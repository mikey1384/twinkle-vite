// Structured previews keep their block layout. Count the text lines the browser
// actually lays out, including nested lists/quotes and their spacing, rather
// than estimating a whole list's line count from its outer height.
export const richTextPreviewClampLinesVar = '--rich-text-preview-clamp-lines';

const budgetTolerancePx = 0.5;

export interface PreviewLineRect {
  top: number;
  bottom: number;
}

export function resolveBlockPreviewClampLines({
  rects,
  budget,
  maxLines
}: {
  rects: PreviewLineRect[];
  budget: number;
  maxLines: number;
}): number | null {
  if (!(budget > 0) || !(maxLines > 0)) return null;

  // A link, emphasis or superscript can produce several rectangles on one
  // line. Merge overlapping fragments without merging neighboring lines whose
  // glyph boxes only slightly overlap at a tight line-height.
  const lines: PreviewLineRect[] = [];
  for (const rect of [...rects].sort((a, b) => a.top - b.top)) {
    if (!(rect.bottom > rect.top)) continue;
    const previous = lines[lines.length - 1];
    const overlap = previous
      ? Math.min(previous.bottom, rect.bottom) -
        Math.max(previous.top, rect.top)
      : 0;
    if (
      previous &&
      overlap >
        Math.min(previous.bottom - previous.top, rect.bottom - rect.top) * 0.5
    ) {
      previous.top = Math.min(previous.top, rect.top);
      previous.bottom = Math.max(previous.bottom, rect.bottom);
    } else {
      lines.push({ ...rect });
    }
  }
  const firstClippedLine = lines.findIndex(
    (line) => line.bottom > budget + budgetTolerancePx
  );
  if (firstClippedLine < 0) return null;
  return Math.max(1, Math.min(maxLines, firstClippedLine));
}

export function measureBlockPreviewClampLines(
  node: HTMLElement,
  maxLines: number
): number | null {
  // Measure natural line positions. Measuring already-clamped list items can
  // make hidden later items overlap the last visible line in WebKit.
  const previousClamp = node.style.getPropertyValue('-webkit-line-clamp');
  const previousPriority = node.style.getPropertyPriority('-webkit-line-clamp');
  node.style.setProperty('-webkit-line-clamp', 'unset', 'important');
  try {
    const nodeTop = node.getBoundingClientRect().top;
    let clipBottom = Infinity;
    for (
      let ancestor = node.parentElement;
      ancestor && ancestor !== document.body;
      ancestor = ancestor.parentElement
    ) {
      const { overflowY } = window.getComputedStyle(ancestor);
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      if (overflowY === 'hidden' || overflowY === 'clip') {
        clipBottom = Math.min(
          clipBottom,
          ancestor.getBoundingClientRect().bottom
        );
      }
    }
    const budget = Math.min(node.clientHeight, clipBottom - nodeTop);
    const rects: PreviewLineRect[] = [];
    const range = document.createRange();
    collectLineRects(node);
    return resolveBlockPreviewClampLines({ rects, budget, maxLines });

    function collectLineRects(parent: Node) {
      for (const child of Array.from(parent.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          range.selectNodeContents(child);
          addRects(range.getClientRects());
        } else if (child instanceof HTMLElement) {
          // Independent embed/table layouts do not contribute text lines to
          // the surrounding prose clamp. Their own preview/scroll rules apply.
          if (
            child.matches(
              '.rich-text-embedded-component, [data-rich-text-table], button'
            )
          ) {
            continue;
          }
          if (child.tagName === 'BR') {
            addRects(child.getClientRects());
          } else if (child.matches('.katex')) {
            addRects(child.getClientRects());
          } else {
            collectLineRects(child);
          }
        }
      }
    }

    function addRects(clientRects: DOMRectList) {
      for (const rect of Array.from(clientRects)) {
        if (rect.height > 0) {
          rects.push({
            top: rect.top - nodeTop,
            bottom: rect.bottom - nodeTop
          });
        }
      }
    }
  } finally {
    if (previousClamp) {
      node.style.setProperty(
        '-webkit-line-clamp',
        previousClamp,
        previousPriority
      );
    } else {
      node.style.removeProperty('-webkit-line-clamp');
    }
  }
}

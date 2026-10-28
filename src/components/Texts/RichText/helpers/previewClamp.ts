// Structured previews keep their block layout. Count the text lines the browser
// actually lays out, including nested lists/quotes and their spacing, rather
// than estimating a whole list's line count from its outer height.
import type { PreviewClampProfile } from '~/helpers/ownerTraceFrameAttribution';
export const richTextPreviewClampLinesVar =
  '--rich-text-preview-clamp-lines';

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
        Math.min(previous.bottom - previous.top, rect.bottom - rect.top) *
          0.5
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
  const previousPriority = node.style.getPropertyPriority(
    '-webkit-line-clamp'
  );
  node.style.setProperty('-webkit-line-clamp', 'unset', 'important');
  try {
    return readBlockPreviewClampLines(node, maxLines);
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

function readBlockPreviewClampLines(
  node: HTMLElement,
  maxLines: number,
  profile?: PreviewClampProfile
): number | null {
  const geometryAt = profile ? performance.now() : 0;
  const nodeTop = node.getBoundingClientRect().top;
  let clipBottom = Infinity;
  for (
    let ancestor = node.parentElement;
    ancestor && ancestor !== document.body;
    ancestor = ancestor.parentElement
  ) {
    if (profile) profile.ancestorReads++;
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
  if (profile) profile.geometryMs += performance.now() - geometryAt;
  const rects: PreviewLineRect[] = [];
  const range = document.createRange();
  const rectAt = profile ? performance.now() : 0;
  collectLineRects(node);
  if (profile) profile.rectMs += performance.now() - rectAt;
  const resolveAt = profile ? performance.now() : 0;
  const result = resolveBlockPreviewClampLines({ rects, budget, maxLines });
  if (profile) profile.resolveMs += performance.now() - resolveAt;
  return result;

  function collectLineRects(parent: Node) {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (profile) profile.textNodes++;
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
        if (profile) profile.rects++;
        rects.push({
          top: rect.top - nodeTop,
          bottom: rect.bottom - nodeTop
        });
      }
    }
  }
}

interface ClampRequest {
  node: HTMLElement;
  maxLines: number;
  onWidth: (width: number) => void;
  measure: (run: (profile?: PreviewClampProfile) => void) => void;
}
const pendingClamps = new Map<HTMLElement, ClampRequest>();
let flushQueued = false;

// React mounts a group of cards in one commit. Batch their writes, reads and
// final writes before the browser paints, instead of forcing layout per card.
export function queueBlockPreviewClamp(
  node: HTMLElement,
  maxLines: number,
  onWidth: (width: number) => void,
  measure: ClampRequest['measure'] = (run) => run()
) {
  const request = { node, maxLines, onWidth, measure };
  pendingClamps.set(node, request);
  if (!flushQueued) {
    flushQueued = true;
    queueMicrotask(() => {
      flushQueued = false;
      const requests = [...pendingClamps.values()].filter(
        (item) => item.node.isConnected
      );
      pendingClamps.clear();
      if (requests.length)
        requests[0].measure((profile) => applyBlockPreviewClamps(requests, profile));
    });
  }
  return () => {
    if (pendingClamps.get(node) === request) pendingClamps.delete(node);
  };
}

export function applyBlockPreviewClamps(
  requests: Pick<ClampRequest, 'node' | 'maxLines' | 'onWidth'>[],
  profile?: PreviewClampProfile
) {
  const styleAt = profile ? performance.now() : 0;
  if (profile) profile.nodes += requests.length;
  // Reset every previous answer first; reading computed style then has only
  // one pending style flush for the whole batch.
  for (const { node } of requests)
    node.style.removeProperty(richTextPreviewClampLinesVar);
  const prepared = requests.map((item) => {
    const cssLines = parseInt(
      window.getComputedStyle(item.node).webkitLineClamp,
      10
    );
    return {
      ...item,
      maxLines: cssLines > 0 ? cssLines : item.maxLines,
      previous: item.node.style.getPropertyValue('-webkit-line-clamp'),
      priority: item.node.style.getPropertyPriority('-webkit-line-clamp'),
      lines: null as number | null
    };
  });
  for (const { node } of prepared)
    node.style.setProperty('-webkit-line-clamp', 'unset', 'important');
  if (profile) profile.styleMs += performance.now() - styleAt;
  try {
    for (const item of prepared) {
      const widthAt = profile ? performance.now() : 0;
      item.onWidth(item.node.getBoundingClientRect().width);
      if (profile) profile.geometryMs += performance.now() - widthAt;
      item.lines = readBlockPreviewClampLines(item.node, item.maxLines, profile);
    }
  } finally {
    for (const { node, previous, priority, lines } of prepared) {
      if (previous)
        node.style.setProperty('-webkit-line-clamp', previous, priority);
      else node.style.removeProperty('-webkit-line-clamp');
      if (lines !== null)
        node.style.setProperty(richTextPreviewClampLinesVar, String(lines));
    }
  }
}

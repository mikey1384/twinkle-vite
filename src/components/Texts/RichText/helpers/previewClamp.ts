// Block-preserving previews (multi-paragraph / structured markdown) keep their
// paragraphs as blocks, so a plain `max-height` of N line-heights lands in the
// middle of a line as soon as a paragraph gap (or a heading's tighter
// line-height) shifts the lines. The root is clamped with -webkit-line-clamp
// instead, and this helper works out how many whole lines actually fit in the
// space the root really has: its own max-height, the flex/grid room it was
// given, and every overflow-hidden ancestor up to the scroll container.

export const richTextPreviewClampLinesVar = '--rich-text-preview-clamp-lines';

const budgetTolerancePx = 1;

export interface PreviewClampBlock {
  // Offsets are relative to the clamped root's top edge, in px.
  top: number;
  height: number;
  lineHeight: number;
}

// Returns the number of whole lines that fit inside `budget`, or null when the
// content already ends within the budget (the base clamp then handles the
// ellipsis on its own). Line counts are derived from each block's height and
// line-height, which is exact for paragraphs and headings and a close estimate
// for lists.
export function resolveBlockPreviewClampLines({
  blocks,
  budget,
  maxLines
}: {
  blocks: PreviewClampBlock[];
  budget: number;
  maxLines: number;
}): number | null {
  if (!blocks.length || !(budget > 0) || !(maxLines > 0)) {
    return null;
  }
  const limit = budget + budgetTolerancePx;
  let contentBottom = 0;
  for (const block of blocks) {
    contentBottom = Math.max(contentBottom, block.top + block.height);
  }
  if (contentBottom <= limit) {
    return null;
  }

  let lines = 0;
  for (const block of [...blocks].sort((a, b) => a.top - b.top)) {
    const lineHeight =
      block.lineHeight > 0 ? block.lineHeight : Math.max(1, block.height);
    if (block.top + lineHeight > limit) {
      break;
    }
    const blockLines = Math.max(1, Math.round(block.height / lineHeight));
    const fittingLines = Math.min(
      blockLines,
      Math.floor((limit - block.top) / lineHeight)
    );
    lines += fittingLines;
    if (fittingLines < blockLines) {
      break;
    }
  }

  return Math.max(1, Math.min(maxLines, lines));
}

export function measureBlockPreviewClampLines(
  node: HTMLElement,
  maxLines: number
): number | null {
  const nodeTop = node.getBoundingClientRect().top;
  let clipBottom = Infinity;
  for (
    let ancestor = node.parentElement;
    ancestor && ancestor !== document.body;
    ancestor = ancestor.parentElement
  ) {
    const { overflowY } = window.getComputedStyle(ancestor);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      break;
    }
    if (overflowY === 'hidden' || overflowY === 'clip') {
      clipBottom = Math.min(
        clipBottom,
        ancestor.getBoundingClientRect().bottom
      );
    }
  }
  const budget = Math.min(node.clientHeight, clipBottom - nodeTop);

  const blocks: PreviewClampBlock[] = [];
  for (const child of Array.from(node.children)) {
    if (!(child instanceof HTMLElement) || !child.offsetHeight) {
      continue;
    }
    const childStyle = window.getComputedStyle(child);
    const lineHeight = parseFloat(childStyle.lineHeight);
    blocks.push({
      top: child.offsetTop,
      height: child.offsetHeight,
      lineHeight:
        Number.isFinite(lineHeight) && lineHeight > 0
          ? lineHeight
          : (parseFloat(childStyle.fontSize) || 0) * 1.2
    });
  }

  return resolveBlockPreviewClampLines({ blocks, budget, maxLines });
}

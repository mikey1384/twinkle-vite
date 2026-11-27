export type FullTextRevealPlacement = 'top' | 'bottom';

export interface FullTextRevealPosition {
  arrowLeft: number;
  left: number;
  placement: FullTextRevealPlacement;
  top: number;
}

export function getNextFullTextRevealPosition(
  prev: FullTextRevealPosition | null,
  next: FullTextRevealPosition | null
): FullTextRevealPosition | null {
  if (prev === next) return prev;
  if (!prev || !next) return next;
  if (
    prev.arrowLeft === next.arrowLeft &&
    prev.left === next.left &&
    prev.placement === next.placement &&
    prev.top === next.top
  ) {
    return prev;
  }
  return next;
}

export function getFullTextRevealComputedWidth(
  styleWidth: string | number | undefined,
  rectWidth: number
): string | undefined {
  if (typeof styleWidth === 'string' && /%$/.test(styleWidth)) {
    const pct = parseFloat(styleWidth);
    if (!Number.isNaN(pct)) {
      return `${(rectWidth * pct) / 100}px`;
    }
  }
  return undefined;
}

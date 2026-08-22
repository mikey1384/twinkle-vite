const overflowTolerancePx = 1;

export function resolveRichTextCollapseThreshold({
  computedMaxHeight,
  fallbackClientHeight
}: {
  computedMaxHeight: string;
  fallbackClientHeight: number;
}) {
  const parsedMaxHeight = Number.parseFloat(computedMaxHeight);
  if (Number.isFinite(parsedMaxHeight) && parsedMaxHeight > 0) {
    return parsedMaxHeight;
  }
  return Math.max(0, fallbackClientHeight);
}

export function isRichTextMeasurementOverflown({
  scrollHeight,
  collapseThreshold,
  extraAllowedHeight = 0
}: {
  scrollHeight: number;
  collapseThreshold: number;
  extraAllowedHeight?: number;
}) {
  return (
    scrollHeight >
    collapseThreshold + Math.max(0, extraAllowedHeight) + overflowTolerancePx
  );
}

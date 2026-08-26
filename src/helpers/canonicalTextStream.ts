export function applyCanonicalTextStreamUpdate({
  currentText,
  delta,
  snapshot,
  startOffset
}: {
  currentText: string;
  delta?: string;
  snapshot?: string;
  startOffset?: number;
}) {
  if (typeof snapshot === 'string') return snapshot;
  if (
    Number.isInteger(startOffset) &&
    Number(startOffset) !== currentText.length
  ) {
    return currentText;
  }
  return currentText + String(delta || '');
}

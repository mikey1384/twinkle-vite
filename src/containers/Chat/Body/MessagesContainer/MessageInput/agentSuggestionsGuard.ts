// Chips that slide in under a finger can catch a tap aimed at whatever was
// there a moment ago, and a tap on a chip sends it (and spends AI Energy) at
// once. A pointer tap that lands this soon after the chips appeared, or after
// their ideas changed, is ignored.
export const SUGGESTION_TAP_GUARD_MS = 500;

export function shouldIgnoreSuggestionTap({
  now,
  shownAt,
  clickDetail,
  guardMs = SUGGESTION_TAP_GUARD_MS
}: {
  now: number;
  shownAt: number;
  // MouseEvent.detail: 0 for keyboard (Enter/Space) and programmatic clicks,
  // 1 or more for a real pointer or touch tap.
  clickDetail: number;
  guardMs?: number;
}): boolean {
  if (clickDetail <= 0) return false;
  const elapsed = now - shownAt;
  return elapsed >= 0 && elapsed < guardMs;
}

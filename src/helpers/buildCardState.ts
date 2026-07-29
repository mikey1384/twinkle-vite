// Action cards in chat carry two sources of truth for the same fact: the
// payload the server hydrated when the message was loaded, and whatever this
// tab wrote into chat state when the user pressed a button on some card.
//
// Neither is automatically the newer one. The cached entry wins right after an
// action, because the server payload predates it. The payload wins after any
// reload or history load, because hydration read the branch again — and it also
// wins when the cached entry describes something that has since been undone: a
// branch merged, then reopened by new work; a thumbnail adopted, then replaced.
// Merging the cache unconditionally is what makes a fresh card render as
// already-merged, or a superseded card claim it is still the one in use.
//
// Both sides stamp themselves, so the comparison is just which stamp is later.
export function isCachedCardStateFresher(
  cachedState: { __eventTime?: number } | null | undefined,
  payload: { eventTimeMs?: number } | null | undefined
) {
  if (!cachedState) return false;
  const cachedAt = Number(cachedState.__eventTime || 0);
  if (!cachedAt) return false;
  const payloadAt = Number(payload?.eventTimeMs || 0);
  // An unstamped payload cannot argue it is newer.
  if (!payloadAt) return true;
  return cachedAt >= payloadAt;
}

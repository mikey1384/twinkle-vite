// The one tab that joined the pinned row since the last render, or null. The
// first render (no baseline yet, or no pins) and bulk changes (a server sync,
// an account switch: more than one new key) never count as a new pin.
export function newlyPinnedKey(
  seen: ReadonlySet<string> | null,
  keys: readonly string[]
): string | null {
  if (!seen || seen.size === 0) return null;
  const added = keys.filter((key) => !seen.has(key));
  return added.length === 1 ? added[0] : null;
}

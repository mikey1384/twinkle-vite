// Realtime content events can be delivered more than once (socket fan-out,
// response/event races, multi-key reducer writes). Lists of canonical server
// rows must remain idempotent by their database id.
export function appendUniqueById<T extends { id?: number | string }>(
  existing: T[] | undefined | null,
  items: T[] | undefined | null
): T[] {
  const current = existing || [];
  if (!items?.length) return current;
  const seen = new Set<number>();
  for (const item of current) {
    const id = Number(item?.id);
    if (id > 0) seen.add(id);
  }
  const uniqueNew: T[] = [];
  for (const item of items) {
    const id = Number(item?.id);
    if (id > 0 && seen.has(id)) continue;
    if (id > 0) seen.add(id);
    uniqueNew.push(item);
  }
  return uniqueNew.length ? current.concat(uniqueNew) : current;
}

export function prependUniqueById<T extends { id?: number | string }>(
  items: T[] | undefined | null,
  existing: T[] | undefined | null
): T[] {
  const current = existing || [];
  if (!items?.length) return current;
  const existingIds = new Set<number>();
  for (const item of current) {
    const id = Number(item?.id);
    if (id > 0) existingIds.add(id);
  }
  const uniqueNew: T[] = [];
  const seenNew = new Set<number>();
  for (const item of items) {
    const id = Number(item?.id);
    if (id > 0 && (existingIds.has(id) || seenNew.has(id))) continue;
    if (id > 0) seenNew.add(id);
    uniqueNew.push(item);
  }
  return uniqueNew.length ? uniqueNew.concat(current) : current;
}

// Same guarantee for lists that hold bare ids rather than rows.
export function prependUniqueIds(
  ids: (number | string)[] | undefined | null,
  existing: (number | string)[] | undefined | null
): number[] {
  const current = (existing || []).map(Number).filter((id) => id > 0);
  const seen = new Set<number>(current);
  const uniqueNew: number[] = [];
  for (const rawId of ids || []) {
    const id = Number(rawId);
    if (!(id > 0) || seen.has(id)) continue;
    seen.add(id);
    uniqueNew.push(id);
  }
  return uniqueNew.length ? uniqueNew.concat(current) : current;
}

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
  const next = current.slice();
  for (const item of items) {
    const id = Number(item?.id);
    if (id > 0 && seen.has(id)) continue;
    if (id > 0) seen.add(id);
    next.push(item);
  }
  return next;
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

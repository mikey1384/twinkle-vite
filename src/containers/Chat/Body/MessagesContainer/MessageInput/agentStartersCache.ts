// Today's starter ideas are the same all day for a member (the server picks
// them per member per UTC day), so the device keeps them: the next visit shows
// the real chips at once and refreshes them quietly. Storage can be missing,
// full or blocked; every access is guarded and nothing depends on it.
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const PREFIX = 'twinkle:agentStarters:';

export function utcDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function keyFor(userId: number | string, now: number) {
  return `${PREFIX}${userId}:${utcDayKey(now)}`;
}

export function readCachedStarters(
  userId: number | string | null | undefined,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now()
): string[] {
  if (!userId || !storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(keyFor(userId, now)) || 'null');
    return Array.isArray(parsed)
      ? parsed.filter((idea) => typeof idea === 'string' && idea)
      : [];
  } catch {
    return [];
  }
}

export function writeCachedStarters(
  userId: number | string | null | undefined,
  ideas: string[],
  storage: StorageLike | null = defaultStorage(),
  now = Date.now()
) {
  if (!userId || !storage || !ideas.length) return;
  try {
    storage.setItem(keyFor(userId, now), JSON.stringify(ideas));
  } catch {
    // Storage full or blocked: the row just loads fresh next time.
  }
}

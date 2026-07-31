const achievementProgressEventPrefix =
  'twinkle:achievement-progress-event-seen';
const seenEventKeys = new Set<string>();

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function consumeAchievementProgressEvent({
  userId,
  eventId,
  storage = getBrowserStorage()
}: {
  userId: number;
  eventId?: string;
  storage?: StorageLike | null;
}) {
  if (!eventId) return true;
  const eventKey = `${achievementProgressEventPrefix}:${userId}:${eventId}`;
  if (seenEventKeys.has(eventKey)) return false;
  try {
    if (storage?.getItem(eventKey)) {
      seenEventKeys.add(eventKey);
      return false;
    }
  } catch {
    // The in-memory guard below still prevents same-page replay.
  }
  seenEventKeys.add(eventKey);
  try {
    storage?.setItem(eventKey, '1');
  } catch {
    // Durable cross-page replay protection requires browser storage.
  }
  return true;
}

export function clearAchievementProgressEventMemory() {
  seenEventKeys.clear();
}

function getBrowserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const USER_ACTIVITY_INPUT_EVENT = 'twinkle-user-activity-input';
export const USER_ACTIVITY_REFRESH_AFTER_MS = 90_000;
// An activity that ends waits this long before others hear it: the gap
// between rounds (a result screen, the next round loading) blinked the badge
// off and on for everyone (Mikey 2026-10-04, chess puzzles). Starting or
// switching an activity is reported at once.
export const USER_ACTIVITY_END_GRACE_MS = 4000;
export function userActivityReportDelayMs({
  next,
  lastReportedKey
}: {
  next: unknown;
  lastReportedKey: string;
}) {
  const wasActive = lastReportedKey !== '' && lastReportedKey !== 'null';
  return !next && wasActive ? USER_ACTIVITY_END_GRACE_MS : 100;
}

export type ActivityGame =
  | 'wordle'
  | 'grammarbles'
  | 'chess'
  | 'chess-puzzles'
  | 'omok'
  | 'word-master'
  | 'ai-cards';
export type UserActivityIntent =
  { kind: 'app'; id: number } | { kind: 'game'; id: ActivityGame };
export type UserActivity = UserActivityIntent & {
  title: string;
  thumbnailUrl: string | null;
};

// A foreground modal takes precedence over the app beneath it. A null source
// deliberately suppresses activity (for example a game's rankings tab).
export function createUserActivityRegistry() {
  const sources = new Map<
    object,
    {
      userId: number;
      activity: UserActivityIntent | null;
      priority: number;
      order: number;
    }
  >();
  const listeners = new Set<() => void>();
  let order = 0;
  function notify() {
    for (const listener of listeners) listener();
  }
  return {
    set(
      key: object,
      userId: number,
      activity: UserActivityIntent | null,
      priority: number
    ) {
      sources.set(key, { userId, activity, priority, order: ++order });
      notify();
    },
    remove(key: object) {
      if (sources.delete(key)) notify();
    },
    get(userId: number) {
      return (
        [...sources.values()]
          .filter((entry) => entry.userId === userId)
          .sort((a, b) => b.priority - a.priority || b.order - a.order)[0]
          ?.activity || null
      );
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export function applyUserActivityEvent(
  entry: any,
  {
    activity,
    observedAt
  }: { activity: UserActivity | null; observedAt: number },
  now = Date.now()
) {
  if (
    !Number.isFinite(observedAt) ||
    observedAt < Number(entry?.activityObservedAt || 0)
  )
    return entry;
  return {
    ...entry,
    activity,
    activityObservedAt: observedAt,
    activityUpdatedAt: now
  };
}

export function activityFromSnapshot(
  previous: any,
  member: any,
  requestedAt: number
) {
  if (
    !Object.prototype.hasOwnProperty.call(member, 'activity') ||
    Number(previous?.activityUpdatedAt || 0) > requestedAt ||
    Number(previous?.activityObservedAt || 0) >
      Number(member.activityObservedAt || 0)
  )
    return previous?.activity === undefined
      ? {}
      : {
          activity: previous.activity,
          activityObservedAt: previous.activityObservedAt,
          activityUpdatedAt: previous.activityUpdatedAt
        };
  return {
    activity: member.activity,
    activityObservedAt: member.activityObservedAt,
    activityUpdatedAt: requestedAt
  };
}

// Active apps renew their activity every 25 seconds. If a cached activity has
// outlived the server's 75-second lease and 15-second sweep without an update,
// read canonical presence again instead of treating the cache as live forever.
export function getNextUserActivityRefreshAt(chatStatus: Record<string, any>) {
  let nextRefreshAt = 0;
  for (const entry of Object.values(chatStatus)) {
    if (!entry?.activity || entry.isOnline !== true) continue;
    const updatedAt = Number(entry.activityUpdatedAt || 0);
    const refreshAt =
      Number.isFinite(updatedAt) && updatedAt > 0
        ? updatedAt + USER_ACTIVITY_REFRESH_AFTER_MS
        : 1;
    if (!nextRefreshAt || refreshAt < nextRefreshAt) nextRefreshAt = refreshAt;
  }
  return nextRefreshAt;
}

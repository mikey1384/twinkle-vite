export const USER_ACTIVITY_INPUT_EVENT = 'twinkle-user-activity-input';

export type ActivityGame =
  'wordle' | 'grammarbles' | 'chess' | 'chess-puzzles' | 'omok';
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

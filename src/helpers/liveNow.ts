// "Live now" in Today's Progress: which Lumine apps members are in right now.
//
// Built from the app-wide presence the site already keeps in chat state
// (check_online_presence snapshots + user_activity_changed events), so it adds
// no server reads and agrees with the avatar activity badges at every moment.
// The server already shares an app here only while it is public and
// published, and only for an online, non-away member (socket/userActivity.ts);
// this module applies the exact badge visibility rule on top.
//
// Kept free of app imports so node tests can load it.
import { isActivityShown, type PresenceFlags } from './presenceVisibility';

export const LIVE_NOW_COLLAPSED_APPS = 2;
// Hard bound for the expanded list and for the faces per app.
export const LIVE_NOW_MAX_APPS = 12;
export const LIVE_NOW_MAX_FACES = 3;

export interface LiveNowMember {
  id: number;
  username: string;
  profilePicUrl: string;
}

export interface LiveNowApp {
  appId: number;
  title: string;
  thumbnailUrl: string | null;
  multiplayer: boolean;
  count: number;
  members: LiveNowMember[];
}

export function groupLiveNowApps({
  chatStatus,
  myId,
  hiddenUserIds,
  blockedUserIds
}: {
  chatStatus: Record<string, any> | null | undefined;
  myId: number;
  hiddenUserIds: readonly number[];
  // Members the viewer blocked: never a face or a count here (their app can
  // still show if others are in it).
  blockedUserIds?: ReadonlySet<number>;
}): LiveNowApp[] {
  const byApp = new Map<number, LiveNowApp>();
  for (const [key, entry] of Object.entries(chatStatus || {})) {
    const userId = Number(entry?.id ?? key);
    const activity = entry?.activity;
    // The viewer is left out: the row is for joining other people, and an app
    // only the viewer is in (another tab) is not something to join.
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId === myId)
      continue;
    if (blockedUserIds?.has(userId)) continue;
    if (
      activity?.kind !== 'app' ||
      !Number.isSafeInteger(activity.id) ||
      activity.id <= 0
    )
      continue;
    const presence: PresenceFlags = {
      isOnline: entry.isOnline,
      isAway: entry.isAway
    };
    if (
      !isActivityShown({
        userId,
        activity,
        presence,
        hiddenUserIds
      })
    )
      continue;
    const username = String(entry.username || '').trim();
    if (!username) continue;
    let app = byApp.get(activity.id);
    if (!app) {
      app = {
        appId: activity.id,
        title: String(activity.title || 'Untitled App'),
        thumbnailUrl: activity.thumbnailUrl || null,
        multiplayer: activity.multiplayer === true,
        count: 0,
        members: []
      };
      byApp.set(activity.id, app);
    }
    app.count++;
    app.members.push({
      id: userId,
      username,
      profilePicUrl: String(entry.profilePicUrl || '')
    });
  }
  const apps = [...byApp.values()];
  for (const app of apps) {
    // Stable faces: the same people keep their places as others come and go.
    app.members.sort((a, b) => a.id - b.id);
    app.members = app.members.slice(0, LIVE_NOW_MAX_FACES);
  }
  apps.sort(
    (a, b) =>
      Number(b.multiplayer) - Number(a.multiplayer) ||
      b.count - a.count ||
      a.title.localeCompare(b.title) ||
      a.appId - b.appId
  );
  return apps.slice(0, LIVE_NOW_MAX_APPS);
}

// "Live now shown": the first time the row appears in a tab, then at most once
// per LIVE_NOW_SHOWN_INTERVAL_MS, so tap/join rates have a steady denominator.
export const LIVE_NOW_SHOWN_INTERVAL_MS = 10 * 60 * 1000;

/** One per tab (module level). True when a shown event should be sent now. */
export function createLiveNowShownTracker({
  intervalMs = LIVE_NOW_SHOWN_INTERVAL_MS,
  now = Date.now
}: { intervalMs?: number; now?: () => number } = {}) {
  let lastAt: number | null = null;
  return function shouldTrack(apps: readonly unknown[]) {
    if (!apps.length) return false;
    const at = now();
    if (lastAt !== null && at - lastAt < intervalMs) return false;
    lastAt = at;
    return true;
  };
}

const NO_BLOCKED_USERS: ReadonlySet<number> = new Set();

/**
 * Chat state changes many times a second (streamed AI tokens, typing...), and
 * every change runs context selectors. This reader groups a given chatStatus
 * object only once per viewer and block list: unrelated dispatches keep the
 * same chatStatus object and get the cached signature back without any work.
 * The hidden-presence ids are fixed per reader.
 */
export function createLiveNowSignatureReader({
  hiddenUserIds,
  group = groupLiveNowApps
}: {
  hiddenUserIds: readonly number[];
  group?: typeof groupLiveNowApps;
}) {
  const cache = new WeakMap<
    object,
    WeakMap<ReadonlySet<number>, Map<number, string>>
  >();
  return function readLiveNowSignature(
    chatStatus: Record<string, any> | null | undefined,
    myId: number,
    blockedUserIds: ReadonlySet<number> = NO_BLOCKED_USERS
  ) {
    if (!myId || !chatStatus) return '[]';
    let byBlockList = cache.get(chatStatus);
    if (!byBlockList) {
      byBlockList = new WeakMap();
      cache.set(chatStatus, byBlockList);
    }
    let byViewer = byBlockList.get(blockedUserIds);
    if (!byViewer) {
      byViewer = new Map();
      byBlockList.set(blockedUserIds, byViewer);
    }
    let signature = byViewer.get(myId);
    if (signature === undefined) {
      signature = JSON.stringify(
        group({ chatStatus, myId, hiddenUserIds, blockedUserIds })
      );
      byViewer.set(myId, signature);
    }
    return signature;
  };
}

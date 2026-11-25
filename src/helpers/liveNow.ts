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
import {
  bestJoinAction,
  primaryJoinAction,
  readJoinable,
  type Joinable,
  type JoinVerb,
  type PrimaryJoinAction
} from './socialWalkups';

export const LIVE_NOW_COLLAPSED_APPS = 2;
// Hard bound for the expanded list and for the faces per app.
export const LIVE_NOW_MAX_APPS = 12;
export const LIVE_NOW_MAX_FACES = 3;
// Hard bound for the "Who do you want to watch?" picker: everyone in an app
// who offers Join / Play / Watch, up to this many, apart from the face cap.
export const LIVE_NOW_MAX_CHOICES = 10;

export interface LiveNowMember {
  id: number;
  username: string;
  profilePicUrl: string;
  // What the app said this member is up to and whether they can be joined
  // (Twinkle.social.setJoinable). Absent for apps that have not adopted it.
  joinable?: Joinable;
}

export interface LiveNowApp {
  appId: number;
  title: string;
  thumbnailUrl: string | null;
  multiplayer: boolean;
  count: number;
  members: LiveNowMember[];
  // Members shown here that someone can join right now or next.
  joinable: number;
  // Everyone in the app the viewer can Join / Play with / Watch right now
  // (not only the faces): best verb first (Join, Play, Watch), then by user
  // id so lines keep their places. At most LIVE_NOW_MAX_CHOICES.
  choices: LiveNowMember[];
}

/**
 * One presence entry as Live now sees it: the app they are in and the member
 * (with what they can be joined for), or null when Live now leaves them out
 * (the viewer, blocked, not shown by the badge rule, no name).
 */
export function readLiveNowEntry(
  key: string,
  entry: any,
  {
    myId,
    hiddenUserIds,
    blockedUserIds
  }: {
    myId: number;
    hiddenUserIds: readonly number[];
    blockedUserIds?: ReadonlySet<number>;
  }
): { activity: any; member: LiveNowMember } | null {
  const userId = Number(entry?.id ?? key);
  const activity = entry?.activity;
  // The viewer is left out: the row is for joining other people, and an app
  // only the viewer is in (another tab) is not something to join.
  if (!Number.isSafeInteger(userId) || userId <= 0 || userId === myId)
    return null;
  if (blockedUserIds?.has(userId)) return null;
  if (
    activity?.kind !== 'app' ||
    !Number.isSafeInteger(activity.id) ||
    activity.id <= 0
  )
    return null;
  const presence: PresenceFlags = {
    isOnline: entry.isOnline,
    isAway: entry.isAway
  };
  if (!isActivityShown({ userId, activity, presence, hiddenUserIds }))
    return null;
  const username = String(entry.username || '').trim();
  if (!username) return null;
  // Hidden-presence accounts (Zero and Ciel) are never walked up to.
  const joinable = hiddenUserIds.includes(userId)
    ? null
    : readJoinable(activity);
  return {
    activity,
    member: {
      id: userId,
      username,
      profilePicUrl: String(entry.profilePicUrl || ''),
      ...(joinable ? { joinable } : {})
    }
  };
}

/**
 * The picker's people as they are right now, read straight from presence
 * (not from app.choices, which is capped): each id maps to the member while
 * they are still in that app, else null. A JSON string, so a selector can
 * return it and re-render only when one of them changes.
 */
export function readLiveNowPickerSignature({
  chatStatus,
  appId,
  ids,
  myId,
  hiddenUserIds,
  blockedUserIds
}: {
  chatStatus: Record<string, any> | null | undefined;
  appId: number;
  ids: readonly number[];
  myId: number;
  hiddenUserIds: readonly number[];
  blockedUserIds?: ReadonlySet<number>;
}) {
  const out: Record<number, LiveNowMember | null> = {};
  for (const id of ids) {
    const read = readLiveNowEntry(String(id), chatStatus?.[id], {
      myId,
      hiddenUserIds,
      blockedUserIds
    });
    out[id] = read && read.activity.id === appId ? read.member : null;
  }
  return JSON.stringify(out);
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
    const read = readLiveNowEntry(key, entry, {
      myId,
      hiddenUserIds,
      blockedUserIds
    });
    if (!read) continue;
    const { activity, member } = read;
    let app = byApp.get(activity.id);
    if (!app) {
      app = {
        appId: activity.id,
        title: String(activity.title || 'Untitled App'),
        thumbnailUrl: activity.thumbnailUrl || null,
        multiplayer: activity.multiplayer === true,
        count: 0,
        members: [],
        joinable: 0,
        choices: []
      };
      byApp.set(activity.id, app);
    }
    app.count++;
    app.members.push(member);
  }
  const apps = [...byApp.values()];
  for (const app of apps) {
    // Who the picker lists: everyone with something to tap. The app's label
    // ("Playing level 12") is free text, so there is no reliable "furthest
    // along" order; lines stay in a stable order instead.
    app.choices = app.members
      .filter((member) => primaryJoinAction(member.joinable))
      .sort(
        (a, b) =>
          verbRank(primaryJoinAction(a.joinable)) -
            verbRank(primaryJoinAction(b.joinable)) || a.id - b.id
      )
      .slice(0, LIVE_NOW_MAX_CHOICES);
    // People you can join come first (ready now, then busy); within each
    // group faces are stable: the same people keep their places.
    app.members.sort(
      (a, b) => joinableRank(a.joinable) - joinableRank(b.joinable) || a.id - b.id
    );
    app.members = app.members.slice(0, LIVE_NOW_MAX_FACES);
    app.joinable = app.members.filter((member) => member.joinable).length;
  }
  // Apps where the row's button really does something with someone (Join,
  // Play with someone, Watch) come first; rows that only open the app ("Play")
  // follow. Mikey 11-24.
  const actionable = new Map(
    apps.map((app) => [app, bestJoinAction(app.choices) ? 1 : 0])
  );
  apps.sort(
    (a, b) =>
      (actionable.get(b) || 0) - (actionable.get(a) || 0) ||
      Number(b.multiplayer) - Number(a.multiplayer) ||
      b.count - a.count ||
      a.title.localeCompare(b.title) ||
      a.appId - b.appId
  );
  return apps.slice(0, LIVE_NOW_MAX_APPS);
}

const VERB_ORDER: Record<JoinVerb, number> = { join: 0, play: 1, watch: 2 };
function verbRank(action: PrimaryJoinAction | null) {
  return action ? VERB_ORDER[action.verb] : 3;
}

// The picker's title, in the row verb's words.
export const LIVE_NOW_PICKER_TITLES: Record<JoinVerb, string> = {
  join: 'Which room?',
  play: 'Who do you want to play with?',
  watch: 'Who do you want to watch?'
};

export type LiveNowRowChoice =
  // nobody to join: the row opens the app
  | { kind: 'open' }
  // exactly one person offers the row's verb: one tap walks up to them
  | { kind: 'walk'; verb: JoinVerb; intent: 'play' | 'watch'; member: LiveNowMember }
  // two or more offer it: "Who do you want to watch?" lists everyone
  // actionable (app.choices), each line with its own verb
  | { kind: 'pick'; verb: JoinVerb; members: LiveNowMember[] };

/**
 * What tapping a Live now row (or its button) does. The row's verb is the
 * best one anyone offers (bestJoinAction). With two or more members offering
 * that verb the member chooses whom (Mikey, 11-25); with one, one tap.
 */
export function liveNowRowChoice(
  app: Pick<LiveNowApp, 'choices'>
): LiveNowRowChoice {
  const choice = liveNowTapChoice(rowVerb(app), app);
  return choice.kind === 'gone' ? { kind: 'open' } : choice;
}

/** The word on a row's button: the best verb anyone offers, or null (Play). */
export function rowVerb(app: Pick<LiveNowApp, 'choices'>): JoinVerb | null {
  return bestJoinAction(app.choices || [])?.verb || null;
}

/**
 * What a tap does, given the word the button showed (it may come from rows
 * held still under the pointer) and who is in the app right now. The tap
 * always does what the word said: the default Play opens the app; a verb
 * walks up to the one person still offering it, or lets the member pick
 * from two or more; nobody offering it any more is 'gone' (open the app with
 * a quiet note), never a different verb's picker.
 */
export function liveNowTapChoice(
  verb: JoinVerb | null,
  live: Pick<LiveNowApp, 'choices'> | null | undefined
): LiveNowRowChoice | { kind: 'gone'; verb: JoinVerb } {
  if (!verb) return { kind: 'open' };
  const choices = live?.choices || [];
  const sameVerb = choices.filter(
    (member) => primaryJoinAction(member.joinable)?.verb === verb
  );
  if (sameVerb.length >= 2) return { kind: 'pick', verb, members: choices };
  const [only] = sameVerb;
  const action = only ? primaryJoinAction(only.joinable) : null;
  if (!only || !action) return { kind: 'gone', verb };
  return { kind: 'walk', verb, intent: action.intent, member: only };
}

// The quiet note when the button's people have all gone by the time of the
// tap (the app opens anyway).
export const LIVE_NOW_GONE_NOTES: Record<JoinVerb, string> = {
  join: "That room isn't open right now",
  play: "Nobody's ready to play right now",
  watch: 'Nobody to watch right now'
};

function joinableRank(joinable: Joinable | undefined) {
  if (!joinable) return 3;
  return joinable.state === 'open' ? 0 : joinable.state === 'busy-watchable' ? 1 : 2;
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

// "Meet people in apps" on the website (projects/arcade-walkup/SPEC.md).
//
// - Joinable presence: what an app said its viewer is doing (it arrives on
//   the member's presence activity; the server validated it).
// - Walk-ups: the page's copy of the queue for the app it is hosting, and of
//   the viewer's own walk-up. Both only mirror what the server said (the
//   walk-up answer and social_walkup_event); nothing here is decided locally.
//
// Kept free of app imports so node tests can load it.

export type JoinableState = 'open' | 'busy-watchable' | 'busy';

export interface Joinable {
  state: JoinableState;
  label: string;
  mode: string;
  // From the server's presence: this member is in a drop-in room (mode
  // 'room' with a roomKey). Join then puts a visitor straight in while the
  // state is 'open'. The roomKey itself never reaches other members.
  dropIn?: boolean;
  // Only on this page's OWN joinable (what its app set): sent with the
  // activity report and kept private by the server.
  roomKey?: string;
}

export const DROP_IN_MODE = 'room';
export const DROP_IN_ROOM_KEY_MAX = 64;
const ROOM_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;

/** What this page's app asked for (social:set-joinable), with its roomKey. */
export function readOwnJoinable(payload: any): Joinable | null {
  const joinable = readJoinable({ kind: 'app', joinable: payload });
  if (!joinable) return null;
  delete joinable.dropIn;
  const roomKey = payload?.roomKey;
  if (
    joinable.mode === DROP_IN_MODE &&
    typeof roomKey === 'string' &&
    roomKey.length > 0 &&
    roomKey.length <= DROP_IN_ROOM_KEY_MAX &&
    ROOM_KEY_PATTERN.test(roomKey)
  )
    joinable.roomKey = roomKey;
  return joinable;
}

export function readJoinable(activity: any): Joinable | null {
  const joinable = activity?.kind === 'app' ? activity.joinable : null;
  if (!joinable || typeof joinable !== 'object') return null;
  if (
    joinable.state !== 'open' &&
    joinable.state !== 'busy-watchable' &&
    joinable.state !== 'busy'
  )
    return null;
  return {
    state: joinable.state,
    label: typeof joinable.label === 'string' ? joinable.label : '',
    mode: typeof joinable.mode === 'string' ? joinable.mode : '',
    ...(joinable.dropIn === true ? { dropIn: true } : {})
  };
}

const GAME_MODES = new Set(['1v1', 'versus', 'duel', 'match', 'pvp']);
export function isGameMode(mode: string) {
  return GAME_MODES.has(mode);
}

// A watch-only member (mode 'watch'): a single-player game people can
// spectate. Joining them is watching; nobody is queued and the host never
// accepts anyone. Only 'busy-watchable' offers anything (the server reads
// 'open' or 'busy' with mode 'watch' as closed).
export const WATCH_ONLY_MODE = 'watch';
export function isWatchOnly(joinable: Joinable) {
  return joinable.mode === WATCH_ONLY_MODE;
}
function isRoom(joinable: Joinable) {
  return !!joinable.dropIn || joinable.mode === DROP_IN_MODE;
}

/** The few words shown next to a face. The app's own label when it gave one. */
export function joinableBadge(joinable: Joinable) {
  if (joinable.label) return joinable.label;
  if (isWatchOnly(joinable)) return 'Playing, come watch';
  if (joinable.state === 'open')
    return isGameMode(joinable.mode) ? 'Looking for a game' : 'Come join';
  if (joinable.state === 'busy-watchable')
    return isGameMode(joinable.mode) ? 'In a game, come watch' : 'Busy, come watch';
  return isGameMode(joinable.mode) ? 'In a game' : 'Busy right now';
}

export type JoinIntent = 'play' | 'next' | 'watch';
export interface JoinAction {
  intent: JoinIntent;
  label: string;
}

// What tapping does, in one word (Live now's row button). Derived from the
// state and mode the app set; apps never name the button themselves.
//
//   state           mode                     verb    tap
//   open            'room' (drop-in)         Join    walk straight in
//   open            any queue mode           Play    walk up (you're next)
//   busy-watchable  any, incl. room/watch    Watch   watch, never queued
//   busy            any                      -       nothing to tap
//   open / busy     'watch'                  -       (read as closed)
//   closed / none   -                        -       nothing to tap
export type JoinVerb = 'join' | 'play' | 'watch';
export const JOIN_VERB_LABELS: Record<JoinVerb, string> = {
  join: 'Join',
  play: 'Play',
  watch: 'Watch'
};
export interface PrimaryJoinAction {
  verb: JoinVerb;
  intent: 'play' | 'watch';
}
export function primaryJoinAction(
  joinable: Joinable | null | undefined
): PrimaryJoinAction | null {
  if (!joinable) return null;
  if (joinable.state === 'busy-watchable') return { verb: 'watch', intent: 'watch' };
  if (joinable.state !== 'open' || isWatchOnly(joinable)) return null;
  return isRoom(joinable)
    ? { verb: 'join', intent: 'play' }
    : { verb: 'play', intent: 'play' };
}

const VERB_RANK: Record<JoinVerb, number> = { join: 0, play: 1, watch: 2 };

/**
 * The row's one button when several members are in the same app: the best
 * action anyone offers (Join, then Play, then Watch), from the first member
 * offering it. Null when nobody has anything to tap.
 */
export function bestJoinAction<M extends { joinable?: Joinable | null }>(
  members: M[]
): (PrimaryJoinAction & { member: M }) | null {
  let best: (PrimaryJoinAction & { member: M }) | null = null;
  for (const member of members) {
    const action = primaryJoinAction(member.joinable);
    if (action && (!best || VERB_RANK[action.verb] < VERB_RANK[best.verb]))
      best = { ...action, member };
  }
  return best;
}

/**
 * What a member can do about someone who is joinable (the profile popup).
 * The first action is the row's verb (primaryJoinAction). Busy: be next (the
 * host is never interrupted), and watch if the app lets people watch. Rooms
 * and watch-only members never use the queue.
 */
export function joinActions({
  joinable,
  appTitle,
  username
}: {
  joinable: Joinable;
  appTitle: string;
  username: string;
}): JoinAction[] {
  const primary = primaryJoinAction(joinable);
  // A room (mode 'room') never uses the queue, in any state. Open: Join
  // drops the visitor straight in (or, with no held key, just opens the app).
  // In a match or full: shown busy, no Join and no "Join next"; at most they
  // can watch. A watch-only member is only ever watched.
  if (isRoom(joinable) || isWatchOnly(joinable)) {
    if (!primary) return [];
    if (primary.verb === 'join')
      return [{ intent: 'play', label: `Join ${username} in ${appTitle}` }];
    return [
      {
        intent: 'watch',
        label: isWatchOnly(joinable) ? `Watch ${username}` : 'Watch'
      }
    ];
  }
  if (primary?.verb === 'play')
    return [{ intent: 'play', label: `Play ${appTitle} with ${username}` }];
  const next: JoinAction = { intent: 'next', label: 'Play next' };
  return primary?.verb === 'watch'
    ? [{ intent: 'watch', label: 'Watch' }, next]
    : [next];
}

// ---- the joinable state this page's app asked for ---------------------------

/** One per page: buildId -> what that app's frame last set. */
export function createSocialJoinableStore() {
  const byBuild = new Map<number, Joinable>();
  const listeners = new Set<() => void>();
  return {
    set(buildId: number, joinable: Joinable | null) {
      const previous = byBuild.get(buildId) || null;
      if (
        (!previous && !joinable) ||
        (previous &&
          joinable &&
          previous.state === joinable.state &&
          previous.label === joinable.label &&
          previous.mode === joinable.mode &&
          previous.roomKey === joinable.roomKey)
      )
        return;
      if (joinable) byBuild.set(buildId, joinable);
      else byBuild.delete(buildId);
      for (const listener of listeners) listener();
    },
    get(buildId: number) {
      return byBuild.get(buildId) || null;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
export const socialJoinableStore = createSocialJoinableStore();

/** The activity report for the socket: the app intent plus its joinable. */
export function withJoinable<T extends { kind: string; id: any } | null>(
  activity: T,
  {
    walkupsAllowed,
    store = socialJoinableStore
  }: {
    walkupsAllowed: boolean;
    store?: ReturnType<typeof createSocialJoinableStore>;
  }
) {
  if (!activity || activity.kind !== 'app' || !walkupsAllowed) return activity;
  const joinable = store.get(Number(activity.id));
  return joinable ? { ...activity, joinable } : activity;
}

// ---- walk-ups ---------------------------------------------------------------

export interface SocialPerson {
  id: number;
  username: string;
  profilePicUrl: string | null;
}

export interface WaitingVisitor {
  id: string;
  user: SocialPerson;
  queuePosition: number;
  createdAt?: number;
  expiresAt: number;
}

// The viewer's own walk-up in an app.
export interface SocialVisit {
  host: SocialPerson;
  // waiting: you're next. later: not right now (watch or play meanwhile).
  // watch: came to watch, not queued. unavailable: they are not here.
  // matched: playing together. released: the host left while you waited.
  // missed: the host's accept ended your walk-up without letting you in
  // (you weren't in the app in time, or a refusal whose reason is never
  // shown).
  status:
    | 'waiting'
    | 'later'
    | 'watch'
    | 'unavailable'
    | 'matched'
    | 'released'
    | 'missed';
  walkupId: string | null;
  expiresAt?: number;
  joinable: Joinable | null;
}

export interface SocialMatchReady {
  matchKey: string;
  mode: string;
  host: SocialPerson;
  at: number;
  // a drop-in: the visitor's app joins the host's roomKey
  dropIn?: boolean;
  roomKey?: string;
}

// Someone walked straight into this member's open room from Live now.
export interface SocialArrival {
  matchKey: string;
  user: SocialPerson;
  shownAt: number;
}

export interface SocialBuildState {
  // for the member being joined
  waiting: WaitingVisitor[];
  banner: (WaitingVisitor & { shownAt: number }) | null;
  // for the member who walked up
  visit: SocialVisit | null;
  match: SocialMatchReady | null;
  // for the member whose open room someone dropped into: a passing toast
  arrival: SocialArrival | null;
}

export const EMPTY_SOCIAL_STATE: SocialBuildState = Object.freeze({
  waiting: [],
  banner: null,
  visit: null,
  match: null,
  arrival: null
}) as SocialBuildState;

function isVisitor(value: any): value is WaitingVisitor {
  return (
    !!value &&
    typeof value.id === 'string' &&
    Number(value.user?.id) > 0 &&
    typeof value.user.username === 'string'
  );
}

/** One server event applied to a build's state. Pure. */
export function applySocialWalkupEvent(
  state: SocialBuildState,
  event: any,
  now = Date.now()
): SocialBuildState {
  if (!event || typeof event !== 'object') return state;
  if (event.type === 'queue') {
    const waiting = (Array.isArray(event.waiting) ? event.waiting : []).filter(
      isVisitor
    );
    const arrived = isVisitor(event.arrived) ? event.arrived : null;
    // The banner follows its visitor: it goes when they leave or are let in.
    const banner = arrived
      ? { ...arrived, shownAt: now }
      : state.banner &&
          waiting.some((entry: WaitingVisitor) => entry.id === state.banner!.id)
        ? state.banner
        : null;
    return { ...state, waiting, banner };
  }
  if (event.type === 'dropIn' && typeof event.matchKey === 'string') {
    const user = event.visitor;
    if (!(Number(user?.id) > 0) || typeof user.username !== 'string') return state;
    return {
      ...state,
      arrival: {
        matchKey: event.matchKey,
        user: {
          id: Number(user.id),
          username: user.username,
          profilePicUrl: user.profilePicUrl || null
        },
        shownAt: now
      }
    };
  }
  if (event.type === 'matchReady' && typeof event.matchKey === 'string') {
    const host: SocialPerson = {
      id: Number(event.host?.id) || 0,
      username: String(event.host?.username || ''),
      profilePicUrl: event.host?.profilePicUrl || null
    };
    const dropIn = event.dropIn === true && typeof event.roomKey === 'string';
    const match: SocialMatchReady = {
      matchKey: event.matchKey,
      mode: typeof event.mode === 'string' ? event.mode : '',
      host,
      at: now,
      ...(dropIn ? { dropIn: true, roomKey: event.roomKey } : {})
    };
    // A drop-in needs no word over the app: the visitor is simply in.
    if (dropIn) return { ...state, match, visit: null };
    return {
      ...state,
      match,
      visit: state.visit
        ? { ...state.visit, status: 'matched' }
        : { host, status: 'matched', walkupId: null, joinable: null }
    };
  }
  if (event.type === 'released') {
    if (!state.visit || state.visit.walkupId !== event.walkupId) return state;
    return {
      ...state,
      visit: {
        ...state.visit,
        status: event.missed === true ? 'missed' : 'released'
      }
    };
  }
  return state;
}

/** One per page: every app this tab hosts or walked up in. */
export function createSocialWalkupStore({
  now = Date.now
}: { now?: () => number } = {}) {
  const byBuild = new Map<number, SocialBuildState>();
  const listeners = new Set<() => void>();
  const playNowListeners = new Set<
    (buildId: number, visitor: WaitingVisitor) => void
  >();
  const eventListeners = new Set<(event: any) => void>();
  function write(buildId: number, next: SocialBuildState) {
    if (next === (byBuild.get(buildId) || EMPTY_SOCIAL_STATE)) return;
    byBuild.set(buildId, next);
    for (const listener of listeners) listener();
  }
  const read = (buildId: number) => byBuild.get(buildId) || EMPTY_SOCIAL_STATE;
  return {
    get: read,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    apply(event: any) {
      const buildId = Number(event?.buildId || 0);
      if (!buildId) return;
      write(buildId, applySocialWalkupEvent(read(buildId), event, now()));
    },
    // An event this page learned itself (a drop-in answer) rather than over
    // the socket: applied like one and handed to an app frame that is
    // already running (a kept-alive app), as social_walkup_event would be.
    deliver(event: any) {
      const buildId = Number(event?.buildId || 0);
      if (!buildId) return;
      write(buildId, applySocialWalkupEvent(read(buildId), event, now()));
      for (const listener of eventListeners) listener(event);
    },
    onEvent(listener: (event: any) => void) {
      eventListeners.add(listener);
      return () => {
        eventListeners.delete(listener);
      };
    },
    dismissArrival(buildId: number) {
      if (read(buildId).arrival)
        write(buildId, { ...read(buildId), arrival: null });
    },
    setWaiting(buildId: number, waiting: WaitingVisitor[]) {
      write(
        buildId,
        applySocialWalkupEvent(
          read(buildId),
          { type: 'queue', waiting, arrived: null },
          now()
        )
      );
    },
    setVisit(buildId: number, visit: SocialVisit | null) {
      write(buildId, {
        ...read(buildId),
        visit,
        match: visit ? read(buildId).match : null
      });
    },
    // The viewer tapped "Play now" for a visitor. Only the app can start
    // anything, so this is passed on to the app (onVisitor, wantsNow: true).
    playNow(buildId: number, visitorId: string) {
      const visitor = read(buildId).waiting.find((entry) => entry.id === visitorId);
      if (!visitor) return;
      for (const listener of playNowListeners) listener(buildId, visitor);
      if (read(buildId).banner) write(buildId, { ...read(buildId), banner: null });
    },
    onPlayNow(listener: (buildId: number, visitor: WaitingVisitor) => void) {
      playNowListeners.add(listener);
      return () => {
        playNowListeners.delete(listener);
      };
    },
    dismissBanner(buildId: number) {
      if (read(buildId).banner)
        write(buildId, { ...read(buildId), banner: null });
    },
    clear(buildId: number) {
      if (byBuild.delete(buildId)) for (const listener of listeners) listener();
    }
  };
}
export const socialWalkupStore = createSocialWalkupStore();

// ---- words ------------------------------------------------------------------

/** The host's banner line: "mikey walked up · next game?" */
export function visitorBannerText({
  username,
  joinable
}: {
  username: string;
  joinable: Joinable | null;
}) {
  const game = isGameMode(joinable?.mode || '');
  if (!joinable || joinable.state === 'open')
    return game ? `${username} walked up · play?` : `${username} walked in`;
  return game
    ? `${username} walked up · next game?`
    : `${username} wants to join next`;
}

/** The visitor's line. Never "declined": only where things stand. */
export function visitLine(visit: SocialVisit) {
  const name = visit.host.username;
  const game = isGameMode(visit.joinable?.mode || '');
  switch (visit.status) {
    case 'waiting':
      return visit.joinable?.state === 'open'
        ? `${name} knows you're here`
        : `You're next · ${name} is finishing up`;
    case 'later':
      return game
        ? `${name}'s still in a game. Play on your own while you wait?`
        : `${name}'s busy right now. Look around while you wait?`;
    case 'watch':
      return `Watching ${name}`;
    case 'released':
    case 'unavailable':
      return `${name} isn't here right now`;
    case 'missed':
      return `${name} couldn't let you in this time. Try again later.`;
    case 'matched':
      return game ? `You're playing with ${name}` : `You're with ${name}`;
  }
}

/**
 * The launch target the app sees (Twinkle.notifications.getLaunchTarget and
 * its listener) once the walk-up it was opened for has ended: a 'waiting'
 * social target becomes 'unavailable', so the app stops showing a wait
 * nobody can end. Anything else comes back unchanged (the same object).
 */
export function settledSocialLaunchTarget<T extends Record<string, any> | null>(
  launchTarget: T,
  visit: SocialVisit | null
): T {
  const target = launchTarget?.target;
  if (
    launchTarget?.source !== 'social' ||
    target?.kind !== 'social' ||
    target.status !== 'waiting' ||
    !visit ||
    Number(target.hostUserId) !== visit.host.id ||
    (visit.status !== 'released' && visit.status !== 'missed')
  )
    return launchTarget;
  return {
    ...launchTarget,
    target: { ...target, status: 'unavailable' }
  };
}

/**
 * What the joiner is told when a Join tap could not put them in the host's
 * room (INCIDENT 2026-11-22). 'retry' is a technical failure on Twinkle's
 * side; 'gone' means the host is not in the app right now. Both are said
 * plainly instead of opening the app into a solo or saved game. Anything
 * else (including the neutral 'unavailable' of a policy refusal) is null:
 * the app opens as before.
 */
export function joinNotice(
  status: unknown,
  hostName: string
): { kind: 'retry' | 'gone'; message: string } | null {
  if (status === 'retry')
    return {
      kind: 'retry',
      message: `Couldn't join ${hostName} right now. Tap to try again.`
    };
  if (status === 'gone')
    return {
      kind: 'gone',
      message: `${hostName} isn't in there anymore. Tap to open the app anyway.`
    };
  return null;
}

/** The host's passing toast when someone dropped into their room. */
export function arrivalText(username: string) {
  return `${username} joined from Live now`;
}

export function queueChipText(count: number) {
  return count === 1 ? '1 person wants next' : `${count} people want next`;
}

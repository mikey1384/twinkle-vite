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
    mode: typeof joinable.mode === 'string' ? joinable.mode : ''
  };
}

const GAME_MODES = new Set(['1v1', 'versus', 'duel', 'match', 'pvp']);
export function isGameMode(mode: string) {
  return GAME_MODES.has(mode);
}

/** The few words shown next to a face. The app's own label when it gave one. */
export function joinableBadge(joinable: Joinable) {
  if (joinable.label) return joinable.label;
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

/**
 * What a member can do about someone who is joinable. Open: play or join
 * now. Busy: be next (the host is never interrupted), and watch if the app
 * lets people watch.
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
  const game = isGameMode(joinable.mode);
  if (joinable.state === 'open') {
    return [
      {
        intent: 'play',
        label: game
          ? `Play ${appTitle} with ${username}`
          : `Join ${username} in ${appTitle}`
      }
    ];
  }
  const next: JoinAction = {
    intent: 'next',
    label: game ? 'Play next' : 'Join next'
  };
  return joinable.state === 'busy-watchable'
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
          previous.mode === joinable.mode)
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
  status:
    'waiting' | 'later' | 'watch' | 'unavailable' | 'matched' | 'released';
  walkupId: string | null;
  expiresAt?: number;
  joinable: Joinable | null;
}

export interface SocialMatchReady {
  matchKey: string;
  mode: string;
  host: SocialPerson;
  at: number;
}

export interface SocialBuildState {
  // for the member being joined
  waiting: WaitingVisitor[];
  banner: (WaitingVisitor & { shownAt: number }) | null;
  // for the member who walked up
  visit: SocialVisit | null;
  match: SocialMatchReady | null;
}

export const EMPTY_SOCIAL_STATE: SocialBuildState = Object.freeze({
  waiting: [],
  banner: null,
  visit: null,
  match: null
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
  if (event.type === 'matchReady' && typeof event.matchKey === 'string') {
    const host: SocialPerson = {
      id: Number(event.host?.id) || 0,
      username: String(event.host?.username || ''),
      profilePicUrl: event.host?.profilePicUrl || null
    };
    return {
      ...state,
      match: {
        matchKey: event.matchKey,
        mode: typeof event.mode === 'string' ? event.mode : '',
        host,
        at: now
      },
      visit: state.visit
        ? { ...state.visit, status: 'matched' }
        : { host, status: 'matched', walkupId: null, joinable: null }
    };
  }
  if (event.type === 'released') {
    if (!state.visit || state.visit.walkupId !== event.walkupId) return state;
    return { ...state, visit: { ...state.visit, status: 'released' } };
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
    case 'matched':
      return game ? `You're playing with ${name}` : `You're with ${name}`;
  }
}

export function queueChipText(count: number) {
  return count === 1 ? '1 person wants next' : `${count} people want next`;
}

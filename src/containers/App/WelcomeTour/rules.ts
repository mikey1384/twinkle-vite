// The welcome greeter's show/hide rules and tour ordering (Mikey 11-25).
// Kept free of app imports so node tests can load it.

export type WelcomeTourGuide = 'zero' | 'ciel';
export type WelcomeTourVariant = 'student' | 'teacher';
export type WelcomeTourExtra = 'make' | 'apps' | 'arena_exams';
// where a tour was started from (telemetry): the welcome card's "Start the
// tour" button, the greeter banner, the "Show me around Twinkle" chip
export type WelcomeTourSource = 'card' | 'banner' | 'chip';

export interface WelcomeTourStop {
  key: string;
  title: string;
  short: string;
  path: string;
  target: string;
  lines: Record<WelcomeTourGuide, string>;
  extra?: WelcomeTourExtra;
}

export interface MakeChoiceOption {
  label: string;
  idea: string;
  next?: MakeChoiceQuestion;
}
export interface MakeChoiceQuestion {
  question: string;
  options: MakeChoiceOption[];
  ownHint: string;
}

export interface WelcomeTourData {
  banner: { show: boolean; reason: string };
  state: WelcomeTourServerState & { guide: WelcomeTourGuide | null };
  // the server takes runs and Skip tour (an older API: neither)
  features?: { runs?: boolean };
  // what the Lumine stop offers (an older API: missing; the stop stays
  // read-only then, so it can never make a second project)
  lumineStop?:
    | { kind: 'project'; project: WelcomeTourProject }
    | { kind: 'card_waiting'; requestId: number }
    | { kind: 'card_in_progress'; requestId: number }
    | { kind: 'make' }
    | { kind: 'unavailable' };
  welcomeCardPathId?: number;
  tour: {
    variant: WelcomeTourVariant;
    greeting: {
      line: string;
      afterVideoLine: string;
      finishLine: Record<WelcomeTourGuide, string>;
      // a finish with stops skipped (an older API: missing, finishLine then)
      partialFinishLine?: Record<WelcomeTourGuide, string>;
    };
    stops: WelcomeTourStop[];
    makeChoices: MakeChoiceQuestion;
    arena: { total: number; groups: { label: string; exams: string[] }[] };
    apps: { pinnedBuildId: number; extra: number };
  };
  welcomeCard: { requestId: number; persona: WelcomeTourGuide } | null;
  // the project Twinkle already made them (the welcome card's or the tour's
  // first build): the Lumine stop opens it instead of offering another
  firstProject?: WelcomeTourProject | null;
  // what Twinkle pays for on this member's first tour (server-decided)
  // talk: free talk with the guide (text or voice call) on the first tour
  free: { build: boolean; card: boolean; talk: 'free' | 'low' | 'none' };
}

export interface WelcomeTourProject {
  buildId: number;
  title: string;
  // what Lumine gets on the first open (the editor sends it only while the
  // project has no chat yet), and whether that may happen by itself
  idea?: string;
  autoStart?: boolean;
}

export interface SurfaceState {
  pathname: string;
  // an open modal ([aria-modal="true"] on screen)
  modalOpen: boolean;
  // a running game or sitting that registered itself (Arena battle, drill)
  focusSurfaces: number;
  // a visible Build app runtime layer
  appRuntimeVisible: boolean;
}

// Never cover a running game or app, the Build editor, an Arena sitting or an
// open modal: wait until the member leaves them.
export function isWelcomeBlockedSurface(state: SurfaceState) {
  const path = state.pathname || '/';
  if (state.modalOpen || state.focusSurfaces > 0 || state.appRuntimeVisible) {
    return true;
  }
  if (/^\/app(-capture)?\//.test(path)) return true;
  // the Build editor (/build/123...), not the Build list or New page
  if (/^\/build\/(preview\/|\d)/.test(path)) return true;
  if (/^\/(signin|signup|reset|verify|cli|join)\b/.test(path)) return true;
  return false;
}

export function isXpVideoPage(pathname: string) {
  return /^\/videos\/[^/]+/.test(pathname || '');
}

export type MediaState = 'idle' | 'playing' | 'paused' | 'ended' | 'rewarded';

// When the banner may slide up on this page (ms since the page settled).
// - most pages: a short beat after the first page load;
// - an XP video page (where most students arrive for homework): never while
//   the video plays; right when it ends or pays XP, after a pause of a few
//   seconds, or if the video never starts.
export const WELCOME_BANNER_DELAY_MS = 4000;
export const WELCOME_VIDEO_PAUSE_MS = 3000;
export const WELCOME_VIDEO_IDLE_MS = 20000;

export function welcomeBannerReady({
  pathname,
  media,
  msSinceLoad,
  msSinceMediaChange
}: {
  pathname: string;
  media: MediaState;
  msSinceLoad: number;
  msSinceMediaChange: number;
}) {
  if (!isXpVideoPage(pathname)) return msSinceLoad >= WELCOME_BANNER_DELAY_MS;
  if (media === 'playing') return false;
  if (media === 'ended' || media === 'rewarded') return true;
  if (media === 'paused') return msSinceMediaChange >= WELCOME_VIDEO_PAUSE_MS;
  return msSinceLoad >= WELCOME_VIDEO_IDLE_MS;
}

// Which greeting line fits the moment.
export function welcomeGreetingLine(
  greeting: { line: string; afterVideoLine: string },
  { pathname, media }: { pathname: string; media: MediaState }
) {
  return isXpVideoPage(pathname) && (media === 'ended' || media === 'rewarded' || media === 'paused')
    ? greeting.afterVideoLine
    : greeting.line;
}

// Chat comes first, unless the member started the tour while already on
// Chat: then it moves to the end, so the tour opens on something new and
// Chat is still in the strip to revisit. The welcome card's "Start the tour"
// keeps the tour's own order (Mikey 11-26: Chat, then Lumine with their new
// project, then the rest), although the card sits in a chat.
export function orderWelcomeStops(
  stops: WelcomeTourStop[],
  startPathname: string,
  { keepOrder = false }: { keepOrder?: boolean } = {}
) {
  const onChat = /^\/chat(\/|$)/.test(startPathname || '');
  if (!onChat || keepOrder) return stops;
  const chat = stops.filter((stop) => stop.key === 'chat');
  return [...stops.filter((stop) => stop.key !== 'chat'), ...chat];
}

export type StopMark = 'done' | 'skipped' | 'current' | 'upcoming';

export function stopMarks({
  stops,
  index,
  done,
  skipped
}: {
  stops: WelcomeTourStop[];
  index: number;
  done: string[];
  skipped: string[];
}): StopMark[] {
  return stops.map((stop, i) => {
    if (i === index) return 'current';
    if (done.includes(stop.key)) return 'done';
    if (skipped.includes(stop.key)) return 'skipped';
    return 'upcoming';
  });
}

// The idea Lumine gets from the "What do you want to make?" answers: the
// deepest choice (or their own words), plus anything they added.
export function composeMakeIdea({
  ideas,
  own,
  extra
}: {
  ideas: string[];
  own: string;
  extra: string;
}) {
  const base = own.trim() || ideas[ideas.length - 1] || '';
  if (!base) return '';
  const sentence = /^(make|build|create)\b/i.test(base)
    ? base.replace(/[.\s]+$/, '') + '.'
    : `Make ${base.replace(/[.\s]+$/, '')}.`;
  const more = extra.trim();
  return [sentence, more].filter(Boolean).join(' ').slice(0, 300);
}

// The new project's name: their own words, or "My first game".
export function makeTitleFor({ labels, own }: { labels: string[]; own: string }) {
  const words = own.trim().split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
  if (words) return words.length > 40 ? `${words.slice(0, 39)}…` : words;
  const top = (labels[0] || 'project').toLowerCase();
  return `My first ${top}`;
}

// Where "Start the tour" picks up: the stop they were on when they left
// (closed it, skipped the rest, reloaded), or the start once they finished.
export function welcomeTourResumeKey(state: WelcomeTourServerState | null | undefined) {
  if (!state) return '';
  // runs (review 11-26): the run's own status, apart from the banner's
  if (state.runStatus) return state.runStatus === 'finished' ? '' : state.stopKey || '';
  if (state.status === 'finished') return '';
  return state.stopKey || '';
}

// The tour state as the server confirmed it (GET /user/welcome-tour, or the
// answer to a step). runId and runSeq order them: a later run, or a later
// step of the same run, is newer.
export interface WelcomeTourServerState {
  status: string | null;
  stopKey: string;
  runId?: number;
  runSeq?: number;
  runStatus?: string;
  visited?: string[];
}

// The newer of the server's state and this tab's last confirmed one, which
// only counts for the account that made it.
export function newerWelcomeTourState(
  server: WelcomeTourServerState | null,
  local: (WelcomeTourServerState & { userId: number }) | null,
  userId: number
): WelcomeTourServerState | null {
  if (!local || !(userId > 0) || local.userId !== userId) return server;
  if (!server) return local;
  const serverRun = Number(server.runId || 0);
  const localRun = Number(local.runId || 0);
  if (localRun !== serverRun) return localRun > serverRun ? local : server;
  return Number(local.runSeq || 0) >= Number(server.runSeq || 0) ? local : server;
}

// What opening a Twinkle-made project sends Lumine by itself (review 11-26
// P0): the idea only while Twinkle's free first run is the one it would
// start; otherwise nothing, and generation waits for the member's own build
// action. The editor sends it only while the project has no chat yet.
export function projectOpenPrompt(
  from: { idea?: unknown; lumineRunSponsored?: unknown; autoStart?: unknown } | null | undefined
) {
  if (!from) return '';
  const free = from.autoStart === true || from.lumineRunSponsored === true;
  const idea = typeof from.idea === 'string' ? from.idea.trim() : '';
  return free && idea ? idea : '';
}

// The welcome card's tour button: "Start the tour with Zero", or "Continue"
// with how far they got once they're partway through.
export function welcomeTourButton({
  guideName,
  stops,
  resumeKey
}: {
  guideName: string;
  stops: { key: string }[];
  resumeKey: string;
}) {
  const at = resumeKey ? stops.findIndex((stop) => stop.key === resumeKey) : -1;
  if (at > 0) {
    return { label: `Continue the tour with ${guideName}`, progress: `${at + 1} of ${stops.length}` };
  }
  return { label: `Start the tour with ${guideName}`, progress: '' };
}

// The Build editor, where a project opened from the tour lives (the tour
// waits there and moves on when the member comes back).
export function isBuildEditorPath(pathname: string) {
  return /^\/build\/(preview\/|\d)/.test(pathname || '');
}

// A run's id for its start request (a retried start sends the same one).
export function newWelcomeRunKey(random: () => number = Math.random) {
  let key = 'r';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  while (key.length < 16) key += chars[Math.floor(random() * chars.length)];
  return key;
}

// What the Lumine stop offers on this website: the server's answer, or, on
// an older API without one, the project the welcome card handed over, and
// otherwise nothing to press (so it can never make a second project).
export function lumineStopFor(
  data: Pick<WelcomeTourData, 'lumineStop' | 'firstProject'>,
  hint: WelcomeTourProject | null
): NonNullable<WelcomeTourData['lumineStop']> | { kind: 'readonly' } {
  if (data.lumineStop) return data.lumineStop;
  const project = data.firstProject || hint;
  if (project) return { kind: 'project', project: { ...project, autoStart: false } };
  return { kind: 'readonly' };
}

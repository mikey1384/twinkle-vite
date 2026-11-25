// The welcome greeter's show/hide rules and tour ordering (Mikey 11-25).
// Kept free of app imports so node tests can load it.

export type WelcomeTourGuide = 'zero' | 'ciel';
export type WelcomeTourVariant = 'student' | 'teacher';
export type WelcomeTourExtra = 'make' | 'apps' | 'arena_exams';

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
  state: { status: string | null; guide: WelcomeTourGuide | null; stopKey: string };
  tour: {
    variant: WelcomeTourVariant;
    greeting: {
      line: string;
      afterVideoLine: string;
      finishLine: Record<WelcomeTourGuide, string>;
    };
    stops: WelcomeTourStop[];
    makeChoices: MakeChoiceQuestion;
    arena: { total: number; groups: { label: string; exams: string[] }[] };
    apps: { pinnedBuildId: number; extra: number };
  };
  welcomeCard: { requestId: number; persona: WelcomeTourGuide } | null;
  // what Twinkle pays for on this member's first tour (server-decided)
  // talk: free talk with the guide (text or voice call) on the first tour
  free: { build: boolean; card: boolean; talk: 'free' | 'low' | 'none' };
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
// Chat is still in the strip to revisit.
export function orderWelcomeStops(stops: WelcomeTourStop[], startPathname: string) {
  const onChat = /^\/chat(\/|$)/.test(startPathname || '');
  if (!onChat) return stops;
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

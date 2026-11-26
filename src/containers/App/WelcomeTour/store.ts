// Small module-level signals for the welcome tour, so places far from the
// host can talk to it without a context: the DM welcome card and the
// "Show me around Twinkle" chip open the tour; the XP video player says
// whether a video is playing; an Arena sitting says a sitting is on.
// No app imports: node tests load it.
import type { MediaState, WelcomeTourGuide, WelcomeTourProject, WelcomeTourSource } from './rules';

type Listener = () => void;

function signal<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

// ---- open the tour from anywhere ------------------------------------------
export interface WelcomeTourOpenOptions {
  // jump straight to this stop; without one the tour resumes where the
  // member left off (or starts over once they finished it)
  stopKey?: string;
  guide?: WelcomeTourGuide;
  source?: WelcomeTourSource;
  // the welcome card's own project, for an API that doesn't send it yet
  project?: WelcomeTourProject | null;
}
export interface WelcomeTourOpenRequest extends WelcomeTourOpenOptions {
  at: number;
}
export const welcomeTourOpenRequest = signal<WelcomeTourOpenRequest | null>(null);

export function startWelcomeTour(options: WelcomeTourOpenOptions = {}) {
  welcomeTourOpenRequest.set({ ...options, at: Date.now() });
}

// Where the running tour is, so the welcome card's button can say
// "Continue the tour" (2 of 6) without asking the server again.
export const welcomeTourProgress = signal<{ status: string | null; stopKey: string } | null>(null);

// The starter chip text the API sends newcomers (twinkle-api
// helpers/ai/websiteAgent/starters.ts NEWCOMER_TOUR): tapping it opens this
// scripted tour instead of asking the AI for one.
export const WELCOME_TOUR_STARTER = 'Show me around Twinkle';

export function isWelcomeTourStarter(idea: string) {
  return String(idea || '').trim().toLowerCase() === WELCOME_TOUR_STARTER.toLowerCase();
}

// ---- the XP video player ----------------------------------------------------
export const welcomeMedia = signal<{ state: MediaState; at: number }>({
  state: 'idle',
  at: Date.now()
});

export function reportWelcomeMedia(state: MediaState) {
  welcomeMedia.set({ state, at: Date.now() });
}

// ---- running games and sittings ---------------------------------------------
export const welcomeFocusSurfaces = signal(0);

export function enterWelcomeFocusSurface() {
  welcomeFocusSurfaces.set(welcomeFocusSurfaces.get() + 1);
  let left = false;
  return () => {
    if (left) return;
    left = true;
    welcomeFocusSurfaces.set(Math.max(0, welcomeFocusSurfaces.get() - 1));
  };
}

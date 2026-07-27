// Video theater ("cinema") mode tiers:
//   0  off — the player sits inline in the page
//   1  stage — the player fills everything BELOW the global nav, which stays
//      visible and usable so the viewer can navigate away and come back
//   2  full — the global nav is hidden too and the player owns the whole tab
//
// Watch surfaces remember tier 1 (View context + localStorage) so the layout
// survives navigation and reloads. Tier 2 is never remembered: it hides the
// global nav, so it belongs to the mount that asked for it and a return lands
// back at the navigable tier.
export type CinemaLevel = 0 | 1 | 2;
export type RememberedCinemaLevel = 0 | 1;

const CINEMA_LEVEL_KEY = 'twinkle-video-theater-level';

export function normalizeCinemaLevel(value: unknown): RememberedCinemaLevel {
  return Number(value) === 1 ? 1 : 0;
}

export function readStoredCinemaLevel(): RememberedCinemaLevel {
  try {
    return normalizeCinemaLevel(localStorage.getItem(CINEMA_LEVEL_KEY));
  } catch {
    // storage can be unavailable in some browser modes
    return 0;
  }
}

export function storeCinemaLevel(level: RememberedCinemaLevel) {
  try {
    localStorage.setItem(CINEMA_LEVEL_KEY, String(level));
  } catch {
    // storage can be unavailable in some browser modes
  }
}

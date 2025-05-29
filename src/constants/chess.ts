export const BASE_RATING = 400; // everyone starts here
export const LEVEL_WIDTH = 100; // elo points per level
export const LOWEST_PUZZLE_RATING = 400;

// Promotion rating thresholds - when player's rating crosses these, they get promotion challenges
export const PROMO_RATING_STEPS = [
  500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800,
  1900, 2000
];

/**
 * Maps chess level to rating window
 * Level 1  → 400-499
 * Level n  → BASE + (n-1)*WIDTH  …  +WIDTH-1
 */
export function levelToRatingWindow(level: number) {
  const floor = BASE_RATING + (level - 1) * LEVEL_WIDTH;
  return { floor, ceil: floor + LEVEL_WIDTH - 1 };
}

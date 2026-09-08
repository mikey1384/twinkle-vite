import { Color } from '~/constants/css';

// Keep each level's color identity, with readable ink on the dark chat banner.
// This does not change Word Master colors or Wordle's reward/level calculations.
const wordLevelInk: Record<number, string> = {
  0: Color.lightBlue(),
  1: Color.lightBlue(),
  2: Color.pink(),
  3: Color.orange(),
  4: Color.lightRed(),
  5: Color.gold()
};

export function getWordleBannerLevelColor(level: number): string {
  return wordLevelInk[level] || Color.lightBlue();
}

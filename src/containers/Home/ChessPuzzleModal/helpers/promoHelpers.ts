import { RATING_WINDOWS } from '~/constants/chessLevels';

export function getPromotionStatus({
  rating,
  maxLevelUnlocked,
  promoCooldownUntil
}: {
  rating: number;
  maxLevelUnlocked: number;
  promoCooldownUntil: string | null; // ISO timestamp from DB (nullable)
}) {
  // already at or beyond final tier → never show button
  if (maxLevelUnlocked >= RATING_WINDOWS.length) {
    return { needsPromotion: false, cooldownSeconds: null };
  }

  // respect cooldown
  if (promoCooldownUntil) {
    const seconds = Math.floor(
      (new Date(promoCooldownUntil).getTime() - Date.now()) / 1000
    );
    if (seconds > 0) {
      return { needsPromotion: false, cooldownSeconds: seconds };
    }
  }

  const { ceil } = RATING_WINDOWS[maxLevelUnlocked - 1]; // array is 0-indexed
  const needsPromotion = rating > ceil;

  return { needsPromotion, cooldownSeconds: null };
}

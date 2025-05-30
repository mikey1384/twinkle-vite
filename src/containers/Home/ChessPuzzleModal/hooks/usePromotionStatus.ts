import { useMemo } from 'react';
import { getPromotionStatus } from '~/containers/Home/ChessPuzzleModal/helpers/promoHelpers';
import { useChessStats } from './useChessStats';

export function usePromotionStatus() {
  const { stats, loading: statsLoading } = useChessStats();

  return useMemo(() => {
    if (!stats) {
      return {
        needsPromotion: false,
        cooldownSeconds: null,
        loading: statsLoading
      };
    }

    const { needsPromotion, cooldownSeconds } = getPromotionStatus({
      rating: stats.rating,
      maxLevelUnlocked: stats.maxLevelUnlocked,
      promoCooldownUntil: stats.promoCooldownUntil
    });

    return { needsPromotion, cooldownSeconds, loading: false };
  }, [stats, statsLoading]);
}

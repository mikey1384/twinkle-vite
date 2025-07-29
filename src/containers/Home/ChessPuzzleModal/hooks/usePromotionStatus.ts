import { useMemo } from 'react';
import { useChessStats } from './useChessStats';

export function usePromotionStatus() {
  const { stats, loading: statsLoading, refreshStats } = useChessStats();

  return useMemo(() => {
    if (!stats) {
      return {
        needsPromotion: false,
        cooldownUntilTomorrow: false,
        currentStreak: 0,
        nextDayTimestamp: null,
        loading: statsLoading,
        refresh: refreshStats
      };
    }

    const needsPromotion =
      stats.currentLevelStreak >= 10 && !stats.cooldownUntilTomorrow;

    return {
      needsPromotion,
      cooldownUntilTomorrow: stats.cooldownUntilTomorrow || false,
      currentStreak: stats.currentLevelStreak || 0,
      nextDayTimestamp: stats.nextDayTimestamp || null,
      loading: false,
      refresh: refreshStats
    };
  }, [stats, statsLoading, refreshStats]);
}

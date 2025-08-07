import { useMemo } from 'react';
import type { ChessStats } from '~/types/chess';

export function usePromotionStatus({
  stats,
  statsLoading,
  refreshStats
}: {
  stats: ChessStats | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
}) {
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

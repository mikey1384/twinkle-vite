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
        loading: statsLoading,
        refresh: refreshStats
      };
    }

    // Use the streak-based system
    const needsPromotion = stats.currentLevelStreak >= 10;

    // Check if failed promotion today (would need to call API or check dayIndex)
    // For now, we'll assume no cooldown and let the backend handle it
    const cooldownUntilTomorrow = false; // Will be handled by backend

    return {
      needsPromotion,
      cooldownUntilTomorrow,
      currentStreak: stats.currentLevelStreak || 0,
      loading: false,
      refresh: refreshStats
    };
  }, [stats, statsLoading, refreshStats]);
}

import { useMemo, useEffect, useState } from 'react';
import { getPromotionStatus } from '~/containers/Home/ChessPuzzleModal/helpers/promoHelpers';
import { useChessStats } from './useChessStats';

export function usePromotionStatus() {
  const { stats, loading: statsLoading, refreshStats } = useChessStats();
  const [now, setNow] = useState(Date.now());

  // Update time every second to keep cooldown accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    if (!stats) {
      return {
        needsPromotion: false,
        cooldownSeconds: null,
        loading: statsLoading,
        refresh: refreshStats
      };
    }

    // Use current time for accurate cooldown calculation
    const { needsPromotion, cooldownSeconds } = getPromotionStatus({
      rating: stats.rating,
      maxLevelUnlocked: stats.maxLevelUnlocked,
      promoCooldownUntil: stats.promoCooldownUntil
    });

    return {
      needsPromotion,
      cooldownSeconds,
      loading: false,
      refresh: refreshStats
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, statsLoading, now, refreshStats]);
}

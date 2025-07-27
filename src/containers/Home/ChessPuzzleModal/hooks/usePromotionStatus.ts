import { useMemo, useEffect, useState } from 'react';
import { useChessStats } from './useChessStats';
import { RATING_WINDOWS } from '~/constants/chessLevels';

export function usePromotionStatus() {
  const { stats, loading: statsLoading, refreshStats } = useChessStats();
  const [now, setNow] = useState(Date.now());

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

function getPromotionStatus({
  rating,
  maxLevelUnlocked,
  promoCooldownUntil
}: {
  rating: number;
  maxLevelUnlocked: number;
  promoCooldownUntil: string | null;
}) {
  if (maxLevelUnlocked >= RATING_WINDOWS.length) {
    return { needsPromotion: false, cooldownSeconds: null };
  }

  if (promoCooldownUntil) {
    const seconds = Math.floor(
      (new Date(promoCooldownUntil).getTime() - Date.now()) / 1000
    );
    if (seconds > 0) {
      return { needsPromotion: false, cooldownSeconds: seconds };
    }
  }

  const { ceil } = RATING_WINDOWS[maxLevelUnlocked - 1];
  const needsPromotion = rating > ceil;

  return { needsPromotion, cooldownSeconds: null };
}

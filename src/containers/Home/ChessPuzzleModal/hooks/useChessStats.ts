import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '~/contexts/hooks';
import type { ChessStats, PromotionEligibility } from '~/types/chess';

interface UseChessStatsReturn {
  stats: ChessStats | null;
  promotionEligibility: PromotionEligibility | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  checkPromotion: () => Promise<void>;
  handlePromotion: ({
    success,
    targetRating,
    token
  }: {
    success: boolean;
    targetRating: number;
    token: string;
  }) => Promise<void>;
}

export function useChessStats(): UseChessStatsReturn {
  const loadChessStats = useAppContext((v) => v.requestHelpers.loadChessStats);
  const checkPromotionEligibility = useAppContext(
    (v) => v.requestHelpers.checkPromotionEligibility
  );
  const completePromotion = useAppContext(
    (v) => v.requestHelpers.completePromotion
  );

  const [stats, setStats] = useState<ChessStats | null>(null);
  const [promotionEligibility, setPromotionEligibility] =
    useState<PromotionEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newStats = await loadChessStats();
      if (newStats) {
        setStats(newStats);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load chess stats'
      );
    } finally {
      setLoading(false);
    }
  }, [loadChessStats]);

  const checkPromotion = useCallback(async () => {
    try {
      const eligibility = await checkPromotionEligibility();
      if (eligibility) {
        setPromotionEligibility(eligibility);
      }
    } catch (err) {
      console.error('Failed to check promotion eligibility:', err);
    }
  }, [checkPromotionEligibility]);

  const handlePromotion = useCallback(
    async ({
      success,
      targetRating,
      token
    }: {
      success: boolean;
      targetRating: number;
      token: string;
    }) => {
      try {
        const updatedStats = await completePromotion({
          success,
          targetRating,
          token
        });
        if (updatedStats) {
          setStats(updatedStats);
          setPromotionEligibility(null); // Clear promotion eligibility after completion
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to complete promotion'
        );
        // Re-check promotion eligibility after failure to reflect cooldown
        await checkPromotion();
      }
    },
    [completePromotion, checkPromotion]
  );

  // Load stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    promotionEligibility,
    loading,
    error,
    refreshStats,
    checkPromotion,
    handlePromotion
  };
}

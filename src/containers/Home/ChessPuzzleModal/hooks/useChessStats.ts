import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '~/contexts/hooks';
import type { ChessStats } from '~/types/chess';

interface UseChessStatsReturn {
  stats: ChessStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
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
  const completePromotion = useAppContext(
    (v) => v.requestHelpers.completePromotion
  );

  const [stats, setStats] = useState<ChessStats | null>(null);
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
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to complete promotion'
        );
      }
    },
    [completePromotion]
  );

  // Load stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    handlePromotion
  };
}

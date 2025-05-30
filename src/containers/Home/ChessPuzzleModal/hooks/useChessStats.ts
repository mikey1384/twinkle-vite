import { useCallback } from 'react';
import { useAppContext } from '~/contexts/hooks';
import { useChessStatsContext } from '~/containers/Home/ChessPuzzleModal/ChessStatsContext';
import type { ChessStats } from '~/types/chess';

interface UseChessStatsReturn {
  stats: ChessStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  updateStats: (partial: Partial<ChessStats>) => void;
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
  const { stats, loading, error, refreshStats, updateStats } =
    useChessStatsContext();
  const completePromotion = useAppContext(
    (v) => v.requestHelpers.completePromotion
  );

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
          updateStats(updatedStats);
        }
      } catch (err) {
        console.error('Failed to complete promotion:', err);
        // Refresh stats on error to get latest state
        await refreshStats();
      }
    },
    [completePromotion, updateStats, refreshStats]
  );

  return {
    stats,
    loading,
    error,
    refreshStats,
    updateStats,
    handlePromotion
  };
}

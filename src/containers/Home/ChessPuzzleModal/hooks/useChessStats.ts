import { useCallback } from 'react';
import { useAppContext, useChessContext } from '~/contexts/hooks';
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
  const stats = useChessContext((v) => v.state.stats);
  const loading = useChessContext((v) => v.state.loading);
  const error = useChessContext((v) => v.state.error);
  const onSetChessStats = useChessContext((v) => v.actions.onSetChessStats);
  const onUpdateChessStats = useChessContext(
    (v) => v.actions.onUpdateChessStats
  );
  const onSetChessLoading = useChessContext((v) => v.actions.onSetChessLoading);
  const onSetChessError = useChessContext((v) => v.actions.onSetChessError);

  const loadChessStats = useAppContext((v) => v.requestHelpers.loadChessStats);
  const completePromotion = useAppContext(
    (v) => v.requestHelpers.completePromotion
  );

  const refreshStats = useCallback(async () => {
    onSetChessLoading(true);
    onSetChessError(null);
    try {
      const data = await loadChessStats();
      if (data) {
        onSetChessStats(data);
      }
    } catch (e: any) {
      onSetChessError(e?.message ?? 'Failed to load chess stats');
    } finally {
      onSetChessLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePromotion({
    success,
    targetRating,
    token
  }: {
    success: boolean;
    targetRating: number;
    token: string;
  }) {
    try {
      const updatedStats = await completePromotion({
        success,
        targetRating,
        token
      });
      if (updatedStats) {
        onUpdateChessStats(updatedStats);
      }
    } catch (err) {
      console.error('Failed to complete promotion:', err);
      await refreshStats();
    }
  }

  return {
    stats,
    loading,
    error,
    refreshStats,
    handlePromotion
  };
}

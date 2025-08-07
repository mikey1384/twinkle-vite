import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { LichessPuzzle, ChessLevelsResponse } from '~/types/chess';
import { useAppContext, useKeyContext, useChessContext } from '~/contexts';

export interface AttemptPayload {
  attemptId: number | null;
  solved: boolean;
  attemptsUsed: number;
  selectedLevel: number;
}

export interface AttemptResponse {
  xpEarned: number;
  newXp: number | null;
  rank: number | null;
  streak?: number;
  nextPuzzle: LichessPuzzle;
  rating?: number;
  maxLevelUnlocked?: number;
  currentLevelStreak?: number;
  promoCooldownUntil?: string | null;
}

export interface SubmitAttemptParams {
  attemptId: string;
  solved: boolean;
  attemptsUsed: number;
}

export function useChessPuzzle() {
  const [loading, setLoading] = useState(false);
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [levels, setLevels] = useState<number[]>([]);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsError, setLevelsError] = useState<string>();

  const stats = useChessContext((v) => v.state.stats);
  const statsLoading = useChessContext((v) => v.state.loading);
  const statsError = useChessContext((v) => v.state.error);
  const onSetChessStats = useChessContext((v) => v.actions.onSetChessStats);
  const onUpdateChessStats = useChessContext(
    (v) => v.actions.onUpdateChessStats
  );
  const onSetChessLoading = useChessContext((v) => v.actions.onSetChessLoading);
  const onSetChessError = useChessContext((v) => v.actions.onSetChessError);

  const cancellingRef = useRef(false);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadChessPuzzle = useAppContext(
    (v) => v.requestHelpers.loadChessPuzzle
  );
  const submitChessAttempt = useAppContext(
    (v) => v.requestHelpers.submitChessAttempt
  );
  const loadChessLevels = useAppContext(
    (v) => v.requestHelpers.loadChessLevels
  );
  const loadChessStats = useAppContext((v) => v.requestHelpers.loadChessStats);
  const completePromotion = useAppContext(
    (v) => v.requestHelpers.completePromotion
  );

  const refreshLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const resp = (await loadChessLevels()) as ChessLevelsResponse;

      const levelNumbers = resp.levels.map((l) => l.level);

      setLevels(levelNumbers);
      setMaxLevelUnlocked(resp.maxLevelUnlocked);
    } catch (e: any) {
      setLevelsError(e.message ?? 'Unknown error');
    } finally {
      setLevelsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fetchPuzzle = useCallback(
    async (level: number = 1) => {
      setLoading(true);
      setPuzzle(null);
      setAttemptId(null);

      try {
        const { puzzle, attemptId } = await loadChessPuzzle({
          level
        });

        setPuzzle(puzzle);
        setAttemptId(attemptId);
        setLoading(false);
      } catch (e) {
        setError(String(e));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  function updatePuzzle(puzzle: LichessPuzzle) {
    setPuzzle(puzzle);
    setLoading(false);
    setError(null);
  }

  async function submitAttempt({
    attemptId,
    solved,
    attemptsUsed,
    selectedLevel
  }: AttemptPayload): Promise<AttemptResponse> {
    if (cancellingRef.current) {
      throw new Error('Operation cancelled');
    }

    try {
      const result = await submitChessAttempt({
        attemptId,
        solved,
        attemptsUsed,
        selectedLevel
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    refreshLevels();
  }, [refreshLevels]);

  const promotionStatus = useMemo(() => {
    if (!stats) {
      return {
        needsPromotion: false,
        cooldownUntilTomorrow: false,
        currentStreak: 0,
        nextDayTimestamp: null,
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
      refresh: refreshStats
    };
  }, [stats, refreshStats]);

  return {
    attemptId,
    puzzle,
    loading,
    error,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle,
    // Chess levels
    levels,
    maxLevelUnlocked,
    levelsLoading,
    levelsError,
    refreshLevels,
    // Chess stats
    stats,
    statsLoading,
    statsError,
    refreshStats,
    handlePromotion,
    // Promotion status
    ...promotionStatus
  };
}

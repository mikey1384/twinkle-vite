import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  LichessPuzzle,
  ChessLevelsResponse,
  MultiPlyPuzzleState
} from '~/types/chess';
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

  // Time attack state
  const [inTimeAttack, setInTimeAttack] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<'PLAYING' | 'SUCCESS' | 'FAIL'>(
    'PLAYING'
  );
  const [startingPromotion, setStartingPromotion] = useState(false);
  const [promoSolved, setPromoSolved] = useState(0);
  const runIdRef = useRef<number | null>(null);
  // Once unlocked via 10-streak, keep it available until user starts promotion or day cooldown kicks in
  const [promotionUnlocked, setPromotionUnlocked] = useState(false);

  // Additional state that handlePromotionClick needs to control
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [puzzleState, setPuzzleState] = useState<MultiPlyPuzzleState>({
    phase: 'WAIT_USER',
    solutionIndex: 0,
    moveHistory: [],
    attemptsUsed: 0,
    showingHint: false
  });

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
  const startTimeAttackPromotion = useAppContext(
    (v) => v.requestHelpers.startTimeAttackPromotion
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

  async function handlePromotionClick(): Promise<LichessPuzzle | undefined> {
    try {
      setStartingPromotion(true);
      const { puzzle: promoPuzzle, runId } = await startTimeAttackPromotion();
      runIdRef.current = runId;
      setPromotionUnlocked(false);
      setInTimeAttack(true);
      setTimeLeft(30);
      setRunResult('PLAYING');

      updatePuzzle(promoPuzzle);
      setSelectedSquare(null);
      setPuzzleState({
        phase: 'WAIT_USER',
        solutionIndex: 0,
        moveHistory: [],
        attemptsUsed: 0,
        showingHint: false
      });

      setPromoSolved(0);

      await refreshLevels();
      return promoPuzzle;
    } catch (err: any) {
      console.error('❌ failed starting time‑attack:', err);

      if (err?.status === 403 || err?.response?.status === 403) {
        await refreshStats();
      }
      return undefined;
    } finally {
      setStartingPromotion(false);
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

    const unlockedFromServer = !!(stats as any).promotionUnlocked;
    const hasThreshold = stats.currentLevelStreak >= 10;
    const unlocked = unlockedFromServer || promotionUnlocked || hasThreshold;
    const needsPromotion = unlocked && !stats.cooldownUntilTomorrow;

    return {
      needsPromotion,
      cooldownUntilTomorrow: stats.cooldownUntilTomorrow || false,
      currentStreak: stats.currentLevelStreak || 0,
      nextDayTimestamp: stats.nextDayTimestamp || null,
      refresh: refreshStats
    };
  }, [stats, refreshStats, promotionUnlocked]);

  // Lock-in unlock when threshold is reached or server says unlocked; clear on cooldown or after starting promotion
  useEffect(() => {
    if (!stats) return;
    if (stats.cooldownUntilTomorrow) {
      setPromotionUnlocked(false);
      return;
    }
    if ((stats as any).promotionUnlocked || stats.currentLevelStreak >= 10) {
      setPromotionUnlocked(true);
    }
  }, [stats]);

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
    ...promotionStatus,
    // Time attack state
    inTimeAttack,
    setInTimeAttack,
    timeLeft,
    setTimeLeft,
    runResult,
    setRunResult,
    startingPromotion,
    promoSolved,
    setPromoSolved,
    runIdRef,
    // Puzzle state
    selectedSquare,
    setSelectedSquare,
    puzzleState,
    setPuzzleState,
    // Actions
    handlePromotionClick
  };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  LichessPuzzle,
  ChessLevelsResponse,
  MultiPlyPuzzleState,
  PuzzlePhase
} from '~/types/chess';
import { TIME_ATTACK_DURATION } from '../../constants';

import { useAppContext, useKeyContext, useChessContext } from '~/contexts';

export interface AttemptPayload {
  attemptId: number | null;
  solved: boolean;
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
  promotionUnlocked?: boolean;
  promoCooldownUntil?: string | null;
}

export interface SubmitAttemptParams {
  attemptId: string;
  solved: boolean;
}

export function useChessPuzzle() {
  const [loading, setLoading] = useState(false);
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [levels, setLevels] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsError, setLevelsError] = useState<string>();

  // Time attack state
  const [inTimeAttack, setInTimeAttack] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(TIME_ATTACK_DURATION);
  const [runResult, setRunResult] = useState<
    'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING'
  >('PLAYING');
  const runIdRef = useRef<number | null>(null);

  // Additional state that handlePromotionClick needs to control
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [phase, setPhase] = useState<PuzzlePhase>('WAIT_USER');
  const [puzzleState, setPuzzleState] = useState<MultiPlyPuzzleState>({
    solutionIndex: 0,
    moveHistory: [],
    showingHint: false
  });

  const stats = useChessContext((v) => v.state.stats);
  const statsLoading = useChessContext((v) => v.state.loading);
  const statsError = useChessContext((v) => v.state.error);
  const onSetChessStats = useChessContext((v) => v.actions.onSetChessStats);
  const onSetChessLoading = useChessContext((v) => v.actions.onSetChessLoading);
  const onSetChessError = useChessContext((v) => v.actions.onSetChessError);

  const cancellingRef = useRef(false);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadChessPuzzle = useAppContext(
    (v) => v.requestHelpers.loadChessPuzzle
  );
  const recordChessAttemptResult = useAppContext(
    (v) => v.requestHelpers.recordChessAttemptResult
  );
  const loadChessLevels = useAppContext(
    (v) => v.requestHelpers.loadChessLevels
  );
  const loadChessStats = useAppContext((v) => v.requestHelpers.loadChessStats);
  const updateChessCurrentLevel = useAppContext(
    (v) => v.requestHelpers.updateChessCurrentLevel
  );

  const refreshLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const resp = (await loadChessLevels()) as ChessLevelsResponse;

      const levelNumbers = resp.levels.map((l) => l.level);
      const nextMaxLevel = resp.maxLevelUnlocked ?? 1;
      const nextCurrentLevel = resp.currentLevel ?? nextMaxLevel ?? 1;

      setLevels(levelNumbers);
      setMaxLevelUnlocked(nextMaxLevel);
      setCurrentLevel(nextCurrentLevel > 0 ? nextCurrentLevel : 1);
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
    selectedLevel
  }: AttemptPayload): Promise<AttemptResponse> {
    if (cancellingRef.current) {
      throw new Error('Operation cancelled');
    }

    try {
      const result = await recordChessAttemptResult({
        attemptId,
        solved,
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

  const persistCurrentLevel = useCallback(
    async (level: number) => {
      const targetLevel = Math.max(1, level || 1);
      try {
        const response = await updateChessCurrentLevel({ level: targetLevel });
        const nextCurrent =
          typeof response?.currentLevel === 'number' &&
          response.currentLevel > 0
            ? response.currentLevel
            : targetLevel;
        setCurrentLevel(nextCurrent);
        if (
          typeof response?.maxLevelUnlocked === 'number' &&
          response.maxLevelUnlocked > 0
        ) {
          setMaxLevelUnlocked(response.maxLevelUnlocked);
        }
        return nextCurrent;
      } catch (error) {
        console.error('Failed to update chess current level:', error);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
    currentLevel,
    maxLevelUnlocked,
    levelsLoading,
    levelsError,
    refreshLevels,
    persistCurrentLevel,
    // Chess stats
    stats,
    statsLoading,
    statsError,
    refreshStats,
    // Time attack state
    inTimeAttack,
    timeLeft,
    onSetInTimeAttack: setInTimeAttack,
    onSetTimeLeft: setTimeLeft,
    runResult,
    setRunResult,
    runIdRef,
    // Puzzle state
    selectedSquare,
    onSetSelectedSquare: setSelectedSquare,
    phase,
    setPhase,
    puzzleState,
    setPuzzleState
  };
}

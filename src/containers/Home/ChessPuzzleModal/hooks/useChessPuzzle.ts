import { useState, useCallback, useRef } from 'react';
import { LichessPuzzle } from '../helpers/puzzleHelpers';
import { useAppContext } from '~/contexts';

export interface AttemptPayload {
  attemptId: number | null;
  solved: boolean;
  attemptsUsed: number;
}

export interface AttemptResponse {
  xpEarned: number;
  newXp: number | null;
  rank: number | null;
  streak?: number;
  nextPuzzle: LichessPuzzle;
}

export function useChessPuzzle() {
  const [loading, setLoading] = useState(false);
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancellingRef = useRef(false);

  const loadChessPuzzle = useAppContext(
    (v) => v.requestHelpers.loadChessPuzzle
  );
  const submitChessAttempt = useAppContext(
    (v) => v.requestHelpers.submitChessAttempt
  );

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
    []
  );

  const submitAttempt = useCallback(
    async (payload: AttemptPayload): Promise<AttemptResponse> => {
      if (cancellingRef.current) {
        throw new Error('Operation cancelled');
      }

      try {
        const result = await submitChessAttempt(payload);
        return result;
      } catch (error) {
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updatePuzzle = useCallback((puzzle: LichessPuzzle) => {
    setPuzzle(puzzle);
    setLoading(false);
    setError(null);
  }, []);

  return {
    attemptId,
    puzzle,
    loading,
    error,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle
  };
}

import { useState, useCallback, useRef } from 'react';
import { LichessPuzzle } from '../helpers/puzzleHelpers';
import { useAppContext } from '~/contexts';

export interface AttemptPayload {
  attemptToken: string;
  solved: boolean;
  attemptsUsed: number;
  timeSpent: number;
}

export interface AttemptResponse {
  xpEarned: number;
  newXp: number | null;
  rank: number | null;
  streak?: number;
  nextPuzzle: LichessPuzzle;
  newAttemptToken: string;
}

interface ChessPuzzleState {
  puzzle?: LichessPuzzle;
  loading: boolean;
  error?: string;
  attemptToken?: string;
}

export function useChessPuzzle() {
  const [state, setState] = useState<ChessPuzzleState>({
    loading: false
  });
  const cancellingRef = useRef(false);

  const loadChessPuzzle = useAppContext(
    (v) => v.requestHelpers.loadChessPuzzle
  );
  const submitChessAttempt = useAppContext(
    (v) => v.requestHelpers.submitChessAttempt
  );

  const fetchPuzzle = useCallback(
    async (level: number = 1) => {
      setState((s) => ({ ...s, loading: true, error: undefined }));

      try {
        const { puzzle, attemptToken } = await loadChessPuzzle({
          level
        });

        setState({
          loading: false,
          puzzle,
          attemptToken
        });
      } catch (e) {
        setState({
          loading: false,
          error: String(e)
        });
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

  const updatePuzzle = useCallback((puzzle: LichessPuzzle, token: string) => {
    setState((s) => ({
      ...s,
      puzzle,
      attemptToken: token,
      loading: false,
      error: undefined
    }));
  }, []);

  return {
    ...state,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle
  };
}

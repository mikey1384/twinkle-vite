import { useState, useCallback, useRef } from 'react';
import { LichessPuzzle } from '../helpers/puzzleHelpers';
import { useAppContext, useKeyContext } from '~/contexts';

// Type definitions for the hook
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
  // Future: add leaderboard updates, achievement unlocks, etc.
}

interface ChessPuzzleState {
  puzzle?: LichessPuzzle;
  loading: boolean;
  error?: string;
  attemptToken?: string;
}

/**
 * Custom hook for managing chess puzzle data and API interactions.
 * This hook encapsulates all fetch logic, retry handling, and token management.
 */
export function useChessPuzzle() {
  const [state, setState] = useState<ChessPuzzleState>({
    loading: false
  });
  const cancellingRef = useRef(false);

  // Get request helpers from context
  const loadChessPuzzle = useAppContext(
    (v) => v.requestHelpers.loadChessPuzzle
  );
  const submitChessAttempt = useAppContext(
    (v) => v.requestHelpers.submitChessAttempt
  );

  // Get user chess rating from context
  const userChessRating = useKeyContext((v) => v.myState.chessRating);

  // Reset cancel flag
  const resetCancel = useCallback(() => {
    cancellingRef.current = false;
  }, []);

  const fetchPuzzle = useCallback(
    async (maxPlies?: number) => {
      resetCancel(); // Clear any previous cancel state
      setState((s) => ({ ...s, loading: true, error: undefined }));

      try {
        // Pick a rating window around the user's current rating
        const userRating = userChessRating ?? 1200; // Default to 1200 if no rating set
        const { puzzle, attemptToken } = await loadChessPuzzle({
          ratingFloor: Math.max(300, userRating - 200),
          ratingCeil: userRating + 200,
          ...(maxPlies && { maxPlies })
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
    [loadChessPuzzle, userChessRating, resetCancel]
  );

  const submitAttempt = useCallback(
    async (payload: AttemptPayload): Promise<AttemptResponse> => {
      if (cancellingRef.current) {
        throw new Error('Operation cancelled');
      }

      try {
        // Use real API helper - returns server response directly
        const result = await submitChessAttempt(payload);
        resetCancel(); // Clear cancel flag after successful completion
        return result;
      } catch (error) {
        resetCancel(); // Also clear on error to allow retry
        throw error;
      }
    },
    [submitChessAttempt, resetCancel]
  );

  const cancel = useCallback(() => {
    cancellingRef.current = true;
  }, []);

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
    updatePuzzle,
    cancel
  };
}

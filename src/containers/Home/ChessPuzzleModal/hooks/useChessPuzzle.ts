import { useState, useCallback, useRef } from 'react';
import { LichessPuzzle } from '../helpers/puzzleHelpers';

// Type definitions for the hook
export interface AttemptPayload {
  attemptToken: string;
  solved: boolean;
  attemptsUsed: number;
  timeSpent: number;
}

export interface AttemptResponse {
  xpEarned: number;
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

  const fetchPuzzle = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));

    try {
      // TODO: Replace with actual API call once backend is ready
      // const res = await fetch('/api/chess/puzzle', { credentials: 'include' });
      // if (!res.ok) throw new Error('Network error');
      // const data = await res.json();

      // For now, return a sample puzzle with mock token
      const samplePuzzle: LichessPuzzle = {
        id: `puzzle_${Date.now()}`,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
        moves: ['d1h5', 'g6h5'], // Queen to h5 threatens mate, black must respond
        rating: 1200,
        ratingDeviation: 100,
        popularity: 85,
        nbPlays: 1500,
        themes: ['mateIn2', 'attack'],
        gameUrl: ''
      };

      setState({
        loading: false,
        puzzle: samplePuzzle,
        attemptToken: `mock_token_${Date.now()}`
      });
    } catch (e) {
      setState({
        loading: false,
        error: (e as Error).message
      });
    }
  }, []);

  const submitAttempt = useCallback(
    async (payload: AttemptPayload): Promise<AttemptResponse> => {
      if (cancellingRef.current) {
        throw new Error('Operation cancelled');
      }

      // TODO: Replace with actual API call once backend is ready
      // const res = await fetch('/api/chess/attempt', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      //   credentials: 'include'
      // });
      // if (!res.ok) throw new Error('Submit failed');
      // return res.json() as Promise<AttemptResponse>;

      // Mock response for now
      const nextPuzzle: LichessPuzzle = {
        id: `puzzle_${Date.now()}`,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: ['e2e4', 'e7e5'],
        rating: 1300,
        ratingDeviation: 100,
        popularity: 90,
        nbPlays: 2000,
        themes: ['opening', 'development'],
        gameUrl: ''
      };

      return {
        xpEarned: payload.solved ? 15 : 5,
        streak: payload.solved ? 2 : 0,
        nextPuzzle,
        newAttemptToken: `mock_token_${Date.now()}`
      };
    },
    []
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

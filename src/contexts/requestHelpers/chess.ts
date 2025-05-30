import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import type {
  TimeAttackStartResponse,
  TimeAttackAttemptResponse
} from '~/types/chess';

export default function chessRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async loadChessStats() {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/stats`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadChessLevels() {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/levels`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadChessPuzzle({ level }: { level: number }) {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/puzzle?level=${level}`,
          auth()
        );

        if (data && data.puzzle) {
          // normalise themes if needed
          data.puzzle.themes = Array.isArray(data.puzzle.themes)
            ? data.puzzle.themes
            : typeof data.puzzle.themes === 'string'
            ? (data.puzzle.themes as string)
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [];
        }

        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async submitChessAttempt({
      attemptId,
      solved,
      attemptsUsed
    }: {
      attemptId: number | null;
      solved: boolean;
      attemptsUsed: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/attempt`,
          {
            attemptId,
            solved,
            attemptsUsed
          },
          auth()
        );

        if (data && data.nextPuzzle) {
          // normalise themes for the next puzzle too
          data.nextPuzzle.themes = Array.isArray(data.nextPuzzle.themes)
            ? data.nextPuzzle.themes
            : typeof data.nextPuzzle.themes === 'string'
            ? (data.nextPuzzle.themes as string)
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [];
        }

        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadChessDailyStats() {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/dailyStats`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    // ─── PROMOTION • TIME-ATTACK ─────────────────────────────────────────
    async startTimeAttackPromotion() {
      try {
        const { data } = await request.post<TimeAttackStartResponse>(
          `${URL}/content/game/chess/promotion/timeattack/start`,
          {}, // no payload
          auth()
        );
        // normalise themes array exactly like loadChessPuzzle does
        if (data && data.puzzle) {
          data.puzzle.themes = Array.isArray(data.puzzle.themes)
            ? data.puzzle.themes
            : typeof data.puzzle.themes === 'string'
            ? (data.puzzle.themes as string)
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [];
        }
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async submitTimeAttackAttempt({
      runId,
      solved
    }: {
      runId: number;
      solved: boolean;
    }) {
      try {
        const { data } = await request.post<TimeAttackAttemptResponse>(
          `${URL}/content/game/chess/promotion/timeattack/attempt`,
          { runId, solved },
          auth()
        );
        if (data && data.nextPuzzle) {
          data.nextPuzzle.themes = Array.isArray(data.nextPuzzle.themes)
            ? data.nextPuzzle.themes
            : typeof data.nextPuzzle.themes === 'string'
            ? (data.nextPuzzle.themes as string)
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [];
        }
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

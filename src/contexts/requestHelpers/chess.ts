import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import type {
  TimeAttackStartResponse,
  TimeAttackAttemptResponse,
  TimeAttackTimerResponse
} from '~/types/chess';

const PROMOTION_TIME_ATTACK_PROTOCOL_VERSION = 4;

function getMonotonicTime() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function attachPromotionResponseTransit<
  T extends { serverProcessingMs?: number }
>(data: T, requestStartedAt: number) {
  const requestElapsedMs = Math.max(0, getMonotonicTime() - requestStartedAt);
  const serverProcessingMs = Number(data?.serverProcessingMs);
  // The server samples remainingMs immediately before serialization and tells
  // us how much of the request was server work. The remainder is network RTT;
  // use its midpoint as the response leg instead of subtracting the entire
  // request (which would double-count work performed before the sample).
  const responseTransitMs = Number.isFinite(serverProcessingMs)
    ? Math.max(0, requestElapsedMs - serverProcessingMs) / 2
    : 0;
  return { ...data, responseTransitMs };
}

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

    async updateChessCurrentLevel({ level }: { level: number }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/levels/current`,
          { level },
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
      selectedLevel
    }: {
      attemptId: number | null;
      solved: boolean;
      selectedLevel?: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/attempt`,
          {
            attemptId,
            solved,
            selectedLevel
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

    // New helper: record result only without fetching next puzzle
    async recordChessAttemptResult({
      attemptId,
      solved
    }: {
      attemptId: number | null;
      solved: boolean;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/attempt/result`,
          { attemptId, solved },
          auth()
        );
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

    async startTimeAttackPromotion({
      recoveryRunId
    }: { recoveryRunId?: number } = {}) {
      try {
        const requestStartedAt = getMonotonicTime();
        const { data } = await request.post<TimeAttackStartResponse>(
          `${URL}/content/game/chess/promotion/timeattack/start`,
          {
            protocolVersion: PROMOTION_TIME_ATTACK_PROTOCOL_VERSION,
            ...(recoveryRunId ? { recoveryRunId } : {})
          },
          {
            ...auth(),
            meta: {
              enforceTimeout: true,
              allowExtendedTimeout: false
            }
          }
        );

        const puzzle = 'puzzle' in data ? data.puzzle : null;
        if (puzzle) {
          puzzle.themes = Array.isArray(puzzle.themes)
            ? puzzle.themes
            : typeof puzzle.themes === 'string'
              ? (puzzle.themes as string)
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean)
              : [];
        }
        return attachPromotionResponseTransit(data, requestStartedAt);
      } catch (error) {
        return handleError(error);
      }
    },

    async submitTimeAttackAttempt({
      runId,
      puzzleId,
      solved
    }: {
      runId: number;
      puzzleId: string;
      solved: boolean;
    }) {
      try {
        const requestStartedAt = getMonotonicTime();
        const { data } = await request.post<TimeAttackAttemptResponse>(
          `${URL}/content/game/chess/promotion/timeattack/attempt`,
          {
            runId,
            puzzleId,
            solved,
            protocolVersion: PROMOTION_TIME_ATTACK_PROTOCOL_VERSION
          },
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
        return attachPromotionResponseTransit(data, requestStartedAt);
      } catch (error) {
        return handleError(error);
      }
    },

    async adjustTimeAttackTimer({
      runId,
      puzzleId,
      moveIndex,
      commandId,
      expectedDeadlineAt,
      outcome
    }: {
      runId: number;
      puzzleId: string;
      moveIndex: number;
      commandId: string;
      expectedDeadlineAt: number;
      outcome: 'correct' | 'wrong';
    }) {
      try {
        const requestStartedAt = getMonotonicTime();
        const { data } = await request.post<TimeAttackTimerResponse>(
          `${URL}/content/game/chess/promotion/timeattack/timer`,
          {
            runId,
            puzzleId,
            moveIndex,
            commandId,
            expectedDeadlineAt,
            outcome,
            protocolVersion: PROMOTION_TIME_ATTACK_PROTOCOL_VERSION
          },
          {
            ...auth(),
            meta: {
              collapseKey: null,
              enforceTimeout: true,
              allowExtendedTimeout: false
            }
          }
        );
        return attachPromotionResponseTransit(data, requestStartedAt);
      } catch (error) {
        return handleError(error);
      }
    },

    async unlockPromotion() {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/promotion/unlock`,
          {}, // no payload needed
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadChessRankings() {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/leaderBoard?_t=${Date.now()}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

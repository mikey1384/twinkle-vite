import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import type { ChessLevelsResponse } from '~/types/chess';

export interface ChessStats {
  id: number;
  userId: number;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  gamesPlayed: number;
  level: number;
  totalXp: number;
  lastPlayedAt: Date | null;
  lastPromotionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

export interface PromotionEligibility {
  needsPromotion: boolean;
  targetRating?: number;
  promotionType?: 'standard' | 'boss';
  token?: string;
  cooldownUntil?: string;
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

    async checkPromotionEligibility() {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/promotion/check`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async completePromotion({
      success,
      targetRating,
      token
    }: {
      success: boolean;
      targetRating: number;
      token: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/promotion/complete`,
          {
            success,
            targetRating,
            token
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateChessRating({
      opponentRating,
      opponentRd,
      gameResult,
      puzzleDifficulty
    }: {
      opponentRating: number;
      opponentRd: number;
      gameResult: number; // 1 = win, 0.5 = draw, 0 = loss
      puzzleDifficulty?: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/rating/update`,
          {
            opponentRating,
            opponentRd,
            gameResult,
            puzzleDifficulty
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadChessPuzzle({ level }: { level: number }) {
      try {
        const params = new URLSearchParams({
          level: level.toString()
        });

        const { data } = await request.get(
          `${URL}/content/game/chess/puzzle?${params}`,
          auth()
        );

        // Normalize puzzle data to ensure themes is always an array
        if (data.puzzle) {
          data.puzzle.themes = Array.isArray(data.puzzle.themes)
            ? data.puzzle.themes
            : typeof data.puzzle.themes === 'string'
            ? data.puzzle.themes
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
      attemptToken,
      solved,
      attemptsUsed,
      timeSpent
    }: {
      attemptToken: string;
      solved: boolean;
      attemptsUsed: number;
      timeSpent: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/attempt`,
          {
            attemptToken,
            solved,
            attemptsUsed,
            timeSpent
          },
          auth()
        );
        /* data = {
             xpEarned,
             streak,
             nextPuzzle,
             newAttemptToken
           }
        */

        // Normalize nextPuzzle themes to ensure it's always an array
        if (data.nextPuzzle) {
          data.nextPuzzle.themes = Array.isArray(data.nextPuzzle.themes)
            ? data.nextPuzzle.themes
            : typeof data.nextPuzzle.themes === 'string'
            ? data.nextPuzzle.themes
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

    async loadChessLevels() {
      try {
        const { data } = await request.get<ChessLevelsResponse>(
          `${URL}/content/game/chess/levels`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async checkChessPromotion() {
      try {
        const { data } = await request.get(
          `${URL}/content/game/chess/promotion/check`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async startChessPromotion({
      token,
      success = true,
      targetRating
    }: {
      token: string;
      success?: boolean;
      targetRating: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/content/game/chess/promotion/complete`,
          { token, success, targetRating },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

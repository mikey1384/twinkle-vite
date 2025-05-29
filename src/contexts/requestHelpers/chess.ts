import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

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
  expiresAt?: number;
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
    }
  };
}

// Get a chess puzzle
export const getPuzzle = request<
  { level: number },
  { puzzle: any; attemptToken: string }
>('/content/game/chess/puzzle');

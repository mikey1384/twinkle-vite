export type PieceType =
  | 'pawn'
  | 'knight'
  | 'bishop'
  | 'rook'
  | 'queen'
  | 'king';

export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  isPiece: boolean;
  state?: string;
}

export type BoardSquare = ChessPiece | { state?: string; [key: string]: any };

export interface ChessBoardState {
  board: BoardSquare[];
  playerColor: PieceColor;
  move: {
    number: number;
    by: number | null;
  };
  enPassantTarget: number | null;
  fallenPieces: {
    white: ChessPiece[];
    black: ChessPiece[];
  };
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
}

export type MoveResultType = 'correct' | 'wrong' | null;

export type PuzzlePhase =
  | 'WAIT_USER'
  | 'ANIM_ENGINE'
  | 'SUCCESS'
  | 'FAIL'
  | 'TA_CLEAR'
  | 'SOLUTION'
  | 'ANALYSIS'
  | 'PROMO_SUCCESS';

export const enum PuzzleTheme {
  MATE = 'mate',
  MATE_IN_1 = 'mateIn1',
  MATE_IN_2 = 'mateIn2',
  MATE_IN_3 = 'mateIn3',
  ATTACK = 'attack',
  OPENING = 'opening',
  DEVELOPMENT = 'development',
  TACTICS = 'tactics',
  ENDGAME = 'endgame'
}

export interface LichessPuzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl: string;
  attemptId: number;
}

export interface PuzzleResult {
  solved: boolean;
  attemptsUsed: number;
}

export interface MoveResult {
  type: MoveResultType;
  message: string;
}

export interface PuzzleMove {
  san: string;
  uci: string;
  from: string;
  to: string;
  promotion?: string;
}

export interface MultiPlyPuzzleState {
  solutionIndex: number;
  moveHistory: PuzzleMove[];
  attemptsUsed: number;
  showingHint: boolean;
}

export interface ChessStats {
  id: number;
  userId: number;
  rating: number;
  volatility: number;
  gamesPlayed: number;
  level: number;
  totalXp: number;
  maxLevelUnlocked: number;
  currentLevelStreak: number;
  lastPlayedAt: Date | null;
  lastPromotionAt: Date | null;
  promoCooldownUntil: string | null;
  cooldownUntilTomorrow: boolean;
  nextDayTimestamp: number | null;
  timeStamp: number;
  lastUpdated: number;
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

export interface ChessLevelsResponse {
  levels: Array<{
    level: number;
    floor: number;
    ceil: number;
  }>;
  currentLevel: number;
  maxLevelUnlocked: number;
}

export interface TimeAttackStartResponse {
  runId: number;
  puzzle: LichessPuzzle;
}

export interface TimeAttackAttemptResponse {
  runId: number;
  nextPuzzle?: LichessPuzzle;
  finished?: true;
  success?: boolean;
  stats?: ChessStats;
}

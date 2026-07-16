export type PieceType =
  'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

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
  | 'START_LEVEL'
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
  promotionUnlocked?: boolean;
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

export interface TimeAttackActiveStartResponse {
  runId: number;
  puzzle: LichessPuzzle;
  puzzlesSolved: number;
  deadlineAt: number;
  serverNow: number;
  remainingMs: number;
  serverProcessingMs: number;
  responseTransitMs?: number;
  recovered: boolean;
}

export interface TimeAttackFinishedStartResponse {
  runId: number;
  puzzlesSolved: number;
  finished: true;
  success: boolean;
  reason?: 'puzzle_unavailable' | 'failed';
  retryable?: boolean;
  recovered: true;
  serverProcessingMs?: number;
  responseTransitMs?: number;
}

export type TimeAttackStartResponse =
  TimeAttackActiveStartResponse | TimeAttackFinishedStartResponse;

export interface TimeAttackTimerResponse {
  deadlineAt: number;
  serverNow: number;
  remainingMs: number;
  serverProcessingMs: number;
  responseTransitMs?: number;
  accepted: boolean;
  applied: boolean;
  expired: boolean;
  replayed: boolean;
}

export interface TimeAttackAttemptResponse {
  runId: number;
  nextPuzzle?: LichessPuzzle;
  puzzlesSolved?: number;
  deadlineAt?: number;
  serverNow?: number;
  remainingMs?: number;
  serverProcessingMs?: number;
  responseTransitMs?: number;
  finished?: true;
  success?: boolean;
  reason?: 'puzzle_unavailable' | string;
  retryable?: boolean;
  message?: string;
  stats?: ChessStats;
}

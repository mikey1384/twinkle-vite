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

export interface ChessSquare {
  piece?: ChessPiece;
}

// Square can either be empty or contain a piece
export type BoardSquare = ChessPiece | { state?: string; [key: string]: any };

// Better interface for chess board state
export interface ChessBoardState {
  board: BoardSquare[];
  playerColors: Record<number, PieceColor>;
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

// ============ PUZZLE SYSTEM TYPES ============

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type PuzzleStatus = 'setup' | 'playing' | 'completed' | 'failed';
export type MoveResultType = 'correct' | 'wrong' | null;

// Multi-ply puzzle state machine phases
export type PuzzlePhase = 'WAIT_USER' | 'ANIM_ENGINE' | 'SUCCESS' | 'FAIL';

// Chess puzzle themes as constants for better autocomplete
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
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl: string;
  attemptId: number;
}

export interface PuzzleResult {
  solved: boolean;
  xpEarned: number;
  attemptsUsed: number;
}

export interface MoveResult {
  type: MoveResultType;
  message: string;
}

// Move representation for multi-ply puzzles
export interface PuzzleMove {
  san: string; // Standard algebraic notation (e.g., "Nxf7+")
  uci: string; // UCI notation (e.g., "g1f3")
  from: string; // source square (e.g., "g1")
  to: string; // destination square (e.g., "f3")
  promotion?: string; // promotion piece if applicable
}

// Multi-ply puzzle state
export interface MultiPlyPuzzleState {
  phase: PuzzlePhase;
  solutionIndex: number; // Current index in the solution array
  moveHistory: PuzzleMove[]; // Moves played so far
  attemptsUsed: number;
  showingHint: boolean;
  autoPlaying: boolean;
}

// ============ PLAYER STATS & PROGRESSION ============

export interface ChessStats {
  id: number;
  userId: number;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  gamesPlayed: number;
  level: number;
  totalXp: number;
  maxLevelUnlocked: number;
  lastPlayedAt: Date | null;
  lastPromotionAt: Date | null;
  promoCooldownUntil: string | null;
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

// ============ TIME-ATTACK PROMOTION TYPES ============

export interface TimeAttackStartResponse {
  runId: number;
  puzzle: LichessPuzzle;
}

export interface TimeAttackAttemptResponse {
  runId: number;
  nextPuzzle?: LichessPuzzle; // undefined if the run just finished
  finished?: true; // present only when run is over
  success?: boolean; // true | false when finished
  stats?: ChessStats; // present on success
}

// ============ HELPER FUNCTIONS & CONSTANTS ============

// Helper functions for board calculations
export const calculateRank = (idx: number): number => Math.floor(idx / 8);
export const calculateFile = (idx: number): number => idx & 7; // cheaper modulo

// Helper function to compare SAN moves (ignoring check/mate symbols)
export const equalSAN = (a: string, b: string): boolean =>
  a.replace(/[+#]/g, '') === b.replace(/[+#]/g, '');

// Constants for board operations
export const BOARD_SIZE = 64;
export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;

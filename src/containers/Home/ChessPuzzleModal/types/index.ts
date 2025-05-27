// Enhanced type definitions for chess puzzle system

export type PieceType =
  | 'pawn'
  | 'knight'
  | 'bishop'
  | 'rook'
  | 'queen'
  | 'king';
export type PieceColor = 'white' | 'black';
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type PuzzleStatus = 'setup' | 'playing' | 'completed' | 'failed';
export type MoveResultType = 'correct' | 'wrong' | null;

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  isPiece: boolean;
  state?: string;
}

export interface ChessSquare {
  piece?: ChessPiece;
}

export interface PuzzleResult {
  solved: boolean;
  xpEarned: number;
  timeSpent: number;
  attemptsUsed: number;
}

export interface MoveResult {
  type: MoveResultType;
  message: string;
}

// Helper functions for board calculations
export const calculateRank = (idx: number): number => Math.floor(idx / 8);
export const calculateFile = (idx: number): number => idx & 7; // cheaper modulo

// Constants for board operations
export const BOARD_SIZE = 64;
export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;

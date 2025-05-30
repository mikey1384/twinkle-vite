// Re-export centralized chess types for backwards compatibility
export type {
  PieceType,
  PieceColor,
  ChessPiece,
  ChessSquare,
  BoardSquare,
  ChessBoardState,
  PuzzleDifficulty,
  PuzzleStatus,
  MoveResultType,
  PuzzlePhase,
  PuzzleTheme,
  LichessPuzzle,
  PuzzleResult,
  MoveResult,
  PuzzleMove,
  MultiPlyPuzzleState
} from '~/types/chess';

// Re-export runtime values (functions and constants)
export {
  calculateRank,
  calculateFile,
  equalSAN,
  BOARD_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT
} from '~/types/chess';

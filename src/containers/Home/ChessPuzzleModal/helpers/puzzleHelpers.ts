// Helper functions for integrating Lichess chess puzzles with the Twinkle chess component

export interface LichessPuzzle {
  id: string;
  fen: string;
  moves: string[]; // UCI notation moves, first move is opponent's play
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl: string;
}

export interface PuzzleGameState {
  initialState: any;
  opponentMove: {
    from: string;
    to: string;
    uci: string;
  };
  solution: Array<{
    from: string;
    to: string;
    uci: string;
  }>;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

/**
 * Converts UCI notation (e.g., "e2e4") to square indices for our chess board
 */
export function uciToSquareIndices({
  uci,
  isBlackPlayer = false
}: {
  uci: string;
  isBlackPlayer?: boolean;
}): { from: number; to: number } {
  const fromSquare = uci.slice(0, 2);
  const toSquare = uci.slice(2, 4);

  const from = algebraicToIndex({ square: fromSquare, isBlackPlayer });
  const to = algebraicToIndex({ square: toSquare, isBlackPlayer });

  return { from, to };
}

/**
 * Converts algebraic notation (e.g., "e4") to board index (0-63)
 * Handles both white and black perspectives
 */
export function algebraicToIndex({
  square,
  isBlackPlayer = false
}: {
  square: string;
  isBlackPlayer?: boolean;
}): number {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
  const rank = parseInt(square[1]) - 1; // 1=0, 2=1, ..., 8=7

  // Convert to board index: rank 8 is index 0-7, rank 1 is index 56-63
  let index = (7 - rank) * 8 + file;

  // If viewing from black's perspective, flip the board
  if (isBlackPlayer) {
    index = 63 - index;
  }

  return index;
}

/**
 * Converts board index to algebraic notation
 */
export function indexToAlgebraic({
  index,
  isBlackPlayer = false
}: {
  index: number;
  isBlackPlayer?: boolean;
}): string {
  let actualIndex = index;

  // If viewing from black's perspective, flip the board
  if (isBlackPlayer) {
    actualIndex = 63 - index;
  }

  const file = String.fromCharCode(97 + (actualIndex % 8)); // 0=a, 1=b, ..., 7=h
  const rank = 8 - Math.floor(actualIndex / 8); // 0=8, 8=7, ..., 56=1

  return file + rank;
}

/**
 * Creates a chess board state from FEN string compatible with your chess component
 */
export function fenToBoardState({
  fen,
  userId,
  opponentId
}: {
  fen: string;
  userId: number;
  opponentId: number;
}): any {
  // Parse FEN string: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  const [boardPart, turn, _castling, enPassant, _halfMove, fullMove] =
    fen.split(' ');

  // Convert FEN board to your square format
  const squares: any[] = new Array(64);
  const rows = boardPart.split('/');

  // FEN starts from rank 8 (top) and goes down to rank 1 (bottom)
  // Our board array goes from index 0 (a8) to index 63 (h1)
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const row = rows[rankIndex]; // FEN rank 8-1
    let file = 0;

    for (const char of row) {
      if (char >= '1' && char <= '8') {
        // Empty squares
        const emptyCount = parseInt(char);
        for (let i = 0; i < emptyCount; i++) {
          squares[rankIndex * 8 + file] = {};
          file++;
        }
      } else {
        // Piece
        const color = char === char.toUpperCase() ? 'white' : 'black';
        const type = fenPieceToType(char.toLowerCase());

        squares[rankIndex * 8 + file] = {
          type,
          color,
          isPiece: true
        };
        file++;
      }
    }
  }

  console.log('fenToBoardState: Created squares array', {
    squaresLength: squares.length,
    firstFewSquares: squares.slice(0, 8),
    lastFewSquares: squares.slice(56, 64)
  });

  // Determine player colors (puzzle solver is usually the side to move)
  const puzzlePlayerColor = turn === 'w' ? 'white' : 'black';
  const playerColors = {
    [userId]: puzzlePlayerColor,
    [opponentId]: puzzlePlayerColor === 'white' ? 'black' : 'white'
  };

  console.log('fenToBoardState: Player colors', {
    puzzlePlayerColor,
    playerColors
  });

  const result = {
    board: squares,
    playerColors,
    move: {
      number: parseInt(fullMove) * 2 - (turn === 'w' ? 2 : 1),
      by: null
    },
    enPassantTarget:
      enPassant === '-' ? null : algebraicToIndex({ square: enPassant }),
    fallenPieces: {
      white: [],
      black: []
    },
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  };

  console.log('fenToBoardState: Final result', result);
  return result;
}

/**
 * Converts FEN piece notation to your piece type format
 */
function fenPieceToType(piece: string): string {
  const pieceMap: { [key: string]: string } = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
  };

  return pieceMap[piece] || piece;
}

/**
 * Determines puzzle difficulty based on rating
 */
export function getPuzzleDifficulty(
  rating: number
): 'easy' | 'medium' | 'hard' | 'expert' {
  if (rating < 1200) return 'easy';
  if (rating < 1600) return 'medium';
  if (rating < 2000) return 'hard';
  return 'expert';
}

/**
 * Converts Lichess puzzle data to format compatible with your chess component
 */
export function convertLichessPuzzle({
  puzzle,
  userId,
  opponentId
}: {
  puzzle: LichessPuzzle;
  userId: number;
  opponentId: number;
}): PuzzleGameState {
  console.log('convertLichessPuzzle: Starting conversion', {
    puzzle,
    userId,
    opponentId
  });

  const initialState = fenToBoardState({
    fen: puzzle.fen,
    userId,
    opponentId
  });

  console.log('convertLichessPuzzle: Got initial state', initialState);

  // First move is what the opponent plays to create the puzzle position
  const opponentMoveUci = puzzle.moves[0];
  const opponentMove = {
    from: opponentMoveUci.slice(0, 2),
    to: opponentMoveUci.slice(2, 4),
    uci: opponentMoveUci
  };

  // Remaining moves are the solution
  const solution = puzzle.moves.slice(1).map((uci) => ({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    uci
  }));

  console.log('convertLichessPuzzle: Parsed moves', { opponentMove, solution });

  const result = {
    initialState,
    opponentMove,
    solution,
    difficulty: getPuzzleDifficulty(puzzle.rating)
  };

  console.log('convertLichessPuzzle: Final result', result);
  return result;
}

/**
 * XP rewards based on puzzle difficulty and performance
 */
export function calculatePuzzleXP({
  difficulty,
  solved,
  attemptsUsed,
  timeSpent
}: {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  solved: boolean;
  attemptsUsed: number;
  timeSpent: number; // in seconds
}): number {
  if (!solved) return 0;

  const baseXP = {
    easy: 50,
    medium: 100,
    hard: 200,
    expert: 400
  };

  let xp = baseXP[difficulty];

  // Bonus for solving quickly (under 30 seconds)
  if (timeSpent < 30) {
    xp = Math.floor(xp * 1.5);
  } else if (timeSpent < 60) {
    xp = Math.floor(xp * 1.2);
  }

  // Penalty for multiple attempts
  if (attemptsUsed > 1) {
    xp = Math.floor(xp * Math.max(0.5, 1 - (attemptsUsed - 1) * 0.2));
  }

  return xp;
}

/**
 * Example usage with Lichess API data:
 *
 * const puzzleData = await fetch('https://lichess.org/api/puzzle/daily').then(r => r.json());
 *
 * const gameState = convertLichessPuzzle({
 *   puzzle: puzzleData.puzzle,
 *   userId: 123,
 *   opponentId: 456
 * });
 *
 * // Use gameState.initialState with your existing Chess component
 * // Show the opponent move, then let user play the solution
 */

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

  const from = algebraicToIndex(fromSquare);
  const to = algebraicToIndex(toSquare);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 UCI Conversion:', {
      uci,
      fromSquare,
      toSquare,
      fromIndex: from,
      toIndex: to,
      isBlackPlayer
    });
  }

  return { from, to };
}

/**
 * Converts algebraic notation (e.g., "e4") to board index (0-63)
 * Handles both white and black perspectives
 */
export function algebraicToIndex(square: string): number {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = parseInt(square[1]); // 1-8
  return (8 - rank) * 8 + file; // rank 8 = index 0-7, rank 1 = index 56-63
}

/**
 * Converts board index to algebraic notation
 */
export function indexToAlgebraic(index: number): string {
  const file = String.fromCharCode(97 + (index % 8)); // a-h
  const rank = 8 - Math.floor(index / 8); // 8-1 (index 0-7 = rank 8, index 56-63 = rank 1)
  return file + rank;
}

/**
 * Creates a chess board state from FEN string compatible with your chess component
 */
export function fenToBoardState({
  fen,
  userId,
  playerColor
}: {
  fen: string;
  userId: number;
  playerColor?: 'white' | 'black';
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

  if (process.env.NODE_ENV === 'development') {
    console.log('fenToBoardState: Created squares array', {
      squaresLength: squares.length,
      firstFewSquares: squares.slice(0, 8),
      lastFewSquares: squares.slice(56, 64)
    });
  }

  // Determine player colors - use provided playerColor or fall back to side to move
  const puzzlePlayerColor = playerColor || (turn === 'w' ? 'white' : 'black');
  const playerColors = {
    [userId]: puzzlePlayerColor
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 FEN Analysis:', {
      fen,
      turn,
      puzzlePlayerColor,
      fenBreakdown: {
        position: boardPart,
        turn,
        castling: _castling,
        enPassant,
        halfMove: _halfMove,
        fullMove
      }
    });

    console.log('fenToBoardState: Player colors', {
      puzzlePlayerColor,
      playerColors
    });
  }

  const result = {
    board: squares,
    playerColors,
    move: {
      number: parseInt(fullMove) * 2 - (turn === 'w' ? 2 : 1),
      by: null
    },
    enPassantTarget: enPassant === '-' ? null : algebraicToIndex(enPassant),
    fallenPieces: {
      white: [],
      black: []
    },
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('fenToBoardState: Final result', result);
  }
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
 * Applies a UCI move to a FEN string and returns the new FEN
 * This is a simplified implementation for basic moves
 */
function applyMoveToFen(fen: string, moveUci: string): string {
  // Parse the FEN
  const [boardPart, turn, castling, _enPassant, halfMove, fullMove] =
    fen.split(' ');

  // Create a 2D board array from the FEN
  const board: (string | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  let rank = 0;
  let file = 0;

  for (const char of boardPart) {
    if (char === '/') {
      rank++;
      file = 0;
    } else if (/\d/.test(char)) {
      file += parseInt(char);
    } else {
      board[rank][file] = char;
      file++;
    }
  }

  // Parse the UCI move
  const fromFile = moveUci.charCodeAt(0) - 97; // a=0, b=1, etc.
  const fromRank = 8 - parseInt(moveUci[1]); // 8=0, 7=1, etc.
  const toFile = moveUci.charCodeAt(2) - 97;
  const toRank = 8 - parseInt(moveUci[3]);

  // Apply the move
  const piece = board[fromRank][fromFile];
  board[fromRank][fromFile] = null;
  board[toRank][toFile] = piece;

  // Convert board back to FEN notation
  let newBoardPart = '';
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    for (let f = 0; f < 8; f++) {
      if (board[r][f] === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          newBoardPart += emptyCount.toString();
          emptyCount = 0;
        }
        newBoardPart += board[r][f];
      }
    }
    if (emptyCount > 0) {
      newBoardPart += emptyCount.toString();
    }
    if (r < 7) newBoardPart += '/';
  }

  // Switch turn
  const newTurn = turn === 'w' ? 'b' : 'w';

  // Update full move number if it was black's turn
  const newFullMove =
    turn === 'b' ? (parseInt(fullMove) + 1).toString() : fullMove;

  // For simplicity, reset en passant and update half-move clock
  const newHalfMove = (parseInt(halfMove) + 1).toString();

  return `${newBoardPart} ${newTurn} ${castling} - ${newHalfMove} ${newFullMove}`;
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
 *
 * According to Lichess documentation:
 * - FEN is position BEFORE opponent's move
 * - First move in array is the opponent's blunder that sets up the puzzle
 * - Remaining moves are the player's solution
 */
export function convertLichessPuzzle({
  puzzle,
  userId
}: {
  puzzle: LichessPuzzle;
  userId: number;
}): PuzzleGameState {
  if (process.env.NODE_ENV === 'development') {
    console.log('convertLichessPuzzle: Starting conversion', {
      puzzle,
      userId
    });
  }

  if (!puzzle.moves || puzzle.moves.length === 0) {
    throw new Error('Puzzle has no moves');
  }

  // Step 1: Get the FEN (position before opponent's move)
  const prePuzzleFen = puzzle.fen;
  if (process.env.NODE_ENV === 'development') {
    console.log(
      'convertLichessPuzzle: FEN before opponent move:',
      prePuzzleFen
    );
  }

  // Determine player color from the original FEN (the side that DIDN'T just move)
  const [_boardPart, turn] = prePuzzleFen.split(' ');
  const playerColor = turn === 'w' ? 'black' : 'white'; // Player is opposite of who's to move in original FEN
  if (process.env.NODE_ENV === 'development') {
    console.log('convertLichessPuzzle: Player color determined:', {
      originalTurn: turn,
      playerColor
    });
  }

  // Step 2: Apply the first move (opponent's blunder) to get the actual puzzle position
  const opponentMoveUci = puzzle.moves[0];
  const puzzleFen = applyMoveToFen(prePuzzleFen, opponentMoveUci);
  if (process.env.NODE_ENV === 'development') {
    console.log('convertLichessPuzzle: Applied opponent move', {
      opponentMoveUci,
      prePuzzleFen,
      puzzleFen
    });
  }

  // Step 3: Create the board state from the puzzle position
  const initialState = fenToBoardState({
    fen: puzzleFen,
    userId,
    playerColor
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(
      'convertLichessPuzzle: Got puzzle position state',
      initialState
    );
  }

  // Step 4: The remaining moves are the player's solution
  const solutionMoves = puzzle.moves.slice(1);
  const solution = solutionMoves.map((uci) => ({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    uci
  }));

  // Store the opponent's setup move for reference
  const opponentMove = {
    from: opponentMoveUci.slice(0, 2),
    to: opponentMoveUci.slice(2, 4),
    uci: opponentMoveUci
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('convertLichessPuzzle: Parsed moves', {
      opponentMove,
      solution,
      solutionMoves
    });
  }

  const result = {
    initialState,
    opponentMove,
    solution,
    difficulty: getPuzzleDifficulty(puzzle.rating)
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('convertLichessPuzzle: Final result', result);
  }
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

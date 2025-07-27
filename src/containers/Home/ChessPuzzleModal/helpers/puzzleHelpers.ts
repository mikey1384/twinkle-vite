import { Chess } from 'chess.js';

export function uciToSquareIndices(uci: string): { from: number; to: number } {
  const fromSquare = uci.slice(0, 2);
  const toSquare = uci.slice(2, 4);

  const from = algebraicToIndex(fromSquare);
  const to = algebraicToIndex(toSquare);

  return { from, to };
}

export function algebraicToIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]);
  return (8 - rank) * 8 + file;
}

export function indexToAlgebraic(index: number): string {
  const file = String.fromCharCode(97 + (index % 8));
  const rank = 8 - Math.floor(index / 8);
  return file + rank;
}

export function fenToBoardState({
  fen,
  userId,
  playerColor
}: {
  fen: string;
  userId: number;
  playerColor?: 'white' | 'black';
}): any {
  const [boardPart, turn, _castling, enPassant, _halfMove, fullMove] =
    fen.split(' ');

  const squares: any[] = new Array(64);
  const rows = boardPart.split('/');

  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const row = rows[rankIndex];
    let file = 0;

    for (const char of row) {
      if (char >= '1' && char <= '8') {
        const emptyCount = parseInt(char);
        for (let i = 0; i < emptyCount; i++) {
          squares[rankIndex * 8 + file] = {};
          file++;
        }
      } else {
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

  const puzzlePlayerColor = playerColor || (turn === 'w' ? 'white' : 'black');
  const playerColors = {
    [userId]: puzzlePlayerColor
  };

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

  return result;
}

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

export function calculatePuzzleXP({
  difficulty,
  solved,
  attemptsUsed
}: {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  solved: boolean;
  attemptsUsed: number;
}): number {
  if (!solved) return 0;

  const baseXP = {
    easy: 50,
    medium: 100,
    hard: 200,
    expert: 400
  };

  let xp = baseXP[difficulty];

  if (attemptsUsed > 1) {
    xp = Math.floor(xp * Math.max(0.5, 1 - (attemptsUsed - 1) * 0.2));
  }

  return xp;
}

export function normalisePuzzle(fen: string) {
  const chess = new Chess(fen);
  const sideToMove = chess.turn();

  return {
    startFen: fen,
    playerColor: sideToMove === 'w' ? 'black' : 'white'
  };
}

import { Chess } from 'chess.js';
import { PuzzleMove } from '~/types/chess';

export async function validateMoveWithAnalysis({
  userMove,
  expectedMove,
  fen,
  engineBestMove
}: {
  userMove: { from: string; to: string; promotion?: string };
  expectedMove: string;
  fen: string;
  engineBestMove: (
    fen: string,
    depth?: number,
    timeout?: number
  ) => Promise<{
    success: boolean;
    move?: string;
    evaluation?: number;
    depth?: number;
    mate?: number;
    error?: string;
  }>;
}): Promise<{
  isCorrect: boolean;
  userMove: string;
  expectedMove: string;
  engineSuggestion?: string;
  evaluation?: number;
  mate?: number;
  analysisLog: string[];
}> {
  const analysisLog: string[] = [];
  const game = new Chess(fen);

  // Validate that the move is legal
  const move = game.move(userMove);
  if (!move) {
    analysisLog.push('Invalid move');
    return {
      isCorrect: false,
      userMove: `${userMove.from}${userMove.to}${userMove.promotion || ''}`,
      expectedMove,
      mate: undefined,
      analysisLog
    };
  }

  const userMoveStr = `${userMove.from}${userMove.to}${
    userMove.promotion || ''
  }`;
  analysisLog.push(`Your move: ${userMoveStr} (${move.san})`);

  // First check: Is this the expected move?
  if (userMoveStr === expectedMove) {
    analysisLog.push('✓ Matches expected move - accepted');
    return {
      isCorrect: true,
      userMove: userMoveStr,
      expectedMove,
      mate: game.isCheckmate() ? 0 : undefined,
      analysisLog
    };
  }

  // Second check: Is this a checkmate based on engine analysis?
  if (game.isCheckmate()) {
    analysisLog.push('✓ Checkmate achieved - accepted');
    return {
      isCorrect: true,
      userMove: userMoveStr,
      expectedMove,
      mate: 0,
      analysisLog
    };
  }

  // Get engine analysis to check for forced mate sequences
  const beforeResult = await engineBestMove(fen, 15, 5000);
  if (
    beforeResult.success &&
    beforeResult.mate !== undefined &&
    beforeResult.mate > 0
  ) {
    // Position had a forced mate - check if this move maintains it
    const afterResult = await engineBestMove(game.fen(), 15, 5000);
    if (afterResult.success) {
      const afterMateRaw = afterResult.mate;

      if (
        afterMateRaw !== undefined &&
        afterMateRaw < 0 &&
        Math.abs(afterMateRaw) <= beforeResult.mate
      ) {
        analysisLog.push(
          `✓ Mate line continues: ${beforeResult.mate} → ${Math.abs(
            afterMateRaw
          )} moves`
        );
        return {
          isCorrect: true,
          userMove: userMoveStr,
          expectedMove,
          engineSuggestion: beforeResult.move,
          mate: Math.abs(afterMateRaw),
          analysisLog
        };
      }
    }
  }

  analysisLog.push(
    '✗ Move is incorrect - neither expected move nor leads to checkmate'
  );
  return {
    isCorrect: false,
    userMove: userMoveStr,
    expectedMove,
    engineSuggestion: beforeResult?.move,
    mate: undefined,
    analysisLog
  };
}

export function createPuzzleMove({
  uci,
  fen
}: {
  uci: string;
  fen: string;
}): PuzzleMove {
  const san = uciToSan({ uci, fen });
  return {
    san,
    uci,
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4) : undefined
  };

  function uciToSan({ uci, fen }: { uci: string; fen: string }): string {
    try {
      const chess = new Chess(fen);
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci.slice(4) : undefined
      });

      if (!move) {
        return uci;
      }

      return move.san;
    } catch {
      return uci;
    }
  }
}

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

export function normalisePuzzle(fen: string) {
  const chess = new Chess(fen);
  const sideToMove = chess.turn();

  return {
    startFen: fen,
    playerColor: sideToMove === 'w' ? 'black' : 'white'
  };
}

export function viewToBoard(index: number, isBlack: boolean): number {
  if (!isBlack) return index;
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col);
}

export function boardToView(index: number, isBlack: boolean): number {
  if (!isBlack) return index;
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col);
}

// ---------------------------------------------
// Highlighting and board-state helpers
// ---------------------------------------------

export function applyCheckmateHighlighting({
  board,
  chessInstance
}: {
  board: any[];
  chessInstance: Chess;
}) {
  if (!chessInstance?.isCheckmate()) return;
  const checkmatedSide = chessInstance.turn() === 'w' ? 'white' : 'black';
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (
      piece?.isPiece &&
      piece.type === 'king' &&
      piece.color === checkmatedSide
    ) {
      piece.state = 'checkmate';
      break;
    }
  }
}

export function clearCheckState({ board }: { board: any[] }) {
  for (let i = 0; i < board.length; i++) {
    const sq: any = board[i];
    if (sq && sq.state === 'check') {
      sq.state = '';
    }
  }
}

export function applyInCheckHighlighting({
  board,
  chessInstance
}: {
  board: any[];
  chessInstance: Chess;
}) {
  clearCheckState({ board });
  if (!chessInstance?.isCheck()) return;
  const sideInCheck = chessInstance.turn() === 'w' ? 'white' : 'black';
  for (let i = 0; i < board.length; i++) {
    const piece = board[i] as any;
    if (piece?.isPiece && piece.type === 'king' && piece.color === sideInCheck) {
      piece.state = 'check';
      break;
    }
  }
}

export function clearArrivedStatesExcept({
  board,
  keepIndices = []
}: {
  board: any[];
  keepIndices?: number[];
}) {
  const keep = new Set(keepIndices);
  board.forEach((square: any, i: number) => {
    if (square && square.state === 'arrived' && !keep.has(i)) {
      square.state = '';
    }
  });
}

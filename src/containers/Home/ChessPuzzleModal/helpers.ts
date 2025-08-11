import React from 'react';
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
    if (
      piece?.isPiece &&
      piece.type === 'king' &&
      piece.color === sideInCheck
    ) {
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

// ---------------------------------------------
// DRY helpers
// ---------------------------------------------

export function mapPromotionLetterToType({
  letter
}: {
  letter: string | undefined;
}): string | undefined {
  if (!letter) return undefined;
  const map: Record<string, string> = {
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight'
  };
  return map[letter.toLowerCase()];
}

export function getPromotionTypeFromMove({
  move
}: {
  move: any;
}): string | undefined {
  return mapPromotionLetterToType({ letter: move?.promotion });
}

export function getCastlingIndices({
  isBlack,
  isKingside
}: {
  isBlack: boolean;
  isKingside: boolean;
}): { kingFrom: number; kingTo: number; rookFrom: number; rookTo: number } {
  if (isBlack) {
    return isKingside
      ? { kingFrom: 4, kingTo: 6, rookFrom: 7, rookTo: 5 }
      : { kingFrom: 4, kingTo: 2, rookFrom: 0, rookTo: 3 };
  }
  return isKingside
    ? { kingFrom: 60, kingTo: 62, rookFrom: 63, rookTo: 61 }
    : { kingFrom: 60, kingTo: 58, rookFrom: 56, rookTo: 59 };
}

export function clearCheckAndCheckmateStates({ board }: { board: any[] }) {
  for (let i = 0; i < board.length; i++) {
    const square = board[i];
    if (square && (square.state === 'check' || square.state === 'checkmate')) {
      square.state = '';
    }
  }
}

export function updateThreatHighlighting({
  board,
  chessInstance
}: {
  board: any[];
  chessInstance: Chess;
}) {
  if (chessInstance.isCheckmate()) {
    applyCheckmateHighlighting({ board, chessInstance });
  } else {
    applyInCheckHighlighting({ board, chessInstance });
  }
}

export function createBoardApplier({
  from,
  to,
  promotion,
  isBlackView,
  chessInstance
}: {
  from: number;
  to: number;
  promotion?: string;
  isBlackView: boolean;
  chessInstance: Chess;
}) {
  return function apply(prev: any) {
    if (!prev) return prev;
    const absFrom = viewToBoard(from, isBlackView);
    const absTo = viewToBoard(to, isBlackView);
    const newBoard = [...prev.board];
    const movingPiece = { ...newBoard[absFrom] };
    if (promotion) {
      const mapped = mapPromotionLetterToType({ letter: promotion });
      if (mapped) movingPiece.type = mapped;
    }
    movingPiece.state = 'arrived';
    newBoard[absTo] = movingPiece;
    newBoard[absFrom] = {};
    clearArrivedStatesExcept({ board: newBoard, keepIndices: [absTo] });
    updateThreatHighlighting({ board: newBoard, chessInstance });
    return {
      ...prev,
      board: newBoard,
      isCheck: chessInstance.isCheck() || false,
      isCheckmate: chessInstance.isCheckmate() || false
    };
  };
}

export function createBoardApplierAbsolute({
  fromAbs,
  toAbs,
  promotion,
  chessInstance
}: {
  fromAbs: number;
  toAbs: number;
  promotion?: string;
  chessInstance: Chess;
}) {
  return function apply(prev: any) {
    if (!prev) return prev;
    const newBoard = [...prev.board];
    const movingPiece = { ...newBoard[fromAbs] };
    if (promotion) {
      const mapped = mapPromotionLetterToType({ letter: promotion });
      if (mapped) (movingPiece as any).type = mapped;
    }
    (movingPiece as any).state = 'arrived';
    newBoard[toAbs] = movingPiece;
    newBoard[fromAbs] = {};
    clearArrivedStatesExcept({ board: newBoard, keepIndices: [toAbs] });
    updateThreatHighlighting({ board: newBoard, chessInstance });
    return {
      ...prev,
      board: newBoard,
      isCheck: chessInstance.isCheck() || false,
      isCheckmate: chessInstance.isCheckmate() || false
    };
  };
}

// Apply castling (moves king and rook) using absolute board indices based on side and direction
export function createCastlingApplier({
  isBlackSide,
  isKingside,
  chessInstance
}: {
  isBlackSide: boolean;
  isKingside: boolean;
  chessInstance: Chess;
}) {
  return function apply(prev: any) {
    if (!prev) return prev;
    const newBoard = [...prev.board];
    const { kingFrom, kingTo, rookFrom, rookTo } = getCastlingIndices({
      isBlack: isBlackSide,
      isKingside
    });

    const kingPiece = { ...newBoard[kingFrom] } as any;
    kingPiece.state = 'arrived';
    newBoard[kingTo] = kingPiece;
    newBoard[kingFrom] = {} as any;

    const rookPiece = { ...newBoard[rookFrom] } as any;
    rookPiece.state = 'arrived';
    newBoard[rookTo] = rookPiece;
    newBoard[rookFrom] = {} as any;

    clearArrivedStatesExcept({
      board: newBoard,
      keepIndices: [kingTo, rookTo]
    });
    updateThreatHighlighting({ board: newBoard, chessInstance });

    return {
      ...prev,
      board: newBoard,
      isCheck: chessInstance.isCheck() || false,
      isCheckmate: chessInstance.isCheckmate() || false
    } as any;
  };
}

export function resetToStartFen({
  puzzle,
  originalPosition,
  chessRef,
  setChessBoardState,
  setSelectedSquare
}: {
  puzzle: any;
  originalPosition: any;
  chessRef: React.RefObject<Chess | null>;
  setChessBoardState: (fn: (prev: any) => any) => void;
  setSelectedSquare?: (v: number | null) => void;
}) {
  if (!puzzle || !originalPosition) return;
  const { startFen } = normalisePuzzle(puzzle.fen);
  const chess = new Chess(startFen);
  chessRef.current = chess;

  setChessBoardState((prev) => {
    if (!prev || !originalPosition) return prev;
    const resetBoard = originalPosition.board.map((square: any) => ({
      ...square
    }));
    clearCheckAndCheckmateStates({ board: resetBoard });
    return {
      ...originalPosition,
      board: resetBoard,
      isCheck: chessRef.current?.isCheck() || false,
      isCheckmate: false
    };
  });

  if (setSelectedSquare) setSelectedSquare(null);
}

export function applyFenToBoard({
  fen,
  userId,
  chessRef,
  setChessBoardState
}: {
  fen: string;
  userId: number;
  chessRef: React.RefObject<Chess | null>;
  setChessBoardState: (fn: (prev: any) => any) => void;
}) {
  const chess = new Chess(fen);
  chessRef.current = chess;
  setChessBoardState((prev) => {
    if (!prev) return prev;
    const isBlack = prev.playerColors[userId] === 'black';
    const viewBoard = fenToBoardState({
      fen,
      userId,
      playerColor: isBlack ? 'black' : 'white'
    });
    const newBoard = viewBoard.board.map((sq: any) => ({ ...sq }));
    updateThreatHighlighting({
      board: newBoard,
      chessInstance: chessRef.current!
    });
    return {
      ...prev,
      ...viewBoard,
      board: newBoard,
      isCheck: chessRef.current?.isCheck() || false,
      isCheckmate: chessRef.current?.isCheckmate() || false
    } as any;
  });
}

export function isCastlingDebug(): boolean {
  try {
    const v = localStorage.getItem('tw-chess-debug-castling');
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
}

export async function requestEngineReplyUnified({
  fen,
  chessRef,
  evaluatePosition,
  executeEngineMove,
  depth = 20,
  timeoutMs = 7000
}: {
  fen?: string;
  chessRef?: React.RefObject<Chess | null>;
  evaluatePosition: (
    fen: string,
    depth?: number,
    timeoutMs?: number
  ) => Promise<{ success: boolean; move?: string }>;
  executeEngineMove: (uci: string) => void;
  depth?: number;
  timeoutMs?: number;
}) {
  try {
    const fenNow = fen || chessRef?.current?.fen();
    if (!fenNow) return;
    const result = await evaluatePosition(fenNow, depth, timeoutMs);
    if (result?.success && result.move) {
      executeEngineMove(result.move);
    }
  } catch {}
}

export function canCastle({
  chessInstance,
  chessBoardState,
  userId,
  side
}: {
  chessInstance: Chess | null | undefined;
  chessBoardState: any;
  userId: number;
  side: 'kingside' | 'queenside';
}): boolean {
  try {
    if (!chessInstance || !chessBoardState) {
      return false;
    }
    // Only consider user's turn; otherwise don't show buttons
    const turn = chessInstance.turn(); // 'w' | 'b'
    const isBlack = chessBoardState.playerColors[userId] === 'black';
    const meToMove = isBlack ? 'b' : 'w';
    if (turn !== meToMove) {
      return false;
    }

    // Use SAN with check/checkmate suffix tolerance, fallback to flags
    const legalVerbose = chessInstance.moves({ verbose: true }) as any[];
    if (!Array.isArray(legalVerbose)) return false;
    const hasKingsideBySan = legalVerbose.some((m) => {
      const san = typeof m?.san === 'string' ? m.san.replace(/[+#]$/, '') : '';
      return san === 'O-O';
    });
    const hasQueensideBySan = legalVerbose.some((m) => {
      const san = typeof m?.san === 'string' ? m.san.replace(/[+#]$/, '') : '';
      return san === 'O-O-O';
    });
    const hasKingsideByFlags = legalVerbose.some(
      (m) => typeof m?.flags === 'string' && m.flags.includes('k')
    );
    const hasQueensideByFlags = legalVerbose.some(
      (m) => typeof m?.flags === 'string' && m.flags.includes('q')
    );

    const canK = hasKingsideBySan || hasKingsideByFlags;
    const canQ = hasQueensideBySan || hasQueensideByFlags;
    const result = side === 'kingside' ? canK : canQ;

    return result;
  } catch {
    return false;
  }
}

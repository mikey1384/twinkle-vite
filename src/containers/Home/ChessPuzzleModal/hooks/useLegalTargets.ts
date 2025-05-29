import { useMemo } from 'react';
import { Chess } from 'chess.js';

// Helper to convert view coordinates to absolute board coordinates
function viewToBoard(index: number, isBlack: boolean): number {
  if (!isBlack) return index; // White: already absolute
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col); // full 180° flip: both rows AND columns
}

// Helper to convert absolute board coordinates to view coordinates
function boardToView(index: number, isBlack: boolean): number {
  if (!isBlack) return index; // White: view same as absolute
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col); // symmetric inverse: full 180° flip
}

// Helper to convert board index to algebraic notation
function indexToAlgebraic(index: number): string {
  const file = String.fromCharCode(97 + (index % 8)); // a-h
  const rank = 8 - Math.floor(index / 8); // 8-1 (index 0-7 = rank 8, index 56-63 = rank 1)
  return file + rank;
}

// Helper to convert algebraic notation to board index
function algebraicToIndex(square: string): number {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = parseInt(square[1]); // 1-8
  return (8 - rank) * 8 + file; // rank 8 = index 0-7, rank 1 = index 56-63
}

export function useLegalTargets({
  game,
  viewIndex,
  isBlack
}: {
  game: Chess;
  viewIndex: number | null;
  isBlack: boolean;
}) {
  return useMemo(() => {
    if (viewIndex == null) return [];
    const abs = viewToBoard(viewIndex, isBlack);
    const alg = indexToAlgebraic(abs);

    return game
      .moves({ square: alg as any, verbose: true })
      .map((m: any) => boardToView(algebraicToIndex(m.to), isBlack));
  }, [game, viewIndex, isBlack]);
}

import { useMemo } from 'react';
import { Chess } from 'chess.js';
import {
  algebraicToIndex,
  indexToAlgebraic,
  viewToBoard,
  boardToView
} from '../helpers';

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

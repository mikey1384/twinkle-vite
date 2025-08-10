import { RefObject, useCallback } from 'react';

export function useSolutionPlayback({
  puzzle,
  chessRef,
  executeEngineMove,
  solutionPlayingRef,
  resetBoardForSolution
}: {
  puzzle: { moves: string[] } | undefined;
  chessRef: RefObject<any>;
  executeEngineMove: (moveUci: string) => void;
  solutionPlayingRef: RefObject<boolean>;
  resetBoardForSolution: () => void;
}) {
  const playSolutionStep = useCallback(
    function playSolutionStep(startIndex: number, step: number) {
      if (!puzzle || !chessRef.current || !solutionPlayingRef.current) return;
      const moveIndex = startIndex + step;
      const move = puzzle.moves[moveIndex];
      if (move) {
        executeEngineMove(move);
        if (moveIndex + 1 < puzzle.moves.length && solutionPlayingRef.current) {
          setTimeout(() => {
            playSolutionStep(startIndex, step + 1);
          }, 1500);
        }
      }
    },
    [puzzle, chessRef, executeEngineMove, solutionPlayingRef]
  );

  const replaySolution = useCallback(() => {
    if (!puzzle) return;
    solutionPlayingRef.current = true;
    resetBoardForSolution();
    setTimeout(() => {
      playSolutionStep(1, 0);
    }, 950);
  }, [puzzle, resetBoardForSolution, playSolutionStep, solutionPlayingRef]);

  const showCompleteSolution = useCallback(() => {
    if (!puzzle || !chessRef.current) return;
    solutionPlayingRef.current = true;
    resetBoardForSolution();
    setTimeout(() => {
      playSolutionStep(1, 0);
      const msPerMove = 1500;
      const remainingMoves = Math.max(puzzle.moves.length - 1, 0);
      const duration = remainingMoves * msPerMove + 200;
      setTimeout(() => {
        solutionPlayingRef.current = false;
      }, duration);
    }, 950);
  }, [
    puzzle,
    chessRef,
    resetBoardForSolution,
    playSolutionStep,
    solutionPlayingRef
  ]);

  return { playSolutionStep, replaySolution, showCompleteSolution } as const;
}

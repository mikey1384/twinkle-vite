import React from 'react';
import { Chess } from 'chess.js';
import { applyFenToBoard } from '../../helpers';

type SetBoardState = (fn: (prev: any) => any) => void;

export function useAnalysisMode({
  chessRef,
  userId,
  setChessBoardState,
  evaluatePosition
}: {
  chessRef: React.RefObject<Chess | null>;
  userId: number;
  setChessBoardState: SetBoardState;
  evaluatePosition: (
    fen: string,
    depth?: number,
    timeoutMs?: number
  ) => Promise<{ success: boolean; move?: string }>;
}) {
  const [fenHistory, setFenHistory] = React.useState<string[]>([]);
  const [analysisIndex, setAnalysisIndex] = React.useState<number>(0);

  function initStartFen({ startFen }: { startFen: string }) {
    setFenHistory([startFen]);
    setAnalysisIndex(0);
  }

  function appendCurrentFen() {
    if (!chessRef.current) return;
    setFenHistory((prev) => [...prev, chessRef.current!.fen()]);
    setAnalysisIndex((prev) => prev + 1);
  }

  function applyAtIndex({ index }: { index: number }) {
    const safeIndex = Math.max(0, Math.min(index, fenHistory.length - 1));
    const fen = fenHistory[safeIndex];
    if (!fen) return;
    applyFenToBoard({ fen, userId, chessRef, setChessBoardState });
    setAnalysisIndex(safeIndex);
  }

  function prev() {
    applyAtIndex({ index: analysisIndex - 1 });
  }

  function next() {
    applyAtIndex({ index: analysisIndex + 1 });
  }

  function enterFromFinal() {
    applyAtIndex({ index: fenHistory.length - 1 });
  }

  function enterFromPly({ plyIndex }: { plyIndex: number }) {
    applyAtIndex({ index: plyIndex });
  }

  function returnToStart() {
    applyAtIndex({ index: 0 });
  }

  async function requestEngineReply({
    depth = 20,
    timeoutMs = 7000,
    executeEngineMove
  }: {
    depth?: number;
    timeoutMs?: number;
    executeEngineMove: (uci: string) => void;
  }) {
    if (!chessRef.current) return;
    const fenNow = chessRef.current.fen();
    const result = await evaluatePosition(fenNow, depth, timeoutMs);
    if (result?.success && result.move) {
      executeEngineMove(result.move);
    }
  }

  return {
    // state
    fenHistory,
    analysisIndex,
    // actions
    initStartFen,
    appendCurrentFen,
    prev,
    next,
    enterFromFinal,
    enterFromPly,
    returnToStart,
    requestEngineReply
  } as const;
}

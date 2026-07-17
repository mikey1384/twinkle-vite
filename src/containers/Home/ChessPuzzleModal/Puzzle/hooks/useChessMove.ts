import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import {
  uciToSquareIndices,
  validateMoveWithAnalysis,
  createPuzzleMove,
  viewToBoard,
  getCastlingIndices,
  applyFenToBoard,
  fenToBoardState,
  requestEngineReplyUnified,
  updateThreatHighlighting
} from '../../helpers';
import { sleep } from '~/helpers';
import { PuzzlePhase } from '~/types/chess';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number;
  error?: string;
}

const VALIDATION_DEPTH = 15;
const ANALYSIS_DEPTH = 20;
const ANALYSIS_TIMEOUT = 7000;

interface MakeEngineMoveParams {
  chessInstance: Chess;
  moveUci: string;
  solutionPlayingRef: React.RefObject<boolean>;
  onMoveAnalysisUpdate?: (entry: any) => void;
  onBoardStateUpdate?: (updateFn: (prev: any) => any) => void;
}

export function useChessMove({
  attemptId,
  onSetPhase,
  phase,
  boardEpochRef
}: {
  attemptId: number | null;
  onSetPhase: (phase: PuzzlePhase) => void;
  phase: PuzzlePhase;
  boardEpochRef: React.RefObject<number>;
}) {
  const phaseRef = useRef<PuzzlePhase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const isReadyRef = useRef(false);
  const requestIdRef = useRef(0);
  const pendingRequests = useRef<Map<number, (result: EngineResult) => void>>(
    new Map()
  );

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
  }, [attemptId]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const initializeEngine = useCallback(() => {
    try {
      workerRef.current = new Worker('/stockfish-worker.js');

      workerRef.current.onmessage = (e) => {
        const { type, requestId, result, error } = e.data;

        if (type === 'ready' || type === 'initialized') {
          setIsReady(true);
        } else if (type === 'error') {
          console.error('Stockfish error:', error);
          setIsReady(false);

          pendingRequests.current.forEach((resolve) => {
            resolve({
              success: false,
              error: error || 'Engine error'
            });
          });
          pendingRequests.current.clear();
        } else if (
          type === 'result' &&
          requestId &&
          pendingRequests.current.has(requestId)
        ) {
          const resolve = pendingRequests.current.get(requestId);
          if (resolve) {
            resolve(result);
            pendingRequests.current.delete(requestId);
          }
        } else if (type === 'debug') {
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        setIsReady(false);
      };

      workerRef.current.postMessage({ type: 'init' });
    } catch (error) {
      console.error('Failed to initialize Stockfish worker:', error);
      setIsReady(false);
    }
  }, []);

  const evaluatePosition = useCallback(
    async (
      fen: string,
      depth: number = VALIDATION_DEPTH,
      timeoutMs: number = 5000
    ): Promise<EngineResult> => {
      return new Promise((resolve) => {
        const requestId = ++requestIdRef.current;

        const timeout = setTimeout(() => {
          if (pendingRequests.current.has(requestId)) {
            pendingRequests.current.delete(requestId);
            resolve({
              success: false,
              error: 'Evaluation timeout'
            });
          }
        }, timeoutMs);

        pendingRequests.current.set(requestId, (result: EngineResult) => {
          clearTimeout(timeout);
          resolve(result);
        });

        workerRef.current!.postMessage({
          type: 'evaluate',
          requestId,
          data: { fen, depth }
        });
      });
    },
    []
  );

  const makeEngineMove = useCallback(
    ({
      chessInstance,
      moveUci,
      solutionPlayingRef,
      onMoveAnalysisUpdate,
      onBoardStateUpdate
    }: MakeEngineMoveParams) => {
      if (!chessInstance) return;

      let move;
      try {
        move = chessInstance.move({
          from: moveUci.slice(0, 2),
          to: moveUci.slice(2, 4),
          promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
        });
      } catch {
        move = null;
      }

      if (!move) {
        console.error('Invalid engine move:', moveUci);
        return;
      }

      if (!solutionPlayingRef.current && isReady && onMoveAnalysisUpdate) {
        const engineAnalysisEntry = {
          userMove: `${move.from}${move.to}${move.promotion || ''}`,
          expectedMove: undefined,
          engineSuggestion: undefined,
          evaluation: undefined,
          mate: undefined,
          isCorrect: true,
          timestamp: Date.now(),
          isEngine: true
        };

        onMoveAnalysisUpdate(engineAnalysisEntry);
      }

      if (onBoardStateUpdate) {
        onBoardStateUpdate((prev) => {
          if (!prev) return prev;
          const toIndex = uciToSquareIndices(moveUci).to;

          const fenNow = chessInstance.fen();
          const view = fenToBoardState({
            fen: fenNow
          });
          const newBoard = view.board.map((sq: any) => ({ ...sq }));
          try {
            updateThreatHighlighting({ board: newBoard, chessInstance });
          } catch {}
          if (newBoard[toIndex]) (newBoard[toIndex] as any).state = 'arrived';
          if (solutionPlayingRef.current) {
            newBoard.forEach((square: any) => {
              if (
                square?.state &&
                square.state !== 'arrived' &&
                square.state !== 'checkmate' &&
                square.state !== 'check'
              ) {
                delete square.state;
              }
            });
          }
          return {
            ...prev,
            ...view,
            board: newBoard,
            isCheck: chessInstance.isCheck() || false,
            isCheckmate: chessInstance.isCheckmate() || false
          } as any;
        });
      }
    },
    [isReady]
  );

  const waitForEngineReady = useCallback(async (timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (workerRef.current && isReadyRef.current) return true;
      await sleep(500);
    }
    return false;
  }, []);

  async function processUserMove({
    move,
    fenBeforeMove,
    boardUpdateFn,
    puzzle,
    puzzleState,
    kickOffFirstEngineMove,
    inTimeAttack,
    onClearSelection,
    runIdRef,
    animationTimeoutRef,
    breakDuration,
    onClearTimer,
    onMoveAnalysisUpdate,
    onPuzzleResultUpdate,
    onPuzzleStateUpdate,
    onPromotionPendingUpdate,
    onSetRunResult,
    onSetInTimeAttack,
    onTimeTrialCompletedUpdate,
    onDailyStatsUpdate,
    onPuzzleComplete,
    resetToOriginalPosition,
    onAdjustTimeAttackTimer,
    onRecoverTimeAttackRun,
    submitTimeAttackAttempt,
    refreshLevels,
    onRefreshStats,
    updatePuzzle,
    loadChessDailyStats,
    executeEngineMove,
    appendCurrentFen
  }: {
    move: any;
    fenBeforeMove: string;
    boardUpdateFn: () => void;
    puzzle: any;
    puzzleState: any;
    kickOffFirstEngineMove: (options?: { phaseAfter?: any }) => void;
    inTimeAttack: boolean;
    onClearSelection?: () => void;
    runIdRef: React.RefObject<number | null>;
    animationTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
    breakDuration: number;
    onClearTimer: () => void;
    onMoveAnalysisUpdate: (entry: any) => void;
    onPuzzleResultUpdate: (result: 'solved' | 'failed' | 'gave_up') => void;
    onPuzzleStateUpdate: (updateFn: (prev: any) => any) => void;
    onPromotionPendingUpdate: (value: any) => void;
    onSetRunResult: (
      result: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING'
    ) => void;
    onSetInTimeAttack: (v: boolean) => void;
    onTimeTrialCompletedUpdate: (value: boolean) => void;
    onDailyStatsUpdate: (stats: any) => void;
    onPuzzleComplete: (result: any) => void;
    resetToOriginalPosition: () => void;
    onAdjustTimeAttackTimer: (params: {
      moveIndex: number;
      outcome: 'correct' | 'wrong';
    }) => Promise<boolean>;
    onRecoverTimeAttackRun: (cause: unknown) => Promise<boolean>;
    submitTimeAttackAttempt: (params: any) => Promise<any>;
    refreshLevels: () => Promise<void>;
    onRefreshStats: () => Promise<void>;
    updatePuzzle: (puzzle: any) => void;
    loadChessDailyStats: () => Promise<any>;
    executeEngineMove: (moveUci: string) => void;
    appendCurrentFen: () => void;
  }): Promise<boolean> {
    const moveIndex = Number(puzzleState.solutionIndex);
    const expectedMove = puzzle.moves[moveIndex];
    const engineReply = puzzle.moves[moveIndex + 1];

    if (!isReady) {
      const becameReady = await waitForEngineReady(5000);
      if (!becameReady) {
        console.warn(
          'Stockfish engine not ready after waiting, rejecting move'
        );
        return false;
      }
    }

    const moveAnalysis = await validateMoveWithAnalysis({
      userMove: {
        from: move.from,
        to: move.to,
        promotion: move.promotion
      },
      expectedMove,
      fen: fenBeforeMove,
      engineBestMove: evaluatePosition
    });

    const isCorrect = moveAnalysis.isCorrect;

    if (inTimeAttack) {
      try {
        const timerStillActive = await onAdjustTimeAttackTimer({
          moveIndex,
          outcome: isCorrect ? 'correct' : 'wrong'
        });
        if (!timerStillActive) return false;
      } catch (error) {
        // Do not mutate the board from an unconfirmed timer outcome. The
        // parent reconciles non-transport conflicts to the canonical run
        // before another move can be attempted.
        console.error('Failed to reconcile promotion timer:', error);
        return false;
      }
    }

    const analysisEntry = {
      userMove: moveAnalysis.userMove,
      expectedMove: moveAnalysis.expectedMove,
      engineSuggestion: moveAnalysis.engineSuggestion,
      evaluation: moveAnalysis.evaluation,
      mate: moveAnalysis.mate,
      isCorrect: moveAnalysis.isCorrect,
      timestamp: Date.now(),
      fen: fenBeforeMove,
      wrong: !isCorrect
    } as any;

    onMoveAnalysisUpdate(analysisEntry);

    if (!isCorrect) {
      if (!inTimeAttack) {
        onPuzzleResultUpdate('failed');
      }
      try {
        boardUpdateFn();
        onClearSelection?.();
      } catch {}

      if (!inTimeAttack) {
        try {
          appendCurrentFen();
        } catch {}
      }
      onSetPhase('FAIL');
      if (!inTimeAttack) {
        onPuzzleComplete({
          solved: false
        });
      }

      const epochAtFail = boardEpochRef.current;
      if (inTimeAttack) {
        setTimeout(() => {
          if (boardEpochRef.current !== epochAtFail) return;
          if (phaseRef.current !== 'SOLUTION') {
            resetToOriginalPosition();
            kickOffFirstEngineMove({ phaseAfter: 'WAIT_USER' });
          }
        }, 1000);
      } else {
        setTimeout(async () => {
          if (boardEpochRef.current !== epochAtFail) return;
          let fenAfter = '';
          try {
            const temp = new Chess(fenBeforeMove);
            temp.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion
            });
            fenAfter = temp.fen();
          } catch {}
          await runFailTransition({
            fen: fenAfter || fenBeforeMove,
            executeEngineMove,
            epochAtFail
          });
        }, 900);
      }

      return false;
    }

    const userUci = move.from + move.to + (move.promotion || '');
    const wasTransposition = userUci !== expectedMove && engineReply;

    const newMoveHistory = [
      ...puzzleState.moveHistory,
      createPuzzleMove({
        uci: userUci,
        fen: fenBeforeMove
      })
    ];

    const newSolutionIndex =
      puzzleState.solutionIndex + (wasTransposition ? 2 : 1);
    const isLastMove = newSolutionIndex >= puzzle.moves.length;

    onPuzzleStateUpdate((prev) => ({
      ...prev,
      solutionIndex: newSolutionIndex,
      moveHistory: newMoveHistory
    }));

    boardUpdateFn();

    if (isLastMove) {
      onSetPhase('SUCCESS');
      if (inTimeAttack) {
        onSetRunResult('PENDING');
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      if (!inTimeAttack) {
        transitionTimeoutRef.current = setTimeout(() => {
          onSetPhase('ANALYSIS');
        }, 1400);
      }

      onPromotionPendingUpdate(null);

      if (inTimeAttack) {
        onClearTimer();
        let promoResp: any = null;
        try {
          promoResp = await submitTimeAttackAttempt({
            runId: runIdRef.current,
            solved: true
          });
        } catch (error) {
          console.error('Failed to submit promotion attempt:', error);
          await onRecoverTimeAttackRun(error);
          return false;
        }

        if (promoResp?.finished) {
          if (promoResp.success) {
            onSetRunResult('SUCCESS');
            onTimeTrialCompletedUpdate(true);
            onSetPhase('PROMO_SUCCESS');
            await Promise.all([refreshLevels(), onRefreshStats()]);
            return true;
          }

          if (promoResp?.reason === 'puzzle_unavailable') {
            console.warn('Promotion stopped: next puzzle unavailable');
          }
          runIdRef.current = null;
          onSetRunResult('FAIL');
          onSetInTimeAttack(false);
          onSetPhase('FAIL');
          await Promise.allSettled([refreshLevels(), onRefreshStats()]);
          return false;
        }

        if (promoResp?.nextPuzzle) {
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
            transitionTimeoutRef.current = null;
          }
          onPuzzleStateUpdate((prev) => ({
            ...prev,
            autoPlaying: true
          }));
          onSetPhase('TA_CLEAR');

          await sleep(breakDuration);

          updatePuzzle(promoResp.nextPuzzle);
          onPuzzleStateUpdate((p) => ({
            ...p,
            autoPlaying: false
          }));
          return true;
        }
        runIdRef.current = null;
        onSetRunResult('FAIL');
        onSetInTimeAttack(false);
        onSetPhase('FAIL');
        await Promise.allSettled([refreshLevels(), onRefreshStats()]);
        return false;
      } else {
        onPuzzleResultUpdate('solved');
        await onPuzzleComplete({
          solved: true
        });

        const stats = await loadChessDailyStats();
        onDailyStatsUpdate(stats);
        try {
          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
          }
          animationTimeoutRef.current = setTimeout(() => {
            onPuzzleStateUpdate((prev) => {
              return prev;
            });
          }, 1400);
        } catch {}
      }

      return true;
    }

    const nextMove = puzzle.moves[newSolutionIndex];
    if (nextMove && !wasTransposition) {
      onPuzzleStateUpdate((prev) => ({ ...prev }));

      animationTimeoutRef.current = setTimeout(() => {
        executeEngineMove(nextMove);

        const finalIndex = newSolutionIndex + 1;
        const puzzleComplete = finalIndex >= puzzle.moves.length;

        onPuzzleStateUpdate((prev) => ({
          ...prev,
          solutionIndex: finalIndex
        }));

        if (puzzleComplete) {
          onPromotionPendingUpdate(null);
        }
      }, 450);
    } else {
      const puzzleComplete = newSolutionIndex >= puzzle.moves.length;

      if (wasTransposition && engineReply) {
        // Capture fen before engine reply is executed for explore-from.
        const currentFen = fenBeforeMove;
        onMoveAnalysisUpdate({
          userMove: engineReply,
          isEngine: true,
          timestamp: Date.now(),
          fen: currentFen
        });
        executeEngineMove(engineReply);
      }

      onPuzzleStateUpdate((prev) => ({
        ...prev,
        solutionIndex: newSolutionIndex
      }));

      if (puzzleComplete) {
        onPromotionPendingUpdate(null);
      }
    }

    return true;
  }

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'terminate' });
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      pendingRequests.current.clear();
    }
  }, []);

  useEffect(() => {
    initializeEngine();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup]);

  return {
    isReady,
    evaluatePosition,
    cleanup,
    makeEngineMove,
    processUserMove
  };

  async function runFailTransition({
    fen,
    executeEngineMove,
    epochAtFail
  }: {
    fen: string;
    executeEngineMove: (uci: string) => void;
    epochAtFail: number;
  }) {
    await requestEngineReplyUnified({
      fen,
      evaluatePosition,
      executeEngineMove: (uci: string) => {
        if (boardEpochRef.current !== epochAtFail) return;
        executeEngineMove(uci);
      },
      depth: ANALYSIS_DEPTH,
      timeoutMs: ANALYSIS_TIMEOUT
    });
    if (boardEpochRef.current !== epochAtFail) return;
    setTimeout(() => {
      if (boardEpochRef.current !== epochAtFail) return;
      onSetPhase('ANALYSIS');
    }, 1400);
  }
}

export function createHandleCastling({
  chessRef,
  chessBoardState,
  setChessBoardState,
  executeUserMove,
  processingMoveRef,
  inTimeAttack,
  runResult,
  timeLeft
}: {
  chessRef: React.RefObject<Chess | null>;
  chessBoardState: any;
  setChessBoardState: (fn: (prev: any) => any) => void;
  executeUserMove: (
    move: any,
    fenBeforeMove: string,
    boardUpdateFn: () => void
  ) => Promise<boolean>;
  processingMoveRef: React.RefObject<boolean>;
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING';
  timeLeft: number;
}) {
  return async function handleCastling(direction: 'kingside' | 'queenside') {
    if (!chessRef.current || !chessBoardState) {
      return;
    }

    if (inTimeAttack) {
      const allowed = runResult === 'PLAYING' && timeLeft > 0;
      if (!allowed) return;
    }

    if (processingMoveRef.current) return;
    processingMoveRef.current = true;

    try {
      const playerColor = chessBoardState.playerColor;
      const castlingMove = direction === 'kingside' ? 'O-O' : 'O-O-O';
      const fenBeforeMove = chessRef.current.fen();

      const candidatePosition = new Chess(fenBeforeMove);
      const move = candidatePosition.move(castlingMove);
      if (!move) {
        console.error('Invalid castling move:', castlingMove);
        return;
      }

      const isBlack = playerColor === 'black';
      const isKingside = direction === 'kingside';

      const boardUpdateFn = () => {
        chessRef.current!.move(castlingMove);
        applyFenToBoard({
          fen: chessRef.current!.fen(),
          chessRef,
          setChessBoardState
        });
        const { kingTo, rookTo } = getCastlingIndices({
          isBlack,
          isKingside
        });
        setChessBoardState((prev) => {
          if (!prev) return prev;
          const nb = prev.board.map((sq: any, i: number) =>
            i === kingTo || i === rookTo ? { ...sq, state: 'arrived' } : sq
          );
          return {
            ...prev,
            board: nb,
            isCheck: chessRef.current?.isCheck() || false,
            isCheckmate: chessRef.current?.isCheckmate() || false
          } as any;
        });
      };

      return await executeUserMove(move, fenBeforeMove, boardUpdateFn);
    } finally {
      processingMoveRef.current = false;
    }
  };
}

export function createHandleFinishMove({
  chessRef,
  puzzle,
  chessBoardState,
  setChessBoardState,
  executeUserMove,
  processingMoveRef
}: {
  chessRef: React.RefObject<Chess | null>;
  puzzle: any;
  chessBoardState: any;
  setChessBoardState: (fn: (prev: any) => any) => void;
  executeUserMove: (
    move: any,
    fenBeforeMove: string,
    boardUpdateFn: () => void
  ) => Promise<boolean>;
  processingMoveRef: React.RefObject<boolean>;
}) {
  return async function handleFinishMove({
    to,
    fromAlgebraic,
    toAlgebraic,
    fenBeforeMove,
    promotion
  }: {
    to: number;
    fromAlgebraic: string;
    toAlgebraic: string;
    fenBeforeMove: string;
    promotion?: string;
  }) {
    if (!chessRef.current || !puzzle) return false;
    if (processingMoveRef.current) return false;
    processingMoveRef.current = true;

    try {
      let move;
      try {
        const candidatePosition = new Chess(fenBeforeMove);
        move = candidatePosition.move({
          from: fromAlgebraic,
          to: toAlgebraic,
          ...(promotion && { promotion })
        });
      } catch {
        return false;
      }

      if (!move) return false;

      const boardUpdateFn = () => {
        chessRef.current!.move({
          from: fromAlgebraic,
          to: toAlgebraic,
          ...(promotion && { promotion })
        });
        applyFenToBoard({
          fen: chessRef.current!.fen(),
          chessRef,
          setChessBoardState
        });
        const isBlack = chessBoardState?.playerColor === 'black';
        const absTo = viewToBoard(to, isBlack);
        setChessBoardState((prev) => {
          if (!prev) return prev;
          const nb = prev.board.map((sq: any, i: number) =>
            i === absTo ? { ...sq, state: 'arrived' } : sq
          );
          return { ...prev, board: nb };
        });
      };

      return await executeUserMove(move, fenBeforeMove, boardUpdateFn);
    } finally {
      processingMoveRef.current = false;
    }
  };
}

export function createHandleFinishMoveAnalysis({
  chessRef,
  chessBoardState,
  setChessBoardState,
  requestEngineReply,
  executeEngineMove
}: {
  chessRef: React.RefObject<Chess | null>;
  chessBoardState: any;
  setChessBoardState: (fn: (prev: any) => any) => void;
  requestEngineReply: (params: {
    executeEngineMove: (uci: string) => void;
  }) => Promise<void>;
  executeEngineMove: (uci: string) => void;
}) {
  return async function handleFinishMoveAnalysis({
    to,
    fromAlgebraic,
    toAlgebraic,
    fenBeforeMove: _fenBeforeMove,
    promotion
  }: {
    to: number;
    fromAlgebraic: string;
    toAlgebraic: string;
    fenBeforeMove: string;
    promotion?: string;
  }) {
    if (!chessRef.current) return false;

    let move;
    try {
      move = chessRef.current.move({
        from: fromAlgebraic,
        to: toAlgebraic,
        ...(promotion && { promotion })
      });
    } catch {
      return false;
    }
    if (!move) return false;

    applyFenToBoard({
      fen: chessRef.current.fen(),
      chessRef,
      setChessBoardState
    });
    (function markArrived() {
      const isBlack = chessBoardState?.playerColor === 'black';
      const absTo = viewToBoard(to, isBlack);
      setChessBoardState((prev) => {
        if (!prev) return prev;
        const nb = prev.board.map((sq: any, i: number) =>
          i === absTo ? { ...sq, state: 'arrived' } : sq
        );
        return { ...prev, board: nb };
      });
    })();
    try {
      await requestEngineReply({ executeEngineMove });
    } catch {}
    return true;
  };
}

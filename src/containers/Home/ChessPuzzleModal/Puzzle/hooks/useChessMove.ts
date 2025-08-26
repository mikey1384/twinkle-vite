import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import {
  uciToSquareIndices,
  validateMoveWithAnalysis,
  createPuzzleMove,
  viewToBoard,
  getCastlingIndices,
  resetToStartFen,
  createBoardApplier,
  createBoardApplierAbsolute,
  createCastlingApplier,
  requestEngineReplyUnified
} from '../../helpers';
import { sleep } from '~/helpers';
import { PuzzlePhase } from '~/types/chess';
import {
  TIME_ATTACK_DURATION,
  TIME_BONUS_CORRECT_MOVE,
  TIME_PENALTY_WRONG_MOVE
} from '../../constants';

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
  onSetTimeLeft,
  onSetPhase
}: {
  attemptId: number | null;
  onSetTimeLeft: (v: any) => void;
  onSetPhase: (phase: PuzzlePhase) => void;
}) {
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
          // Suppress debug messages
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

      const move = chessInstance.move({
        from: moveUci.slice(0, 2),
        to: moveUci.slice(2, 4),
        promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
      });

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
          const fromIndex = uciToSquareIndices(moveUci).from;

          if (move.san === 'O-O' || move.san === 'O-O-O') {
            const isWhite = (prev.board[fromIndex] as any)?.color === 'white';
            const isBlack = !isWhite;
            const isKingside = move.san === 'O-O';
            const applier = createCastlingApplier({
              isBlackSide: isBlack,
              isKingside,
              chessInstance
            });
            let next = applier(prev);
            if (solutionPlayingRef.current && next?.board) {
              next.board.forEach((square: any) => {
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
            return next;
          }

          const promoFromUci =
            moveUci.length > 4 ? moveUci.slice(4, 5) : undefined;
          const promoFromSan = (() => {
            if (move.san && move.san.includes('=')) {
              const m = /\=([QRBN])/i.exec(move.san);
              return m ? m[1].toLowerCase() : undefined;
            }
            return undefined;
          })();
          const promotion =
            promoFromSan || promoFromUci || (move as any).promotion;
          const applier = createBoardApplierAbsolute({
            fromAbs: fromIndex,
            toAbs: toIndex,
            promotion,
            chessInstance
          });
          let next = applier(prev);
          if (solutionPlayingRef.current && next?.board) {
            next.board.forEach((square: any) => {
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
          return next;
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
    inTimeAttack,
    autoRetryOnFail,
    onClearSelection,
    runIdRef,
    animationTimeoutRef,
    breakDuration,
    onClearTimer,
    onMoveAnalysisUpdate,
    onPuzzleResultUpdate,
    onPuzzleStateUpdate,
    onPromotionPendingUpdate,
    onRunResultUpdate,
    onTimeTrialCompletedUpdate,
    onDailyStatsUpdate,
    onPuzzleComplete,
    resetToOriginalPosition,
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
    inTimeAttack: boolean;
    autoRetryOnFail: boolean;
    onClearSelection?: () => void;
    runIdRef: React.RefObject<number | null>;
    animationTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
    breakDuration: number;
    onClearTimer: () => void;
    onMoveAnalysisUpdate: (entry: any) => void;
    onPuzzleResultUpdate: (result: 'solved' | 'failed' | 'gave_up') => void;
    onPuzzleStateUpdate: (updateFn: (prev: any) => any) => void;
    onPromotionPendingUpdate: (value: any) => void;
    onRunResultUpdate: (
      result: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING'
    ) => void;
    onTimeTrialCompletedUpdate: (value: boolean) => void;
    onDailyStatsUpdate: (stats: any) => void;
    onPuzzleComplete: (result: any) => void;
    resetToOriginalPosition: () => void;
    submitTimeAttackAttempt: (params: any) => Promise<any>;
    refreshLevels: () => Promise<void>;
    onRefreshStats: () => Promise<void>;
    updatePuzzle: (puzzle: any) => void;
    loadChessDailyStats: () => Promise<any>;
    executeEngineMove: (moveUci: string) => void;
    appendCurrentFen: () => void;
  }): Promise<boolean> {
    const expectedMove = puzzle.moves[puzzleState.solutionIndex];
    const engineReply = puzzle.moves[puzzleState.solutionIndex + 1];

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
      onSetTimeLeft((v: any) => (v ? v - TIME_PENALTY_WRONG_MOVE : 0));
      onPuzzleResultUpdate('failed');
      try {
        boardUpdateFn();
      } catch {}

      try {
        onClearSelection?.();
      } catch {}
      if (!inTimeAttack && !autoRetryOnFail) {
        try {
          appendCurrentFen();
        } catch {}
        onSetPhase('FAIL');
        onPuzzleStateUpdate((prev) => ({
          ...prev,
          attemptsUsed: prev.attemptsUsed + 1
        }));
      } else {
        onSetPhase('FAIL');
        onPuzzleStateUpdate((prev) => ({
          ...prev,
          attemptsUsed: prev.attemptsUsed + 1
        }));
      }

      onPuzzleComplete({
        solved: false,
        attemptsUsed: puzzleState.attemptsUsed + 1
      });

      if (autoRetryOnFail || inTimeAttack) {
        setTimeout(() => {
          resetToOriginalPosition();
        }, 1000);
      } else {
        setTimeout(async () => {
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
            executeEngineMove
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

    if (inTimeAttack) {
      onSetTimeLeft((v: any) => {
        if (!v || v <= 0) return v;
        return Math.min(v + TIME_BONUS_CORRECT_MOVE, TIME_ATTACK_DURATION);
      });
    }

    if (isLastMove) {
      onSetPhase('SUCCESS');
      if (inTimeAttack) {
        onRunResultUpdate('PENDING');
      }
      // Clear any pending transition timers before scheduling
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      // Only schedule analysis transition for non time-attack mode
      if (!inTimeAttack) {
        transitionTimeoutRef.current = setTimeout(() => {
          onSetPhase('ANALYSIS');
        }, 1400);
      }

      onPromotionPendingUpdate(null);

      if (inTimeAttack) {
        onClearTimer();
        const promoResp = await submitTimeAttackAttempt({
          runId: runIdRef.current,
          solved: true
        });

        if (promoResp.finished) {
          onRunResultUpdate(promoResp.success ? 'SUCCESS' : 'FAIL');
          if (promoResp.success) {
            onTimeTrialCompletedUpdate(true);
          }
          onSetPhase('PROMO_SUCCESS');
          await Promise.all([refreshLevels(), onRefreshStats()]);
        } else if (promoResp.nextPuzzle) {
          // Ensure no stray analysis transition fires between puzzles
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
      } else {
        onPuzzleResultUpdate('solved');
        await onPuzzleComplete({
          solved: true,
          attemptsUsed: puzzleState.attemptsUsed + 1
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
      onSetPhase('ANIM_ENGINE');
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
    scheduledPuzzleId
  }: {
    fen: string;
    executeEngineMove: (uci: string) => void;
    scheduledPuzzleId?: string;
  }) {
    if (scheduledPuzzleId) {
      return;
    }
    await requestEngineReplyUnified({
      fen,
      evaluatePosition,
      executeEngineMove,
      depth: ANALYSIS_DEPTH,
      timeoutMs: ANALYSIS_TIMEOUT
    });
    setTimeout(() => {
      onSetPhase('ANALYSIS');
    }, 1400);
  }
}

// -----------------------------
// Board/UI action creators
// -----------------------------

export function createOnSquareClick({
  chessBoardState,
  phase,
  inTimeAttack,
  runResult,
  timeLeft,
  userId,
  selectedSquare,
  setSelectedSquare,
  handleUserMove
}: {
  chessBoardState: any;
  phase: PuzzlePhase;
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING';
  timeLeft: number;
  userId: number;
  selectedSquare: number | null;
  setSelectedSquare: (v: number | null) => void;
  handleUserMove: (from: number, to: number) => Promise<boolean>;
}) {
  return async function onSquareClick(clickedSquare: number) {
    if (!chessBoardState || (phase !== 'WAIT_USER' && phase !== 'ANALYSIS')) {
      return;
    }

    // Disallow any user moves if time-attack has ended
    if (inTimeAttack && (runResult !== 'PLAYING' || timeLeft <= 0)) {
      return;
    }

    const isBlack = chessBoardState.playerColors[userId] === 'black';
    const absClickedSquare = viewToBoard(clickedSquare, isBlack);

    const clickedPiece = chessBoardState.board[absClickedSquare];
    const playerColor = chessBoardState.playerColors[userId];

    if (selectedSquare == null) {
      if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
        setSelectedSquare(clickedSquare);
      }
      return;
    }

    if (selectedSquare === clickedSquare) {
      setSelectedSquare(null);
      return;
    }

    if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
      setSelectedSquare(clickedSquare);
      return;
    }

    const success = await handleUserMove(selectedSquare, clickedSquare);
    if (success) {
      setSelectedSquare(null);
    }
  };
}

export function createResetToOriginalPosition({
  puzzle,
  originalPosition,
  chessRef,
  setChessBoardState,
  setSelectedSquare,
  setMoveAnalysisHistory,
  setPuzzleState,
  executeEngineMove,
  animationTimeoutRef
}: {
  puzzle: any;
  originalPosition: any;
  chessRef: React.RefObject<Chess | null>;
  setChessBoardState: (fn: (prev: any) => any) => void;
  setSelectedSquare: (v: number | null) => void;
  setMoveAnalysisHistory: (fnOrArray: any[] | ((prev: any[]) => any[])) => void;
  setPuzzleState: (fn: (prev: any) => any) => void;
  executeEngineMove: (moveUci: string) => void;
  animationTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
}) {
  return function resetToOriginalPosition(options?: {
    countAsAttempt?: boolean;
  }) {
    const countAsAttempt = options?.countAsAttempt ?? true;
    resetToStartFen({
      puzzle,
      originalPosition,
      chessRef,
      setChessBoardState,
      setSelectedSquare
    });
    setMoveAnalysisHistory([] as any[]);

    setPuzzleState((prev: any) => ({
      ...prev,
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: countAsAttempt ? prev.attemptsUsed + 1 : prev.attemptsUsed
    }));

    animationTimeoutRef.current = setTimeout(() => {
      executeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev: any) => ({
        ...prev,
        solutionIndex: 1
      }));
    }, 450);
  };
}

export function createHandleCastling({
  chessRef,
  chessBoardState,
  userId,
  setChessBoardState,
  executeUserMove,
  inTimeAttack,
  runResult,
  timeLeft
}: {
  chessRef: React.RefObject<Chess | null>;
  chessBoardState: any;
  userId: number;
  setChessBoardState: (fn: (prev: any) => any) => void;
  executeUserMove: (
    move: any,
    fenBeforeMove: string,
    boardUpdateFn: () => void
  ) => Promise<boolean>;
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING';
  timeLeft: number;
}) {
  return async function handleCastling(direction: 'kingside' | 'queenside') {
    if (!chessRef.current || !chessBoardState) {
      return;
    }

    // Disallow any user moves if time-attack has ended
    if (inTimeAttack && (runResult !== 'PLAYING' || timeLeft <= 0)) {
      return;
    }

    const playerColor = chessBoardState.playerColors[userId];
    const castlingMove = direction === 'kingside' ? 'O-O' : 'O-O-O';
    const fenBeforeMove = chessRef.current.fen();

    const move = chessRef.current.move(castlingMove);
    if (!move) {
      console.error('Invalid castling move:', castlingMove);
      return;
    }

    const isBlack = playerColor === 'black';
    const isKingside = direction === 'kingside';

    const boardUpdateFn = () => {
      const isPositionCheckmate = chessRef.current?.isCheckmate() || false;

      setChessBoardState((prev) => {
        if (!prev) return prev;

        const newBoard = [...prev.board];

        const { kingFrom, kingTo, rookFrom, rookTo } = getCastlingIndices({
          isBlack,
          isKingside
        });

        // Move king
        const kingPiece = { ...newBoard[kingFrom] };
        kingPiece.state = 'arrived';
        newBoard[kingTo] = kingPiece;
        newBoard[kingFrom] = {};

        // Move rook
        const rookPiece = { ...newBoard[rookFrom] };
        rookPiece.state = 'arrived';
        newBoard[rookTo] = rookPiece;
        newBoard[rookFrom] = {};

        return {
          ...prev,
          board: newBoard,
          isCheck: chessRef.current?.isCheck() || false,
          isCheckmate: isPositionCheckmate
        };
      });
    };

    return await executeUserMove(move, fenBeforeMove, boardUpdateFn);
  };
}

export function createHandleFinishMove({
  chessRef,
  puzzle,
  chessBoardState,
  userId,
  setChessBoardState,
  executeUserMove
}: {
  chessRef: React.RefObject<Chess | null>;
  puzzle: any;
  chessBoardState: any;
  userId: number;
  setChessBoardState: (fn: (prev: any) => any) => void;
  executeUserMove: (
    move: any,
    fenBeforeMove: string,
    boardUpdateFn: () => void
  ) => Promise<boolean>;
}) {
  return async function handleFinishMove({
    from,
    to,
    fromAlgebraic,
    toAlgebraic,
    fenBeforeMove,
    promotion
  }: {
    from: number;
    to: number;
    fromAlgebraic: string;
    toAlgebraic: string;
    fenBeforeMove: string;
    promotion?: string;
  }) {
    if (!chessRef.current || !puzzle) return false;

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

    const isBlack = chessBoardState?.playerColors[userId] === 'black';

    const boardUpdateFn = () => {
      const isPositionCheckmate = chessRef.current?.isCheckmate() || false;
      const isPositionCheck = chessRef.current?.isCheck() || false;

      setChessBoardState((prev) => {
        if (!prev) return prev;
        const applier = createBoardApplier({
          from,
          to,
          promotion: move.promotion,
          isBlackView: isBlack,
          chessInstance: chessRef.current!
        });
        const next = applier(prev);
        return {
          ...next,
          isCheck: isPositionCheck,
          isCheckmate: isPositionCheckmate
        } as any;
      });
    };

    return await executeUserMove(move, fenBeforeMove, boardUpdateFn);
  };
}

export function createHandleFinishMoveAnalysis({
  chessRef,
  chessBoardState,
  userId,
  setChessBoardState,
  requestEngineReply,
  executeEngineMove
}: {
  chessRef: React.RefObject<Chess | null>;
  chessBoardState: any;
  userId: number;
  setChessBoardState: (fn: (prev: any) => any) => void;
  requestEngineReply: (params: {
    executeEngineMove: (uci: string) => void;
  }) => Promise<void>;
  executeEngineMove: (uci: string) => void;
}) {
  return async function handleFinishMoveAnalysis({
    from,
    to,
    fromAlgebraic,
    toAlgebraic,
    fenBeforeMove: _fenBeforeMove,
    promotion
  }: {
    from: number;
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

    const isBlack = chessBoardState?.playerColors[userId] === 'black';
    setChessBoardState((prev) => {
      if (!prev) return prev;
      const applier = createBoardApplier({
        from,
        to,
        promotion,
        isBlackView: isBlack,
        chessInstance: chessRef.current!
      });
      return applier(prev);
    });
    try {
      await requestEngineReply({ executeEngineMove });
    } catch {}
    return true;
  };
}

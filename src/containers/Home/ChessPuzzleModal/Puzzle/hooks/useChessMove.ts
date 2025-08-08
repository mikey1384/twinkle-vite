import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import {
  uciToSquareIndices,
  validateMoveWithAnalysis,
  createPuzzleMove,
  normalisePuzzle,
  viewToBoard,
  applyCheckmateHighlighting,
  applyInCheckHighlighting,
  clearArrivedStatesExcept
} from '../../helpers';
import { sleep } from '~/helpers';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number;
  error?: string;
}

interface MakeEngineMoveParams {
  chessInstance: Chess;
  moveUci: string;
  solutionPlayingRef: React.RefObject<boolean>;
  onMoveAnalysisUpdate?: (entry: any) => void;
  onBoardStateUpdate?: (updateFn: (prev: any) => any) => void;
  applyCheckmateHighlighting?: (board: any[]) => void;
}

interface ProcessUserMoveParams {
  move: any;
  fenBeforeMove: string;
  boardUpdateFn: () => void;
  puzzle: any;
  puzzleState: any;
  aliveRef: React.RefObject<boolean>;
  inTimeAttack: boolean;
  runIdRef: React.RefObject<number | null>;
  animationTimeoutRef: React.RefObject<number | null>;
  breakDuration: number;
  onMoveAnalysisUpdate: (entry: any) => void;
  onPuzzleResultUpdate: (result: 'solved' | 'failed' | 'gave_up') => void;
  onPuzzleStateUpdate: (updateFn: (prev: any) => any) => void;
  onPromotionPendingUpdate: (value: any) => void;
  onRunResultUpdate: (result: 'PLAYING' | 'SUCCESS' | 'FAIL') => void;
  onTimeTrialCompletedUpdate: (value: boolean) => void;
  onPromoSolvedUpdate: (updateFn: (prev: number) => number) => void;
  onDailyStatsUpdate: (stats: any) => void;
  onPuzzleComplete: (result: any) => void;
  resetToOriginalPosition: () => void;
  submitTimeAttackAttempt: (params: any) => Promise<any>;
  refreshLevels: () => Promise<void>;
  refreshPromotion: () => Promise<void>;
  updatePuzzle: (puzzle: any) => void;
  loadChessDailyStats: () => Promise<any>;
  executeEngineMove: (moveUci: string) => void;
}

export function useChessMove() {
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequests = useRef<Map<number, (result: EngineResult) => void>>(
    new Map()
  );

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

      // Initialize the engine
      workerRef.current.postMessage({ type: 'init' });
    } catch (error) {
      console.error('Failed to initialize Stockfish worker:', error);
      setIsReady(false);
    }
  }, []);

  const evaluatePosition = useCallback(
    async (
      fen: string,
      depth: number = 15,
      timeoutMs: number = 5000
    ): Promise<EngineResult> => {
      if (!workerRef.current || !isReady) {
        return {
          success: false,
          error: 'Engine not ready'
        };
      }

      return new Promise((resolve) => {
        const requestId = ++requestIdRef.current;

        // Set up timeout
        const timeout = setTimeout(() => {
          if (pendingRequests.current.has(requestId)) {
            pendingRequests.current.delete(requestId);
            resolve({
              success: false,
              error: 'Evaluation timeout'
            });
          }
        }, timeoutMs);

        // Store the resolver
        pendingRequests.current.set(requestId, (result: EngineResult) => {
          clearTimeout(timeout);
          resolve(result);
        });

        // Send evaluation request
        workerRef.current!.postMessage({
          type: 'evaluate',
          requestId,
          data: { fen, depth }
        });
      });
    },
    [isReady]
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'terminate' });
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      pendingRequests.current.clear();
    }
  }, []);

  const makeEngineMove = useCallback(
    ({
      chessInstance,
      moveUci,
      solutionPlayingRef,
      onMoveAnalysisUpdate,
      onBoardStateUpdate,
      applyCheckmateHighlighting
    }: MakeEngineMoveParams) => {
      if (!chessInstance) return;

      const { from } = uciToSquareIndices(moveUci);

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

      const isPositionCheckmate = chessInstance?.isCheckmate() || false;
      const isPositionCheck = chessInstance?.isCheck() || false;

      if (onBoardStateUpdate) {
        onBoardStateUpdate((prev) => {
          if (!prev) return prev;

          const newBoard = [...prev.board];
          let movingPiece = { ...newBoard[from] };
          const toIndex = uciToSquareIndices(moveUci).to;

          if (move.san.includes('=')) {
            const promotionPiece = move.san.slice(-1).toLowerCase();
            const pieceTypeMap: { [key: string]: string } = {
              q: 'queen',
              r: 'rook',
              b: 'bishop',
              n: 'knight'
            };
            movingPiece.type = pieceTypeMap[promotionPiece] || 'queen';
          }

          if (move.san === 'O-O' || move.san === 'O-O-O') {
            const isKingside = move.san === 'O-O';
            const isWhite = movingPiece.color === 'white';

            let kingDest: number;
            let rookFrom: number;
            let rookDest: number;

            if (isWhite) {
              if (isKingside) {
                kingDest = 62; // g1
                rookFrom = 63; // h1
                rookDest = 61; // f1
              } else {
                kingDest = 58; // c1
                rookFrom = 56; // a1
                rookDest = 59; // d1
              }
            } else {
              if (isKingside) {
                kingDest = 6; // g8
                rookFrom = 7; // h8
                rookDest = 5; // f8
              } else {
                kingDest = 2; // c8
                rookFrom = 0; // a8
                rookDest = 3; // d8
              }
            }

            const kingPiece = { ...newBoard[from] };
            kingPiece.state = 'arrived';
            newBoard[kingDest] = kingPiece;
            newBoard[from] = {};

            const rookPiece = { ...newBoard[rookFrom] };
            rookPiece.state = 'arrived';
            newBoard[rookDest] = rookPiece;
            newBoard[rookFrom] = {};
          } else {
            movingPiece.state = 'arrived';
            newBoard[toIndex] = movingPiece;
            newBoard[from] = {};
          }

          if (move.san === 'O-O' || move.san === 'O-O-O') {
            clearArrivedStatesExcept({ board: newBoard });
          } else {
            clearArrivedStatesExcept({
              board: newBoard,
              keepIndices: [toIndex]
            });
          }

          if (solutionPlayingRef.current) {
            newBoard.forEach((square: any) => {
              if (
                square?.state &&
                square.state !== 'arrived' &&
                square.state !== 'checkmate'
              ) {
                delete square.state;
              }
            });
          }

          if (isPositionCheckmate) {
            applyCheckmateHighlighting?.(newBoard);
          } else {
            applyInCheckHighlighting({ board: newBoard, chessInstance });
          }

          return {
            ...prev,
            board: newBoard,
            isCheck: isPositionCheck,
            isCheckmate: isPositionCheckmate
          };
        });
      }
    },
    [isReady]
  );

  async function processUserMove({
    move,
    fenBeforeMove,
    boardUpdateFn,
    puzzle,
    puzzleState,
    aliveRef,
    inTimeAttack,
    runIdRef,
    animationTimeoutRef,
    breakDuration,
    onMoveAnalysisUpdate,
    onPuzzleResultUpdate,
    onPuzzleStateUpdate,
    onPromotionPendingUpdate,
    onRunResultUpdate,
    onTimeTrialCompletedUpdate,
    onPromoSolvedUpdate,
    onDailyStatsUpdate,
    onPuzzleComplete,
    resetToOriginalPosition,
    submitTimeAttackAttempt,
    refreshLevels,
    refreshPromotion,
    updatePuzzle,
    loadChessDailyStats,
    executeEngineMove
  }: ProcessUserMoveParams): Promise<boolean> {
    const expectedMove = puzzle.moves[puzzleState.solutionIndex];
    const engineReply = puzzle.moves[puzzleState.solutionIndex + 1];

    if (!isReady) {
      console.warn('Stockfish engine not ready, rejecting move');
      return false;
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
      timestamp: Date.now()
    };

    onMoveAnalysisUpdate(analysisEntry);

    if (!aliveRef.current) return false;

    if (!isCorrect) {
      onPuzzleResultUpdate('failed');
      onPuzzleStateUpdate((prev) => ({
        ...prev,
        phase: 'FAIL' as const,
        attemptsUsed: prev.attemptsUsed + 1
      }));

      onPuzzleComplete({
        solved: false,
        attemptsUsed: puzzleState.attemptsUsed + 1
      });

      setTimeout(() => {
        if (!aliveRef.current) return;
        resetToOriginalPosition();
      }, 2000);

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

    // Apply board update
    boardUpdateFn();

    if (isLastMove) {
      onPuzzleStateUpdate((prev) => ({ ...prev, phase: 'SUCCESS' as const }));
      onPromotionPendingUpdate(null);

      if (inTimeAttack) {
        const promoResp = await submitTimeAttackAttempt({
          runId: runIdRef.current,
          solved: true
        });

        if (promoResp.finished) {
          onRunResultUpdate(promoResp.success ? 'SUCCESS' : 'FAIL');
          if (promoResp.success) {
            onTimeTrialCompletedUpdate(true);
          }
          await Promise.all([refreshLevels(), refreshPromotion()]);
        } else if (promoResp.nextPuzzle) {
          onPromoSolvedUpdate((n) => n + 1);
          onPuzzleStateUpdate((prev) => ({
            ...prev,
            phase: 'TA_CLEAR',
            autoPlaying: true
          }));

          await sleep(breakDuration);

          updatePuzzle(promoResp.nextPuzzle);
          onPuzzleStateUpdate((p) => ({
            ...p,
            phase: 'WAIT_USER',
            autoPlaying: false
          }));
          return true; // skip normal completion logic
        }
      } else {
        await onPuzzleComplete({
          solved: true,
          attemptsUsed: puzzleState.attemptsUsed + 1
        });

        const stats = await loadChessDailyStats();
        onDailyStatsUpdate(stats);
      }

      return true;
    }

    const nextMove = puzzle.moves[newSolutionIndex];
    if (nextMove && !wasTransposition) {
      onPuzzleStateUpdate((prev) => ({ ...prev, phase: 'ANIM_ENGINE' }));

      animationTimeoutRef.current = window.setTimeout(() => {
        executeEngineMove(nextMove);

        const finalIndex = newSolutionIndex + 1;
        const puzzleComplete = finalIndex >= puzzle.moves.length;

        onPuzzleStateUpdate((prev) => ({
          ...prev,
          phase: puzzleComplete ? 'SUCCESS' : 'WAIT_USER',
          solutionIndex: finalIndex
        }));

        if (puzzleComplete) {
          onPromotionPendingUpdate(null);
        }
      }, 450);
    } else {
      const puzzleComplete = newSolutionIndex >= puzzle.moves.length;

      if (wasTransposition && engineReply) {
        executeEngineMove(engineReply);
      }

      onPuzzleStateUpdate((prev) => ({
        ...prev,
        phase: puzzleComplete ? 'SUCCESS' : 'WAIT_USER',
        solutionIndex: newSolutionIndex
      }));

      if (puzzleComplete) {
        onPromotionPendingUpdate(null);
      }
    }

    return true;
  }

  useEffect(() => {
    initializeEngine();
    return terminate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminate]);

  return {
    isReady,
    evaluatePosition,
    terminate,
    makeEngineMove,
    processUserMove
  };
}

// -----------------------------
// Board/UI action creators
// -----------------------------

export function createOnSquareClick({
  chessBoardState,
  puzzleState,
  userId,
  selectedSquare,
  setSelectedSquare,
  handleUserMove
}: {
  chessBoardState: any;
  puzzleState: any;
  userId: number;
  selectedSquare: number | null;
  setSelectedSquare: (v: number | null) => void;
  handleUserMove: (from: number, to: number) => Promise<boolean>;
}) {
  return async function onSquareClick(clickedSquare: number) {
    if (!chessBoardState || puzzleState.phase !== 'WAIT_USER') return;

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
  setPuzzleResult,
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
  setPuzzleResult: (v: 'solved' | 'failed' | 'gave_up') => void;
  setPuzzleState: (fn: (prev: any) => any) => void;
  executeEngineMove: (moveUci: string) => void;
  animationTimeoutRef: React.RefObject<number | null>;
}) {
  return function resetToOriginalPosition() {
    if (!puzzle || !originalPosition || !chessRef.current) return;

    const { startFen } = normalisePuzzle(puzzle.fen);
    const chess = new Chess(startFen);
    chessRef.current = chess;

    setChessBoardState((prev) => {
      if (!prev || !originalPosition) return prev;
      const resetBoard = originalPosition.board.map((square: any) => {
        if (square.state === 'checkmate' || square.state === 'check') {
          const clearedSquare = { ...square };
          delete clearedSquare.state;
          return clearedSquare;
        }
        return square;
      });
      return {
        ...originalPosition,
        board: resetBoard,
        isCheck: chessRef.current?.isCheck() || false,
        isCheckmate: false
      };
    });
    setSelectedSquare(null);
    setMoveAnalysisHistory([] as any[]);
    setPuzzleResult('solved');

    setPuzzleState((prev: any) => ({
      ...prev,
      phase: 'ANIM_ENGINE',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: prev.attemptsUsed + 1
    }));

    animationTimeoutRef.current = window.setTimeout(() => {
      executeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev: any) => ({
        ...prev,
        phase: 'WAIT_USER',
        solutionIndex: 1
      }));
    }, 450);
  };
}

export function createHandleCastling({
  chessRef,
  chessBoardState,
  puzzleState,
  userId,
  setChessBoardState,
  executeUserMove
}: {
  chessRef: React.RefObject<Chess | null>;
  chessBoardState: any;
  puzzleState: any;
  userId: number;
  setChessBoardState: (fn: (prev: any) => any) => void;
  executeUserMove: (
    move: any,
    fenBeforeMove: string,
    boardUpdateFn: () => void
  ) => Promise<boolean>;
}) {
  return async function handleCastling(direction: 'kingside' | 'queenside') {
    if (
      !chessRef.current ||
      !chessBoardState ||
      puzzleState.phase !== 'WAIT_USER'
    ) {
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

        // Define positions based on color and castling type
        let kingFrom: number, kingTo: number, rookFrom: number, rookTo: number;

        if (isBlack) {
          if (isKingside) {
            kingFrom = 4;
            kingTo = 6;
            rookFrom = 7;
            rookTo = 5; // Black kingside
          } else {
            kingFrom = 4;
            kingTo = 2;
            rookFrom = 0;
            rookTo = 3; // Black queenside
          }
        } else {
          if (isKingside) {
            kingFrom = 60;
            kingTo = 62;
            rookFrom = 63;
            rookTo = 61; // White kingside
          } else {
            kingFrom = 60;
            kingTo = 58;
            rookFrom = 56;
            rookTo = 59; // White queenside
          }
        }

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

        // Clear previous highlighting
        clearArrivedStatesExcept({
          board: newBoard,
          keepIndices: [kingTo, rookTo]
        });

        if (isPositionCheckmate) {
          applyCheckmateHighlighting({
            board: newBoard,
            chessInstance: chessRef.current!
          });
        } else {
          applyInCheckHighlighting({
            board: newBoard,
            chessInstance: chessRef.current!
          });
        }

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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import CastlingOverlay from './CastlingOverlay';
import {
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle,
  viewToBoard,
  clearArrivedStatesExcept,
  updateThreatHighlighting,
  applyInCheckHighlighting,
  resetToStartFen,
  getCastlingIndices,
  isCastlingDebug,
  canCastle as canCastleHelper
} from '../helpers';
import { LichessPuzzle, PuzzleResult, ChessBoardState } from '~/types/chess';
import { useKeyContext, useAppContext } from '~/contexts';

import {
  useChessMove,
  createOnSquareClick,
  createResetToOriginalPosition,
  createHandleCastling,
  createHandleFinishMove,
  createHandleFinishMoveAnalysis
} from './hooks/useChessMove';
import { useChessPuzzle } from './hooks/useChessPuzzle';
import { useAnalysisMode } from './hooks/useAnalysisMode';
import { useAnalysisKeyboardNav } from './hooks/useAnalysisKeyboardNav';
import { useSolutionPlayback } from './hooks/useSolutionPlayback';
import StatusHeader from './StatusHeader';
import ThemeDisplay from './ThemeDisplay';
import RightPanel from './RightPanel';
import ActionButtons from './RightPanel/ActionButtons';
import PromotionPicker from './PromotionPicker';
import AnalysisModal from './AnalysisModal';
import {
  analysisFadeCls,
  containerCls,
  contentAreaCls,
  stickyFooterCls,
  gridCls,
  boardAreaCls
} from './styles';

const breakDuration = 1000;

export default function Puzzle({
  puzzle,
  onPuzzleComplete,
  onMoveToNextPuzzle,
  selectedLevel,
  onLevelChange,
  updatePuzzle,
  levels,
  maxLevelUnlocked,
  levelsLoading,
  refreshLevels,
  needsPromotion,
  cooldownUntilTomorrow,
  currentStreak,
  nextDayTimestamp,
  refreshPromotion
}: {
  puzzle?: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onMoveToNextPuzzle: () => void;
  selectedLevel?: number;
  onLevelChange?: (level: number) => void;
  updatePuzzle: (puzzle: LichessPuzzle) => void;
  levels: number[];
  maxLevelUnlocked: number;
  levelsLoading: boolean;
  refreshLevels: () => Promise<void>;
  needsPromotion: boolean;
  cooldownUntilTomorrow: boolean;
  currentStreak: number;
  nextDayTimestamp: number | null;
  refreshPromotion: () => Promise<void>;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const submitTimeAttackAttempt = useAppContext(
    (v) => v.requestHelpers.submitTimeAttackAttempt
  );
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );

  // finish handlers provided by hooks

  const { makeEngineMove, processUserMove, evaluatePosition } = useChessMove();
  const {
    inTimeAttack,
    setInTimeAttack,
    timeLeft,
    setTimeLeft,
    runResult,
    setRunResult,
    startingPromotion,
    promoSolved,
    setPromoSolved,
    runIdRef,
    selectedSquare,
    setSelectedSquare,
    puzzleState,
    setPuzzleState,
    handlePromotionClick,
    refreshStats
  } = useChessPuzzle();

  const [timeTrialCompleted, setTimeTrialCompleted] = useState(false);
  const [dailyStats, setDailyStats] = useState<{
    puzzlesSolved: number;
    xpEarnedToday: number;
  } | null>(null);
  const [chessBoardState, setChessBoardState] =
    useState<ChessBoardState | null>(null);
  const [originalPosition, setOriginalPosition] = useState<any>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: number;
    to: number;
    fromAlgebraic: string;
    toAlgebraic: string;
    fenBeforeMove: string;
  } | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [moveAnalysisHistory, setMoveAnalysisHistory] = useState<
    {
      userMove: string;
      expectedMove?: string;
      engineSuggestion?: string;
      evaluation?: number;
      mate?: number;
      isCorrect: boolean;
      timestamp: number;
    }[]
  >([]);
  const [puzzleResult, setPuzzleResult] = useState<
    'solved' | 'failed' | 'gave_up' | undefined
  >(undefined);
  const chessRef = useRef<Chess | null>(null);
  const {
    fenHistory,
    analysisIndex,
    initStartFen,
    appendCurrentFen,
    prev: analysisPrev,
    next: analysisNext,
    enterFromFinal,
    enterFromPly,
    requestEngineReply
  } = useAnalysisMode({
    chessRef,
    userId,
    setChessBoardState,
    evaluatePosition
  });
  const startTimeRef = useRef<number>(Date.now());
  const animationTimeoutRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const solutionPlayingRef = useRef(false);
  const puzzleIdRef = useRef<string | undefined>(puzzle?.id);

  const {
    replaySolution: hookReplaySolution,
    showCompleteSolution: hookShowCompleteSolution
  } = useSolutionPlayback({
    puzzle,
    chessRef,
    executeEngineMove: executeEngineMove,
    solutionPlayingRef,
    resetBoardForSolution
  });

  useEffect(() => {
    puzzleIdRef.current = puzzle?.id;
  }, [puzzle?.id]);

  const enterInteractiveAnalysis = useCallback(
    ({ from }: { from: 'final' | number }) => {
      if (!puzzle) return;
      solutionPlayingRef.current = false;
      if (from === 'final') {
        enterFromFinal();
      } else {
        enterFromPly({ plyIndex: from });
      }
      setPuzzleState((p) => ({ ...p, phase: 'ANALYSIS' as any }));
    },
    [enterFromFinal, enterFromPly, puzzle, setPuzzleState]
  );

  const [autoRetryOnFail, setAutoRetryOnFail] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('tw-chess-auto-retry');
      if (v === null) return true; // default ON
      return v === '1' || v === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tw-chess-auto-retry', autoRetryOnFail ? '1' : '0');
    } catch {}
  }, [autoRetryOnFail]);

  useAnalysisKeyboardNav({
    phase: (puzzleState as any).phase,
    analysisPrev,
    analysisNext,
    enterFromPly,
    enterFromFinal
  });

  async function executeUserMove(
    move: any,
    fenBeforeMove: string,
    boardUpdateFn: () => void
  ): Promise<boolean> {
    return await processUserMove({
      move,
      fenBeforeMove,
      boardUpdateFn,
      puzzle,
      puzzleState,
      aliveRef,
      inTimeAttack,
      onClearSelection: () => setSelectedSquare(null),
      autoRetryOnFail: autoRetryOnFail || inTimeAttack,
      runIdRef,
      animationTimeoutRef,
      breakDuration,
      onMoveAnalysisUpdate: (entry) => {
        setMoveAnalysisHistory((prev) => [...prev, entry]);
      },
      onPuzzleResultUpdate: setPuzzleResult,
      onPuzzleStateUpdate: setPuzzleState,
      onPromotionPendingUpdate: setPromotionPending,
      onRunResultUpdate: setRunResult,
      onTimeTrialCompletedUpdate: setTimeTrialCompleted,
      onPromoSolvedUpdate: setPromoSolved,
      onDailyStatsUpdate: setDailyStats,
      onPuzzleComplete,
      resetToOriginalPosition,
      submitTimeAttackAttempt,
      refreshLevels,
      refreshPromotion: refreshStats,
      updatePuzzle,
      loadChessDailyStats,
      executeEngineMove,
      puzzleIdRef
    });
  }

  const handleFinishMove = createHandleFinishMove({
    chessRef,
    puzzle,
    chessBoardState,
    userId,
    setChessBoardState,
    executeUserMove
  });

  const handleFinishMoveAnalysis = createHandleFinishMoveAnalysis({
    chessRef,
    chessBoardState,
    userId,
    setChessBoardState,
    requestEngineReply,
    executeEngineMove
  });

  const handleUserMove = useCallback(
    async (from: number, to: number) => {
      if (
        !chessRef.current ||
        !puzzle ||
        (puzzleState.phase !== 'WAIT_USER' &&
          (puzzleState as any).phase !== 'ANALYSIS')
      ) {
        return false;
      }

      const isBlack = chessBoardState?.playerColors[userId] === 'black';

      const fromAlgebraic = indexToAlgebraic(viewToBoard(from, isBlack));
      const toAlgebraic = indexToAlgebraic(viewToBoard(to, isBlack));

      const fenBeforeMove = chessRef.current.fen();

      const isPawnPromotion = (() => {
        const absFrom = viewToBoard(from, isBlack);
        const absTo = viewToBoard(to, isBlack);

        const piece = chessBoardState?.board[absFrom];
        const playerColor = piece?.color;
        const targetRank = playerColor === 'white' ? 0 : 7;
        const targetRankStart = targetRank * 8;
        const targetRankEnd = targetRankStart + 7;

        return (
          piece?.type === 'pawn' &&
          piece?.color === chessBoardState?.playerColors[userId] &&
          absTo >= targetRankStart &&
          absTo <= targetRankEnd
        );
      })();

      if (isPawnPromotion) {
        setPromotionPending({
          from,
          to,
          fromAlgebraic,
          toAlgebraic,
          fenBeforeMove
        });
        setSelectedSquare(null);
        return true;
      }

      {
        const absFrom = viewToBoard(from, isBlack);
        const absTo = viewToBoard(to, isBlack);
        const piece = chessBoardState?.board[absFrom];
        if (piece?.type === 'king') {
          const fromRow = Math.floor(absFrom / 8);
          const fromCol = absFrom % 8;
          const toRow = Math.floor(absTo / 8);
          const toCol = absTo % 8;
          const dx = Math.abs(toCol - fromCol);
          const dy = Math.abs(toRow - fromRow);
          if (dx > 1 || dy > 1) {
            return false;
          }
        }
      }

      if ((puzzleState as any).phase === 'ANALYSIS') {
        return await handleFinishMoveAnalysis({
          from,
          to,
          fromAlgebraic,
          toAlgebraic,
          fenBeforeMove
        });
      }

      const result = await handleFinishMove({
        from,
        to,
        fromAlgebraic,
        toAlgebraic,
        fenBeforeMove
      });
      if (isCastlingDebug()) {
        // debug removed
      }
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState, autoRetryOnFail, inTimeAttack]
  );

  useEffect(() => {
    if (!puzzle || !userId) return;

    const { startFen, playerColor } = normalisePuzzle(puzzle.fen);

    const initialState = fenToBoardState({
      fen: startFen,
      userId,
      playerColor: playerColor as 'white' | 'black'
    });
    const chess = new Chess(startFen);

    chessRef.current = chess;
    setChessBoardState(initialState);
    setOriginalPosition(initialState);
    initStartFen({ startFen });
    startTimeRef.current = Date.now();

    setPuzzleState({
      phase: 'ANIM_ENGINE',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: 0,
      showingHint: false
    });

    setMoveAnalysisHistory([]);

    setChessBoardState((prev) => {
      if (!prev || !chessRef.current) return prev;
      const newBoard = [...prev.board];
      applyInCheckHighlighting({
        board: newBoard,
        chessInstance: chessRef.current
      });
      return { ...prev, board: newBoard, isCheck: chessRef.current.isCheck() };
    });

    kickOffFirstEngineMove({ phaseAfter: 'WAIT_USER' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, userId]);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    solutionPlayingRef.current = false;
  }, [puzzle?.id]);

  useEffect(() => {
    if (!userId) return;

    fetchDailyStats();

    async function fetchDailyStats() {
      try {
        const stats = await loadChessDailyStats();
        setDailyStats(stats);
      } catch (error) {
        console.error('Failed to load chess daily stats:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!inTimeAttack || timeLeft === null || runResult !== 'PLAYING') return;

    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, timeLeft, runResult]);

  useEffect(() => {
    if (runResult !== 'PLAYING') {
      setTimeLeft(null);
    }
  }, [runResult, setTimeLeft]);

  useEffect(() => {
    if (inTimeAttack && puzzle) {
      setTimeLeft(30);
    } else if (!inTimeAttack) {
      setTimeLeft(null);
      setPromoSolved(0);
      setRunResult('PLAYING');
      setTimeTrialCompleted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, puzzle?.id]);

  const isReady = !!(puzzle && chessBoardState);
  const emptySquares = React.useMemo(() => {
    return Array.from({ length: 64 }, () => ({} as any));
  }, []);

  function canCastle({ side }: { side: 'kingside' | 'queenside' }) {
    return canCastleHelper({
      chessInstance: chessRef.current,
      chessBoardState,
      userId,
      side
    });
  }

  const onSquareClick = createOnSquareClick({
    chessBoardState,
    puzzleState,
    userId,
    selectedSquare,
    setSelectedSquare,
    handleUserMove
  });

  const resetToOriginalPosition = createResetToOriginalPosition({
    puzzle,
    originalPosition,
    chessRef,
    setChessBoardState,
    setSelectedSquare,
    setMoveAnalysisHistory,
    setPuzzleState,
    executeEngineMove,
    animationTimeoutRef
  });

  const handleCastling = createHandleCastling({
    chessRef,
    chessBoardState,
    puzzleState,
    userId,
    setChessBoardState,
    executeUserMove
  });

  return (
    <div className={containerCls}>
      <div className={contentAreaCls}>
        <StatusHeader
          phase={(puzzleState as any).phase}
          inTimeAttack={inTimeAttack}
          timeLeft={timeLeft}
          showNav={(puzzleState as any).phase === 'ANALYSIS'}
          canPrev={analysisIndex > 0}
          canNext={analysisIndex < fenHistory.length - 1}
          onPrev={analysisPrev}
          onNext={analysisNext}
        />

        <ThemeDisplay themes={puzzle?.themes || []} />

        <div className={gridCls}>
          <div className={boardAreaCls}>
            {isReady ? (
              <ChessBoard
                className={
                  (puzzleState as any).phase === 'ANALYSIS'
                    ? analysisFadeCls
                    : ''
                }
                squares={chessBoardState!.board as any[]}
                playerColor={chessBoardState!.playerColors[userId] || 'white'}
                interactable={
                  puzzleState.phase === 'WAIT_USER' ||
                  (puzzleState as any).phase === 'ANALYSIS'
                }
                onSquareClick={onSquareClick}
                showSpoiler={false}
                onSpoilerClick={() => {}}
                enPassantTarget={chessBoardState!.enPassantTarget || undefined}
                selectedSquare={selectedSquare}
                game={chessRef.current || undefined}
                overlay={(() => {
                  const overlayInteractable =
                    puzzleState.phase === 'WAIT_USER' ||
                    (puzzleState as any).phase === 'ANALYSIS';
                  const playerColor =
                    chessBoardState!.playerColors[userId] || 'white';
                  const canKingside = canCastle({ side: 'kingside' });
                  const canQueenside = canCastle({ side: 'queenside' });

                  const onCastlingClick = async (
                    dir: 'kingside' | 'queenside'
                  ) => {
                    if ((puzzleState as any)?.phase === 'ANALYSIS') {
                      try {
                        const castlingSan =
                          dir === 'kingside' ? 'O-O' : 'O-O-O';

                        const moved = chessRef.current?.move(castlingSan);
                        if (!moved) return;

                        const isBlack = playerColor === 'black';
                        const isKingside = dir === 'kingside';
                        const { kingFrom, kingTo, rookFrom, rookTo } =
                          getCastlingIndices({ isBlack, isKingside });

                        setChessBoardState((prev) => {
                          if (!prev) return prev;
                          const newBoard = [...prev.board];
                          // Move king
                          const kingPiece = { ...newBoard[kingFrom] } as any;
                          kingPiece.state = 'arrived';
                          newBoard[kingTo] = kingPiece;
                          newBoard[kingFrom] = {} as any;
                          // Move rook
                          const rookPiece = { ...newBoard[rookFrom] } as any;
                          rookPiece.state = 'arrived';
                          newBoard[rookTo] = rookPiece;
                          newBoard[rookFrom] = {} as any;

                          clearArrivedStatesExcept({
                            board: newBoard,
                            keepIndices: [kingTo, rookTo]
                          });

                          updateThreatHighlighting({
                            board: newBoard,
                            chessInstance: chessRef.current!
                          });

                          return {
                            ...prev,
                            board: newBoard,
                            isCheck: chessRef.current?.isCheck() || false,
                            isCheckmate:
                              chessRef.current?.isCheckmate() || false
                          } as any;
                        });

                        await requestEngineReply({ executeEngineMove });
                        return;
                      } catch {}
                    }
                    await handleCastling(dir);
                  };
                  const preClick = (_dir: 'kingside' | 'queenside') => {};
                  return (
                    <CastlingOverlay
                      interactable={overlayInteractable}
                      playerColor={playerColor}
                      onCastling={onCastlingClick}
                      canKingside={canKingside}
                      canQueenside={canQueenside}
                      onPreClick={preClick}
                    />
                  );
                })()}
              />
            ) : (
              <ChessBoard
                className={
                  (puzzleState as any).phase === 'ANALYSIS'
                    ? analysisFadeCls
                    : ''
                }
                squares={emptySquares as any[]}
                playerColor={'white'}
                interactable={false}
                onSquareClick={() => {}}
                showSpoiler={false}
                onSpoilerClick={() => {}}
                enPassantTarget={undefined}
                selectedSquare={null}
                game={undefined}
              />
            )}
          </div>

          <RightPanel
            levels={levels}
            maxLevelUnlocked={maxLevelUnlocked}
            levelsLoading={levelsLoading}
            currentLevel={selectedLevel || 1}
            onLevelChange={onLevelChange}
            needsPromotion={needsPromotion}
            cooldownUntilTomorrow={cooldownUntilTomorrow}
            currentStreak={currentStreak}
            nextDayTimestamp={nextDayTimestamp}
            startingPromotion={startingPromotion}
            onPromotionClick={async () => {
              const newPuzzle = await handlePromotionClick();
              if (newPuzzle) {
                updatePuzzle(newPuzzle);
              }
            }}
            onRefreshPromotion={refreshPromotion}
            dailyStats={dailyStats}
            inTimeAttack={inTimeAttack}
            runResult={runResult}
            promoSolved={promoSolved}
          />
        </div>
      </div>

      <div className={stickyFooterCls}>
        <ActionButtons
          inTimeAttack={inTimeAttack}
          runResult={runResult}
          timeTrialCompleted={!!timeTrialCompleted}
          maxLevelUnlocked={maxLevelUnlocked}
          puzzleState={puzzleState}
          puzzleResult={puzzleResult}
          autoRetryOnFail={autoRetryOnFail || inTimeAttack}
          onNewPuzzleClick={onMoveToNextPuzzle}
          onResetPosition={resetToOriginalPosition}
          onCelebrationComplete={handleCelebrationComplete}
          onGiveUp={handleGiveUpWithSolution}
          onLevelChange={onLevelChange}
          levelsLoading={levelsLoading}
          onReplaySolution={replaySolution}
          onShowAnalysis={() => setShowAnalysisModal(true)}
          onEnterInteractiveAnalysis={() =>
            enterInteractiveAnalysis({ from: 'final' })
          }
          onToggleAutoRetry={setAutoRetryOnFail}
        />
      </div>

      {promotionPending && (
        <PromotionPicker
          color={chessBoardState?.playerColors[userId] || 'white'}
          onSelect={async (piece) => {
            const { fenBeforeMove } = promotionPending;
            const isAnalysis = (puzzleState as any).phase === 'ANALYSIS';
            const finish = isAnalysis
              ? handleFinishMoveAnalysis
              : handleFinishMove;
            const success = await finish({
              from: promotionPending.from,
              to: promotionPending.to,
              fromAlgebraic: promotionPending.fromAlgebraic,
              toAlgebraic: promotionPending.toAlgebraic,
              fenBeforeMove,
              promotion: piece
            });
            if (success) {
              setPromotionPending(null);
            }
          }}
          onCancel={() => setPromotionPending(null)}
        />
      )}

      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        moveHistory={moveAnalysisHistory}
        puzzleResult={puzzleResult}
        canExplore={!inTimeAttack}
        onExploreFinal={() => {
          enterInteractiveAnalysis({ from: 'final' });
          setShowAnalysisModal(false);
        }}
        onExploreFrom={(plyIndex) => {
          enterInteractiveAnalysis({ from: plyIndex });
          setShowAnalysisModal(false);
        }}
      />
    </div>
  );

  function kickOffFirstEngineMove(options?: { phaseAfter?: any }) {
    if (!puzzle) return;
    const phaseAfter = options?.phaseAfter ?? 'WAIT_USER';
    animationTimeoutRef.current = window.setTimeout(() => {
      executeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev) => ({
        ...prev,
        phase: phaseAfter,
        solutionIndex: 1
      }));
    }, 450);
  }

  function resetBoardForSolution() {
    if (!puzzle || !originalPosition) return;
    resetToStartFen({
      puzzle,
      originalPosition,
      chessRef,
      setChessBoardState,
      setSelectedSquare
    });

    setPuzzleState((prev) => ({
      ...prev,
      solutionIndex: 0,
      moveHistory: []
    }));

    kickOffFirstEngineMove({ phaseAfter: 'SOLUTION' });
  }

  function executeEngineMove(moveUci: string) {
    if (!chessRef.current) return;

    makeEngineMove({
      chessInstance: chessRef.current,
      moveUci,
      solutionPlayingRef,
      onMoveAnalysisUpdate: (entry) => {
        setMoveAnalysisHistory((prev) => [...prev, entry]);
      },
      onBoardStateUpdate: (updateFn) => {
        setChessBoardState((prev) => updateFn(prev));
        appendCurrentFen();
      }
    });
  }

  function replaySolution() {
    if (!puzzle) return;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    hookReplaySolution();
  }

  function handleGiveUpWithSolution() {
    if (!puzzle) return;

    setPuzzleResult('gave_up');
    hookShowCompleteSolution();

    setPuzzleState((prev) => ({ ...prev, phase: 'SOLUTION' }));

    // Treat give up as a failed attempt (reset streak like fail)
    try {
      onPuzzleComplete({
        solved: false,
        attemptsUsed: (puzzleState?.attemptsUsed || 0) + 1
      });
    } catch {}
  }

  async function handleTimeUp() {
    if (
      puzzleState.phase === 'SUCCESS' ||
      puzzleState.phase === 'FAIL' ||
      puzzleState.phase === 'SOLUTION'
    ) {
      return;
    }

    hookShowCompleteSolution();

    setPuzzleState((prev) => ({ ...prev, phase: 'SOLUTION' }));

    try {
      const promoResp = await submitTimeAttackAttempt({
        runId: runIdRef.current,
        solved: false
      });

      if (promoResp.finished) {
        setRunResult('FAIL');
        await Promise.all([refreshLevels(), refreshPromotion()]);
      }
    } catch (error) {
      console.error('Error submitting time up result:', error);
    }
  }

  function handleCelebrationComplete() {
    // Reset time-attack state fully so the next puzzle is normal mode
    setRunResult('PLAYING');
    setTimeTrialCompleted(false);
    setPromoSolved(0);
    setInTimeAttack(false);
    setTimeLeft(null);
  }
}

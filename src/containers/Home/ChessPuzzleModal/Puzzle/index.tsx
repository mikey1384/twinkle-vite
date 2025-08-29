import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, type Square } from 'chess.js';
import PuzzleBoard from './PuzzleBoard';
import {
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle,
  viewToBoard,
  applyInCheckHighlighting,
  resetToStartFen
} from '../helpers';
import {
  LichessPuzzle,
  PuzzleResult,
  ChessBoardState,
  PuzzlePhase
} from '~/types/chess';
import { useKeyContext, useAppContext, useChessContext } from '~/contexts';
import { TIME_ATTACK_DURATION } from '../constants';

import {
  useChessMove,
  createOnSquareClick,
  createResetToOriginalPosition,
  createHandleCastling,
  createHandleFinishMove,
  createHandleFinishMoveAnalysis
} from './hooks/useChessMove';

import { useAnalysisMode } from './hooks/useAnalysisMode';
import { useAnalysisKeyboardNav } from './hooks/useAnalysisKeyboardNav';
import { useSolutionPlayback } from './hooks/useSolutionPlayback';
import StatusHeader from './StatusHeader';
import ThemeDisplay from './ThemeDisplay';
import RightPanel from './RightPanel';
import ActionButtons from './ActionButtons';
import PromotionPicker from './PromotionPicker';
import AnalysisModal from './AnalysisModal';
import {
  containerCls,
  contentAreaCls,
  stickyFooterCls,
  gridCls,
  boardAreaCls
} from './styles';

const breakDuration = 1000;

export default function Puzzle({
  attemptId,
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
  onRefreshStats,

  inTimeAttack,
  onSetInTimeAttack,
  timeLeft,
  onSetTimeLeft,
  runResult,
  setRunResult,
  runIdRef,
  isActive = true
}: {
  attemptId: number | null;
  puzzle?: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onMoveToNextPuzzle: () => void;
  selectedLevel?: number;
  onLevelChange: (level: number) => void;
  updatePuzzle: (puzzle: LichessPuzzle) => void;
  levels: number[];
  maxLevelUnlocked: number;
  levelsLoading: boolean;
  refreshLevels: () => Promise<void>;
  onRefreshStats: () => Promise<void>;

  inTimeAttack: boolean;
  onSetInTimeAttack: (v: boolean) => void;
  timeLeft: number;
  onSetTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING';
  setRunResult: React.Dispatch<
    React.SetStateAction<'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING'>
  >;
  runIdRef: React.RefObject<number | null>;
  isActive?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const chessStats = useChessContext((v) => v.state.stats as any);
  const startTimeAttackPromotion = useAppContext(
    (v) => v.requestHelpers.startTimeAttackPromotion
  );
  const submitTimeAttackAttemptApi = useAppContext(
    (v) => v.requestHelpers.submitTimeAttackAttempt
  );
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );

  const [startingPromotion, setStartingPromotion] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [puzzleState, setPuzzleState] = useState({
    solutionIndex: 0,
    moveHistory: [] as any[],
    attemptsUsed: 0,
    showingHint: false
  });
  const [phase, setPhase] = useState<PuzzlePhase>('WAIT_USER');
  const { makeEngineMove, processUserMove, evaluatePosition } = useChessMove({
    attemptId,
    onSetTimeLeft: onSetTimeLeft,
    onSetPhase: setPhase
  });

  const [timeTrialCompleted, setTimeTrialCompleted] = useState(false);
  const [promoSolved, setPromoSolved] = useState(0);
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
  const previousPhaseRef = useRef<PuzzlePhase | null>(null);
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
  const timeTrialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const solutionPlayingRef = useRef(false);

  // Derived stats-based UI flags
  const needsPromotion = Boolean(
    chessStats?.promotionUnlocked && !chessStats?.cooldownUntilTomorrow
  );
  const cooldownUntilTomorrow = Boolean(chessStats?.cooldownUntilTomorrow);
  const currentStreak = Number(chessStats?.currentLevelStreak || 0);
  const nextDayTimestamp = (chessStats?.nextDayTimestamp as number) || null;

  const { showCompleteSolution: hookShowCompleteSolution } =
    useSolutionPlayback({
      puzzle,
      chessRef,
      executeEngineMove: executeEngineMove,
      solutionPlayingRef,
      resetBoardForSolution
    });

  useAnalysisKeyboardNav({
    phase,
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
      inTimeAttack,
      onClearSelection: () => setSelectedSquare(null),
      autoRetryOnFail: inTimeAttack,
      runIdRef,
      animationTimeoutRef,
      breakDuration,
      onClearTimer: () => {
        if (timeTrialTimerRef.current) {
          clearTimeout(timeTrialTimerRef.current);
          timeTrialTimerRef.current = null;
        }
      },
      onMoveAnalysisUpdate: (entry) => {
        setMoveAnalysisHistory((prev) => [...prev, entry]);
      },
      onPuzzleResultUpdate: setPuzzleResult,
      onPuzzleStateUpdate: setPuzzleState,
      onPromotionPendingUpdate: setPromotionPending,
      onRunResultUpdate: setRunResult,
      onTimeTrialCompletedUpdate: setTimeTrialCompleted,
      onDailyStatsUpdate: setDailyStats,
      onPuzzleComplete,
      resetToOriginalPosition,
      submitTimeAttackAttempt,
      refreshLevels,
      onRefreshStats,
      updatePuzzle,
      loadChessDailyStats,
      executeEngineMove,
      appendCurrentFen
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

  useEffect(() => {
    if (phase !== 'ANIM_ENGINE') {
      previousPhaseRef.current = phase;
    }
  }, [phase]);

  const handleUserMove = useCallback(
    async (from: number, to: number) => {
      if (
        !chessRef.current ||
        !puzzle ||
        (phase !== 'WAIT_USER' && phase !== 'ANALYSIS')
      ) {
        return false;
      }

      const isBlack = chessBoardState?.playerColors[userId] === 'black';

      const fromAlgebraic = indexToAlgebraic(viewToBoard(from, isBlack));
      const toAlgebraic = indexToAlgebraic(viewToBoard(to, isBlack));

      const fenBeforeMove = chessRef.current.fen();

      let needsPromotion = false;
      try {
        const legal = chessRef.current!.moves({
          square: fromAlgebraic as Square,
          verbose: true
        }) as any[];
        needsPromotion = !!legal.find(
          (m: any) => m.to === toAlgebraic && m.promotion
        );
      } catch {}

      if (needsPromotion) {
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

      if (phase === 'ANALYSIS') {
        const success = await handleFinishMoveAnalysis({
          from,
          to,
          fromAlgebraic,
          toAlgebraic,
          fenBeforeMove
        });
        if (success) {
          try {
            appendCurrentFen();
          } catch {}
        }
        return success;
      }

      const result = await handleFinishMove({
        from,
        to,
        fromAlgebraic,
        toAlgebraic,
        fenBeforeMove
      });
      if (result) {
        try {
          appendCurrentFen();
        } catch {}
      }
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState, inTimeAttack, phase]
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

    setPhase('ANIM_ENGINE');
    setPuzzleState({
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
    if (!isActive) return;
    if (phase === 'ANIM_ENGINE' && puzzle && !animationTimeoutRef.current) {
      try {
        const nextIndex = Math.max(0, puzzleState?.solutionIndex || 0);
        const moveUci = puzzle.moves[nextIndex] || puzzle.moves[0];
        if (moveUci) {
          executeEngineMove(moveUci);
          if (previousPhaseRef.current !== 'ANALYSIS') {
            setPhase('WAIT_USER');
          }
          setPuzzleState((prev) => ({
            ...prev,
            solutionIndex: Math.max(prev.solutionIndex || 0, 1)
          }));
        }
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!inTimeAttack || runResult !== 'PLAYING') return;

    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    timeTrialTimerRef.current = setTimeout(() => {
      onSetTimeLeft((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timeTrialTimerRef.current) {
        clearTimeout(timeTrialTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, timeLeft, runResult]);

  useEffect(() => {
    setRunResult('PLAYING');
    onSetTimeLeft(TIME_ATTACK_DURATION);
    if (!inTimeAttack) {
      setTimeTrialCompleted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, puzzle?.id]);

  const isReady = !!(puzzle && chessBoardState);

  const promoColor = chessBoardState?.playerColors[userId] ?? 'white';

  const onSquareClick = createOnSquareClick({
    chessBoardState,
    phase,
    inTimeAttack,
    runResult,
    timeLeft,
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
    userId,
    setChessBoardState,
    executeUserMove,
    inTimeAttack,
    runResult,
    timeLeft
  });

  return (
    <div className={containerCls}>
      <div className={contentAreaCls}>
        <StatusHeader
          phase={phase}
          inTimeAttack={inTimeAttack}
          timeLeft={timeLeft ?? 0}
          showNav={phase === 'ANALYSIS'}
          canPrev={analysisIndex > 0}
          canNext={analysisIndex < fenHistory.length - 1}
          onPrev={analysisPrev}
          onNext={analysisNext}
        />

        <ThemeDisplay themes={puzzle?.themes || []} />

        <div className={gridCls}>
          <div className={boardAreaCls}>
            <PuzzleBoard
              isReady={isReady}
              chessBoardState={chessBoardState}
              userId={userId}
              phase={phase}
              puzzleState={puzzleState}
              selectedSquare={selectedSquare}
              onSquareClick={onSquareClick}
              chessRef={chessRef}
              setChessBoardState={setChessBoardState}
              executeEngineMove={executeEngineMove}
              requestEngineReply={requestEngineReply}
              appendCurrentFen={appendCurrentFen}
              handleCastling={handleCastling}
              currentLevel={selectedLevel || 1}
            />
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
            onUnlockPromotion={handleUnlockPromotion}
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
          phase={phase}
          onNewPuzzleClick={onMoveToNextPuzzle}
          onResetPosition={() => {
            if (phase === 'SOLUTION') {
              setPhase('ANALYSIS');
            }
            resetToOriginalPosition();
          }}
          onGiveUp={handleGiveUpWithSolution}
          onLevelChange={onLevelChange}
          levelsLoading={levelsLoading}
          onShowSolution={handleShowSolution}
          onEnterInteractiveAnalysis={() =>
            handleEnterInteractiveAnalysis({ from: 'final' })
          }
          onSetInTimeAttack={onSetInTimeAttack}
        />
      </div>

      {promotionPending && (
        <PromotionPicker
          color={promoColor}
          onSelect={async (piece) => {
            const { fenBeforeMove } = promotionPending;
            const isAnalysis = phase === 'ANALYSIS';
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
              try {
                appendCurrentFen();
              } catch {}
            }
            setPromotionPending(null);
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
          handleEnterInteractiveAnalysis({ from: 'final' });
          setShowAnalysisModal(false);
        }}
        onExploreFrom={(plyIndex) => {
          handleEnterInteractiveAnalysis({ from: plyIndex });
          setShowAnalysisModal(false);
        }}
      />
    </div>
  );

  async function handlePromotionClick(): Promise<LichessPuzzle | undefined> {
    try {
      setStartingPromotion(true);
      const { puzzle: promoPuzzle, runId } = await startTimeAttackPromotion();
      runIdRef.current = runId;
      onSetInTimeAttack(true);
      onSetTimeLeft(TIME_ATTACK_DURATION);
      setRunResult('PLAYING');
      setPromoSolved(0);

      updatePuzzle(promoPuzzle);
      setSelectedSquare(null);
      setPuzzleState({
        solutionIndex: 0,
        moveHistory: [],
        attemptsUsed: 0,
        showingHint: false
      });

      await refreshLevels();
      return promoPuzzle;
    } catch (err: any) {
      console.error('❌ failed starting time‑attack:', err);

      if (err?.status === 403 || err?.response?.status === 403) {
        await onRefreshStats();
      }
      return undefined;
    } finally {
      setStartingPromotion(false);
    }
  }

  function handleEnterInteractiveAnalysis({
    from
  }: {
    from: 'final' | number;
  }) {
    if (!puzzle) return;
    solutionPlayingRef.current = false;
    if (from === 'final') {
      enterFromFinal();
    } else {
      enterFromPly({ plyIndex: from });
    }
    setPhase('ANALYSIS');
  }

  function kickOffFirstEngineMove(options?: { phaseAfter?: any }) {
    if (!puzzle) return;
    const phaseAfter = options?.phaseAfter ?? 'WAIT_USER';
    animationTimeoutRef.current = setTimeout(() => {
      executeEngineMove(puzzle.moves[0]);
      setPhase(phaseAfter);
      setPuzzleState((prev) => ({
        ...prev,
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
        setSelectedSquare(null);
        appendCurrentFen();
        if (
          !solutionPlayingRef.current &&
          previousPhaseRef.current &&
          previousPhaseRef.current !== 'ANALYSIS' &&
          previousPhaseRef.current !== 'FAIL'
        ) {
          setPhase('WAIT_USER');
        }
      }
    });
  }

  function handleGiveUpWithSolution() {
    if (!puzzle) return;
    setRunResult('FAIL');
    handleShowSolution();
    try {
      onPuzzleComplete({
        solved: false,
        attemptsUsed: (puzzleState?.attemptsUsed || 0) + 1
      });
    } catch {}
  }

  function handleShowSolution() {
    if (!puzzle) return;
    setPhase('SOLUTION');
    hookShowCompleteSolution();
  }

  async function handleTimeUp() {
    setPhase('SOLUTION');
    if (timeTrialTimerRef.current) {
      clearTimeout(timeTrialTimerRef.current);
    }
    try {
      await submitTimeAttackAttempt({
        runId: runIdRef.current,
        solved: false
      });
      setRunResult('FAIL');
      hookShowCompleteSolution();
      try {
        await Promise.all([onRefreshStats(), refreshLevels()]);
      } catch {}
    } catch (error) {
      console.error('Error submitting time up result:', error);
    }
  }

  async function submitTimeAttackAttempt({
    runId,
    solved
  }: {
    runId: number | null;
    solved: boolean;
  }) {
    if (runId == null) return {} as any;
    const resp = await submitTimeAttackAttemptApi({
      runId,
      solved
    } as any);
    if (resp && resp.nextPuzzle) {
      setPromoSolved((prev) => prev + 1);
    }
    return resp;
  }

  async function handleUnlockPromotion() {
    try {
      await onRefreshStats();
    } catch {}
  }
}

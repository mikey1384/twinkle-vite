import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, type Square } from 'chess.js';
import PuzzleBoard from './Board';
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
  PuzzlePhase,
  TimeAttackActiveStartResponse,
  TimeAttackFinishedStartResponse,
  TimeAttackStartResponse,
  TimeAttackTimerResponse
} from '~/types/chess';
import { useKeyContext, useAppContext, useChessContext } from '~/contexts';
import { TIME_ATTACK_DURATION } from '../constants';

import {
  useChessMove,
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
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

const breakDuration = 1000;
const PROMOTION_TIMER_RETRY_BASE_DELAY_MS = 750;
const PROMOTION_TIMER_RETRY_MAX_DELAY_MS = 10_000;

interface PendingPromotionTimerCommand {
  runId: number;
  puzzleId: number;
  moveIndex: number;
  commandId: string;
  expectedDeadlineAt: number;
  outcome: 'correct' | 'wrong';
}

export default function Puzzle({
  phase,
  onSetPhase,
  attemptId,
  puzzle,
  onPuzzleComplete,
  onMoveToNextPuzzle,
  selectedLevel,
  onLevelChange,
  onStartLevel,
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
  onSetRunResult,
  runIdRef
}: {
  phase: PuzzlePhase;
  onSetPhase: (phase: PuzzlePhase) => void;
  attemptId: number | null;
  puzzle?: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onMoveToNextPuzzle: () => void;
  selectedLevel?: number;
  onLevelChange: (level: number) => void;
  onStartLevel: (level: number) => void;
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
  onSetRunResult: React.Dispatch<
    React.SetStateAction<'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING'>
  >;
  runIdRef: React.RefObject<number | null>;
}) {
  const inTimeAttackStill = useRef(inTimeAttack);
  const userId = useKeyContext((v) => v.myState.userId);
  const promotionUnlocked = useChessContext(
    (v) => v.state.stats?.promotionUnlocked
  );
  const promotionCooldownUntilTomorrow = useChessContext(
    (v) => v.state.stats?.cooldownUntilTomorrow
  );
  const promotionCurrentStreak = useChessContext(
    (v) => v.state.stats?.currentLevelStreak
  );
  const promotionNextDayTimestamp = useChessContext(
    (v) => v.state.stats?.nextDayTimestamp
  );
  const startTimeAttackPromotion = useAppContext(
    (v) => v.requestHelpers.startTimeAttackPromotion
  );
  const submitTimeAttackAttemptApi = useAppContext(
    (v) => v.requestHelpers.submitTimeAttackAttempt
  );
  const adjustTimeAttackTimer = useAppContext(
    (v) => v.requestHelpers.adjustTimeAttackTimer
  );
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [startingPromotion, setStartingPromotion] = useState(false);
  const [promotionStartError, setPromotionStartError] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [puzzleState, setPuzzleState] = useState({
    solutionIndex: 0,
    moveHistory: [] as any[],
    showingHint: false
  });
  const boardEpochRef = useRef(0);
  const { makeEngineMove, processUserMove, evaluatePosition } = useChessMove({
    attemptId,
    onSetPhase,
    phase,
    boardEpochRef
  });

  const [timeTrialCompleted, setTimeTrialCompleted] = useState(false);
  const timeIsAlreadyUpRef = useRef(false);
  // deadlineRef is the server compare-and-set token. endsAtRef is the local
  // display clock, anchored to monotonic time from server-provided remaining
  // duration so device wall-clock skew cannot extend or consume a trial.
  const timeAttackDeadlineRef = useRef<number | null>(null);
  const timeAttackEndsAtRef = useRef<number | null>(null);
  const processingMoveRef = useRef(false);
  const pendingPromotionTimerCommandRef =
    useRef<PendingPromotionTimerCommand | null>(null);
  const promotionTimerCommandGenerationRef = useRef(0);
  const [promotionTimerPending, setPromotionTimerPending] = useState(false);
  const startingPromotionRef = useRef(false);
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

  const needsPromotion = Boolean(
    promotionUnlocked && !promotionCooldownUntilTomorrow
  );
  const cooldownUntilTomorrow = Boolean(promotionCooldownUntilTomorrow);
  const currentStreak = Number(promotionCurrentStreak || 0);
  const nextDayTimestamp = Number(promotionNextDayTimestamp) || null;

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
      kickOffFirstEngineMove,
      boardUpdateFn,
      puzzle,
      puzzleState,
      inTimeAttack,
      onClearSelection: () => setSelectedSquare(null),
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
      onSetRunResult,
      onSetInTimeAttack,
      onTimeTrialCompletedUpdate: setTimeTrialCompleted,
      onDailyStatsUpdate: setDailyStats,
      onPuzzleComplete,
      resetToOriginalPosition,
      onAdjustTimeAttackTimer: adjustCanonicalTimeAttackTimer,
      onRecoverTimeAttackRun: recoverCanonicalTimeAttackRun,
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
    setChessBoardState,
    executeUserMove,
    processingMoveRef
  });

  const handleFinishMoveAnalysis = createHandleFinishMoveAnalysis({
    chessRef,
    chessBoardState,
    setChessBoardState,
    requestEngineReply,
    executeEngineMove
  });

  useEffect(() => {
    if (phase !== 'SOLUTION') {
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

      const isBlack = chessBoardState?.playerColor === 'black';

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
      } catch (err) {
        console.error('Error checking promotion moves:', err);
      }

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

    const baseState = fenToBoardState({ fen: startFen });
    const initialState = { ...baseState, playerColor } as any;
    const chess = new Chess(startFen);

    chessRef.current = chess;
    setChessBoardState(initialState);
    setOriginalPosition(initialState);
    initStartFen({ startFen });
    startTimeRef.current = Date.now();

    setPuzzleState({
      solutionIndex: 0,
      moveHistory: [],
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
      promotionTimerCommandGenerationRef.current += 1;
      pendingPromotionTimerCommandRef.current = null;
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
    if (!inTimeAttack || runResult !== 'PLAYING') return;
    if (!puzzle) return;
    if (
      phase === 'ANALYSIS' ||
      phase === 'SOLUTION' ||
      phase === 'PROMO_SUCCESS'
    )
      return;
    const endsAt = timeAttackEndsAtRef.current;
    if (!endsAt) return;

    const canonicalTimeLeft = getTimeAttackSecondsRemaining(endsAt);
    if (canonicalTimeLeft !== timeLeft) {
      onSetTimeLeft(canonicalTimeLeft);
    }
    if (canonicalTimeLeft <= 0) {
      if (!promotionTimerPending) {
        handleTimeUp();
      }
      return;
    }

    scheduleCanonicalTimerTick();

    return () => {
      if (timeTrialTimerRef.current) {
        clearTimeout(timeTrialTimerRef.current);
      }
    };

    function scheduleCanonicalTimerTick() {
      const activeEndsAt = timeAttackEndsAtRef.current;
      if (!activeEndsAt) return;
      const millisecondsRemaining = Math.max(
        0,
        activeEndsAt - performance.now()
      );
      const secondsRemaining = getTimeAttackSecondsRemaining(activeEndsAt);
      const millisecondsUntilNextSecond =
        millisecondsRemaining - Math.max(0, secondsRemaining - 1) * 1000;

      timeTrialTimerRef.current = setTimeout(
        () => {
          const nextEndsAt = timeAttackEndsAtRef.current;
          if (!nextEndsAt) return;
          const nextTimeLeft = getTimeAttackSecondsRemaining(nextEndsAt);
          onSetTimeLeft((previousTimeLeft) =>
            previousTimeLeft === nextTimeLeft ? previousTimeLeft : nextTimeLeft
          );
          if (nextTimeLeft > 0) scheduleCanonicalTimerTick();
        },
        Math.min(1000, Math.max(50, millisecondsUntilNextSecond + 5))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, timeLeft, runResult, promotionTimerPending, puzzle, phase]);

  useEffect(() => {
    if (!inTimeAttack && previousPhaseRef.current !== 'ANALYSIS') {
      promotionTimerCommandGenerationRef.current += 1;
      pendingPromotionTimerCommandRef.current = null;
      setPromotionTimerPending(false);
      setTimeTrialCompleted(false);
      timeAttackDeadlineRef.current = null;
      timeAttackEndsAtRef.current = null;
    }
  }, [inTimeAttack]);

  useEffect(() => {
    if (!puzzle) return;
    onSetRunResult('PLAYING');
    if (!inTimeAttack) {
      onSetTimeLeft(TIME_ATTACK_DURATION);
    }
  }, [puzzle, inTimeAttack, onSetRunResult, onSetTimeLeft]);

  const isReady = !!(puzzle && chessBoardState);

  const promoColor = chessBoardState?.playerColor ?? 'white';

  useEffect(() => {
    inTimeAttackStill.current = inTimeAttack;
  }, [inTimeAttack]);

  const handleCastling = createHandleCastling({
    chessRef,
    chessBoardState,
    setChessBoardState,
    executeUserMove,
    processingMoveRef,
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
              onSquareClick={handleSquareClick}
              chessRef={chessRef}
              setChessBoardState={setChessBoardState}
              executeEngineMove={executeEngineMove}
              requestEngineReply={requestEngineReply}
              appendCurrentFen={appendCurrentFen}
              onCastling={handleCastling}
              currentLevel={selectedLevel || 1}
            />
            {phase === 'ANALYSIS' && (
              <FenBar
                fen={
                  fenHistory?.[analysisIndex] || chessRef.current?.fen?.() || ''
                }
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
            promotionStartError={promotionStartError}
            onPromotionClick={handlePromotionClick}
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
              onSetPhase('ANALYSIS');
            }
            resetToOriginalPosition();
            kickOffFirstEngineMove({
              phaseAfter: getResetPhaseAfter()
            });
          }}
          onGiveUp={handleGiveUpWithSolution}
          levelsLoading={levelsLoading}
          onShowSolution={handleShowSolution}
          onEnterInteractiveAnalysis={() =>
            handleEnterInteractiveAnalysis({ from: 'final' })
          }
          onStartLevel={onStartLevel}
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

  async function handleSquareClick(clickedSquare: number) {
    if (!chessBoardState || (phase !== 'WAIT_USER' && phase !== 'ANALYSIS')) {
      return;
    }

    if (inTimeAttack) {
      const allowed = runResult === 'PLAYING' && timeLeft > 0;
      if (!allowed && phase !== 'ANALYSIS') return;
    }

    if (phase === 'WAIT_USER') {
      const turnColor = getCurrentTurnColor();
      if (turnColor !== chessBoardState.playerColor) {
        setSelectedSquare(null);
        return;
      }
    }

    const isBlack = chessBoardState.playerColor === 'black';
    const absClickedSquare = viewToBoard(clickedSquare, isBlack);

    const clickedPiece = chessBoardState.board[absClickedSquare];

    let allowedColor = chessBoardState.playerColor;
    if (phase === 'ANALYSIS' && chessRef.current) {
      try {
        allowedColor = chessRef.current.turn() === 'w' ? 'white' : 'black';
      } catch {}
    }

    if (selectedSquare == null) {
      if (clickedPiece?.isPiece && clickedPiece.color === allowedColor) {
        setSelectedSquare(clickedSquare);
      }
      return;
    }

    if (selectedSquare === clickedSquare) {
      setSelectedSquare(null);
      return;
    }

    if (clickedPiece?.isPiece && clickedPiece.color === allowedColor) {
      setSelectedSquare(clickedSquare);
      return;
    }

    const success = await handleUserMove(selectedSquare, clickedSquare);
    if (success) {
      setSelectedSquare(null);
    }
  }

  function resetToOriginalPosition() {
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
      moveHistory: []
    }));
  }

  async function handlePromotionClick() {
    let promotionStarted = false;
    try {
      if (startingPromotionRef.current || startingPromotion) return;
      startingPromotionRef.current = true;
      setStartingPromotion(true);
      setPromotionStartError('');
      const promotionRun = await startTimeAttackPromotion();
      applyCanonicalPromotionStartResponse(promotionRun);
      promotionStarted = true;

      setStartingPromotion(false);
      void refreshLevels().catch((refreshError) => {
        console.warn(
          'Failed to refresh levels after promotion start:',
          refreshError
        );
      });
    } catch (err: any) {
      console.error('❌ failed starting time‑attack:', err);
      setPromotionStartError(
        err?.status === 409
          ? 'Your promotion trial is still being prepared. Please wait a moment and try again.'
          : err?.message ||
              'The promotion trial could not start. Check your connection and try again.'
      );
      if (!promotionStarted) {
        onSetInTimeAttack(false);
        runIdRef.current = null;
      }

      if (err?.status === 403 || err?.response?.status === 403) {
        await onRefreshStats();
      }
    } finally {
      startingPromotionRef.current = false;
      setStartingPromotion(false);
    }
  }

  function handleEnterInteractiveAnalysis({
    from
  }: {
    from: 'final' | number;
  }) {
    if (!puzzle) return;
    onSetInTimeAttack(false);
    solutionPlayingRef.current = false;
    if (from === 'final') {
      enterFromFinal();
    } else {
      enterFromPly({ plyIndex: from });
    }
    onSetPhase('ANALYSIS');
  }

  function kickOffFirstEngineMove(options?: { phaseAfter?: PuzzlePhase }) {
    if (!puzzle) return;
    const phaseAfter = options?.phaseAfter ?? 'WAIT_USER';
    if (phaseAfter !== 'SOLUTION') {
      // New live board session: invalidate pending fail/solution
      // transitions scheduled for the previous position.
      boardEpochRef.current += 1;
      solutionPlayingRef.current = false;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (phaseAfter === 'WAIT_USER') {
      setSelectedSquare(null);
    }
    animationTimeoutRef.current = setTimeout(() => {
      animationTimeoutRef.current = null;
      executeEngineMove(puzzle.moves[0]);
      onSetPhase(phaseAfter);
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

  function getResetPhaseAfter(): PuzzlePhase {
    if (phase === 'ANALYSIS') {
      return 'ANALYSIS';
    }
    if (phase === 'SOLUTION' && previousPhaseRef.current === 'ANALYSIS') {
      return 'ANALYSIS';
    }
    return 'WAIT_USER';
  }

  function getCurrentTurnColor() {
    try {
      const turn = chessRef.current?.turn();
      if (turn === 'w') return 'white';
      if (turn === 'b') return 'black';
    } catch {}
    return null;
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
          onSetPhase('WAIT_USER');
        }
      }
    });
  }

  function handleGiveUpWithSolution() {
    if (!puzzle) return;
    onSetRunResult('FAIL');
    handleShowSolution();
    try {
      onPuzzleComplete({
        solved: false
      });
    } catch {}
  }

  async function handleShowSolution() {
    if (!puzzle) return;
    const epochAtStart = boardEpochRef.current;
    onSetPhase('SOLUTION');
    await hookShowCompleteSolution();
    if (boardEpochRef.current !== epochAtStart) return;
    onSetPhase('ANALYSIS');
  }

  async function handleTimeUp() {
    if (timeIsAlreadyUpRef.current || phase === 'SOLUTION') return;
    if (!runIdRef.current) return;
    timeIsAlreadyUpRef.current = true;
    const epochAtStart = boardEpochRef.current;
    // The local clock is display state, not authority. Ask the server to
    // confirm expiration before consuming the daily run or revealing the
    // solution; a conservative clock may reach zero during response transit.
    onSetRunResult('PENDING');
    if (timeTrialTimerRef.current) {
      clearTimeout(timeTrialTimerRef.current);
    }
    try {
      const timeoutResult = await submitTimeAttackAttempt({
        runId: runIdRef.current,
        solved: false
      });
      if (!timeoutResult?.finished) {
        onSetRunResult('PLAYING');
        return;
      }
      onSetRunResult('FAIL');
      onSetPhase('SOLUTION');
      await hookShowCompleteSolution();
      if (boardEpochRef.current === epochAtStart) {
        onSetPhase('ANALYSIS');
      }
      try {
        await Promise.all([onRefreshStats(), refreshLevels()]);
      } catch {}
    } catch (error) {
      console.error('Error submitting time up result:', error);
      await recoverCanonicalTimeAttackRun(error);
    } finally {
      timeIsAlreadyUpRef.current = false;
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
    const puzzleId = Number(puzzle?.id || 0);
    if (!Number.isSafeInteger(puzzleId) || puzzleId <= 0) {
      throw new Error('The active promotion puzzle is unavailable');
    }
    const resp = await submitTimeAttackAttemptApi({
      runId,
      puzzleId,
      solved
    });
    if (
      resp?.deadlineAt &&
      Number.isFinite(resp?.serverNow) &&
      Number.isFinite(resp?.remainingMs)
    ) {
      applyCanonicalTimeAttackClock({
        deadlineAt: resp.deadlineAt,
        serverNow: resp.serverNow,
        remainingMs: resp.remainingMs,
        responseTransitMs: resp.responseTransitMs
      });
    } else if (resp?.finished) {
      timeAttackDeadlineRef.current = null;
      timeAttackEndsAtRef.current = null;
    }
    if (typeof resp?.stats?.maxLevelUnlocked === 'number') {
      onSetUserState({
        userId,
        newState: {
          chessMaxLevelUnlocked: resp.stats.maxLevelUnlocked
        }
      });
    }
    if (
      Number.isSafeInteger(resp?.puzzlesSolved) &&
      Number(resp.puzzlesSolved) >= 0
    ) {
      // Promotion progress is server-owned. Install the count committed with
      // the attempt instead of incrementing a local projection.
      setPromoSolved(Number(resp.puzzlesSolved));
    }
    return resp;
  }

  function invalidateLocalPromotionRunWork() {
    promotionTimerCommandGenerationRef.current += 1;
    pendingPromotionTimerCommandRef.current = null;
    setPromotionTimerPending(false);
    if (timeTrialTimerRef.current) {
      clearTimeout(timeTrialTimerRef.current);
      timeTrialTimerRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    boardEpochRef.current += 1;
    solutionPlayingRef.current = false;
    timeIsAlreadyUpRef.current = false;
  }

  function applyCanonicalPromotionStartResponse(
    promotionRun: TimeAttackStartResponse
  ) {
    if ('finished' in promotionRun) {
      applyCanonicalFinishedPromotionRun(promotionRun);
      return;
    }
    applyCanonicalPromotionRun(promotionRun);
  }

  function applyCanonicalPromotionRun(
    promotionRun: TimeAttackActiveStartResponse
  ) {
    const promoRunId = Number(promotionRun?.runId || 0);
    const promoPuzzle = promotionRun?.puzzle;
    if (!Number.isSafeInteger(promoRunId) || promoRunId <= 0 || !promoPuzzle) {
      throw new Error('The canonical promotion run was invalid');
    }

    // Validate and install the canonical clock before replacing the rest of
    // the local projection. applyCanonicalTimeAttackClock does not mutate on
    // invalid input, so a malformed response cannot leave a half-loaded run.
    applyCanonicalTimeAttackClock({
      deadlineAt: promotionRun.deadlineAt,
      serverNow: promotionRun.serverNow,
      remainingMs: promotionRun.remainingMs,
      responseTransitMs: promotionRun.responseTransitMs
    });

    invalidateLocalPromotionRunWork();
    runIdRef.current = promoRunId;
    setTimeTrialCompleted(false);
    setPromoSolved(Math.max(0, Number(promotionRun.puzzlesSolved) || 0));
    setSelectedSquare(null);
    setPromotionPending(null);
    setPuzzleState({
      solutionIndex: 0,
      moveHistory: [],
      showingHint: false
    });
    setPromotionStartError('');
    onSetPhase('START_LEVEL');
    onSetRunResult('PLAYING');
    updatePuzzle(promoPuzzle);
    onSetInTimeAttack(true);
  }

  function applyCanonicalFinishedPromotionRun(
    promotionRun: TimeAttackFinishedStartResponse
  ) {
    const promoRunId = Number(promotionRun?.runId || 0);
    if (
      !Number.isSafeInteger(promoRunId) ||
      promoRunId <= 0 ||
      promotionRun.finished !== true
    ) {
      throw new Error('The canonical promotion result was invalid');
    }

    invalidateLocalPromotionRunWork();
    processingMoveRef.current = false;
    timeAttackDeadlineRef.current = null;
    timeAttackEndsAtRef.current = null;
    runIdRef.current = null;
    setPromotionPending(null);
    setPromotionStartError('');
    setPromoSolved(Math.max(0, Number(promotionRun.puzzlesSolved) || 0));
    if (promotionRun.success) {
      setTimeTrialCompleted(true);
      onSetRunResult('SUCCESS');
      onSetPhase('PROMO_SUCCESS');
      // Match the normal terminal-success projection: the time-attack success
      // panel remains visible, while runResult stops the clock and submissions.
      onSetInTimeAttack(true);
      return;
    }

    setTimeTrialCompleted(false);
    onSetRunResult('FAIL');
    onSetPhase('FAIL');
    onSetInTimeAttack(false);
  }

  async function recoverCanonicalTimeAttackRun(cause: unknown) {
    const recoveryGeneration = promotionTimerCommandGenerationRef.current;
    const recoveryRunId = runIdRef.current ?? undefined;
    try {
      const promotionRun = await startTimeAttackPromotion({ recoveryRunId });
      if (promotionTimerCommandGenerationRef.current !== recoveryGeneration) {
        return false;
      }
      applyCanonicalPromotionStartResponse(promotionRun);
      if ('finished' in promotionRun) {
        await Promise.allSettled([refreshLevels(), onRefreshStats()]);
      }
      return true;
    } catch (recoveryError: any) {
      if (promotionTimerCommandGenerationRef.current !== recoveryGeneration) {
        return false;
      }
      console.error('Failed to reload canonical promotion run:', {
        cause,
        recoveryError
      });
      leaveStaleTimeAttackProjection(recoveryError);
      await Promise.allSettled([refreshLevels(), onRefreshStats()]);
      return false;
    }
  }

  function leaveStaleTimeAttackProjection(error: any) {
    invalidateLocalPromotionRunWork();
    processingMoveRef.current = false;
    timeAttackDeadlineRef.current = null;
    timeAttackEndsAtRef.current = null;
    runIdRef.current = null;
    setPromotionPending(null);
    setTimeTrialCompleted(false);
    onSetRunResult('PENDING');
    onSetPhase('START_LEVEL');
    onSetInTimeAttack(false);

    const status = Number(error?.status || error?.response?.status || 0);
    setPromotionStartError(
      status === 403
        ? 'This promotion trial is no longer active. Your promotion status has been refreshed.'
        : 'We could not reload the promotion trial. Use the promotion button to resume it.'
    );
  }

  async function adjustCanonicalTimeAttackTimer({
    moveIndex,
    outcome
  }: {
    moveIndex: number;
    outcome: 'correct' | 'wrong';
  }) {
    const runId = runIdRef.current;
    const puzzleId = Number(puzzle?.id || 0);
    const expectedDeadlineAt = timeAttackDeadlineRef.current;
    if (
      runId == null ||
      !Number.isSafeInteger(puzzleId) ||
      puzzleId <= 0 ||
      !Number.isSafeInteger(moveIndex) ||
      expectedDeadlineAt == null
    ) {
      return false;
    }
    if (pendingPromotionTimerCommandRef.current) {
      throw new Error(
        'The previous promotion timer command is still being reconciled'
      );
    }
    const command: PendingPromotionTimerCommand = {
      runId,
      puzzleId,
      moveIndex,
      commandId: createPromotionCommandId(),
      expectedDeadlineAt,
      outcome
    };
    const commandGeneration = promotionTimerCommandGenerationRef.current;
    pendingPromotionTimerCommandRef.current = command;

    setPromotionTimerPending(true);
    try {
      let transportFailureCount = 0;
      while (
        pendingPromotionTimerCommandRef.current === command &&
        promotionTimerCommandGenerationRef.current === commandGeneration
      ) {
        try {
          const timerState = (await adjustTimeAttackTimer(
            command
          )) as TimeAttackTimerResponse;
          if (
            pendingPromotionTimerCommandRef.current !== command ||
            promotionTimerCommandGenerationRef.current !== commandGeneration
          ) {
            return false;
          }
          pendingPromotionTimerCommandRef.current = null;
          const timerStillActive = applyCanonicalTimeAttackClock({
            deadlineAt: timerState.deadlineAt,
            serverNow: timerState.serverNow,
            remainingMs: timerState.remainingMs,
            responseTransitMs: timerState.responseTransitMs
          });
          return timerState.accepted && timerStillActive && !timerState.expired;
        } catch (error: any) {
          if (
            pendingPromotionTimerCommandRef.current !== command ||
            promotionTimerCommandGenerationRef.current !== commandGeneration
          ) {
            return false;
          }
          if (!error?.isTransportError) {
            pendingPromotionTimerCommandRef.current = null;
            await recoverCanonicalTimeAttackRun(error);
            throw error;
          }
          // The server may already have committed this command. Keep the
          // complete identity and original CAS input until its canonical row
          // can be replayed; a new command would be stale after a lost reply.
          transportFailureCount += 1;
          await waitForPromotionTimerRetry(transportFailureCount);
        }
      }
      return false;
    } finally {
      if (promotionTimerCommandGenerationRef.current === commandGeneration) {
        setPromotionTimerPending(false);
      }
    }
  }

  function applyCanonicalTimeAttackClock({
    deadlineAt,
    serverNow,
    remainingMs,
    responseTransitMs = 0
  }: {
    deadlineAt: number;
    serverNow: number;
    remainingMs: number;
    responseTransitMs?: number;
  }) {
    if (
      !Number.isSafeInteger(deadlineAt) ||
      deadlineAt <= 0 ||
      !Number.isFinite(serverNow) ||
      serverNow < 0 ||
      !Number.isFinite(remainingMs) ||
      remainingMs < 0 ||
      !Number.isFinite(responseTransitMs) ||
      responseTransitMs < 0 ||
      Math.abs(Math.max(0, deadlineAt - serverNow) - remainingMs) > 1000
    ) {
      throw new Error('The promotion timer response was invalid');
    }
    timeAttackDeadlineRef.current = deadlineAt;
    // remainingMs was sampled immediately before the response. Subtract only
    // the estimated response network leg, not outbound transit or server work
    // that happened before the sample. Local zero is still advisory:
    // handleTimeUp asks the server to confirm expiry before failing the run.
    const endsAt =
      performance.now() + Math.max(0, remainingMs - responseTransitMs);
    timeAttackEndsAtRef.current = endsAt;
    const secondsRemaining = getTimeAttackSecondsRemaining(endsAt);
    onSetTimeLeft(secondsRemaining);
    return secondsRemaining > 0;
  }

  async function handleUnlockPromotion() {
    try {
      await onRefreshStats();
    } catch {}
  }
}

function getTimeAttackSecondsRemaining(endsAt: number) {
  return Math.max(0, Math.ceil((endsAt - performance.now()) / 1000));
}

function createPromotionCommandId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

async function waitForPromotionTimerRetry(failureCount: number) {
  const exponentialDelay =
    PROMOTION_TIMER_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, failureCount - 1);
  const onlineDelay = Math.min(
    PROMOTION_TIMER_RETRY_MAX_DELAY_MS,
    exponentialDelay
  );
  const retryDelay =
    typeof navigator !== 'undefined' && navigator.onLine === false
      ? PROMOTION_TIMER_RETRY_MAX_DELAY_MS
      : onlineDelay;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', finish);
      }
      resolve();
    };
    const timer = setTimeout(finish, retryDelay);
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator.onLine === false
    ) {
      window.addEventListener('online', finish, { once: true });
    }
  });
}

function FenBar({ fen }: { fen: string }) {
  const [copied, setCopied] = useState(false);
  const boxCls = css`
    margin-top: 0.75rem;
    background: #fff;
    border: 1px solid var(--ui-border);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
  `;
  const rowCls = css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  const inputCls = css`
    flex: 1;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    font-size: 1.1rem;
    border: none;
    outline: none;
    background: transparent;
    color: #111827;
  `;
  const iconBtnCls = css`
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 4px;
    border: 1px solid var(--ui-border);
    background: #f8fafc;
    color: #111827;
    transition:
      background 0.15s ease,
      transform 0.08s ease;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: #eef2f7;
      }
    }
    &:active {
      transform: translateY(1px) scale(0.97);
    }
  `;
  const iconBtnCopiedCls = css`
    background: #dcfce7;
    border-color: #86efac;
    color: #065f46;
    animation: pop 220ms ease-out;
    @keyframes pop {
      0% {
        transform: scale(0.95);
      }
      60% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }
  `;
  async function copyFen() {
    try {
      await navigator.clipboard.writeText(fen);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore clipboard errors
    }
  }
  return (
    <div className={boxCls}>
      <div className={rowCls}>
        <span
          className={css`
            font-weight: 600;
            font-size: 1.1rem;
            color: #111827;
          `}
        >
          FEN:{' '}
        </span>{' '}
        <input className={inputCls} value={fen} readOnly />
        <button
          className={`${iconBtnCls} ${copied ? iconBtnCopiedCls : ''}`}
          onClick={copyFen}
          aria-label={copied ? 'Copied' : 'Copy FEN'}
          title={copied ? 'Copied!' : 'Copy FEN'}
        >
          <Icon icon={copied ? 'check' : 'copy'} />
        </button>
      </div>
    </div>
  );
}

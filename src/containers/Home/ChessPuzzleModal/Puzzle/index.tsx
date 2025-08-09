import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import CastlingButton from './CastlingButton';
import {
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle,
  viewToBoard,
  clearArrivedStatesExcept,
  updateThreatHighlighting,
  applyInCheckHighlighting,
  mapPromotionLetterToType,
  resetToStartFen
} from '../helpers';
import { LichessPuzzle, PuzzleResult, ChessBoardState } from '~/types/chess';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useAppContext } from '~/contexts';

import {
  useChessMove,
  createOnSquareClick,
  createResetToOriginalPosition,
  createHandleCastling
} from './hooks/useChessMove';
import { useChessPuzzle } from './hooks/useChessPuzzle';
import { useAnalysisMode } from './hooks/useAnalysisMode';
import StatusHeader from './StatusHeader';
import ThemeDisplay from './ThemeDisplay';
import RightPanel from './RightPanel';
import ActionButtons from './RightPanel/ActionButtons';
import PromotionPicker from './PromotionPicker';
import AnalysisModal from './AnalysisModal';
import {
  surface,
  borderSubtle,
  shadowCard,
  radiusCard,
  analysisFadeCls
} from './styles';
// (none)

const breakDuration = 1000;

const containerCls = css`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 2rem;
  box-sizing: border-box;
  background: ${surface};
  border: 1px solid ${borderSubtle};
  border-radius: ${radiusCard};
  box-shadow: ${shadowCard};
  transition: box-shadow 0.3s ease;

  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.5rem;
    gap: 2rem;
  }
`;

const contentAreaCls = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  min-height: 0;
  overflow-y: auto;

  @media (max-width: ${mobileMaxWidth}) {
    gap: 2rem;
  }
`;

const stickyFooterCls = css`
  position: sticky;
  bottom: 0;
  background: ${surface};
  padding: 1rem 0 0 0;
  margin-top: auto;
  z-index: 10;

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.75rem 0 0 0;
  }
`;

const gridCls = css`
  display: grid;
  grid-template-columns: 1fr auto 260px;
  grid-template-areas: 'board gap right';
  grid-template-rows: 1fr;
  gap: 1.5rem;
  flex-grow: 1;
  min-height: 0;
  align-items: start;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    grid-template-areas: 'board' 'right';
    grid-template-rows: auto auto;
  }
`;

const boardAreaCls = css`
  grid-area: board;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
`;

// moved to styles.ts: analysisBadgeCls

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

  async function handleFinishMoveAnalysis(
    from: number,
    to: number,
    fromAlgebraic: string,
    toAlgebraic: string,
    fenBeforeMove: string,
    promotion?: string
  ) {
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
      const absFrom = viewToBoard(from, isBlack);
      const absTo = viewToBoard(to, isBlack);
      const newBoard = [...prev.board];
      const movingPiece = { ...newBoard[absFrom] };
      movingPiece.state = 'arrived';
      newBoard[absTo] = movingPiece;
      newBoard[absFrom] = {};
      clearArrivedStatesExcept({ board: newBoard, keepIndices: [absTo] });
      updateThreatHighlighting({
        board: newBoard,
        chessInstance: chessRef.current!
      });
      return {
        ...prev,
        board: newBoard,
        isCheck: chessRef.current?.isCheck() || false,
        isCheckmate: chessRef.current?.isCheckmate() || false
      };
    });
    // Ask engine to respond in analysis mode
    try {
      await requestEngineReply({ executeEngineMove });
    } catch {}
    return true;
  }

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
  const enterInteractiveAnalysis = React.useCallback(
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

  // Keyboard navigation in Analysis mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = (target.tagName || '').toLowerCase();
        const isTyping =
          tag === 'input' || tag === 'textarea' || target.isContentEditable;
        if (isTyping) return;
      }
      if ((puzzleState as any).phase !== 'ANALYSIS') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        analysisPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        analysisNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        // jump to start
        enterFromPly({ plyIndex: 0 });
      } else if (e.key === 'End') {
        e.preventDefault();
        // jump to final
        enterFromFinal();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [analysisPrev, analysisNext, enterFromPly, enterFromFinal, puzzleState]);

  const executeEngineMove = useCallback(
    (moveUci: string) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
      autoRetryOnFail,
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
      executeEngineMove
    });
  }

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

      // Prevent king from moving more than 1 square (castling via board disabled).
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
        return await handleFinishMoveAnalysis(
          from,
          to,
          fromAlgebraic,
          toAlgebraic,
          fenBeforeMove
        );
      }

      return await handleFinishMove(
        from,
        to,
        fromAlgebraic,
        toAlgebraic,
        fenBeforeMove
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState, autoRetryOnFail]
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

    // Apply initial in-check highlighting if position starts in check
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

  // Timer effect for time attack (stop when not actively playing)
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

  // Clear timer once the run is over (SUCCESS/FAIL)
  useEffect(() => {
    if (runResult !== 'PLAYING') {
      setTimeLeft(null);
    }
  }, [runResult, setTimeLeft]);

  useEffect(() => {
    if (inTimeAttack && puzzle) {
      // Timer starts with 30 seconds per puzzle
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
    try {
      if (!chessRef.current || !chessBoardState) return false;
      // Only consider user's turn; otherwise don't show buttons
      const fen = chessRef.current.fen();
      const parts = fen.split(' ');
      const turn = parts[1];
      const isBlack = chessBoardState.playerColors[userId] === 'black';
      const meToMove = isBlack ? 'b' : 'w';
      if (turn !== meToMove) return false;

      const legal = chessRef.current.moves({ verbose: true }) as any[];
      if (!Array.isArray(legal)) return false;
      if (side === 'kingside') {
        return legal.some((m) => m?.flags && m.flags.includes('k'));
      }
      return legal.some((m) => m?.flags && m.flags.includes('q'));
    } catch {
      return false;
    }
  }

  // Wire UI handlers via creators
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
              <>
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
                  enPassantTarget={
                    chessBoardState!.enPassantTarget || undefined
                  }
                  selectedSquare={selectedSquare}
                  game={chessRef.current || undefined}
                  overlay={
                    <CastlingButton
                      interactable={puzzleState.phase === 'WAIT_USER'}
                      playerColor={
                        chessBoardState!.playerColors[userId] || 'white'
                      }
                      onCastling={handleCastling}
                      canKingside={canCastle({ side: 'kingside' })}
                      canQueenside={canCastle({ side: 'queenside' })}
                    />
                  }
                />
              </>
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
          autoRetryOnFail={autoRetryOnFail}
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
            const success = await finish(
              promotionPending.from,
              promotionPending.to,
              promotionPending.fromAlgebraic,
              promotionPending.toAlgebraic,
              fenBeforeMove,
              piece
            );
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

  async function handleFinishMove(
    from: number,
    to: number,
    fromAlgebraic: string,
    toAlgebraic: string,
    fenBeforeMove: string,
    promotion?: string
  ) {
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

    if (!move) {
      return false;
    }

    const isBlack = chessBoardState?.playerColors[userId] === 'black';

    const boardUpdateFn = () => {
      const isPositionCheckmate = chessRef.current?.isCheckmate() || false;
      const isPositionCheck = chessRef.current?.isCheck() || false;

      setChessBoardState((prev) => {
        if (!prev) return prev;

        const absFrom = viewToBoard(from, isBlack);
        const absTo = viewToBoard(to, isBlack);

        const newBoard = [...prev.board];
        const movingPiece = { ...newBoard[absFrom] };

        if (move.promotion) {
          const mapped = mapPromotionLetterToType({ letter: move.promotion });
          if (mapped) movingPiece.type = mapped;
        }

        movingPiece.state = 'arrived';
        newBoard[absTo] = movingPiece;
        newBoard[absFrom] = {};

        // Clear previous 'arrived' state except destination
        clearArrivedStatesExcept({ board: newBoard, keepIndices: [absTo] });

        updateThreatHighlighting({
          board: newBoard,
          chessInstance: chessRef.current!
        });

        return {
          ...prev,
          board: newBoard,
          isCheck: isPositionCheck,
          isCheckmate: isPositionCheckmate
        };
      });
    };

    return await executeUserMove(move, fenBeforeMove, boardUpdateFn);
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
  }

  function showCompleteSolution() {
    if (!puzzle || !chessRef.current) return;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    solutionPlayingRef.current = true;
    resetBoardForSolution();

    setTimeout(() => {
      playSolutionStep(1, 0);
      // When solution playback completes, remain in SOLUTION phase
      const msPerMove = 1500;
      const remainingMoves = Math.max(puzzle.moves.length - 1, 0);
      const duration = remainingMoves * msPerMove + 200; // small buffer
      setTimeout(() => {
        solutionPlayingRef.current = false;
        // Do not auto-enter Analysis here; keep SOLUTION state
      }, duration);
    }, 950);
  }

  function replaySolution() {
    if (!puzzle) return;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    solutionPlayingRef.current = true;
    resetBoardForSolution();

    setTimeout(() => {
      playSolutionStep(1, 0);
    }, 950);
  }

  function handleGiveUpWithSolution() {
    if (!puzzle) return;

    setPuzzleResult('gave_up');
    showCompleteSolution();

    setPuzzleState((prev) => ({ ...prev, phase: 'SOLUTION' }));
  }

  async function handleTimeUp() {
    if (
      puzzleState.phase === 'SUCCESS' ||
      puzzleState.phase === 'FAIL' ||
      puzzleState.phase === 'SOLUTION'
    ) {
      return;
    }

    showCompleteSolution();

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

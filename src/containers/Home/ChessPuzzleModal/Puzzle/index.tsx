import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import CastlingButton from './CastlingButton';
import {
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle,
  viewToBoard,
  applyCheckmateHighlighting as applyMate,
  applyInCheckHighlighting as applyCheck,
  clearArrivedStatesExcept
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
import StatusHeader from './StatusHeader';
import ThemeDisplay from './ThemeDisplay';
import RightPanel from './RightPanel';
import ActionButtons from './RightPanel/ActionButtons';
import PromotionPicker from './PromotionPicker';
import AnalysisModal from './AnalysisModal';
import { surface, borderSubtle, shadowCard, radiusCard } from './styles';

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
  puzzle: LichessPuzzle;
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
  const { userId } = useKeyContext((v) => v.myState);
  const submitTimeAttackAttempt = useAppContext(
    (v) => v.requestHelpers.submitTimeAttackAttempt
  );
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );

  const { makeEngineMove, processUserMove } = useChessMove();
  const {
    inTimeAttack,
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
    'solved' | 'failed' | 'gave_up'
  >('solved');

  const chessRef = useRef<Chess | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationTimeoutRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const solutionPlayingRef = useRef(false);

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
        onBoardStateUpdate: setChessBoardState,
        applyCheckmateHighlighting
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Wrapper function for processUserMove with the necessary parameters
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
      if (!chessRef.current || !puzzle || puzzleState.phase !== 'WAIT_USER') {
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

      return await handleFinishMove(
        from,
        to,
        fromAlgebraic,
        toAlgebraic,
        fenBeforeMove
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState]
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
    startTimeRef.current = Date.now();

    setPuzzleState({
      phase: 'ANIM_ENGINE',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: 0,
      showingHint: false
    });

    setMoveAnalysisHistory([]);
    setPuzzleResult('solved');

    // Apply initial in-check highlighting if position starts in check
    setChessBoardState((prev) => {
      if (!prev || !chessRef.current) return prev;
      const newBoard = [...prev.board];
      // Clear any previous 'check'
      for (let i = 0; i < newBoard.length; i++) {
        const sq: any = newBoard[i];
        if (sq && sq.state === 'check') sq.state = '';
      }
      if (chessRef.current.isCheck()) {
        const sideInCheck = chessRef.current.turn() === 'w' ? 'white' : 'black';
        for (let i = 0; i < newBoard.length; i++) {
          const piece = newBoard[i] as any;
          if (
            piece.isPiece &&
            piece.type === 'king' &&
            piece.color === sideInCheck
          ) {
            piece.state = 'check';
            break;
          }
        }
      }
      return { ...prev, board: newBoard, isCheck: chessRef.current.isCheck() };
    });

    animationTimeoutRef.current = window.setTimeout(() => {
      executeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev) => ({
        ...prev,
        phase: 'WAIT_USER',
        solutionIndex: 1
      }));
    }, 450);
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

  // Timer effect for time attack
  useEffect(() => {
    if (!inTimeAttack || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, timeLeft]);

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

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
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
    setPuzzleResult,
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
          phase={puzzleState.phase}
          inTimeAttack={inTimeAttack}
          timeLeft={timeLeft}
        />

        <ThemeDisplay themes={puzzle.themes} />

        <div className={gridCls}>
          <div className={boardAreaCls}>
            <ChessBoard
              squares={chessBoardState.board as any[]}
              playerColor={chessBoardState.playerColors[userId] || 'white'}
              interactable={puzzleState.phase === 'WAIT_USER'}
              onSquareClick={onSquareClick}
              showSpoiler={false}
              onSpoilerClick={() => {}}
              enPassantTarget={chessBoardState.enPassantTarget || undefined}
              selectedSquare={selectedSquare}
              game={chessRef.current || undefined}
            />
            <CastlingButton
              interactable={puzzleState.phase === 'WAIT_USER'}
              playerColor={chessBoardState.playerColors[userId] || 'white'}
              onCastling={handleCastling}
              squares={chessBoardState.board as any[]}
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
            onPromotionClick={handlePromotionClick}
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
          onNewPuzzleClick={onMoveToNextPuzzle}
          onResetPosition={resetToOriginalPosition}
          onCelebrationComplete={handleCelebrationComplete}
          onGiveUp={handleGiveUpWithSolution}
          onLevelChange={onLevelChange}
          levelsLoading={levelsLoading}
          onReplaySolution={replaySolution}
          onShowAnalysis={() => setShowAnalysisModal(true)}
        />
      </div>

      {promotionPending && (
        <PromotionPicker
          color={chessBoardState?.playerColors[userId] || 'white'}
          onSelect={async (piece) => {
            const { fenBeforeMove } = promotionPending;
            const success = await handleFinishMove(
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
          const pieceTypeMap: { [key: string]: string } = {
            q: 'queen',
            r: 'rook',
            b: 'bishop',
            n: 'knight'
          };
          movingPiece.type = pieceTypeMap[move.promotion] || 'queen';
        }

        movingPiece.state = 'arrived';
        newBoard[absTo] = movingPiece;
        newBoard[absFrom] = {};

        // Clear previous 'arrived' state except destination
        clearArrivedStatesExcept({ board: newBoard, keepIndices: [absTo] });

        // Apply checkmate highlighting when checkmate occurs
        if (isPositionCheckmate) {
          applyMate({ board: newBoard, chessInstance: chessRef.current! });
        } else {
          applyCheck({ board: newBoard, chessInstance: chessRef.current! });
        }

        // Apply in-check highlighting on the checked king (non-checkmate)
        if (!isPositionCheckmate) {
          // Determine which side is in check: if inCheck() is true, it's the side to move
          const sideInCheck = isPositionCheck
            ? chessRef.current!.turn() === 'w'
              ? 'white'
              : 'black'
            : null;

          // Clear any previous 'check' state
          for (let i = 0; i < newBoard.length; i++) {
            const sq: any = newBoard[i];
            if (sq && sq.state === 'check') {
              sq.state = '';
            }
          }

          if (sideInCheck) {
            for (let i = 0; i < newBoard.length; i++) {
              const piece = newBoard[i] as any;
              if (
                piece.isPiece &&
                piece.type === 'king' &&
                piece.color === sideInCheck
              ) {
                piece.state = 'check';
                break;
              }
            }
          }
        }

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

  function applyCheckmateHighlighting(board: any[]) {
    if (!chessRef.current?.isCheckmate()) return;

    const checkmatedSide = chessRef.current.turn() === 'w' ? 'white' : 'black';

    for (let i = 0; i < board.length; i++) {
      const piece = board[i];
      if (
        piece.isPiece &&
        piece.type === 'king' &&
        piece.color === checkmatedSide
      ) {
        piece.state = 'checkmate';
        break;
      }
    }
  }

  // intentionally removed unused helper

  function resetBoardForSolution() {
    if (!puzzle || !originalPosition || !chessRef.current) return;

    const { startFen } = normalisePuzzle(puzzle.fen);
    const chess = new Chess(startFen);

    chessRef.current = chess;
    setChessBoardState((prev) => {
      if (!prev || !originalPosition) return prev;
      // Clear any checkmate highlighting when resetting
      const resetBoard = originalPosition.board.map((square: any) => {
        if (square.state === 'checkmate') {
          const clearedSquare = { ...square };
          delete clearedSquare.state;
          return clearedSquare;
        }
        return square;
      });
      return { ...originalPosition, board: resetBoard, isCheckmate: false };
    });
    setSelectedSquare(null);

    setPuzzleState((prev) => ({
      ...prev,
      solutionIndex: 0,
      moveHistory: []
    }));

    animationTimeoutRef.current = window.setTimeout(() => {
      executeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev) => ({
        ...prev,
        solutionIndex: 1
      }));
    }, 450);
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

    solutionPlayingRef.current = true;
    resetBoardForSolution();

    setTimeout(() => {
      playSolutionStep(1, 0);
    }, 950);
  }

  function replaySolution() {
    if (!puzzle) return;

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
    setRunResult('PLAYING');
    setTimeTrialCompleted(false);
    setPromoSolved(0);
  }
}

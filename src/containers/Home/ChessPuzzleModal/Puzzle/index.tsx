import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import {
  uciToSquareIndices,
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle
} from '../helpers/puzzleHelpers';
import {
  LichessPuzzle,
  PuzzleResult,
  ChessBoardState,
  MultiPlyPuzzleState
} from '~/types/chess';
import {
  validateMoveWithAnalysis,
  createPuzzleMove
} from '../helpers/multiPlyHelpers';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useAppContext } from '~/contexts';
import { useChessLevels } from '../hooks/useChessLevels';
import { usePromotionStatus } from '../hooks/usePromotionStatus';
import useTimeAttackPromotion from '../hooks/useTimeAttackPromotion';
import { useChessEngine } from '../hooks/useChessEngine';
import StatusHeader from './StatusHeader';
import ThemeDisplay from './ThemeDisplay';
import RightPanel from './RightPanel';
import ActionButtons from './RightPanel/ActionButtons';
import PromotionPicker from './PromotionPicker';
import AnalysisModal from './AnalysisModal';
import { surface, borderSubtle, shadowCard, radiusCard } from './styles';

type PuzzleMode =
  | { type: 'playing' }
  | { type: 'puzzle_solved' }
  | { type: 'puzzle_failed' }
  | { type: 'time_trial_active'; timeLeft: number }
  | { type: 'time_trial_completed'; success: boolean; newLevel?: number }
  | { type: 'showing_solution'; autoPlaying: boolean };

interface PuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onNewPuzzle?: (level: number) => void;
  selectedLevel?: number;
  onLevelChange?: (level: number) => void;
  updatePuzzle: (puzzle: LichessPuzzle) => void;
}

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
`;

export default function Puzzle({
  puzzle,
  onPuzzleComplete,
  onNewPuzzle,
  selectedLevel,
  onLevelChange,
  updatePuzzle
}: PuzzleProps) {
  const { userId } = useKeyContext((v) => v.myState);
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );

  const {
    levels,
    maxLevelUnlocked,
    loading: levelsLoading,
    refresh: refreshLevels
  } = useChessLevels();
  const {
    needsPromotion,
    cooldownUntilTomorrow,
    currentStreak,
    nextDayTimestamp,
    refresh: refreshPromotion
  } = usePromotionStatus();

  const timeAttack = useTimeAttackPromotion();
  const { evaluatePosition, isReady: engineReady } = useChessEngine();

  const [mode, setMode] = useState<PuzzleMode>({ type: 'playing' });
  const [promoSolved, setPromoSolved] = useState(0);
  const currentLevel = selectedLevel || 1;

  // Derived state - much cleaner
  const inTimeAttack = Boolean(timeAttack.runId);
  const timeLeft = mode.type === 'time_trial_active' ? mode.timeLeft : null;
  const timeTrialCompleted =
    mode.type === 'time_trial_completed' && mode.success;
  const runResult =
    mode.type === 'time_trial_completed'
      ? mode.success
        ? 'SUCCESS'
        : 'FAIL'
      : 'PLAYING';

  const [puzzleState, setPuzzleState] = useState<MultiPlyPuzzleState>({
    phase: 'WAIT_USER',
    solutionIndex: 0,
    moveHistory: [],
    attemptsUsed: 0,
    showingHint: false,
    autoPlaying: false
  });
  const [dailyStats, setDailyStats] = useState<{
    puzzlesSolved: number;
    xpEarnedToday: number;
  } | null>(null);
  const [chessBoardState, setChessBoardState] =
    useState<ChessBoardState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [originalPosition, setOriginalPosition] = useState<any>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: number;
    to: number;
    fromAlgebraic: string;
    toAlgebraic: string;
    fenBeforeMove: string;
  } | null>(null);
  const [nextPuzzleLoading, setNextPuzzleLoading] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [startingPromotion, setStartingPromotion] = useState(false);

  const [expiresAt, setExpiresAt] = useState<number | null>(null);

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

  const makeEngineMove = useCallback((moveUci: string) => {
    if (!chessRef.current) return;

    const { from } = uciToSquareIndices(moveUci);

    const move = chessRef.current.move({
      from: moveUci.slice(0, 2),
      to: moveUci.slice(2, 4),
      promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
    });

    if (!move) {
      console.error('Invalid engine move:', moveUci);
      return;
    }

    const isPositionCheckmate = chessRef.current?.isCheckmate() || false;

    setChessBoardState((prev) => {
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

      movingPiece.state = 'arrived';
      newBoard[toIndex] = movingPiece;
      newBoard[from] = {};

      // Clear previous state highlighting
      newBoard.forEach((square, i) => {
        if (i !== toIndex && 'state' in square) {
          if (square.state === 'arrived') {
            square.state = '';
          }
          // During solution playback, clear non-essential states but keep checkmate
          if (
            solutionPlayingRef.current &&
            square.state &&
            square.state !== 'arrived' &&
            square.state !== 'checkmate'
          ) {
            delete square.state;
          }
        }
      });

      // Always apply checkmate highlighting when checkmate occurs
      if (isPositionCheckmate) {
        applyCheckmateHighlighting(newBoard);
      }

      return {
        ...prev,
        board: newBoard,
        isCheckmate: isPositionCheckmate
      };
    });
  }, []);

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

  const handleSquareClick = useCallback(
    async (clickedSquare: number) => {
      if (
        !chessBoardState ||
        puzzleState.phase !== 'WAIT_USER' ||
        submittingResult
      )
        return;

      const isBlack = chessBoardState.playerColors[userId] === 'black';
      const absClickedSquare = viewToBoard(clickedSquare, isBlack);

      const clickedPiece = chessBoardState.board[absClickedSquare];
      const playerColor = chessBoardState.playerColors[userId];

      if (selectedSquare === null) {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chessBoardState,
      selectedSquare,
      userId,
      puzzleState.phase,
      submittingResult
    ]
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
      showingHint: false,
      autoPlaying: false
    });

    setMoveAnalysisHistory([]);
    setPuzzleResult('solved');

    if (mode.type !== 'playing') {
      setMode({ type: 'playing' });
    }

    animationTimeoutRef.current = window.setTimeout(() => {
      makeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev) => ({
        ...prev,
        phase: 'WAIT_USER',
        solutionIndex: 1
      }));
    }, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeEngineMove, puzzle, userId]);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setNextPuzzleLoading(false);
    setSubmittingResult(false);

    if (!inTimeAttack && mode.type !== 'playing') {
      setMode({ type: 'playing' });
    }
  }, [puzzle, inTimeAttack, mode.type]);

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
    if (!inTimeAttack || expiresAt === null) {
      if (mode.type === 'time_trial_active') {
        setMode({ type: 'playing' });
      }
      return;
    }

    const timer = setInterval(() => {
      if (!inTimeAttack || expiresAt === null) return;

      const remaining = Math.max(
        0,
        Math.round((expiresAt - Date.now()) / 1000)
      );

      if (remaining === 0) {
        handleTimeUp();
      } else {
        setMode({ type: 'time_trial_active', timeLeft: remaining });
      }
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, expiresAt]);

  useEffect(() => {
    if (inTimeAttack && puzzle) {
      setExpiresAt(Date.now() + 30_000);
      setMode({ type: 'time_trial_active', timeLeft: 30 });
    } else if (!inTimeAttack) {
      setExpiresAt(null);
      setPromoSolved(0);
      if (
        mode.type === 'time_trial_active' ||
        mode.type === 'time_trial_completed'
      ) {
        setMode({ type: 'playing' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTimeAttack, puzzle?.id]);

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div className={containerCls}>
      <div className={contentAreaCls}>
        <StatusHeader
          phase={
            puzzleState.phase === 'SOLUTION'
              ? 'SOLUTION'
              : mode.type === 'time_trial_completed' && mode.success
              ? 'PROMO_SUCCESS'
              : mode.type === 'time_trial_completed' && !mode.success
              ? 'PROMO_FAIL'
              : puzzleState.phase
          }
          inTimeAttack={inTimeAttack}
          timeLeft={timeLeft}
        />

        <ThemeDisplay themes={puzzle.themes} />

        <div className={gridCls}>
          <div className={boardAreaCls}>
            <ChessBoard
              squares={chessBoardState.board as any[]}
              playerColor={chessBoardState.playerColors[userId] || 'white'}
              interactable={
                puzzleState.phase === 'WAIT_USER' && !puzzleState.autoPlaying
              }
              onSquareClick={handleSquareClick}
              showSpoiler={false}
              onSpoilerClick={() => {}}
              enPassantTarget={chessBoardState.enPassantTarget || undefined}
              selectedSquare={selectedSquare}
              game={chessRef.current || undefined}
            />
          </div>

          <RightPanel
            levels={levels}
            maxLevelUnlocked={maxLevelUnlocked}
            levelsLoading={levelsLoading}
            currentLevel={currentLevel}
            onLevelChange={onLevelChange}
            needsPromotion={needsPromotion}
            cooldownUntilTomorrow={cooldownUntilTomorrow}
            currentStreak={currentStreak}
            nextDayTimestamp={nextDayTimestamp}
            startingPromotion={startingPromotion}
            onPromotionClick={handlePromotionClick}
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
          timeTrialCompleted={timeTrialCompleted}
          maxLevelUnlocked={maxLevelUnlocked}
          currentLevel={currentLevel}
          nextPuzzleLoading={nextPuzzleLoading}
          puzzleState={puzzleState}
          onNewPuzzleClick={handleNewPuzzleClick}
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

  async function handlePromotionClick() {
    if (startingPromotion) return;

    setStartingPromotion(true);
    try {
      const { puzzle: promoPuzzle } = await timeAttack.start();

      updatePuzzle(promoPuzzle);
      setSelectedSquare(null);
      setPuzzleState({
        phase: 'WAIT_USER',
        solutionIndex: 0,
        moveHistory: [],
        attemptsUsed: 0,
        showingHint: false,
        autoPlaying: false
      });

      setPromoSolved(0);

      await refreshLevels();
    } catch (err: any) {
      console.error('❌ failed starting time‑attack:', err);

      if (err?.status === 403 || err?.response?.status === 403) {
        await refreshPromotion();
      }
    } finally {
      setStartingPromotion(false);
    }
  }

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

    const expectedMove = puzzle.moves[puzzleState.solutionIndex];
    const engineReply = puzzle.moves[puzzleState.solutionIndex + 1];

    if (!engineReady) {
      console.warn('Stockfish engine not ready, rejecting move');
      return false;
    }

    // Use analysis version to capture move data
    const moveAnalysis = await validateMoveWithAnalysis({
      userMove: {
        from: fromAlgebraic,
        to: toAlgebraic,
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

    setMoveAnalysisHistory((prev) => [...prev, analysisEntry]);

    if (!aliveRef.current) return false;

    if (!isCorrect) {
      setPuzzleResult('failed');
      setPuzzleState((prev) => {
        const next = {
          ...prev,
          phase: 'FAIL' as const,
          attemptsUsed: prev.attemptsUsed + 1
        };
        return next;
      });

      if (!submittingResult) {
        setSubmittingResult(true);
        onPuzzleComplete({
          solved: false,
          xpEarned: 0,
          attemptsUsed: puzzleState.attemptsUsed + 1
        });
        setTimeout(() => setSubmittingResult(false), 500);
      }

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
        uci: move.from + move.to + (move.promotion || ''),
        fen: fenBeforeMove
      })
    ];

    const newSolutionIndex =
      puzzleState.solutionIndex + (wasTransposition ? 2 : 1);
    const isLastMove = newSolutionIndex >= puzzle.moves.length;

    setPuzzleState((prev) => {
      const next = {
        ...prev,
        solutionIndex: newSolutionIndex,
        moveHistory: newMoveHistory
      };
      return next;
    });

    const isBlack = chessBoardState?.playerColors[userId] === 'black';

    // Check if the position after the move results in checkmate
    const isPositionCheckmate = chessRef.current?.isCheckmate() || false;

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

      // Clear previous state highlighting, but preserve checkmate state
      newBoard.forEach((square, i) => {
        if (i !== absTo && 'state' in square) {
          if (square.state === 'arrived') {
            square.state = '';
          }
          // Keep checkmate state if it exists
        }
      });

      // Apply checkmate highlighting when checkmate occurs
      if (isPositionCheckmate) {
        applyCheckmateHighlighting(newBoard);
      }

      return {
        ...prev,
        board: newBoard,
        isCheckmate: isPositionCheckmate
      };
    });

    if (isLastMove) {
      setPuzzleState((prev) => {
        const next = { ...prev, phase: 'SUCCESS' as const };
        return next;
      });

      setPromotionPending(null);

      if (submittingResult) {
        console.warn(
          'Puzzle result already being submitted, ignoring duplicate'
        );
        return true;
      }

      setSubmittingResult(true);

      if (inTimeAttack) {
        const promoResp = await timeAttack.submit({ solved: true });

        if (promoResp.finished) {
          setExpiresAt(null);
          setMode({
            type: 'time_trial_completed',
            success: promoResp.success || false,
            newLevel: promoResp.success ? maxLevelUnlocked + 1 : undefined
          });

          await Promise.all([refreshLevels(), refreshPromotion()]);
        } else if (promoResp.nextPuzzle) {
          setPromoSolved((n) => n + 1);
          setPuzzleState((prev) => ({
            ...prev,
            phase: 'TA_CLEAR',
            autoPlaying: true
          }));

          await sleep(breakDuration);

          updatePuzzle(promoResp.nextPuzzle);
          setPuzzleState((p) => ({
            ...p,
            phase: 'WAIT_USER',
            autoPlaying: false
          }));
          setExpiresAt(Date.now() + 30_000);
          return true; // skip normal completion logic
        }
      } else {
        await onPuzzleComplete({
          solved: true,
          xpEarned: 500,
          attemptsUsed: puzzleState.attemptsUsed + 1
        });

        // Refresh daily stats immediately after puzzle completion
        const stats = await loadChessDailyStats();
        setDailyStats(stats);
      }

      setSubmittingResult(false);

      return true;
    }

    const nextMove = puzzle.moves[newSolutionIndex];
    if (nextMove && !wasTransposition) {
      setPuzzleState((prev) => ({ ...prev, phase: 'ANIM_ENGINE' }));

      animationTimeoutRef.current = window.setTimeout(() => {
        makeEngineMove(nextMove);

        const finalIndex = newSolutionIndex + 1;
        const puzzleComplete = finalIndex >= puzzle.moves.length;

        setPuzzleState((prev) => ({
          ...prev,
          phase: puzzleComplete ? 'SUCCESS' : 'WAIT_USER',
          solutionIndex: finalIndex
        }));

        if (puzzleComplete) {
          setPromotionPending(null);
        }
      }, 450);
    } else {
      const puzzleComplete = newSolutionIndex >= puzzle.moves.length;

      if (wasTransposition && engineReply) {
        makeEngineMove(engineReply);
      }

      setPuzzleState((prev) => ({
        ...prev,
        phase: puzzleComplete ? 'SUCCESS' : 'WAIT_USER',
        solutionIndex: newSolutionIndex
      }));

      if (puzzleComplete) {
        setPromotionPending(null);
      }
    }

    return true;
  }

  function applyCheckmateHighlighting(board: any[]) {
    if (!chessRef.current?.isCheckmate()) return;

    // Find the king that is in checkmate (the side to move is checkmated)
    const checkmatedSide = chessRef.current.turn() === 'w' ? 'white' : 'black';

    for (let i = 0; i < board.length; i++) {
      const piece = board[i];
      if (
        piece.isPiece &&
        piece.type === 'king' &&
        piece.color === checkmatedSide
      ) {
        // Apply checkmate state to the king's square
        piece.state = 'checkmate';
        break;
      }
    }
  }

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
      makeEngineMove(puzzle.moves[0]);
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
      makeEngineMove(move);

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

    // Immediately clear the timer to prevent multiple calls
    setExpiresAt(null);

    showCompleteSolution();

    setPuzzleState((prev) => ({ ...prev, phase: 'SOLUTION' }));

    if (submittingResult) {
      console.warn('Result already being submitted, ignoring time up');
      return;
    }

    setSubmittingResult(true);

    try {
      const promoResp = await timeAttack.submit({ solved: false });

      if (promoResp.finished) {
        setMode({ type: 'time_trial_completed', success: false });
        await Promise.all([refreshLevels(), refreshPromotion()]);
      }
    } catch (error) {
      console.error('Error submitting time up result:', error);
    } finally {
      setSubmittingResult(false);
    }
  }

  function handleNextPuzzle() {
    if (
      !puzzle ||
      puzzleState.phase !== 'SUCCESS' ||
      nextPuzzleLoading ||
      submittingResult
    )
      return;

    setNextPuzzleLoading(true);

    if (submittingResult) {
      console.warn('Result already submitted, skipping duplicate');
      return;
    }

    setSubmittingResult(true);

    onPuzzleComplete({
      solved: true,
      xpEarned: 500,
      attemptsUsed: puzzleState.attemptsUsed + 1
    });
  }

  function handleCelebrationComplete() {
    setMode({ type: 'playing' });
    setExpiresAt(null);
    setPromoSolved(0);
  }

  function resetToOriginalPosition() {
    if (!puzzle || !originalPosition || !chessRef.current) return;

    solutionPlayingRef.current = false;
    const { startFen } = normalisePuzzle(puzzle.fen);
    const chess = new Chess(startFen);

    chessRef.current = chess;
    setChessBoardState((prev) => {
      if (!prev || !originalPosition) return prev;
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
      phase: 'ANIM_ENGINE',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: prev.attemptsUsed + 1
    }));

    animationTimeoutRef.current = window.setTimeout(() => {
      makeEngineMove(puzzle.moves[0]);
      setPuzzleState((prev) => ({
        ...prev,
        phase: 'WAIT_USER',
        solutionIndex: 1
      }));
    }, 450);
  }

  function handleNewPuzzleClick() {
    // If we just finished a failed time attack, ensure promotion status is updated
    if (mode.type === 'time_trial_completed' && !mode.success) {
      refreshPromotion();
    }

    // Reset mode when starting a new puzzle
    setMode({ type: 'playing' });

    if (onNewPuzzle) {
      onNewPuzzle(currentLevel);
    } else {
      handleNextPuzzle();
    }
  }
}

function viewToBoard(index: number, isBlack: boolean): number {
  if (!isBlack) return index;
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

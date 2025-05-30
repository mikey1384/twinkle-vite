import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import {
  uciToSquareIndices,
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle
} from '../helpers/puzzleHelpers';
import { LichessPuzzle } from '~/types/chess';
import {
  validateMoveAsync,
  createPuzzleMove
} from '../helpers/multiPlyHelpers';
import { PuzzleResult, ChessBoardState, MultiPlyPuzzleState } from '../types';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useAppContext } from '~/contexts';
import { useChessLevels } from '../hooks/useChessLevels';
import { usePromotionStatus } from '../hooks/usePromotionStatus';
import useTimeAttackPromotion from '../hooks/useTimeAttackPromotion';
import StatusHeader from './StatusHeader';
import ThemeDisplay from './ThemeDisplay';
import RightPanel from './RightPanel';
import PromotionPicker from './PromotionPicker';
import { surface, borderSubtle, shadowCard, radiusCard } from './styles';

function viewToBoard(index: number, isBlack: boolean): number {
  if (!isBlack) return index;
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col);
}

interface PuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onNewPuzzle?: (level: number) => void;
  selectedLevel?: number;
  onLevelChange?: (level: number) => void;
  updatePuzzle: (puzzle: LichessPuzzle) => void;
}

export default function Puzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp,
  onNewPuzzle,
  selectedLevel,
  onLevelChange,
  updatePuzzle
}: PuzzleProps) {
  // ------------------------------
  // 🔑  HOOKS + REFS
  // ------------------------------
  const { userId } = useKeyContext((v) => v.myState);
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );

  // New hooks for level management and promotion
  const {
    levels,
    maxLevelUnlocked,
    loading: levelsLoading,
    refresh: refreshLevels
  } = useChessLevels();
  const { needsPromotion, cooldownSeconds } = usePromotionStatus();

  // ⏱ time‑attack promotion controller
  const timeAttack = useTimeAttackPromotion();

  // Guard helper – are we currently in a run?
  const inTimeAttack = Boolean(timeAttack.runId);

  // Use parent's selectedLevel directly - no local state needed
  const currentLevel = selectedLevel || 1;

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

  const chessRef = useRef<Chess | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationTimeoutRef = useRef<number | null>(null);
  const aliveRef = useRef(true); // Track if component is mounted

  // ------------------------------
  // 🔄  ORIGINAL GAME LOGIC
  // ------------------------------

  useEffect(() => {
    if (!puzzle || !userId) return;

    const { startFen, playerColor, enginePlaysFirst } = normalisePuzzle(
      puzzle.fen,
      puzzle.moves
    );

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
      phase: enginePlaysFirst ? 'ANIM_ENGINE' : 'WAIT_USER',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: 0,
      showingHint: false,
      autoPlaying: false
    });

    if (enginePlaysFirst) {
      animationTimeoutRef.current = window.setTimeout(() => {
        makeEngineMove(puzzle.moves[0]);
        setPuzzleState((prev) => ({
          ...prev,
          phase: 'WAIT_USER',
          solutionIndex: 1
        }));
      }, 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, userId]);

  useEffect(() => {
    return () => {
      aliveRef.current = false; // Mark as unmounted
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Clear next puzzle loading when puzzle changes
  useEffect(() => {
    setNextPuzzleLoading(false);
    setSubmittingResult(false); // Reset submission state for new puzzle
  }, [puzzle]);

  // Load daily stats
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

  const resetToOriginalPosition = useCallback(() => {
    if (!puzzle || !originalPosition || !chessRef.current) return;

    const { startFen, enginePlaysFirst } = normalisePuzzle(
      puzzle.fen,
      puzzle.moves
    );
    const chess = new Chess(startFen);

    chessRef.current = chess;
    setChessBoardState((prev) => {
      if (!prev || !originalPosition) return prev;
      return { ...originalPosition };
    });
    setSelectedSquare(null);
    setPuzzleState((prev) => ({
      ...prev,
      phase: enginePlaysFirst ? 'ANIM_ENGINE' : 'WAIT_USER',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: prev.attemptsUsed + 1
    }));

    if (enginePlaysFirst) {
      animationTimeoutRef.current = window.setTimeout(() => {
        makeEngineMove(puzzle.moves[0]);
        setPuzzleState((prev) => ({
          ...prev,
          phase: 'WAIT_USER',
          solutionIndex: 1
        }));
      }, 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, originalPosition]);

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

      newBoard.forEach((square, i) => {
        if (i !== toIndex && 'state' in square && square.state === 'arrived') {
          square.state = '';
        }
      });

      return {
        ...prev,
        board: newBoard
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

      // Convert view coordinate to absolute coordinate for piece lookup
      const isBlack = chessBoardState.playerColors[userId] === 'black';
      const absClickedSquare = viewToBoard(clickedSquare, isBlack);

      const clickedPiece = chessBoardState.board[absClickedSquare];
      const playerColor = chessBoardState.playerColors[userId];

      // If no piece selected
      if (selectedSquare === null) {
        if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
          setSelectedSquare(clickedSquare);
          // Legal targets are now calculated by ChessBoard component
        }
        return;
      }

      // If clicking same square, deselect
      if (selectedSquare === clickedSquare) {
        setSelectedSquare(null);
        return;
      }

      // If clicking another own piece, select it
      if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
        setSelectedSquare(clickedSquare);
        // Legal targets are now calculated by ChessBoard component
        return;
      }

      // Try to make move
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

  const handleNextPuzzle = useCallback(() => {
    if (
      !puzzle ||
      puzzleState.phase !== 'SUCCESS' ||
      nextPuzzleLoading ||
      submittingResult
    )
      return;

    setNextPuzzleLoading(true);

    // Guard against double submission
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, puzzleState, nextPuzzleLoading, submittingResult]);

  const handlePromotionClick = useCallback(async () => {
    if (startingPromotion) return; // Guard against double-click

    setStartingPromotion(true);
    try {
      // 1. kick off the run (also sets internal runId)
      const { puzzle: promoPuzzle } = await timeAttack.start();

      // 2. force‑switch UI to that puzzle (level is current max)
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

      // 3. refresh user data (levels / promo status)
      await refreshLevels();
    } catch (err) {
      console.error('❌ failed starting time‑attack:', err);
    } finally {
      setStartingPromotion(false);
    }
  }, [startingPromotion, refreshLevels, timeAttack, updatePuzzle]);

  const containerCls = css`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    box-sizing: border-box;
    background: ${surface};
    border: 1px solid ${borderSubtle};
    border-radius: ${radiusCard};
    box-shadow: ${shadowCard};
    transition: box-shadow 0.3s ease;

    @media (max-width: ${mobileMaxWidth}) {
      padding: 1.5rem;
      gap: 1.25rem;
    }
  `;

  const gridCls = css`
    display: grid;
    grid-template-columns: 1fr auto 260px;
    grid-template-areas: 'board gap right';
    gap: 1.5rem;
    flex-grow: 1;
    min-height: 0;
    @media (max-width: ${mobileMaxWidth}) {
      grid-template-columns: 1fr;
      grid-template-areas: 'board' 'right';
    }
  `;

  const boardAreaCls = css`
    grid-area: board;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  `;

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div className={containerCls}>
      <StatusHeader phase={puzzleState.phase} />

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
          cooldownSeconds={cooldownSeconds || null}
          startingPromotion={startingPromotion}
          onPromotionClick={handlePromotionClick}
          dailyStats={dailyStats}
          puzzleState={puzzleState}
          nextPuzzleLoading={nextPuzzleLoading}
          onNewPuzzleClick={handleNewPuzzleClick}
          onResetPosition={resetToOriginalPosition}
          onGiveUp={onGiveUp}
          inTimeAttack={inTimeAttack}
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

    const expectedMove = puzzle.moves[puzzleState.solutionIndex];
    const engineReply = puzzle.moves[puzzleState.solutionIndex + 1];

    const isCorrect = await validateMoveAsync({
      userMove: {
        from: fromAlgebraic,
        to: toAlgebraic,
        promotion: move.promotion
      },
      expectedMove,
      fen: fenBeforeMove,
      engineReply
    });

    if (!aliveRef.current) return false;

    if (!isCorrect) {
      setPuzzleState((prev) => {
        const next = {
          ...prev,
          phase: 'FAIL' as const,
          attemptsUsed: prev.attemptsUsed + 1
        };
        return next;
      });
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

      newBoard.forEach((square, i) => {
        if (i !== absTo && 'state' in square && square.state === 'arrived') {
          square.state = '';
        }
      });

      return {
        ...prev,
        board: newBoard
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

      // ─── Promotion run or normal attempt ──────────────────────────
      if (inTimeAttack) {
        // send result to /promotion/timeattack/attempt
        const promoResp = await timeAttack.submit({ solved: true });

        if (promoResp.finished) {
          // show celebratory state + refresh app‑wide stats
          await refreshLevels();

          if (promoResp.success) {
            onLevelChange?.(levels.length);
          }
        } else if (promoResp.nextPuzzle) {
          updatePuzzle(promoResp.nextPuzzle);
          setSubmittingResult(false);
          return true; // skip normal completion logic
        }
      } else {
        await onPuzzleComplete({
          solved: true,
          xpEarned: 500,
          attemptsUsed: puzzleState.attemptsUsed + 1
        });
      }

      const stats = await loadChessDailyStats();
      setDailyStats(stats);

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

  function handleNewPuzzleClick() {
    if (onNewPuzzle) {
      onNewPuzzle(currentLevel);
    } else {
      handleNextPuzzle();
    }
  }
}

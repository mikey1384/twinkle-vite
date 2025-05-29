import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import {
  LichessPuzzle,
  uciToSquareIndices,
  indexToAlgebraic,
  fenToBoardState,
  normalisePuzzle
} from './helpers/puzzleHelpers';
import { validateMoveAsync, createPuzzleMove } from './helpers/multiPlyHelpers';
import { PuzzleResult, ChessBoardState, MultiPlyPuzzleState } from './types';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color } from '~/constants/css';
import { useKeyContext, useAppContext } from '~/contexts';
import Button from '~/components/Button';
import { cloudFrontURL } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useChessLevels } from './hooks/useChessLevels';
import { usePromotionStatus } from './hooks/usePromotionStatus';

const surface = '#ffffff';
const surfaceAlt = '#f7f7f7';
const borderSubtle = '#dddddd';

// Sophisticated shadow system like Airbnb
const shadowCard = '0 6px 16px rgba(0,0,0,0.12)';
const shadowButton = '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)';
const shadowButtonHover =
  '0 2px 4px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.1)';

// Refined border radius
const radiusCard = '12px';
const radiusButton = '8px';
const radiusSmall = '6px';

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
  loading?: boolean;
  refreshTrigger?: number;
  selectedLevel?: number;
  onLevelChange?: (level: number) => void;
}

export default function Puzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp,
  onNewPuzzle,
  loading: _loading,
  refreshTrigger,
  selectedLevel,
  onLevelChange
}: PuzzleProps) {
  // ------------------------------
  // 🔑  HOOKS + REFS
  // ------------------------------
  const { userId } = useKeyContext((v) => v.myState);
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const loadChessDailyStats = useAppContext(
    (v) => v.requestHelpers.loadChessDailyStats
  );
  const startChessPromotion = useAppContext(
    (v) => v.requestHelpers.startChessPromotion
  );

  // New hooks for level management and promotion
  const {
    levels,
    maxLevelUnlocked,
    loading: levelsLoading,
    refresh: refreshLevels
  } = useChessLevels();
  const {
    needsPromotion,
    targetRating,
    token,
    cooldownSeconds,
    loading: promoLoading,
    refresh: refreshPromotion
  } = usePromotionStatus();

  // Use parent's selectedLevel directly - no local state needed
  const currentLevel = selectedLevel || 1;

  const [dailyStats, setDailyStats] = useState<{
    puzzlesSolved: number;
    xpEarnedToday: number;
  } | null>(null);

  const [puzzleState, setPuzzleState] = useState<MultiPlyPuzzleState>({
    phase: 'WAIT_USER',
    solutionIndex: 0,
    moveHistory: [],
    attemptsUsed: 0,
    showingHint: false,
    autoPlaying: false
  });

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

    const fetchDailyStats = async () => {
      try {
        const stats = await loadChessDailyStats();
        setDailyStats(stats);
      } catch (error) {
        console.error('Failed to load chess daily stats:', error);
      }
    };

    fetchDailyStats();
  }, [userId, loadChessDailyStats]);

  // Refresh daily stats when refreshTrigger changes (when XP is earned)
  useEffect(() => {
    if (!userId || !refreshTrigger) return;

    const refreshStats = async () => {
      try {
        const stats = await loadChessDailyStats();
        setDailyStats(stats);
      } catch (error) {
        console.error('Failed to refresh chess daily stats:', error);
      }
    };

    refreshStats();
  }, [refreshTrigger, userId, loadChessDailyStats]);

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

      return await finishMove(
        from,
        to,
        fromAlgebraic,
        toAlgebraic,
        fenBeforeMove
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState, onPuzzleComplete]
  );

  const finishMove = useCallback(
    async (
      from: number,
      to: number,
      fromAlgebraic: string,
      toAlgebraic: string,
      fenBeforeMove: string,
      promotion?: string
    ) => {
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
      const engineReply = puzzle.moves[puzzleState.solutionIndex + 1]; // Next move after expected

      // Use async validation with engine evaluation for alternative moves
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

      // Safety check: don't update state if component was unmounted
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

      // Check if this was a transposition (alternative move leading to same position)
      const userUci = move.from + move.to + (move.promotion || '');
      const wasTransposition = userUci !== expectedMove && engineReply;

      // Correct move - update state
      const newMoveHistory = [
        ...puzzleState.moveHistory,
        createPuzzleMove({
          uci: move.from + move.to + (move.promotion || ''),
          fen: fenBeforeMove // Use FEN from before the move, not after
        })
      ];

      // If transposition, we advance by 2 (user move + engine reply consumed in validation)
      // Otherwise advance by 1 (just user move)
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

      // Update visual board state to show the move
      const isBlack = chessBoardState?.playerColors[userId] === 'black';
      setChessBoardState((prev) => {
        if (!prev) return prev;

        // Convert view coordinates to absolute coordinates for board array access
        const absFrom = viewToBoard(from, isBlack);
        const absTo = viewToBoard(to, isBlack);

        const newBoard = [...prev.board];
        const movingPiece = { ...newBoard[absFrom] };

        // Handle promotion - update piece type if promoted
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

        // Clear previous arrived states
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
        // Puzzle completed!
        setPuzzleState((prev) => {
          const next = { ...prev, phase: 'SUCCESS' as const };
          return next;
        });

        // Clear any pending promotion modal
        setPromotionPending(null);

        // Guard against double submission
        if (submittingResult) {
          console.warn(
            'Puzzle result already being submitted, ignoring duplicate'
          );
          return true;
        }

        setSubmittingResult(true);

        // Immediately update XP and daily stats when puzzle is solved
        const timeSpent = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        onPuzzleComplete({
          solved: true,
          xpEarned: 500, // Fixed 500 XP per puzzle (backend will handle actual calculation)
          timeSpent,
          attemptsUsed: puzzleState.attemptsUsed + 1
        });

        return true;
      }

      // Check if there's an engine reply
      const nextMove = puzzle.moves[newSolutionIndex];
      if (nextMove && !wasTransposition) {
        // Only play engine move if this wasn't a transposition
        // (transpositions already "consumed" the engine reply in validation)
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
        // No engine reply, or this was a transposition - go directly to next state
        const puzzleComplete = newSolutionIndex >= puzzle.moves.length;

        // If this was a transposition and there's an engine reply, we need to apply it visually
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chessRef,
      puzzle,
      puzzleState,
      chessBoardState,
      userId,
      makeEngineMove,
      onPuzzleComplete
    ]
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
    [
      chessBoardState,
      selectedSquare,
      userId,
      puzzleState.phase,
      handleUserMove,
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

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    onPuzzleComplete({
      solved: true,
      xpEarned: 500, // Fixed 500 XP per puzzle (backend will handle actual calculation)
      timeSpent,
      attemptsUsed: puzzleState.attemptsUsed + 1
    });
  }, [
    puzzle,
    puzzleState,
    nextPuzzleLoading,
    submittingResult,
    onPuzzleComplete
  ]);

  const handlePromotionClick = useCallback(async () => {
    if (!token || !targetRating) return;

    try {
      await startChessPromotion({ token, success: true, targetRating });

      // Refresh both promotion status and levels after completion
      await Promise.all([refreshPromotion(), refreshLevels()]);

      // Sync level state with parent modal
      const newLevel = currentLevel + 1;
      onLevelChange?.(newLevel);

      // Jump to newly-unlocked level if onNewPuzzle is available
      if (onNewPuzzle) {
        onNewPuzzle(newLevel);
      }
    } catch (error) {
      console.error('Failed to start promotion:', error);
    }
  }, [
    token,
    targetRating,
    startChessPromotion,
    refreshPromotion,
    refreshLevels,
    onLevelChange,
    onNewPuzzle,
    currentLevel
  ]);

  const handleNewPuzzleClick = useCallback(() => {
    if (onNewPuzzle) {
      onNewPuzzle(currentLevel);
    } else {
      handleNextPuzzle();
    }
  }, [onNewPuzzle, currentLevel, handleNextPuzzle]);

  // ------------------------------
  // 🎨  CLEAN MODERN STYLES
  // ------------------------------
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

  const statusHeaderCls = css`
    text-align: center;
    padding: 0.75rem 1.5rem;
    border-radius: ${radiusSmall};
    font-size: 1.5rem;
    font-weight: 600;
    background: ${puzzleState.phase === 'SUCCESS'
      ? Color.green(0.1)
      : puzzleState.phase === 'FAIL'
      ? Color.red(0.1)
      : Color.logoBlue(0.08)};
    color: ${puzzleState.phase === 'SUCCESS'
      ? Color.green()
      : puzzleState.phase === 'FAIL'
      ? Color.red()
      : Color.logoBlue()};
    border: 1px solid
      ${puzzleState.phase === 'SUCCESS'
        ? Color.green(0.3)
        : puzzleState.phase === 'FAIL'
        ? Color.red(0.3)
        : Color.logoBlue(0.2)};
  `;

  const themeCls = css`
    background: ${Color.orange(0.08)};
    border: 1px solid ${Color.orange(0.3)};
    border-radius: ${radiusSmall};
    padding: 0.5rem 1rem;
    text-align: center;
    font-size: 1.2rem;
    color: ${Color.orange()};
    font-weight: 500;
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

  const rightPanelCls = css`
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: ${surfaceAlt};
    border: 1px solid ${borderSubtle};
    border-radius: ${radiusCard};
    padding: 1.25rem;
    box-shadow: ${shadowCard};
  `;

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div className={containerCls}>
      {/* Status Header */}
      <div className={statusHeaderCls}>
        {puzzleState.phase === 'SUCCESS' && '🎉 Puzzle solved!'}
        {puzzleState.phase === 'FAIL' && '❌ Try again!'}
        {puzzleState.phase === 'WAIT_USER' && `🎯 Find the best move`}
        {puzzleState.phase === 'ANIM_ENGINE' && '⏳ Opponent responds...'}
      </div>

      {/* Puzzle Theme Context */}
      {puzzle.themes.length > 0 && (
        <div className={themeCls}>
          Theme:{' '}
          {puzzle.themes
            .join(', ')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()}
        </div>
      )}

      {/* Main Grid */}
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
            opponentName="AI"
            enPassantTarget={chessBoardState.enPassantTarget || undefined}
            selectedSquare={selectedSquare}
            game={chessRef.current || undefined}
          />
        </div>

        {/* Right Panel */}
        <div className={rightPanelCls}>
          {/* Level Selector */}
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              margin-bottom: 0.75rem;
            `}
          >
            {levels?.length > 1 && (
              <label
                className={css`
                  font-size: 0.9rem;
                  font-weight: 600;
                  color: ${Color.logoBlue()};
                `}
              >
                Puzzle Level
              </label>
            )}
            {levels?.length > 1 && (
              <select
                disabled={levelsLoading}
                value={currentLevel}
                onChange={(e) => {
                  const newLevel = Number(e.target.value);
                  console.log('🔍 Dropdown changed to:', newLevel);
                  console.log('🔍 Current selectedLevel:', currentLevel);
                  console.log('🔍 Parent selectedLevel:', selectedLevel);

                  onLevelChange?.(newLevel);
                }}
                className={css`
                  padding: 0.5rem;
                  border: 1px solid ${Color.borderGray()};
                  border-radius: ${radiusSmall};
                  background: white;
                  font-size: 0.9rem;
                  cursor: pointer;

                  &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                  }
                `}
              >
                {levels
                  .filter((l) => l <= maxLevelUnlocked)
                  .map((level) => (
                    <option key={level} value={level}>
                      Level {level}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Current Level Badge */}
          <div
            style={{
              background: Color.logoBlue(0.08),
              border: `1px solid ${Color.logoBlue(0.3)}`,
              borderRadius: radiusSmall,
              padding: '0.5rem 1rem',
              fontWeight: 600,
              alignSelf: 'flex-start',
              marginBottom: '0.75rem'
            }}
          >
            Level {currentLevel}
          </div>

          {/* Promotion CTA */}
          {!promoLoading && (
            <>
              {needsPromotion ? (
                <button
                  onClick={handlePromotionClick}
                  className={css`
                    background: linear-gradient(
                      135deg,
                      #f87171 0%,
                      #ef4444 100%
                    );
                    color: #fff;
                    border: none;
                    border-radius: ${radiusButton};
                    padding: 0.75rem 1.25rem;
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
                    animation: pulse 1.2s infinite;
                    cursor: pointer;
                    margin-bottom: 0.75rem;

                    @keyframes pulse {
                      0% {
                        transform: scale(1);
                      }
                      50% {
                        transform: scale(1.05);
                      }
                      100% {
                        transform: scale(1);
                      }
                    }

                    &:hover {
                      background: linear-gradient(
                        135deg,
                        #ef4444 0%,
                        #dc2626 100%
                      );
                    }
                  `}
                >
                  🔥 Promotion unlocked! Play now
                </button>
              ) : cooldownSeconds ? (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: Color.gray(),
                    textAlign: 'center',
                    marginBottom: '0.75rem'
                  }}
                >
                  Next promotion in {cooldownSeconds}s
                </div>
              ) : null}
            </>
          )}

          {/* Daily XP Stats */}
          {dailyStats && (
            <div
              className={css`
                background: ${Color.logoBlue(0.08)};
                border: 1px solid ${Color.logoBlue(0.2)};
                border-radius: ${radiusSmall};
                padding: 1rem;
                text-align: center;
                margin-bottom: 0.75rem;
              `}
            >
              <div
                className={css`
                  font-size: 0.9rem;
                  color: ${Color.logoBlue()};
                  font-weight: 600;
                  margin-bottom: 0.5rem;
                `}
              >
                Today's Progress
              </div>
              <div
                className={css`
                  font-size: 1.3rem;
                  font-weight: 700;
                  color: ${Color[xpNumberColor]()};
                  margin-bottom: 0.25rem;
                `}
              >
                {addCommasToNumber(dailyStats.xpEarnedToday)}{' '}
                <span
                  className={css`
                    color: ${Color.gold()};
                  `}
                >
                  XP
                </span>
              </div>
              <div
                className={css`
                  font-size: 0.85rem;
                  color: ${Color.logoBlue(0.8)};
                `}
              >
                {dailyStats.puzzlesSolved} puzzle
                {dailyStats.puzzlesSolved !== 1 ? 's' : ''} solved
              </div>
            </div>
          )}

          {puzzleState.phase === 'FAIL' && (
            <Button color="logoBlue" onClick={resetToOriginalPosition}>
              🔄 Try Again
            </Button>
          )}

          {/* Main Actions - Success shows Next Puzzle, otherwise Reset/Give Up */}
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              margin-top: auto;
              margin-bottom: auto;
            `}
          >
            {puzzleState.phase === 'SUCCESS' && onNewPuzzle ? (
              <button
                onClick={handleNewPuzzleClick}
                disabled={nextPuzzleLoading}
                className={css`
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  border: none;
                  border-radius: ${radiusButton};
                  padding: 1rem 1.5rem;
                  font-size: 1.1rem;
                  font-weight: 600;
                  color: white;
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  box-shadow: ${shadowButton};
                  position: relative;
                  overflow: hidden;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.5rem;
                  min-height: 48px;

                  &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                      90deg,
                      transparent,
                      rgba(255, 255, 255, 0.2),
                      transparent
                    );
                    transition: left 0.5s ease;
                  }

                  &:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: ${shadowButtonHover};

                    &::before {
                      left: 100%;
                    }
                  }

                  &:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: ${shadowButton};
                  }

                  &:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: ${shadowButton};
                  }
                `}
              >
                {nextPuzzleLoading ? (
                  <>
                    <div
                      className={css`
                        width: 16px;
                        height: 16px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-top: 2px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;

                        @keyframes spin {
                          from {
                            transform: rotate(0deg);
                          }
                          to {
                            transform: rotate(360deg);
                          }
                        }
                      `}
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    <Icon
                      icon="arrow-right"
                      className={css`
                        transition: transform 0.2s ease;
                        margin-right: 0.5rem;

                        button:hover & {
                          transform: translateX(2px);
                        }
                      `}
                    />
                    Next Puzzle
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={resetToOriginalPosition}
                  disabled={puzzleState.autoPlaying}
                  className={css`
                    background: ${surface};
                    border: 1px solid ${borderSubtle};
                    border-radius: ${radiusButton};
                    padding: 0.875rem 1.25rem;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #222222;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: ${shadowButton};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;

                    &:hover:not(:disabled) {
                      background: ${surface};
                      border-color: #222222;
                      color: #222222;
                      box-shadow: ${shadowButtonHover};
                      transform: translateY(-1px);
                    }

                    &:active:not(:disabled) {
                      transform: translateY(0);
                      box-shadow: ${shadowButton};
                    }

                    &:disabled {
                      opacity: 0.6;
                      cursor: not-allowed;
                      transform: none;
                      box-shadow: ${shadowButton};
                    }
                  `}
                >
                  ↺ Reset
                </button>

                {onGiveUp && (
                  <button
                    onClick={onGiveUp}
                    disabled={puzzleState.autoPlaying}
                    className={css`
                      background: ${surface};
                      border: 1px solid ${borderSubtle};
                      border-radius: ${radiusButton};
                      padding: 0.875rem 1.25rem;
                      font-size: 1rem;
                      font-weight: 600;
                      color: #222222;
                      cursor: pointer;
                      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                      box-shadow: ${shadowButton};
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 0.5rem;

                      &:hover:not(:disabled) {
                        background: ${surface};
                        color: #d93025;
                        border-color: #d93025;
                        box-shadow: ${shadowButtonHover};
                        transform: translateY(-1px);
                      }

                      &:active:not(:disabled) {
                        transform: translateY(0);
                        box-shadow: ${shadowButton};
                      }

                      &:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
                        box-shadow: ${shadowButton};
                      }
                    `}
                  >
                    Give Up
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Promotion Picker Modal */}
      {promotionPending && (
        <PromotionPicker
          color={chessBoardState?.playerColors[userId] || 'white'}
          onSelect={async (piece) => {
            const { fenBeforeMove } = promotionPending;
            const success = await finishMove(
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
}

// Simple Promotion Picker Component
function PromotionPicker({
  color,
  onSelect,
  onCancel
}: {
  color: 'white' | 'black';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}) {
  const pieceImages = {
    white: {
      q: `${cloudFrontURL}/assets/chess/WhiteQueen.svg`,
      r: `${cloudFrontURL}/assets/chess/WhiteRook.svg`,
      b: `${cloudFrontURL}/assets/chess/WhiteBishop.svg`,
      n: `${cloudFrontURL}/assets/chess/WhiteKnight.svg`
    },
    black: {
      q: `${cloudFrontURL}/assets/chess/BlackQueen.svg`,
      r: `${cloudFrontURL}/assets/chess/BlackRook.svg`,
      b: `${cloudFrontURL}/assets/chess/BlackBishop.svg`,
      n: `${cloudFrontURL}/assets/chess/BlackKnight.svg`
    }
  };

  const pieceNames = {
    q: 'Queen',
    r: 'Rook',
    b: 'Bishop',
    n: 'Knight'
  };

  return (
    <div
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}
    >
      <div
        className={css`
          background: ${surface};
          border: 1px solid ${borderSubtle};
          border-radius: ${radiusCard};
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          text-align: center;
          max-width: 360px;
          width: 90%;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      >
        <h3
          className={css`
            margin: 0 0 2rem 0;
            color: #222222;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.01em;
          `}
        >
          Choose promotion piece
        </h3>

        <div
          className={css`
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
          `}
        >
          {(['q', 'r', 'b', 'n'] as const).map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className={css`
                background: ${surface};
                border: 1px solid ${borderSubtle};
                border-radius: ${radiusButton};
                padding: 1.25rem;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: ${shadowButton};
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;

                &:hover {
                  background: ${surface};
                  border-color: #222222;
                  transform: translateY(-2px);
                  box-shadow: ${shadowButtonHover};
                }

                &:active {
                  transform: translateY(0);
                  box-shadow: ${shadowButton};
                }
              `}
            >
              <img
                src={pieceImages[color][piece]}
                alt={pieceNames[piece]}
                className={css`
                  width: 48px;
                  height: 48px;
                  transition: transform 0.2s ease;

                  button:hover & {
                    transform: scale(1.05);
                  }
                `}
              />
              <span
                className={css`
                  font-size: 1rem;
                  font-weight: 600;
                  color: #222222;
                  letter-spacing: -0.01em;
                `}
              >
                {pieceNames[piece]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className={css`
            width: 100%;
            background: ${surface};
            border: 1px solid ${borderSubtle};
            border-radius: ${radiusButton};
            padding: 0.875rem 1.25rem;
            font-size: 1rem;
            font-weight: 600;
            color: #222222;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: ${shadowButton};

            &:hover {
              background: ${surface};
              border-color: #222222;
              box-shadow: ${shadowButtonHover};
              transform: translateY(-1px);
            }

            &:active {
              transform: translateY(0);
              box-shadow: ${shadowButton};
            }
          `}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

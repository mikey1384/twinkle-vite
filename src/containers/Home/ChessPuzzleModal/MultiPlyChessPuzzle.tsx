import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import {
  calculatePuzzleXP,
  LichessPuzzle,
  uciToSquareIndices,
  indexToAlgebraic,
  algebraicToIndex,
  fenToBoardState,
  normalisePuzzle
} from './helpers/puzzleHelpers';
import { validateMove, createPuzzleMove } from './helpers/multiPlyHelpers';
import { PuzzleResult, ChessBoardState, MultiPlyPuzzleState } from './types';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import Button from '~/components/Button';
import { cloudFrontURL } from '~/constants/defaultValues';

// ------------------------------
// ✨  CLEAN THEME CONSTANTS
// ------------------------------
// Centralise style tweaks / variables here so it is easy to iterate
const surface = '#ffffff';
const surfaceAlt = '#f9fafb';
const borderSoft = '#e5e7eb';
const shadowSm = '0 1px 4px rgba(0,0,0,0.05)';
const shadowMd = '0 4px 20px rgba(0,0,0,0.08)';
const radiusLg = '20px';
const radiusMd = '12px';

function viewToBoard(index: number, isBlack: boolean): number {
  if (!isBlack) return index;
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col);
}

function boardToView(index: number, isBlack: boolean): number {
  if (!isBlack) return index;
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + (7 - col);
}

interface MultiPlyChessPuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onNewPuzzle?: () => void;
  loading?: boolean;
}

function getPuzzleDifficultyFromRating(
  rating: number
): 'easy' | 'medium' | 'hard' | 'expert' {
  if (rating < 1200) return 'easy';
  if (rating < 1800) return 'medium';
  if (rating < 2300) return 'hard';
  return 'expert';
}

export default function MultiPlyChessPuzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp,
  onNewPuzzle,
  loading: _loading
}: MultiPlyChessPuzzleProps) {
  // ------------------------------
  // 🔑  HOOKS + REFS
  // ------------------------------
  const { userId } = useKeyContext((v) => v.myState);

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
  const [legalTargets, setLegalTargets] = useState<number[]>([]);
  const [originalPosition, setOriginalPosition] = useState<any>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: number;
    to: number;
    fromAlgebraic: string;
    toAlgebraic: string;
    fenBeforeMove: string;
  } | null>(null);

  const chessRef = useRef<Chess | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationTimeoutRef = useRef<number | null>(null);

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
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

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
    setLegalTargets([]);
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
    (from: number, to: number) => {
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
        setLegalTargets([]);
        return true;
      }

      return finishMove(from, to, fromAlgebraic, toAlgebraic, fenBeforeMove);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState, onPuzzleComplete]
  );

  const finishMove = useCallback(
    (
      from: number,
      to: number,
      fromAlgebraic: string,
      toAlgebraic: string,
      fenBeforeMove: string,
      promotion?: string
    ) => {
      if (!chessRef.current || !puzzle) return false;

      const move = chessRef.current.move({
        from: fromAlgebraic,
        to: toAlgebraic,
        ...(promotion && { promotion })
      });

      if (!move) {
        return false;
      }

      const expectedMove = puzzle.moves[puzzleState.solutionIndex];
      const engineReply = puzzle.moves[puzzleState.solutionIndex + 1]; // Next move after expected

      const isCorrect = validateMove({
        userMove: {
          from: fromAlgebraic,
          to: toAlgebraic,
          promotion: move.promotion
        },
        expectedMove,
        fen: fenBeforeMove,
        engineReply
      });

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

        const timeSpent = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const xpEarned = calculatePuzzleXP({
          difficulty: getPuzzleDifficultyFromRating(puzzle.rating),
          solved: true,
          attemptsUsed: puzzleState.attemptsUsed + 1,
          timeSpent
        });

        setTimeout(() => {
          onPuzzleComplete({
            solved: true,
            xpEarned,
            timeSpent,
            attemptsUsed: puzzleState.attemptsUsed + 1
          });
        }, 1000);

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
            // Clear any pending promotion modal
            setPromotionPending(null);

            const timeSpent = Math.floor(
              (Date.now() - startTimeRef.current) / 1000
            );
            const xpEarned = calculatePuzzleXP({
              difficulty: getPuzzleDifficultyFromRating(puzzle.rating),
              solved: true,
              attemptsUsed: puzzleState.attemptsUsed + 1,
              timeSpent
            });

            setTimeout(() => {
              onPuzzleComplete({
                solved: true,
                xpEarned,
                timeSpent,
                attemptsUsed: puzzleState.attemptsUsed + 1
              });
            }, 1000);
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

          const timeSpent = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          const xpEarned = calculatePuzzleXP({
            difficulty: getPuzzleDifficultyFromRating(puzzle.rating),
            solved: true,
            attemptsUsed: puzzleState.attemptsUsed + 1,
            timeSpent
          });

          setTimeout(() => {
            onPuzzleComplete({
              solved: true,
              xpEarned,
              timeSpent,
              attemptsUsed: puzzleState.attemptsUsed + 1
            });
          }, 1000);
        }
      }

      return true;
    },
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
    (clickedSquare: number) => {
      if (!chessBoardState || puzzleState.phase !== 'WAIT_USER') return;

      // Convert view coordinate to absolute coordinate for piece lookup
      const isBlack = chessBoardState.playerColors[userId] === 'black';
      const absClickedSquare = viewToBoard(clickedSquare, isBlack);

      const clickedPiece = chessBoardState.board[absClickedSquare];
      const playerColor = chessBoardState.playerColors[userId];

      // If no piece selected
      if (selectedSquare === null) {
        if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
          setSelectedSquare(clickedSquare);

          // Calculate legal moves using Chess.js directly - more reliable than custom logic
          const fromAlgebraic = indexToAlgebraic(absClickedSquare);
          const moves = chessRef.current
            ? chessRef.current
                .moves({ square: fromAlgebraic as any, verbose: true })
                .map((m: any) => algebraicToIndex(m.to)) // abs indices
                .map((abs) => boardToView(abs, isBlack)) // view indices
            : [];

          setLegalTargets(moves);
        }
        return;
      }

      // If clicking same square, deselect
      if (selectedSquare === clickedSquare) {
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }

      // If clicking another own piece, select it
      if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
        setSelectedSquare(clickedSquare);

        // Calculate legal moves using Chess.js directly
        const fromAlgebraic = indexToAlgebraic(absClickedSquare);
        const moves = chessRef.current
          ? chessRef.current
              .moves({ square: fromAlgebraic as any, verbose: true })
              .map((m: any) => algebraicToIndex(m.to)) // abs indices
              .map((abs) => boardToView(abs, isBlack)) // view indices
          : [];

        setLegalTargets(moves);
        return;
      }

      // Try to make move
      const success = handleUserMove(selectedSquare, clickedSquare);
      if (success) {
        setSelectedSquare(null);
        setLegalTargets([]);
      }
    },
    [chessBoardState, selectedSquare, userId, puzzleState.phase, handleUserMove]
  );

  // ------------------------------
  // 🎨  CLEAN MODERN STYLES
  // ------------------------------
  const containerCls = css`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    box-sizing: border-box;
    background: ${surface};
    border: 1px solid ${borderSoft};
    border-radius: ${radiusLg};
    box-shadow: ${shadowSm};
  `;

  const statusHeaderCls = css`
    text-align: center;
    padding: 0.75rem 1.5rem;
    border-radius: ${radiusMd};
    font-size: 1.25rem;
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
    border-radius: ${radiusMd};
    padding: 0.5rem 1rem;
    text-align: center;
    font-size: 0.9rem;
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
    border: 1px solid ${borderSoft};
    border-radius: ${radiusLg};
    padding: 1.25rem;
    box-shadow: ${shadowSm};
  `;

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div className={containerCls}>
      {/* Status Header */}
      <div className={statusHeaderCls}>
        {puzzleState.phase === 'SUCCESS' &&
          '🎉 Puzzle solved! You found the winning line.'}
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
            legalTargets={legalTargets}
          />
        </div>

        {/* Right Panel */}
        <div className={rightPanelCls}>
          {puzzleState.phase === 'FAIL' && (
            <Button color="logoBlue" onClick={resetToOriginalPosition}>
              🔄 Try Again
            </Button>
          )}

          {puzzleState.phase === 'SUCCESS' && onNewPuzzle && (
            <Button color="green" onClick={onNewPuzzle}>
              ➡️ Next Puzzle
            </Button>
          )}

          {/* Secondary Actions */}
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              margin-top: auto;
              margin-bottom: auto;
            `}
          >
            <button
              onClick={resetToOriginalPosition}
              disabled={puzzleState.autoPlaying}
              className={css`
                background: ${surfaceAlt};
                border: 1px solid ${borderSoft};
                border-radius: 8px;
                padding: 0.75rem 1rem;
                font-size: 0.9rem;
                color: ${Color.darkerGray()};
                cursor: pointer;
                transition: all 0.2s;

                &:hover:not(:disabled) {
                  background: ${Color.blue(0.05)};
                  border-color: ${Color.logoBlue(0.3)};
                  color: ${Color.logoBlue()};
                }

                &:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
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
                  background: ${surfaceAlt};
                  border: 1px solid ${borderSoft};
                  border-radius: 8px;
                  padding: 0.75rem 1rem;
                  font-size: 0.9rem;
                  color: ${Color.darkerGray()};
                  cursor: pointer;
                  transition: all 0.2s;

                  &:hover:not(:disabled) {
                    background: ${Color.red(0.05)};
                    color: ${Color.red()};
                    border-color: ${Color.red(0.3)};
                  }

                  &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                  }
                `}
              >
                Give Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Promotion Picker Modal */}
      {promotionPending && (
        <PromotionPicker
          color={chessBoardState?.playerColors[userId] || 'white'}
          onSelect={(piece) => {
            const { fenBeforeMove } = promotionPending;
            const success = finishMove(
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
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      `}
    >
      <div
        className={css`
          background: ${surface};
          border: 1px solid ${borderSoft};
          border-radius: ${radiusLg};
          padding: 2rem;
          box-shadow: ${shadowMd};
          text-align: center;
          max-width: 320px;
          width: 90%;
        `}
      >
        <h3
          className={css`
            margin: 0 0 1.5rem 0;
            color: ${Color.darkerGray()};
            font-size: 1.25rem;
            font-weight: 600;
          `}
        >
          Choose promotion piece:
        </h3>

        <div
          className={css`
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
          `}
        >
          {(['q', 'r', 'b', 'n'] as const).map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className={css`
                background: ${surfaceAlt};
                border: 1px solid ${borderSoft};
                border-radius: ${radiusMd};
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;

                &:hover {
                  background: ${Color.blue(0.05)};
                  border-color: ${Color.logoBlue()};
                  transform: translateY(-1px);
                  box-shadow: ${shadowSm};
                }
              `}
            >
              <img
                src={pieceImages[color][piece]}
                alt={pieceNames[piece]}
                className={css`
                  width: 48px;
                  height: 48px;
                `}
              />
              <span
                className={css`
                  font-size: 0.9rem;
                  font-weight: 600;
                  color: ${Color.darkerGray()};
                `}
              >
                {pieceNames[piece]}
              </span>
            </button>
          ))}
        </div>

        <Button
          color="lightGray"
          onClick={onCancel}
          className={css`
            width: 100%;
          `}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

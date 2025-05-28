import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import {
  convertLichessPuzzle,
  calculatePuzzleXP,
  LichessPuzzle,
  uciToSquareIndices,
  indexToAlgebraic
} from './helpers/puzzleHelpers';
import { validateMove, createPuzzleMove } from './helpers/multiPlyHelpers';
import { PuzzleResult, ChessBoardState, MultiPlyPuzzleState } from './types';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import Button from '~/components/Button';

interface MultiPlyChessPuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onNewPuzzle?: () => void;
  loading?: boolean;
}

export default function MultiPlyChessPuzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp,
  onNewPuzzle,
  loading: _loading
}: MultiPlyChessPuzzleProps) {
  const { userId } = useKeyContext((v) => v.myState);

  // Core state machine
  const [puzzleState, setPuzzleState] = useState<MultiPlyPuzzleState>({
    phase: 'WAIT_USER',
    solutionIndex: 0,
    moveHistory: [],
    attemptsUsed: 0,
    showingHint: false,
    autoPlaying: false
  });

  // Board state
  const [chessBoardState, setChessBoardState] =
    useState<ChessBoardState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [originalPosition, setOriginalPosition] = useState<any>(null);

  // Chess.js instance for logic
  const chessRef = useRef<Chess | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationTimeoutRef = useRef<number | null>(null);

  // Initialize puzzle
  useEffect(() => {
    if (!puzzle || !userId) return;

    const convertedPuzzle = convertLichessPuzzle({ puzzle, userId });

    // Initialize chess.js with the puzzle position
    const chess = new Chess(puzzle.fen);

    // Apply the opponent's setup move
    const opponentMove = puzzle.moves[0];
    chess.move({
      from: opponentMove.slice(0, 2),
      to: opponentMove.slice(2, 4),
      promotion: opponentMove.length > 4 ? opponentMove.slice(4) : undefined
    });

    chessRef.current = chess;
    setChessBoardState(convertedPuzzle.initialState);
    setOriginalPosition(convertedPuzzle.initialState);
    startTimeRef.current = Date.now();

    // Reset puzzle state
    setPuzzleState({
      phase: 'WAIT_USER',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: 0,
      showingHint: false,
      autoPlaying: false
    });
  }, [puzzle, userId]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const resetToOriginalPosition = useCallback(() => {
    if (!puzzle || !originalPosition || !chessRef.current) return;

    // Reset chess.js to puzzle starting position
    const chess = new Chess(puzzle.fen);
    const opponentMove = puzzle.moves[0];
    chess.move({
      from: opponentMove.slice(0, 2),
      to: opponentMove.slice(2, 4),
      promotion: opponentMove.length > 4 ? opponentMove.slice(4) : undefined
    });

    chessRef.current = chess;
    setChessBoardState({ ...originalPosition });
    setSelectedSquare(null);
    setPuzzleState((prev) => ({
      ...prev,
      phase: 'WAIT_USER',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: prev.attemptsUsed + 1
    }));
  }, [puzzle, originalPosition]);

  const makeEngineMove = useCallback(
    (moveUci: string) => {
      if (!chessRef.current || !chessBoardState) return;

      const playerColor = chessBoardState.playerColors[userId];
      const { from } = uciToSquareIndices({
        uci: moveUci,
        isBlackPlayer: playerColor === 'black'
      });

      // Apply move to chess.js
      chessRef.current.move({
        from: moveUci.slice(0, 2),
        to: moveUci.slice(2, 4),
        promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
      });

      // Update board visually
      const newBoard = [...chessBoardState.board];
      const movingPiece = newBoard[from];
      const toIndex = uciToSquareIndices({
        uci: moveUci,
        isBlackPlayer: playerColor === 'black'
      }).to;

      newBoard[toIndex] = { ...movingPiece, state: 'arrived' };
      newBoard[from] = {};

      // Clear previous arrived states
      newBoard.forEach((square, i) => {
        if (i !== toIndex && 'state' in square && square.state === 'arrived') {
          square.state = '';
        }
      });

      setChessBoardState({
        ...chessBoardState,
        board: newBoard
      });
    },
    [chessBoardState, userId]
  );

  const handleAutoPlay = useCallback(() => {
    if (!puzzle || puzzleState.autoPlaying) return;

    setPuzzleState((prev) => ({ ...prev, autoPlaying: true }));

    const playMoves = async () => {
      const solutionMoves = puzzle.moves.slice(1); // Skip opponent's setup move

      for (let i = 0; i < solutionMoves.length; i++) {
        const moveUci = solutionMoves[i];
        const isPlayerMove = i % 2 === 0;

        await new Promise((resolve) => setTimeout(resolve, 400));

        if (isPlayerMove) {
          // User's move - highlight and animate
          const { from } = uciToSquareIndices({
            uci: moveUci,
            isBlackPlayer: chessBoardState?.playerColors[userId] === 'black'
          });
          setSelectedSquare(from);

          await new Promise((resolve) => setTimeout(resolve, 200));

          // Make the move
          makeEngineMove(moveUci);
        } else {
          // Engine response
          makeEngineMove(moveUci);
        }
      }

      // Mark as failed (no XP since auto-played)
      setTimeout(() => {
        setPuzzleState((prev) => ({
          ...prev,
          phase: 'FAIL',
          autoPlaying: false
        }));
      }, 500);
    };

    playMoves();
  }, [
    puzzle,
    puzzleState.autoPlaying,
    chessBoardState,
    userId,
    makeEngineMove
  ]);

  const handleUserMove = useCallback(
    (from: number, to: number) => {
      if (!chessRef.current || !puzzle || puzzleState.phase !== 'WAIT_USER') {
        return false;
      }

      const fromAlgebraic = indexToAlgebraic({
        index: from,
        isBlackPlayer: false
      });
      const toAlgebraic = indexToAlgebraic({
        index: to,
        isBlackPlayer: false
      });

      // Check if move is legal
      const move = chessRef.current.move({
        from: fromAlgebraic,
        to: toAlgebraic
      });

      if (!move) {
        return false; // Illegal move
      }

      // Check if move matches expected solution
      const expectedMove = puzzle.moves[puzzleState.solutionIndex + 1]; // +1 to skip opponent setup move
      const isCorrect = validateMove({
        userMove: {
          from: fromAlgebraic,
          to: toAlgebraic,
          promotion: move.promotion
        },
        expectedMove,
        fen:
          chessRef.current.history({ verbose: true }).length === 1
            ? puzzle.fen
            : chessRef.current.history().join(' ')
      });

      if (!isCorrect) {
        // Wrong move - go to FAIL state
        setPuzzleState((prev) => ({
          ...prev,
          phase: 'FAIL',
          attemptsUsed: prev.attemptsUsed + 1
        }));
        return false;
      }

      // Correct move - update state
      const newMoveHistory = [
        ...puzzleState.moveHistory,
        createPuzzleMove({
          uci: move.from + move.to + (move.promotion || ''),
          fen: chessRef.current.fen()
        })
      ];

      const newSolutionIndex = puzzleState.solutionIndex + 1;
      const isLastMove = newSolutionIndex >= puzzle.moves.length - 1;

      setPuzzleState((prev) => ({
        ...prev,
        solutionIndex: newSolutionIndex,
        moveHistory: newMoveHistory
      }));

      if (isLastMove) {
        // Puzzle completed!
        setPuzzleState((prev) => ({ ...prev, phase: 'SUCCESS' }));

        const timeSpent = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const xpEarned = calculatePuzzleXP({
          difficulty: 'medium', // You may want to determine this from puzzle rating
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
      const nextMove = puzzle.moves[newSolutionIndex + 1];
      if (nextMove) {
        // Go to animation phase
        setPuzzleState((prev) => ({ ...prev, phase: 'ANIM_ENGINE' }));

        animationTimeoutRef.current = window.setTimeout(() => {
          makeEngineMove(nextMove);

          const finalIndex = newSolutionIndex + 1;
          const puzzleComplete = finalIndex >= puzzle.moves.length - 1;

          setPuzzleState((prev) => ({
            ...prev,
            phase: puzzleComplete ? 'SUCCESS' : 'WAIT_USER',
            solutionIndex: finalIndex
          }));

          if (puzzleComplete) {
            const timeSpent = Math.floor(
              (Date.now() - startTimeRef.current) / 1000
            );
            const xpEarned = calculatePuzzleXP({
              difficulty: 'medium',
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
        // No engine reply, puzzle complete
        setPuzzleState((prev) => ({ ...prev, phase: 'SUCCESS' }));
      }

      return true;
    },
    [chessRef, puzzle, puzzleState, makeEngineMove, onPuzzleComplete]
  );

  const handleSquareClick = useCallback(
    (clickedSquare: number) => {
      if (!chessBoardState || puzzleState.phase !== 'WAIT_USER') return;

      const clickedPiece = chessBoardState.board[clickedSquare];
      const playerColor = chessBoardState.playerColors[userId];

      // If no piece selected
      if (selectedSquare === null) {
        if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
          setSelectedSquare(clickedSquare);
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
        return;
      }

      // Try to make move
      const success = handleUserMove(selectedSquare, clickedSquare);
      if (success) {
        setSelectedSquare(null);
      }
    },
    [chessBoardState, selectedSquare, userId, puzzleState.phase, handleUserMove]
  );

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  const solutionMoves = puzzle.moves.slice(1); // Skip opponent setup move
  const currentMoveNumber = Math.floor(puzzleState.solutionIndex / 2) + 1;

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: relative;
        padding: 0.25rem;
        box-sizing: border-box;
      `}
    >
      {/* Status Header */}
      <div
        className={css`
          text-align: center;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: 700;
          background: ${puzzleState.phase === 'SUCCESS'
            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
            : puzzleState.phase === 'FAIL'
            ? 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
            : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'};
          color: ${puzzleState.phase === 'SUCCESS'
            ? '#166534'
            : puzzleState.phase === 'FAIL'
            ? '#dc2626'
            : '#1e40af'};
          border: 1px solid
            ${puzzleState.phase === 'SUCCESS'
              ? '#86efac'
              : puzzleState.phase === 'FAIL'
              ? '#f87171'
              : '#93c5fd'};
        `}
      >
        {puzzleState.phase === 'SUCCESS' && '🎉 Puzzle solved!'}
        {puzzleState.phase === 'FAIL' && '❌ Try again!'}
        {puzzleState.phase === 'WAIT_USER' &&
          `🎯 Find the best move (${currentMoveNumber})`}
        {puzzleState.phase === 'ANIM_ENGINE' && '⏳ Opponent responds...'}
      </div>

      {/* Main Game Area */}
      <div
        className={css`
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas: 'left-panel board right-panel';
          gap: 1rem;
          flex-grow: 1;
          min-height: 0;

          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
            grid-template-areas:
              'board'
              'left-panel'
              'right-panel';
            gap: 0.75rem;
          }
        `}
      >
        {/* Left Panel - Move List */}
        <div
          className={css`
            grid-area: left-panel;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          `}
        >
          <h4
            className={css`
              margin: 0;
              font-size: 1rem;
              color: ${Color.darkerGray()};
            `}
          >
            Solution Line:
          </h4>

          <ol
            className={css`
              margin: 0;
              padding-left: 1.5rem;
              max-height: 200px;
              overflow-y: auto;
              font-family: 'SF Mono', 'Monaco', monospace;
              font-size: 0.9rem;
            `}
          >
            {solutionMoves.map((moveUci, index) => {
              const moveNumber = Math.floor(index / 2) + 1;
              const isWhiteMove = index % 2 === 0;
              const isCurrent = index === puzzleState.solutionIndex;
              const isPlayed = index < puzzleState.solutionIndex;

              // Convert UCI to SAN for display
              let displayMove = moveUci;
              try {
                if (chessRef.current) {
                  // Create a temporary Chess instance to get the position before this move
                  const tempChess = new Chess(puzzle.fen);
                  const opponentMove = puzzle.moves[0];
                  tempChess.move({
                    from: opponentMove.slice(0, 2),
                    to: opponentMove.slice(2, 4),
                    promotion:
                      opponentMove.length > 4
                        ? opponentMove.slice(4)
                        : undefined
                  });

                  // Apply moves up to this point
                  for (let i = 0; i < index; i++) {
                    const prevMoveUci = solutionMoves[i];
                    tempChess.move({
                      from: prevMoveUci.slice(0, 2),
                      to: prevMoveUci.slice(2, 4),
                      promotion:
                        prevMoveUci.length > 4
                          ? prevMoveUci.slice(4)
                          : undefined
                    });
                  }

                  // Get SAN for current move
                  const move = tempChess.move({
                    from: moveUci.slice(0, 2),
                    to: moveUci.slice(2, 4),
                    promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
                  });

                  if (move) {
                    displayMove = move.san;
                  }
                }
              } catch (error) {
                // Fallback to UCI if SAN conversion fails
                console.warn('Failed to convert UCI to SAN:', moveUci, error);
              }

              return (
                <li
                  key={index}
                  className={css`
                    color: ${isCurrent
                      ? Color.logoBlue()
                      : isPlayed
                      ? Color.darkGray()
                      : Color.lightGray()};
                    font-weight: ${isCurrent ? 'bold' : 'normal'};
                    margin: 0.25rem 0;
                  `}
                >
                  {isWhiteMove && `${moveNumber}. `}
                  {displayMove}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Chess Board - Center */}
        <div
          className={css`
            grid-area: board;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          `}
        >
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
          />
        </div>

        {/* Right Panel - Controls */}
        <div
          className={css`
            grid-area: right-panel;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          `}
        >
          <Button
            color="orange"
            onClick={resetToOriginalPosition}
            disabled={puzzleState.autoPlaying}
          >
            ↺ Reset
          </Button>

          <Button
            color="purple"
            onClick={handleAutoPlay}
            disabled={
              puzzleState.autoPlaying || puzzleState.phase === 'SUCCESS'
            }
          >
            {puzzleState.autoPlaying ? '▶ Playing...' : '▶ Show Line'}
          </Button>

          {puzzleState.phase === 'FAIL' && (
            <Button color="logoBlue" onClick={resetToOriginalPosition}>
              Try Again
            </Button>
          )}

          {puzzleState.phase === 'SUCCESS' && onNewPuzzle && (
            <Button color="green" onClick={onNewPuzzle}>
              Next Puzzle
            </Button>
          )}

          {onGiveUp && (
            <Button
              color="red"
              onClick={onGiveUp}
              disabled={puzzleState.autoPlaying}
            >
              Give Up
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

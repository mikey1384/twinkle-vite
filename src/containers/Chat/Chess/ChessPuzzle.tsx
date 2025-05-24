import React, { useState, useEffect, useCallback, useRef } from 'react';
import Chess from './index';
import {
  convertLichessPuzzle,
  calculatePuzzleXP,
  LichessPuzzle,
  PuzzleGameState,
  uciToSquareIndices
} from './helpers/puzzleHelpers';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

interface ChessPuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: {
    solved: boolean;
    xpEarned: number;
    timeSpent: number;
    attemptsUsed: number;
  }) => void;
  onGiveUp?: () => void;
}

export default function ChessPuzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp
}: ChessPuzzleProps) {
  const { userId } = useKeyContext((v) => v.myState);
  const [gameState, setGameState] = useState<PuzzleGameState | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<
    'setup' | 'playing' | 'completed' | 'failed'
  >('setup');
  const [showHint, setShowHint] = useState(false);
  const [chessBoardState, setChessBoardState] = useState<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize puzzle
  useEffect(() => {
    const opponentId = 999; // Dummy opponent ID for puzzle mode
    const convertedPuzzle = convertLichessPuzzle({
      puzzle,
      userId,
      opponentId
    });

    setGameState(convertedPuzzle);
    setChessBoardState(convertedPuzzle.initialState);
    startTimeRef.current = Date.now();

    // Auto-play opponent's first move after a short delay
    setTimeout(() => {
      playOpponentMove(convertedPuzzle);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, userId]);

  const playOpponentMove = useCallback(
    (state: PuzzleGameState) => {
      // Convert UCI move to board indices and simulate the opponent's move
      const { from: _from, to: _to } = uciToSquareIndices({
        uci: state.opponentMove.uci,
        isBlackPlayer: state.initialState.playerColors[userId] === 'black'
      });

      // This would trigger your existing chess move logic
      // For now, we'll just update the status to start the puzzle
      setPuzzleStatus('playing');
    },
    [userId]
  );

  const handleChessMove = useCallback(
    (moveData: any) => {
      if (!gameState || puzzleStatus !== 'playing') return;

      const currentSolutionMove = gameState.solution[currentMoveIndex];
      if (!currentSolutionMove) return;

      // Check if the move matches the expected solution
      const userMove = `${moveData.state.move.from}${moveData.state.move.to}`;
      const expectedMove = currentSolutionMove.uci;

      if (userMove === expectedMove) {
        // Correct move!
        setCurrentMoveIndex((prev) => prev + 1);

        if (currentMoveIndex + 1 >= gameState.solution.length) {
          // Puzzle completed successfully!
          const timeSpent = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          const xpEarned = calculatePuzzleXP({
            difficulty: gameState.difficulty,
            solved: true,
            attemptsUsed: attemptsUsed + 1,
            timeSpent
          });

          setPuzzleStatus('completed');
          onPuzzleComplete({
            solved: true,
            xpEarned,
            timeSpent,
            attemptsUsed: attemptsUsed + 1
          });
        }
      } else {
        // Wrong move
        setAttemptsUsed((prev) => prev + 1);

        if (attemptsUsed >= 2) {
          // Too many attempts, puzzle failed
          const timeSpent = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          setPuzzleStatus('failed');
          onPuzzleComplete({
            solved: false,
            xpEarned: 0,
            timeSpent,
            attemptsUsed: attemptsUsed + 1
          });
        } else {
          // Show hint or reset position
          setShowHint(true);
        }
      }
    },
    [gameState, currentMoveIndex, puzzleStatus, attemptsUsed, onPuzzleComplete]
  );

  const handleShowHint = useCallback(() => {
    if (!gameState) return;

    const currentSolutionMove = gameState.solution[currentMoveIndex];
    if (currentSolutionMove) {
      // You could highlight the from/to squares or show the move notation
      setShowHint(true);
    }
  }, [gameState, currentMoveIndex]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      case 'expert':
        return '#9C27B0';
      default:
        return Color.darkerGray();
    }
  };

  if (!gameState || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div
      className={css`
        width: 100%;
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.5rem;
        }
      `}
    >
      {/* Puzzle Header */}
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        `}
      >
        <div>
          <h3
            className={css`
              margin: 0 0 0.25rem 0;
              color: ${Color.darkerGray()};
            `}
          >
            Chess Puzzle #{puzzle.id}
          </h3>
          <div
            className={css`
              display: flex;
              gap: 1rem;
              align-items: center;
              flex-wrap: wrap;
            `}
          >
            <span
              className={css`
                background: ${getDifficultyColor(gameState.difficulty)};
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.875rem;
                font-weight: 500;
                text-transform: capitalize;
              `}
            >
              {gameState.difficulty}
            </span>
            <span
              className={css`
                color: ${Color.darkGray()};
                font-size: 0.875rem;
              `}
            >
              Rating: {puzzle.rating}
            </span>
            <span
              className={css`
                color: ${Color.darkGray()};
                font-size: 0.875rem;
              `}
            >
              Themes: {puzzle.themes.slice(0, 3).join(', ')}
            </span>
          </div>
        </div>

        <div
          className={css`
            display: flex;
            gap: 0.5rem;
          `}
        >
          <button
            onClick={handleShowHint}
            disabled={puzzleStatus !== 'playing'}
            className={css`
              background: ${Color.logoBlue()};
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.875rem;

              &:hover:not(:disabled) {
                background: ${Color.darkBlue()};
              }

              &:disabled {
                background: ${Color.lightGray()};
                cursor: not-allowed;
              }
            `}
          >
            Hint
          </button>

          {onGiveUp && (
            <button
              onClick={onGiveUp}
              disabled={puzzleStatus === 'completed'}
              className={css`
                background: ${Color.rose()};
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.875rem;

                &:hover:not(:disabled) {
                  background: ${Color.darkRose()};
                }

                &:disabled {
                  background: ${Color.lightGray()};
                  cursor: not-allowed;
                }
              `}
            >
              Give Up
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div
        className={css`
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
          background: ${puzzleStatus === 'completed'
            ? '#E8F5E8'
            : puzzleStatus === 'failed'
            ? '#FFEBEE'
            : puzzleStatus === 'playing'
            ? '#E3F2FD'
            : '#F5F5F5'};
          color: ${puzzleStatus === 'completed'
            ? '#2E7D32'
            : puzzleStatus === 'failed'
            ? '#C62828'
            : puzzleStatus === 'playing'
            ? '#1565C0'
            : Color.darkerGray()};
        `}
      >
        {puzzleStatus === 'setup' && 'Setting up puzzle...'}
        {puzzleStatus === 'playing' &&
          `Find the best move! (${currentMoveIndex + 1}/${
            gameState.solution.length
          })`}
        {puzzleStatus === 'completed' && '🎉 Puzzle solved! Great job!'}
        {puzzleStatus === 'failed' &&
          '😞 Puzzle failed. Better luck next time!'}
        {attemptsUsed > 0 &&
          puzzleStatus === 'playing' &&
          ` (${attemptsUsed} attempt${attemptsUsed > 1 ? 's' : ''})`}
      </div>

      {/* Hint */}
      {showHint && gameState.solution[currentMoveIndex] && (
        <div
          className={css`
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #fff3e0;
            border-radius: 4px;
            color: #e65100;
          `}
        >
          <strong>Hint:</strong> Try moving from{' '}
          {gameState.solution[currentMoveIndex].from} to{' '}
          {gameState.solution[currentMoveIndex].to}
        </div>
      )}

      {/* Chess Board */}
      <Chess
        channelId={0}
        loaded={true}
        initialState={chessBoardState}
        interactable={puzzleStatus === 'playing'}
        onChessMove={handleChessMove}
        myId={userId}
        style={{
          pointerEvents: puzzleStatus === 'playing' ? 'auto' : 'none',
          opacity: puzzleStatus === 'playing' ? 1 : 0.8
        }}
      />

      {/* Instructions */}
      <div
        className={css`
          margin-top: 1rem;
          padding: 0.75rem;
          background: ${Color.lightGray()};
          border-radius: 4px;
          font-size: 0.875rem;
          color: ${Color.darkerGray()};
        `}
      >
        <p style={{ margin: 0 }}>
          <strong>How to play:</strong> Find the best sequence of moves in this
          position. You need to play {gameState.solution.length} correct move
          {gameState.solution.length > 1 ? 's' : ''} to solve the puzzle.
        </p>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ChessPuzzle from './ChessPuzzle';
import MultiPlyChessPuzzle from './MultiPlyChessPuzzle';
import { useChessPuzzle } from './hooks/useChessPuzzle';
import ChessErrorBoundary from './components/ChessErrorBoundary';
import { PuzzleResult } from './types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ChessPuzzleModal({ onHide }: { onHide: () => void }) {
  const {
    puzzle,
    attemptToken,
    loading,
    error,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle,
    cancel
  } = useChessPuzzle();

  const timeoutRef = useRef<number | null>(null);
  const submittingRef = useRef(false);

  // Toggle between one-move and multi-ply modes
  const [useMultiPly, setUseMultiPly] = useState(true);

  // Load initial puzzle
  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancel();
    };
  }, [cancel]);

  const handlePuzzleComplete = async (result: PuzzleResult) => {
    if (!attemptToken || !puzzle || submittingRef.current) return;

    submittingRef.current = true;

    try {
      const response = await submitAttempt({
        attemptToken,
        solved: result.solved,
        attemptsUsed: result.attemptsUsed,
        timeSpent: result.timeSpent
      });

      // Show celebration animation briefly, then swap to next puzzle
      timeoutRef.current = window.setTimeout(() => {
        updatePuzzle(response.nextPuzzle, response.newAttemptToken);
        submittingRef.current = false;

        // TODO: Show XP earned toast notification
        if (process.env.NODE_ENV === 'development') {
          console.log('XP earned:', response.xpEarned);
          console.log('Current streak:', response.streak);
        }
      }, 600); // Brief pause for celebration
    } catch (error) {
      submittingRef.current = false;
      console.error('Failed to submit puzzle attempt:', error);
      // Fallback: just fetch a new puzzle
      timeoutRef.current = window.setTimeout(() => {
        fetchPuzzle();
      }, 1000);
    }
  };

  const handleGiveUp = async () => {
    // Prevent race condition: wait for any pending submission
    if (submittingRef.current) {
      cancel();
      // Wait a bit for cancellation to take effect
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Load new puzzle immediately on give up
    fetchPuzzle();
  };

  const isMultiMove = puzzle && puzzle.moves.length > 2; // More than just opponent setup + 1 player move

  return (
    <Modal
      large
      closeWhenClickedOutside={false}
      onHide={onHide}
      modalStyle={{
        height: '85vh',
        maxHeight: '900px'
      }}
    >
      <header>
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          `}
        >
          <span>Chess Puzzles</span>

          {/* Mode Toggle */}
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
              align-items: center;
              font-size: 0.875rem;
            `}
          >
            <span>Mode:</span>
            <Button
              color={useMultiPly ? 'logoBlue' : 'gray'}
              transparent={!useMultiPly}
              onClick={() => setUseMultiPly(true)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                marginRight: '0.25rem'
              }}
            >
              Multi-ply
            </Button>
            <Button
              color={!useMultiPly ? 'logoBlue' : 'gray'}
              transparent={useMultiPly}
              onClick={() => setUseMultiPly(false)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem'
              }}
            >
              Classic
            </Button>
          </div>
        </div>

        {puzzle && (
          <div
            className={css`
              font-size: 0.75rem;
              color: ${Color.darkerGray()};
              margin-top: 0.5rem;
            `}
          >
            Rating: {puzzle.rating} • Moves: {puzzle.moves.length} • Themes:{' '}
            {puzzle.themes.join(', ')}
            {isMultiMove && (
              <span
                className={css`
                  margin-left: 0.5rem;
                  padding: 0.125rem 0.375rem;
                  background: ${Color.logoBlue(0.2)};
                  color: ${Color.logoBlue()};
                  border-radius: 4px;
                  font-weight: 600;
                `}
              >
                Multi-move
              </span>
            )}
          </div>
        )}
      </header>
      <main
        className={css`
          padding: 1rem !important;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          box-sizing: border-box;
        `}
      >
        <ChessErrorBoundary onRetry={fetchPuzzle}>
          {loading ? (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 400px;
                gap: 1rem;
              `}
            >
              <div
                className={css`
                  font-size: 3rem;
                  animation: spin 2s linear infinite;

                  @keyframes spin {
                    from {
                      transform: rotate(0deg);
                    }
                    to {
                      transform: rotate(360deg);
                    }
                  }
                `}
              >
                ♞
              </div>
              <div
                className={css`
                  font-size: 1.375rem;
                  font-weight: 600;
                  color: ${Color.darkerGray()};
                `}
              >
                Loading chess puzzle...
              </div>
            </div>
          ) : puzzle ? (
            <div
              className={css`
                width: 100%;
                max-width: 800px;
                height: 100%;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                justify-content: center;

                box-sizing: border-box;
              `}
            >
              {useMultiPly || isMultiMove ? (
                <MultiPlyChessPuzzle
                  puzzle={puzzle}
                  onPuzzleComplete={handlePuzzleComplete}
                  onGiveUp={handleGiveUp}
                  onNewPuzzle={fetchPuzzle}
                  loading={loading}
                />
              ) : (
                <ChessPuzzle
                  puzzle={puzzle}
                  onPuzzleComplete={handlePuzzleComplete}
                  onGiveUp={handleGiveUp}
                  onNewPuzzle={fetchPuzzle}
                  loading={loading}
                />
              )}
            </div>
          ) : error ? (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 400px;
                gap: 1rem;
              `}
            >
              <div>Failed to load puzzle: {error}</div>
              <Button onClick={fetchPuzzle} color="logoBlue">
                Try Again
              </Button>
            </div>
          ) : null}
        </ChessErrorBoundary>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}

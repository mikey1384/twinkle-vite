import React, { useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ChessPuzzle from './ChessPuzzle';
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
    updatePuzzle
  } = useChessPuzzle();

  // Load initial puzzle
  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handlePuzzleComplete = async (result: PuzzleResult) => {
    if (!attemptToken || !puzzle) return;

    try {
      const response = await submitAttempt({
        attemptToken,
        solved: result.solved,
        attemptsUsed: result.attemptsUsed,
        timeSpent: result.timeSpent
      });

      // Show celebration animation briefly, then swap to next puzzle
      setTimeout(() => {
        updatePuzzle(response.nextPuzzle, response.newAttemptToken);

        // TODO: Show XP earned toast notification
        if (process.env.NODE_ENV === 'development') {
          console.log('XP earned:', response.xpEarned);
          console.log('Current streak:', response.streak);
        }
      }, 600); // Brief pause for celebration
    } catch (error) {
      console.error('Failed to submit puzzle attempt:', error);
      // Fallback: just fetch a new puzzle
      setTimeout(() => {
        fetchPuzzle();
      }, 1000);
    }
  };

  const handleGiveUp = () => {
    // Load new puzzle immediately on give up
    fetchPuzzle();
  };

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
      <header>Chess Puzzles</header>
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
              <ChessPuzzle
                puzzle={puzzle}
                onPuzzleComplete={handlePuzzleComplete}
                onGiveUp={handleGiveUp}
                onNewPuzzle={fetchPuzzle}
                loading={loading}
              />
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

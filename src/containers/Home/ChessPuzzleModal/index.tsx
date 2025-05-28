import React, { useEffect, useRef } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import MultiPlyChessPuzzle from './MultiPlyChessPuzzle';
import { useChessPuzzle } from './hooks/useChessPuzzle';
import ChessErrorBoundary from './ChessErrorBoundary';
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

  // Load initial puzzle
  useEffect(() => {
    fetchPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        </div>
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
              <MultiPlyChessPuzzle
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

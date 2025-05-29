import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Puzzle from './Puzzle';
import { useChessPuzzle } from './hooks/useChessPuzzle';
import ChessErrorBoundary from './ChessErrorBoundary';
import { PuzzleResult } from './types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Persist level across sessions -----------------
  const LS_KEY = 'twinkle-chess-last-level';

  const [selectedLevel, setSelectedLevel] = useState(() => {
    const cached = Number(localStorage.getItem(LS_KEY));
    return Number.isFinite(cached) && cached > 0 ? cached : 1;
  });

  const [nextPuzzleData, setNextPuzzleData] = useState<{
    puzzle: any;
    token: string;
  } | null>(null);

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  // Load puzzle when selectedLevel changes and handle cleanup
  useEffect(() => {
    fetchPuzzle(selectedLevel);
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, cancel]);

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

      // Update user XP and rank if they earned XP (like AI stories/grammarbles)
      if (response.newXp !== null && response.newXp !== undefined) {
        onSetUserState({
          twinkleXP: response.newXp,
          ...(response.rank && { rank: response.rank })
        });

        // Trigger refresh in child component
        setRefreshTrigger((prev) => prev + 1);
      }

      // Store the next puzzle data but don't automatically move to it
      // Let the user click "Next Puzzle" button manually
      if (response.nextPuzzle && response.newAttemptToken) {
        // Store for when user clicks Next Puzzle
        setNextPuzzleData({
          puzzle: response.nextPuzzle,
          token: response.newAttemptToken
        });
      }

      submittingRef.current = false;
    } catch (error) {
      submittingRef.current = false;
      console.error('Failed to submit puzzle attempt:', error);
      // Fallback: just fetch a new puzzle
      timeoutRef.current = window.setTimeout(() => {
        fetchPuzzle();
      }, 1000);
    }
  };

  const handleGiveUp = () => {
    // Load same level again
    fetchPuzzle(selectedLevel);
  };

  const handleMoveToNextPuzzle = (level?: number) => {
    const targetLevel = level || selectedLevel;

    if (nextPuzzleData) {
      updatePuzzle(nextPuzzleData.puzzle, nextPuzzleData.token);
      setNextPuzzleData(null); // Clear stored data
    } else {
      // Fallback to fetching a new puzzle at the specified level
      fetchPuzzle(targetLevel);
    }

    // Update selected level if a new level was specified
    if (level && level !== selectedLevel) {
      setSelectedLevel(level);
    }
  };

  // 🔐 persist whenever selectedLevel changes
  useEffect(() => {
    localStorage.setItem(LS_KEY, String(selectedLevel));
  }, [selectedLevel]);

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
              <Puzzle
                puzzle={puzzle}
                onPuzzleComplete={handlePuzzleComplete}
                onGiveUp={handleGiveUp}
                onNewPuzzle={handleMoveToNextPuzzle}
                loading={loading}
                refreshTrigger={refreshTrigger}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
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

import React, { useEffect, useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import Puzzle from './Puzzle';
import { useChessPuzzle } from './hooks/useChessPuzzle';

import ChessErrorBoundary from './ChessErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext, useChessContext } from '~/contexts';
import { LS_KEY } from '~/constants/chessLevels';
import { PuzzleResult } from '~/types/chess';

export default function ChessPuzzleModal({ onHide }: { onHide: () => void }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onUpdateChessStats = useChessContext(
    (v) => v.actions.onUpdateChessStats
  );
  const {
    attemptId,
    puzzle,
    loading,
    error,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle,
    levels,
    maxLevelUnlocked,
    levelsLoading,
    refreshLevels,
    stats,
    statsLoading,
    refreshStats
  } = useChessPuzzle();

  const submittingRef = useRef(false);

  const [selectedLevel, setSelectedLevel] = useState(() => {
    const cached = Number(localStorage.getItem(LS_KEY));
    return cached > 0 ? cached : 1;
  });

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  useEffect(() => {
    if (!levelsLoading && selectedLevel > maxLevelUnlocked) {
      setSelectedLevel(maxLevelUnlocked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLevelUnlocked, levelsLoading]);

  useEffect(() => {
    fetchPuzzle(selectedLevel);
    localStorage.setItem(LS_KEY, String(selectedLevel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel]);

  return (
    <NewModal
      isOpen={true}
      onClose={onHide}
      title="Chess Puzzles"
      size="lg"
      modalLevel={0}
      footer={
        <Button transparent onClick={onHide}>
          Close
        </Button>
      }
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
              onGiveUp={() => fetchPuzzle(selectedLevel)}
              onMoveToNextPuzzle={() => fetchPuzzle(selectedLevel)}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              updatePuzzle={updatePuzzle}
              levels={levels}
              maxLevelUnlocked={maxLevelUnlocked}
              levelsLoading={levelsLoading}
              refreshLevels={refreshLevels}
              stats={stats}
              statsLoading={statsLoading}
              refreshStats={refreshStats}
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
    </NewModal>
  );

  async function handlePuzzleComplete(result: PuzzleResult) {
    if (!puzzle || submittingRef.current) return;

    submittingRef.current = true;

    try {
      const response = await submitAttempt({
        attemptId,
        solved: result.solved,
        attemptsUsed: result.attemptsUsed,
        selectedLevel: selectedLevel
      });

      if (response.newXp) {
        onSetUserState({
          userId,
          newState: {
            twinkleXP: response.newXp,
            ...(response.rank && { rank: response.rank })
          }
        });
      }

      if (response.maxLevelUnlocked !== undefined) {
        onUpdateChessStats({
          maxLevelUnlocked: response.maxLevelUnlocked,
          currentLevelStreak: response.currentLevelStreak
        });
      } else {
        await refreshStats();
      }

      submittingRef.current = false;
    } catch (error) {
      submittingRef.current = false;
      console.error('Failed to submit puzzle attempt:', error);
    }
  }
}

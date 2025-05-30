import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Puzzle from './Puzzle';
import { useChessPuzzle } from './hooks/useChessPuzzle';
import { useChessLevels } from './hooks/useChessLevels';
import { useChessStats } from './hooks/useChessStats';
import { ChessStatsProvider } from '~/containers/Home/ChessPuzzleModal/ChessStatsContext';
import ChessErrorBoundary from './ChessErrorBoundary';
import { PuzzleResult } from './types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { LS_KEY } from '~/constants/chessLevels';

function ChessPuzzleModalContent({ onHide }: { onHide: () => void }) {
  const {
    attemptId,
    puzzle,
    loading,
    error,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle
  } = useChessPuzzle();

  const { maxLevelUnlocked, loading: levelsLoading } = useChessLevels();
  const { refreshStats, updateStats } = useChessStats();

  const submittingRef = useRef(false);

  const [selectedLevel, setSelectedLevel] = useState(() => {
    const cached = Number(localStorage.getItem(LS_KEY));
    return Number.isFinite(cached) && cached > 0 ? cached : 1;
  });

  const [nextPuzzleData, setNextPuzzleData] = useState<{
    puzzle: any;
  } | null>(null);

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  useEffect(() => {
    if (!levelsLoading && selectedLevel > maxLevelUnlocked) {
      setSelectedLevel(maxLevelUnlocked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLevelUnlocked, levelsLoading]);

  useEffect(() => {
    if (nextPuzzleData) {
      console.log('[Modal] Using cached puzzle for level', selectedLevel);
      updatePuzzle(nextPuzzleData.puzzle);
      setNextPuzzleData(null);
    } else {
      console.log('[Modal] Fetching new puzzle for level', selectedLevel);
      fetchPuzzle(selectedLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel]);

  const handleGiveUp = () => {
    fetchPuzzle(selectedLevel);
  };

  const handleMoveToNextPuzzle = (level?: number) => {
    const targetLevel = level || selectedLevel;

    if (nextPuzzleData) {
      updatePuzzle(nextPuzzleData.puzzle);
      setNextPuzzleData(null); // Clear stored data
    } else {
      // Fallback to fetching a new puzzle at the specified level
      fetchPuzzle(targetLevel);
    }

    // Update selected level if a new level was specified
    if (level && level !== selectedLevel) {
      setSelectedLevel(level);
      setNextPuzzleData(null); // 🔄 force fresh fetch for new level
    }
  };

  // 🔐 persist whenever selectedLevel changes
  useEffect(() => {
    localStorage.setItem(LS_KEY, String(selectedLevel));
  }, [selectedLevel]);

  async function handlePuzzleComplete(result: PuzzleResult) {
    if (!puzzle || submittingRef.current) return;

    submittingRef.current = true;

    try {
      const isRatedGame = selectedLevel === maxLevelUnlocked;
      const response = await submitAttempt({
        attemptId,
        solved: result.solved,
        attemptsUsed: result.attemptsUsed,
        rated: isRatedGame
      });

      if (response.newXp !== null && response.newXp !== undefined) {
        onSetUserState({
          twinkleXP: response.newXp,
          ...(response.rank && { rank: response.rank })
        });
      }

      if (response.nextPuzzle) {
        setNextPuzzleData({
          puzzle: response.nextPuzzle
        });
      }

      // ⬅️ NEW: Use fast-path response data if available
      if (response.rating !== undefined) {
        if (isRatedGame) {
          updateStats({ rating: response.rating });
        }
        updateStats({
          maxLevelUnlocked: response.maxLevelUnlocked,
          promoCooldownUntil: response.promoCooldownUntil
        });
      } else {
        // Fallback to refresh if server response doesn't include stats
        await refreshStats();
      }

      submittingRef.current = false;
    } catch (error) {
      submittingRef.current = false;
      console.error('Failed to submit puzzle attempt:', error);
    }
  }

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
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
                updatePuzzle={updatePuzzle}
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

export default function ChessPuzzleModal({ onHide }: { onHide: () => void }) {
  return (
    <ChessStatsProvider>
      <ChessPuzzleModalContent onHide={onHide} />
    </ChessStatsProvider>
  );
}

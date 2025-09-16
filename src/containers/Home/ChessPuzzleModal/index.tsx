import React, { useCallback, useEffect, useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import Puzzle from './Puzzle';
import { useChessPuzzle } from './Puzzle/hooks/useChessPuzzle';

import ChessErrorBoundary from './ChessErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext, useChessContext } from '~/contexts';
import { PuzzlePhase, PuzzleResult } from '~/types/chess';
import FilterBar from '~/components/FilterBar';
import Rankings from './Rankings';

export default function ChessPuzzleModal({ onHide }: { onHide: () => void }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onUpdateChessStats = useChessContext(
    (v) => v.actions.onUpdateChessStats
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [activeTab, setActiveTab] = useState<'game' | 'rankings'>('game');
  const [phase, setPhase] = useState<PuzzlePhase>('WAIT_USER');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const {
    attemptId,
    puzzle,
    error,
    fetchPuzzle,
    submitAttempt,
    updatePuzzle,
    levels,
    currentLevel,
    maxLevelUnlocked,
    levelsLoading,
    refreshLevels,
    refreshStats,
    persistCurrentLevel,

    inTimeAttack,
    timeLeft,
    onSetInTimeAttack,
    onSetTimeLeft,
    runResult,
    setRunResult,
    runIdRef
  } = useChessPuzzle();

  const submittingRef = useRef(false);
  const effectiveLevel = selectedLevel ?? Math.max(1, maxLevelUnlocked || 1);

  useEffect(() => {
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (levelsLoading) return;

    const availableMax = Math.max(1, maxLevelUnlocked || 1);
    const preferred =
      currentLevel && currentLevel > 0 ? currentLevel : availableMax;
    const normalizedPreferred = Math.min(preferred, availableMax);

    setSelectedLevel((prev) => {
      if (prev == null) {
        return normalizedPreferred;
      }
      if (prev > availableMax) {
        return availableMax;
      }
      if (currentLevel && currentLevel > 0 && prev !== normalizedPreferred) {
        return normalizedPreferred;
      }
      return prev;
    });
  }, [levelsLoading, maxLevelUnlocked, currentLevel]);

  useEffect(() => {
    if (selectedLevel == null) return;
    fetchPuzzle(selectedLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel]);

  const handleLevelChange = useCallback(
    async (level: number) => {
      const availableMax = Math.max(1, maxLevelUnlocked || 1);
      const clamped = Math.min(Math.max(1, Number(level) || 1), availableMax);
      setSelectedLevel(clamped);
      try {
        await persistCurrentLevel(clamped);
      } catch (error) {
        console.error('Failed to persist chess level preference:', error);
      }
    },
    [maxLevelUnlocked, persistCurrentLevel]
  );

  return (
    <NewModal
      isOpen={true}
      onClose={onHide}
      hasHeader={false}
      size="lg"
      modalLevel={0}
      footer={
        <Button transparent onClick={onHide}>
          Close
        </Button>
      }
    >
      <div style={{ width: '100%' }}>
        <FilterBar
          style={{
            height: '5rem'
          }}
        >
          <nav
            className={activeTab === 'game' ? 'active' : ''}
            onClick={() => setActiveTab('game')}
          >
            Game
          </nav>
          <nav
            className={activeTab === 'rankings' ? 'active' : ''}
            onClick={() => setActiveTab('rankings')}
          >
            Rankings
          </nav>
        </FilterBar>

        {/* Keep Puzzle mounted to preserve state; toggle visibility */}
        <div style={{ display: activeTab === 'game' ? 'block' : 'none' }}>
          <ChessErrorBoundary onRetry={fetchPuzzle}>
            <div
              className={css`
                width: 100%;
                min-height: 400px;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                box-sizing: border-box;
              `}
            >
              {error ? (
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 400px;
                    gap: 1rem;
                  `}
                >
                  <div>Failed to load puzzle: {error}</div>
                  <Button onClick={fetchPuzzle} color="logoBlue">
                    Try Again
                  </Button>
                </div>
              ) : (
                <Puzzle
                  phase={phase}
                  onSetPhase={setPhase}
                  attemptId={attemptId}
                  puzzle={puzzle || undefined}
                  onPuzzleComplete={handlePuzzleComplete}
                  onGiveUp={() => fetchPuzzle(effectiveLevel)}
                  onMoveToNextPuzzle={handleMoveToNextPuzzle}
                  selectedLevel={effectiveLevel}
                  onLevelChange={handleLevelChange}
                  updatePuzzle={updatePuzzle}
                  levels={levels}
                  maxLevelUnlocked={maxLevelUnlocked}
                  levelsLoading={levelsLoading}
                  refreshLevels={refreshLevels}
                  onRefreshStats={refreshStats}
                  inTimeAttack={inTimeAttack}
                  onSetInTimeAttack={onSetInTimeAttack}
                  timeLeft={timeLeft}
                  onSetTimeLeft={onSetTimeLeft}
                  runResult={runResult}
                  onSetRunResult={setRunResult}
                  runIdRef={runIdRef}
                />
              )}
            </div>
          </ChessErrorBoundary>
        </div>
        <div
          style={{
            width: '100%',
            display: activeTab === 'rankings' ? 'flex' : 'none',
            justifyContent: 'center'
          }}
        >
          <Rankings isActive={activeTab === 'rankings'} />
        </div>
      </div>
    </NewModal>
  );

  function handleMoveToNextPuzzle() {
    const levelForNext = effectiveLevel;
    setPhase('START_LEVEL');
    setRunResult('PLAYING');
    onSetInTimeAttack(false);
    fetchPuzzle(levelForNext);
  }

  async function handlePuzzleComplete(result: PuzzleResult) {
    if (!puzzle || submittingRef.current) return;

    submittingRef.current = true;

    try {
      const response = await submitAttempt({
        attemptId,
        solved: result.solved,
        selectedLevel: effectiveLevel
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
          currentLevelStreak: response.currentLevelStreak,
          promotionUnlocked: response.promotionUnlocked
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

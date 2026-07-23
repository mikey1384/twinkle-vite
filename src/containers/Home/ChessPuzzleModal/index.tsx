import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Puzzle from './Puzzle';
import { useChessPuzzle } from './Puzzle/hooks/useChessPuzzle';

import ChessErrorBoundary from './ChessErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext, useChessContext } from '~/contexts';
import { PuzzlePhase, PuzzleResult } from '~/types/chess';
import FilterBar from '~/components/FilterBar';
import Rankings from './Rankings';
import {
  areNormalAttemptTransitionsLocked,
  getChessAttemptRequestMessage,
  getChessAttemptRequestStatus,
  type NormalAttemptSubmissionState
} from './normalAttemptSubmission';

export default function ChessPuzzleModal({ onHide }: { onHide: () => void }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onUpdateChessStats = useChessContext(
    (v) => v.actions.onUpdateChessStats
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [activeTab, setActiveTab] = useState<'game' | 'rankings'>('game');
  const [phase, setPhase] = useState<PuzzlePhase>('WAIT_USER');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [attemptSubmission, setAttemptSubmission] =
    useState<NormalAttemptSubmissionState>({ status: 'idle' });

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
  const pendingAttemptResultRef = useRef<PuzzleResult | null>(null);
  const initialPuzzleRequestedRef = useRef(false);
  const levelTransitionPendingRef = useRef(false);
  const effectiveLevel = selectedLevel ?? Math.max(1, maxLevelUnlocked || 1);
  const attemptTransitionsLocked =
    areNormalAttemptTransitionsLocked(attemptSubmission);
  const attemptSubmissionInFlight = attemptSubmission.status === 'submitting';

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
    if (
      initialPuzzleRequestedRef.current ||
      levelsLoading ||
      selectedLevel == null ||
      inTimeAttack
    ) {
      return;
    }
    initialPuzzleRequestedRef.current = true;
    fetchPuzzle(selectedLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelsLoading, selectedLevel]);

  return (
    <Modal
      modalKey="ChessPuzzleModal"
      isOpen={true}
      onClose={handleClose}
      closeOnBackdropClick={!attemptSubmissionInFlight}
      closeOnEscape={!attemptSubmissionInFlight}
      hasHeader={false}
      size="lg"
      modalLevel={0}
      footer={
        <Button
          variant="ghost"
          onClick={handleClose}
          disabled={attemptSubmissionInFlight}
        >
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
          <ChessErrorBoundary onRetry={handlePuzzleLoadRetry}>
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
                  <Button onClick={handlePuzzleLoadRetry} color="logoBlue">
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
                  onMoveToNextPuzzle={handleMoveToNextPuzzle}
                  selectedLevel={effectiveLevel}
                  onLevelChange={handleLevelChange}
                  onStartLevel={handleStartLevel}
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
                  attemptSubmission={attemptSubmission}
                  onRetryAttemptSubmission={handleRetryAttemptSubmission}
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
    </Modal>
  );

  function handleMoveToNextPuzzle() {
    if (submittingRef.current || attemptTransitionsLocked) return;
    const levelForNext = effectiveLevel;
    setPhase('START_LEVEL');
    setRunResult('PLAYING');
    onSetInTimeAttack(false);
    fetchPuzzle(levelForNext);
  }

  function handleLevelChange(level: number) {
    if (submittingRef.current || attemptTransitionsLocked) return;
    void persistAndLoadLevel(level);
  }

  function handleStartLevel(level: number) {
    if (submittingRef.current || attemptTransitionsLocked) return;
    void persistAndLoadLevel(level, { exitTimeAttack: true });
  }

  async function persistAndLoadLevel(
    level: number,
    { exitTimeAttack = false }: { exitTimeAttack?: boolean } = {}
  ) {
    if (
      levelTransitionPendingRef.current ||
      submittingRef.current ||
      attemptTransitionsLocked
    ) {
      return;
    }
    levelTransitionPendingRef.current = true;
    const availableMax = Math.max(1, maxLevelUnlocked || 1);
    const requestedLevel = Math.min(
      Math.max(1, Number(level) || 1),
      availableMax
    );
    try {
      const canonicalLevel = await persistCurrentLevel(requestedLevel);
      setSelectedLevel(canonicalLevel);
      setPhase('START_LEVEL');
      setRunResult('PLAYING');
      if (exitTimeAttack) {
        onSetInTimeAttack(false);
      }
      await fetchPuzzle(canonicalLevel);
    } catch (error) {
      console.error('Failed to load the selected chess level:', error);
    } finally {
      levelTransitionPendingRef.current = false;
    }
  }

  async function handlePuzzleComplete(result: PuzzleResult) {
    if (
      !puzzle ||
      !attemptId ||
      submittingRef.current ||
      attemptTransitionsLocked
    ) {
      return;
    }
    pendingAttemptResultRef.current = result;
    await submitCanonicalAttempt(result);
  }

  async function submitCanonicalAttempt(result: PuzzleResult) {
    submittingRef.current = true;
    setAttemptSubmission({ status: 'submitting', result });

    try {
      const response = await submitAttempt({
        attemptId,
        solved: result.solved
      });

      if (typeof response.newXp === 'number') {
        onSetUserState({
          userId,
          newState: {
            twinkleXP: response.newXp,
            ...(typeof response.rank === 'number'
              ? { rank: response.rank }
              : {})
          }
        });
      }

      if (response.maxLevelUnlocked !== undefined) {
        onSetUserState({
          userId,
          newState: {
            chessMaxLevelUnlocked: response.maxLevelUnlocked
          }
        });
        onUpdateChessStats({
          maxLevelUnlocked: response.maxLevelUnlocked,
          currentLevelStreak: response.currentLevelStreak,
          promotionUnlocked: response.promotionUnlocked
        });
      } else {
        await refreshStats();
      }

      pendingAttemptResultRef.current = null;
      setAttemptSubmission({ status: 'idle' });
    } catch (error) {
      console.error('Failed to submit puzzle attempt:', error);
      if (getChessAttemptRequestStatus(error) === 409) {
        const reconciled = await reconcileAfterAttemptConflict();
        if (reconciled) {
          pendingAttemptResultRef.current = null;
          setAttemptSubmission({ status: 'idle' });
          return;
        }
      }
      setAttemptSubmission({
        status: 'failed',
        result,
        message: getChessAttemptRequestMessage(error)
      });
    } finally {
      submittingRef.current = false;
    }
  }

  async function reconcileAfterAttemptConflict() {
    setPhase('START_LEVEL');
    setRunResult('PLAYING');
    const puzzleLoaded = await fetchPuzzle(effectiveLevel);
    if (puzzleLoaded) {
      await refreshLevels();
      await refreshStats();
    }
    return puzzleLoaded;
  }

  async function handleRetryAttemptSubmission() {
    if (submittingRef.current) return;
    const pendingResult = pendingAttemptResultRef.current;
    if (!pendingResult) return;
    await submitCanonicalAttempt(pendingResult);
  }

  async function handlePuzzleLoadRetry() {
    if (submittingRef.current) return;
    const puzzleLoaded = await fetchPuzzle(effectiveLevel);
    if (puzzleLoaded && attemptSubmission.status === 'failed') {
      pendingAttemptResultRef.current = null;
      setAttemptSubmission({ status: 'idle' });
      setRunResult('PLAYING');
      setPhase('START_LEVEL');
    }
  }

  function handleClose() {
    if (submittingRef.current) return;
    onHide();
  }
}

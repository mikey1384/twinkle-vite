import React from 'react';
import { css } from '@emotion/css';
import { Color, tabletMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { MultiPlyPuzzleState } from '~/types/chess';

export default function ActionButtons({
  inTimeAttack,
  runResult,
  maxLevelUnlocked,
  currentLevel,
  nextPuzzleLoading,
  puzzleState,
  onNewPuzzleClick,
  onResetPosition,
  onCelebrationComplete,
  onGiveUp,
  onLevelChange,
  levelsLoading,
  onReplaySolution,
  onShowAnalysis
}: {
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL';
  maxLevelUnlocked: number;
  currentLevel: number;
  nextPuzzleLoading: boolean;
  puzzleState: MultiPlyPuzzleState;
  onNewPuzzleClick: () => void;
  onResetPosition: () => void;
  onCelebrationComplete?: () => void;
  onGiveUp?: () => void;
  onLevelChange?: (level: number) => void;
  levelsLoading: boolean;
  onReplaySolution: () => void;
  onShowAnalysis?: () => void;
}) {
  if (
    runResult === 'SUCCESS' &&
    maxLevelUnlocked > currentLevel &&
    inTimeAttack
  ) {
    return (
      <div className={bottomBarCss}>
        <button
          onClick={handleAfterTAComplete}
          disabled={levelsLoading}
          className={successBtnCss}
        >
          🎉 Start Level {maxLevelUnlocked}
        </button>
      </div>
    );
  }

  if (runResult === 'FAIL') {
    return (
      <div className={bottomBarCss}>
        <div
          style={{
            fontSize: '0.9rem',
            color: Color.gray(),
            textAlign: 'center',
            marginBottom: '0.75rem'
          }}
        >
          Try again when cooldown expires
        </div>
      </div>
    );
  }

  if (puzzleState.phase === 'SOLUTION') {
    return (
      <div className={bottomBarCss}>
        {onShowAnalysis && (
          <button onClick={onShowAnalysis} className={analysisBtnCss}>
            📊 Analysis
          </button>
        )}
        <button onClick={onReplaySolution} className={neutralBtnCss}>
          🔄 Replay Solution
        </button>
        <button onClick={onNewPuzzleClick} className={successBtnCss}>
          <Icon icon="arrow-right" style={{ marginRight: 8 }} /> Next Puzzle
        </button>
      </div>
    );
  }

  if (
    puzzleState.phase === 'SUCCESS' &&
    !inTimeAttack &&
    runResult !== 'SUCCESS'
  ) {
    return (
      <div className={bottomBarCss}>
        {onShowAnalysis && (
          <button onClick={onShowAnalysis} className={analysisBtnCss}>
            📊 Analysis
          </button>
        )}
        <button
          onClick={onNewPuzzleClick}
          disabled={nextPuzzleLoading}
          className={successBtnCss}
        >
          {nextPuzzleLoading ? (
            <>
              <div className={spinnerCss} /> Loading...
            </>
          ) : (
            <>
              <Icon icon="arrow-right" style={{ marginRight: 8 }} /> Next Puzzle
            </>
          )}
        </button>
      </div>
    );
  }

  if (puzzleState.phase === 'FAIL') {
    return (
      <div className={bottomBarCss}>
        {onShowAnalysis && (
          <button onClick={onShowAnalysis} className={analysisBtnCss}>
            📊 Analysis
          </button>
        )}
        <button onClick={onResetPosition} className={neutralBtnCss}>
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={bottomBarCss}>
      {runResult === 'PLAYING' && (
        <button
          onClick={onResetPosition}
          disabled={puzzleState.autoPlaying}
          className={neutralBtnCss}
        >
          ↺ Reset
        </button>
      )}

      {!inTimeAttack && runResult === 'PLAYING' && onGiveUp && (
        <button
          onClick={onGiveUp}
          disabled={puzzleState.autoPlaying}
          className={giveUpBtnCss}
        >
          Give Up
        </button>
      )}
    </div>
  );

  function handleAfterTAComplete() {
    if (onLevelChange) {
      onLevelChange(maxLevelUnlocked);
    }

    onCelebrationComplete?.();
  }
}

/* ---- shared css blocks ------------------------------------------------ */
const successBtnCss = css`
  cursor: pointer;
  display: flex;
  background: #22c55e;
  border: 2px solid #16a34a;
  color: white;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  gap: 0.5rem;
  min-height: 44px;
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 #15803d;

  &:hover:not(:disabled) {
    background: #16a34a;
    transform: translateY(1px);
    box-shadow: 0 1px 0 #15803d;
  }

  &:active:not(:disabled) {
    background: #15803d;
    transform: translateY(2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${tabletMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
  }
`;

const spinnerCss = css`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const neutralBtnCss = css`
  cursor: pointer;
  display: flex;
  background: #64748b;
  border: 2px solid #475569;
  color: white;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  gap: 0.5rem;
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 #334155;

  &:hover:not(:disabled) {
    background: #475569;
    transform: translateY(1px);
    box-shadow: 0 1px 0 #334155;
  }

  &:active:not(:disabled) {
    background: #334155;
    transform: translateY(2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${tabletMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
  }
`;

const giveUpBtnCss = css`
  cursor: pointer;
  display: flex;
  background: #ef4444;
  border: 2px solid #dc2626;
  color: white;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  gap: 0.5rem;
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 #b91c1c;

  &:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(1px);
    box-shadow: 0 1px 0 #b91c1c;
  }

  &:active:not(:disabled) {
    background: #b91c1c;
    transform: translateY(2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${tabletMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
  }
`;

const analysisBtnCss = css`
  cursor: pointer;
  display: flex;
  background: #3b82f6;
  border: 2px solid #2563eb;
  color: white;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  gap: 0.5rem;
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 #1d4ed8;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(1px);
    box-shadow: 0 1px 0 #1d4ed8;
  }

  &:active:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${tabletMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
  }
`;

const bottomBarCss = css`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 1rem;

  @media (max-width: ${tabletMaxWidth}) {
    padding: 0.875rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

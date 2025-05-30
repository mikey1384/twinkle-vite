import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { MultiPlyPuzzleState } from '../../types';
import {
  surface,
  borderSubtle,
  shadowButton,
  shadowButtonHover,
  radiusButton
} from '../styles';

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
  levelsLoading
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
}) {
  // 📊  live dump
  console.log('[AB] render', {
    runResult,
    inTimeAttack,
    currentLevel,
    maxLevelUnlocked
  });

  const nextLevelUnlocked = maxLevelUnlocked > currentLevel;

  // === handlers ============================================================
  const handleAfterTAComplete = () => {
    console.log('[AB] 🔥 Button clicked'); // ← 1️⃣  should always appear

    // bump level first
    if (onLevelChange) {
      console.log('[AB] → calling onLevelChange', maxLevelUnlocked);
      onLevelChange(maxLevelUnlocked);
    } else {
      console.warn('[AB] onLevelChange is UNDEFINED');
    }

    // then reset celebration flag (optional)
    onCelebrationComplete?.();
  };

  // === 1. completed entire run =============================================
  if (nextLevelUnlocked) {
    return (
      <button
        onClick={handleAfterTAComplete}
        disabled={levelsLoading}
        className={successBtnCss}
      >
        🎉 Start Level {maxLevelUnlocked}
      </button>
    );
  }

  // === 2. failed run ========================================================
  if (runResult === 'FAIL') {
    return (
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
    );
  }

  // === 3. individual puzzle success (non-time-attack) ======================
  if (puzzleState.phase === 'SUCCESS' && !inTimeAttack) {
    return (
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
    );
  }

  // === 4. individual puzzle failure ========================================
  if (puzzleState.phase === 'FAIL') {
    return (
      <button onClick={onResetPosition} className={neutralBtnCss}>
        🔄 Try Again
      </button>
    );
  }

  // === 5. still playing =====================================================
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: auto;
        margin-bottom: auto;
      `}
    >
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
}

/* ---- shared css blocks ------------------------------------------------ */
const successBtnCss = css`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: ${radiusButton};
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${shadowButton};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  animation: bounceIn 0.6s ease-out;

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${shadowButtonHover};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${shadowButton};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: ${shadowButton};
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
  background: ${surface};
  border: 1px solid ${borderSubtle};
  border-radius: ${radiusButton};
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: #222222;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${shadowButton};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: ${surface};
    border-color: #222222;
    color: #222222;
    box-shadow: ${shadowButtonHover};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: ${shadowButton};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: ${shadowButton};
  }
`;

const giveUpBtnCss = css`
  ${neutralBtnCss};
  &:hover:not(:disabled) {
    background: ${surface};
    color: #d93025;
    border-color: #d93025;
    box-shadow: ${shadowButtonHover};
    transform: translateY(-1px);
  }
`;

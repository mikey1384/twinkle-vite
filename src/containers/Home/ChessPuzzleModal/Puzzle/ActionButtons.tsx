import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { PuzzlePhase } from '~/types/chess';

export default function ActionButtons({
  inTimeAttack,
  runResult,
  timeTrialCompleted,
  maxLevelUnlocked,
  phase,
  onNewPuzzleClick,
  onResetPosition,
  onGiveUp,
  onLevelChange,
  levelsLoading,
  onReplaySolution,
  onShowAnalysis,
  onEnterInteractiveAnalysis,
  onSetInTimeAttack,
  onShowSolution
}: {
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL' | 'PENDING';
  timeTrialCompleted: boolean;
  maxLevelUnlocked: number;
  phase: PuzzlePhase;
  onNewPuzzleClick: () => void;
  onResetPosition: () => void;
  onGiveUp?: () => void;
  onLevelChange: (level: number) => void;
  levelsLoading: boolean;
  onReplaySolution: () => void;
  onShowAnalysis?: () => void;
  onEnterInteractiveAnalysis?: () => void;
  onSetInTimeAttack: (v: boolean) => void;
  onShowSolution?: () => void;
}) {
  if (timeTrialCompleted) {
    return (
      <div className={bottomBarCss}>
        {onEnterInteractiveAnalysis && (
          <button
            onClick={onEnterInteractiveAnalysis}
            className={analysisBtnCss}
          >
            🔍 Board Analysis
          </button>
        )}
        <button
          onClick={() => {
            onSetInTimeAttack(false);
            onLevelChange(maxLevelUnlocked);
          }}
          disabled={levelsLoading}
          className={successBtnCss}
        >
          🎉 Start Level {maxLevelUnlocked}
        </button>
      </div>
    );
  }

  if (phase === 'SOLUTION') {
    return (
      <div className={bottomBarCss}>
        <button onClick={onReplaySolution} className={neutralBtnCss}>
          🔄 Replay Solution
        </button>
        <button onClick={onEnterInteractiveAnalysis} className={analysisBtnCss}>
          🔍 Board Analysis
        </button>
        <button onClick={onNewPuzzleClick} className={successBtnCss}>
          <Icon icon="arrow-right" style={{ marginRight: 8 }} /> Next Puzzle
        </button>
      </div>
    );
  }

  if (
    phase === 'ANALYSIS' ||
    (phase === 'SUCCESS' && !inTimeAttack && runResult !== 'SUCCESS')
  ) {
    return (
      <div className={bottomBarCss}>
        {onShowSolution && (
          <button onClick={onShowSolution} className={solutionBtnCss}>
            💡 Show Solution
          </button>
        )}
        {onShowAnalysis && (
          <button onClick={onShowAnalysis} className={analysisBtnCss}>
            📊 Move Analysis
          </button>
        )}
        <button onClick={onResetPosition} className={neutralBtnCss}>
          🔄 Try Again
        </button>
        <button onClick={onNewPuzzleClick} className={successBtnCss}>
          <Icon icon="arrow-right" style={{ marginRight: 8 }} /> Next Puzzle
        </button>
      </div>
    );
  }

  if (phase === 'FAIL') {
    return (
      <div className={bottomBarCss}>
        <div
          className={css`
            font-size: 0.9rem;
            font-weight: 700;
            color: #dc2626;
            margin-right: 0.75rem;
          `}
        >
          ❌ Failed
        </div>
        {onShowAnalysis && (
          <button onClick={onShowAnalysis} className={analysisBtnCss}>
            📊 Move Analysis
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
        <button onClick={onResetPosition} className={neutralBtnCss}>
          ↺ Reset
        </button>
      )}

      {!inTimeAttack && runResult === 'PLAYING' && onGiveUp && (
        <button onClick={onGiveUp} className={giveUpBtnCss}>
          <Icon icon="flag" style={{ color: '#fff' }} />
          Give Up
        </button>
      )}
    </div>
  );
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
  min-width: 140px;
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

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
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

  @media (max-width: ${mobileMaxWidth}) {
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

  @media (max-width: ${mobileMaxWidth}) {
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

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
  }
`;

const solutionBtnCss = css`
  cursor: pointer;
  display: flex;
  background: #f59e0b;
  border: 2px solid #d97706;
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
  box-shadow: 0 2px 0 #b45309;

  &:hover:not(:disabled) {
    background: #d97706;
    transform: translateY(1px);
    box-shadow: 0 1px 0 #b45309;
  }

  &:active:not(:disabled) {
    background: #b45309;
    transform: translateY(2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.625rem 1rem;
  }
`;

const bottomBarCss = css`
  position: relative;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  min-height: 74px;

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.4rem 0.5rem;
    gap: 0.4rem;
    flex-wrap: wrap;
    min-height: 5rem;
  }
`;

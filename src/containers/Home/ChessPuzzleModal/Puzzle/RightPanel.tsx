import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { MultiPlyPuzzleState } from '../types';
import {
  surface,
  surfaceAlt,
  borderSubtle,
  shadowCard,
  shadowButton,
  shadowButtonHover,
  radiusCard,
  radiusButton,
  radiusSmall
} from './styles';

function formatCooldownTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function RightPanel({
  levels,
  maxLevelUnlocked,
  levelsLoading,
  currentLevel,
  onLevelChange,
  needsPromotion,
  cooldownSeconds,
  startingPromotion,
  onPromotionClick,
  dailyStats,
  puzzleState,
  nextPuzzleLoading,
  onNewPuzzleClick,
  onResetPosition,
  onGiveUp,
  inTimeAttack
}: {
  levels: number[] | null;
  maxLevelUnlocked: number;
  levelsLoading: boolean;
  currentLevel: number;
  onLevelChange?: (level: number) => void;
  needsPromotion: boolean;
  cooldownSeconds: number | null;
  startingPromotion: boolean;
  onPromotionClick: () => void | Promise<void>;
  dailyStats: {
    puzzlesSolved: number;
    xpEarnedToday: number;
  } | null;
  puzzleState: MultiPlyPuzzleState;
  nextPuzzleLoading: boolean;
  onNewPuzzleClick: () => void;
  onResetPosition: () => void;
  onGiveUp?: () => void;
  inTimeAttack: boolean;
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);

  const rightPanelCls = css`
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: ${surfaceAlt};
    border: 1px solid ${borderSubtle};
    border-radius: ${radiusCard};
    padding: 1.25rem;
    box-shadow: ${shadowCard};
  `;

  return (
    <div className={rightPanelCls}>
      {/* Level Selector */}
      {!inTimeAttack && (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          `}
        >
          {levels && levels.length > 1 && (
            <label
              className={css`
                font-size: 0.9rem;
                font-weight: 600;
                color: ${Color.logoBlue()};
              `}
            >
              Puzzle Level
            </label>
          )}
          {levels && levels.length > 1 && (
            <select
              disabled={levelsLoading}
              value={currentLevel}
              onChange={(e) => {
                const newLevel = Number(e.target.value);
                onLevelChange?.(newLevel);
              }}
              className={css`
                padding: 0.5rem;
                border: 1px solid ${Color.borderGray()};
                border-radius: ${radiusSmall};
                background: white;
                font-size: 0.9rem;
                cursor: pointer;

                &:disabled {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
              `}
            >
              {levels
                .filter((l) => l <= maxLevelUnlocked)
                .map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
            </select>
          )}
        </div>
      )}

      {/* Current Level Badge */}
      <div
        style={{
          background: Color.logoBlue(0.08),
          border: `1px solid ${Color.logoBlue(0.3)}`,
          borderRadius: radiusSmall,
          padding: '0.5rem 1rem',
          fontWeight: 600,
          alignSelf: 'flex-start',
          marginBottom: '0.75rem'
        }}
      >
        Level {currentLevel}
      </div>

      {/* Promotion CTA */}
      <>
        {needsPromotion && !inTimeAttack ? (
          <button
            onClick={onPromotionClick}
            disabled={startingPromotion}
            className={css`
              background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
              color: #fff;
              border: none;
              border-radius: ${radiusButton};
              padding: 0.75rem 1.25rem;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
              animation: pulse 1.2s infinite;
              cursor: pointer;
              margin-bottom: 0.75rem;

              @keyframes pulse {
                0% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.05);
                }
                100% {
                  transform: scale(1);
                }
              }

              &:hover:not(:disabled) {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              }

              &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                animation: none;
              }
            `}
          >
            {startingPromotion
              ? '⏳ Starting...'
              : '🔥 Promotion unlocked! Play now'}
          </button>
        ) : cooldownSeconds && !inTimeAttack ? (
          <div
            style={{
              fontSize: '0.9rem',
              color: Color.gray(),
              textAlign: 'center',
              marginBottom: '0.75rem'
            }}
          >
            Next promotion in {formatCooldownTime(cooldownSeconds)}
          </div>
        ) : null}
      </>

      {/* Daily XP Stats */}
      {dailyStats && (
        <div
          className={css`
            background: ${Color.logoBlue(0.08)};
            border: 1px solid ${Color.logoBlue(0.2)};
            border-radius: ${radiusSmall};
            padding: 1rem;
            text-align: center;
            margin-bottom: 0.75rem;
          `}
        >
          <div
            className={css`
              font-size: 0.9rem;
              color: ${Color.logoBlue()};
              font-weight: 600;
              margin-bottom: 0.5rem;
            `}
          >
            Today's Progress
          </div>
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color[xpNumberColor]()};
              margin-bottom: 0.25rem;
            `}
          >
            {addCommasToNumber(dailyStats.xpEarnedToday)}{' '}
            <span
              className={css`
                color: ${Color.gold()};
              `}
            >
              XP
            </span>
          </div>
          <div
            className={css`
              font-size: 0.85rem;
              color: ${Color.logoBlue(0.8)};
            `}
          >
            {dailyStats.puzzlesSolved} puzzle
            {dailyStats.puzzlesSolved !== 1 ? 's' : ''} solved
          </div>
        </div>
      )}

      {puzzleState.phase === 'FAIL' && (
        <Button color="logoBlue" onClick={onResetPosition}>
          🔄 Try Again
        </Button>
      )}

      {/* Main Actions */}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
          margin-bottom: auto;
        `}
      >
        {puzzleState.phase === 'SUCCESS' && !inTimeAttack ? (
          <button
            onClick={onNewPuzzleClick}
            disabled={nextPuzzleLoading}
            className={css`
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
              position: relative;
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              min-height: 48px;

              &::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.2),
                  transparent
                );
                transition: left 0.5s ease;
              }

              &:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: ${shadowButtonHover};

                &::before {
                  left: 100%;
                }
              }

              &:active:not(:disabled) {
                transform: translateY(0);
                box-shadow: ${shadowButton};
              }

              &:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
                box-shadow: ${shadowButton};
              }
            `}
          >
            {nextPuzzleLoading ? (
              <>
                <div
                  className={css`
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
                  `}
                />
                Loading...
              </>
            ) : (
              <>
                <Icon
                  icon="arrow-right"
                  className={css`
                    transition: transform 0.2s ease;
                    margin-right: 0.5rem;

                    button:hover & {
                      transform: translateX(2px);
                    }
                  `}
                />
                Next Puzzle
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={onResetPosition}
              disabled={puzzleState.autoPlaying}
              className={css`
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
              `}
            >
              ↺ Reset
            </button>

            {!inTimeAttack && onGiveUp && (
              <button
                onClick={onGiveUp}
                disabled={puzzleState.autoPlaying}
                className={css`
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
                    color: #d93025;
                    border-color: #d93025;
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
                `}
              >
                Give Up
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

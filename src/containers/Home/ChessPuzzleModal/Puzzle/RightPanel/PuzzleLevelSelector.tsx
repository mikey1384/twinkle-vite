import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusSmall } from '../styles';

export default function PuzzleLevelSelector({
  levels,
  maxLevelUnlocked,
  levelsLoading,
  currentLevel,
  onLevelChange
}: {
  levels: number[] | null;
  maxLevelUnlocked: number;
  levelsLoading: boolean;
  currentLevel: number;
  onLevelChange?: (level: number) => void;
}) {
  if (!levels || levels.length <= 1) return null;

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      `}
    >
      <label
        className={css`
          font-size: 0.9rem;
          font-weight: 600;
          color: ${Color.logoBlue()};
        `}
      >
        Puzzle Level
      </label>

      <select
        disabled={levelsLoading}
        value={currentLevel}
        onChange={(e) => onLevelChange?.(Number(e.target.value))}
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
          .map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
      </select>
    </div>
  );
}

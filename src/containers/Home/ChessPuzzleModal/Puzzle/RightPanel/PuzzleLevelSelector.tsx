import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

function PuzzleLevelSelector({
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
          color: #6b7280;
          text-align: center;
        `}
      >
        🎮 Select Level
      </label>

      <select
        disabled={levelsLoading}
        value={currentLevel}
        onChange={(e) => onLevelChange?.(Number(e.target.value))}
        className={css`
          cursor: pointer;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          color: #374151;
          font-weight: 600;
          font-size: 1rem;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          text-align: center;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;

          &:hover:not(:disabled) {
            background: #f1f5f9;
            border-color: #3b82f6;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }

          &:focus:not(:disabled) {
            outline: none;
            background: #f1f5f9;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 0.9rem;
            padding: 0.625rem 0.875rem;
            padding-right: 2.25rem;
          }
        `}
      >
        {levels
          .filter((l) => l <= maxLevelUnlocked)
          .map((l) => {
            const getLevelOption = (level: number) => {
              if (level === 42) return '🌌 42';
              if (level >= 37) return `👑 Level ${level} • Genius`;
              if (level >= 31) return `🔥 Level ${level} • Legendary`;
              if (level >= 25) return `⭐ Level ${level} • Expert`;
              if (level >= 20) return `⚡ Level ${level} • Advanced`;
              if (level >= 15) return `🎯 Level ${level} • Intermediate`;
              return `🌱 Level ${level} • Beginner`;
            };

            return (
              <option key={l} value={l}>
                {getLevelOption(l)}
              </option>
            );
          })}
      </select>
    </div>
  );
}

export default React.memo(PuzzleLevelSelector);

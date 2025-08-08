import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';
import LevelDropdown from '../LevelDropdown';

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

  const getLevelOption = (level: number) => {
    if (level === 42) return '🌌 42';
    if (level >= 37) return `👑 Level ${level} • Genius`;
    if (level >= 31) return `🔥 Level ${level} • Legendary`;
    if (level >= 25) return `⭐ Level ${level} • Expert`;
    if (level >= 20) return `⚡ Level ${level} • Advanced`;
    if (level >= 15) return `🎯 Level ${level} • Intermediate`;
    return `🌱 Level ${level} • Beginner`;
  };

  const items = (levels || [])
    .filter((l) => l <= maxLevelUnlocked)
    .map((l) => ({ label: getLevelOption(l), value: l }));

  const currentLabel = getLevelOption(currentLevel);

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
          font-size: 1rem;
          font-weight: 600;
          color: #6b7280;
          text-align: center;
          @media (max-width: ${tabletMaxWidth}) {
            font-size: 1.05rem;
          }
        `}
      >
        🎮 Select Level
      </label>

      <LevelDropdown
        items={items}
        selectedLabel={currentLabel}
        onSelect={(value) => onLevelChange?.(value)}
        disabled={levelsLoading}
      />
    </div>
  );
}

export default React.memo(PuzzleLevelSelector);

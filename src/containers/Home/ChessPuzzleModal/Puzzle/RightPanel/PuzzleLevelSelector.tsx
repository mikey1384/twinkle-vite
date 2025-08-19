import React from 'react';
import { css } from '@emotion/css';
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

  const xpWindowStart = Math.max(1, maxLevelUnlocked - 4);

  const items = (levels || [])
    .filter((l) => l <= maxLevelUnlocked)
    .map((l) => {
      const base = getLevelOption(l);
      const eligible = l >= xpWindowStart;
      const chip = eligible ? '  • ⚡ XP' : '  • 🧪 Practice';
      return { label: base + chip, value: l };
    });

  const currentLabel = (() => {
    const base = getLevelOption(currentLevel);
    const eligible = currentLevel >= xpWindowStart;
    const chip = eligible ? '  • ⚡ XP' : '  • 🧪 Practice';
    return base + chip;
  })();

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      `}
    >
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

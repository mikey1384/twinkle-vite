import React from 'react';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

import PuzzleLevelSelector from './PuzzleLevelSelector';
import CurrentLevelBadge from './CurrentLevelBadge';
import TimeAttackProgress from './TimeAttackProgress';
import PromotionCTA from './PromotionCTA';
import XpCard from './XpCard';
import StreakProgressCard from './StreakProgressCard';

function RightPanel({
  levels,
  maxLevelUnlocked,
  levelsLoading,
  currentLevel,
  onLevelChange,
  needsPromotion,
  cooldownUntilTomorrow,
  nextDayTimestamp,
  startingPromotion,
  onPromotionClick,
  onRefreshPromotion,
  dailyStats,
  currentStreak,
  inTimeAttack,
  runResult,
  promoSolved
}: {
  levels: number[] | null;
  maxLevelUnlocked: number;
  levelsLoading: boolean;
  currentLevel: number;
  onLevelChange?: (level: number) => void;
  needsPromotion: boolean;
  cooldownUntilTomorrow: boolean;
  nextDayTimestamp: number | null;
  startingPromotion: boolean;
  onPromotionClick: () => void | Promise<void>;
  onRefreshPromotion: () => void | Promise<void>;
  dailyStats: {
    puzzlesSolved: number;
    xpEarnedToday: number;
  } | null;
  currentStreak: number;
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL';
  promoSolved: number;
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);

  const panelCls = css`
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.25rem;
    align-self: start;
    height: fit-content;
  `;

  return (
    <div className={panelCls}>
      {!inTimeAttack && (
        <PuzzleLevelSelector
          levels={levels}
          maxLevelUnlocked={maxLevelUnlocked}
          levelsLoading={levelsLoading}
          currentLevel={currentLevel}
          onLevelChange={onLevelChange}
        />
      )}

      <CurrentLevelBadge currentLevel={currentLevel} />

      {inTimeAttack && runResult === 'PLAYING' && (
        <TimeAttackProgress solved={promoSolved} />
      )}

      <PromotionCTA
        needsPromotion={needsPromotion}
        inTimeAttack={inTimeAttack}
        cooldownUntilTomorrow={cooldownUntilTomorrow}
        nextDayTimestamp={nextDayTimestamp}
        startingPromotion={startingPromotion}
        onPromotionClick={onPromotionClick}
        onRefreshPromotion={onRefreshPromotion}
      />

      {!inTimeAttack &&
        currentLevel === maxLevelUnlocked &&
        !needsPromotion &&
        !cooldownUntilTomorrow &&
        currentLevel < 42 && (
          <StreakProgressCard
            currentStreak={currentStreak}
            needsPromotion={needsPromotion}
            xpNumberColor={xpNumberColor}
          />
        )}

      {dailyStats && currentLevel >= maxLevelUnlocked - 4 && (
        <XpCard
          xpEarnedToday={dailyStats.xpEarnedToday}
          xpNumberColor={xpNumberColor}
        />
      )}
    </div>
  );
}

export default React.memo(RightPanel);

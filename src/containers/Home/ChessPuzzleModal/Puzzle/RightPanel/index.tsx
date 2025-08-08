import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
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

  const skeletonCls = css`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `;

  const bar = (w: number) => css`
    height: 14px;
    width: ${w}%;
    background: #e5e7eb;
    border-radius: 6px;
    animation: pulse 1.2s ease-in-out infinite;
    @keyframes pulse {
      0%,
      100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }
  `;

  const showSkeleton = levels === null || levelsLoading;

  return (
    <div className={panelCls}>
      {showSkeleton ? (
        <div className={skeletonCls}>
          <div className={bar(60)} />
          <div className={bar(90)} />
          <div className={bar(75)} />
          <div className={bar(85)} />
          <div className={bar(50)} />
        </div>
      ) : (
        <>
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
          {inTimeAttack && runResult === 'SUCCESS' && (
            <div
              className={css`
                margin: 0.5rem 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
                font-weight: 700;
                color: #16a34a;
              `}
            >
              <Icon icon="check-circle" style={{ color: '#16a34a' }} />
              <span>Promotion complete</span>
            </div>
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
        </>
      )}
    </div>
  );
}

export default React.memo(RightPanel);

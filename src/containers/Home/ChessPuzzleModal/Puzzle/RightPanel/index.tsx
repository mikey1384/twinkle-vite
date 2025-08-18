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

export default function RightPanel({
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
  onUnlockPromotion,
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
  onUnlockPromotion: () => void | Promise<void>;
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
  `;

  const showSkeleton = levels === null || levelsLoading;

  const primaryBtnCss = css`
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #3b82f6;
    border: 2px solid #2563eb;
    color: #ffffff;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 9999px;
    padding: 0.5rem 0.9rem;
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
  `;

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

          {currentLevel < Math.max(1, maxLevelUnlocked - 4) ? (
            <div
              className={css`
                background: #fff7ed;
                border: 1px solid #fed7aa;
                color: #9a3412;
                border-radius: 8px;
                padding: 0.625rem 0.75rem;
                font-size: 0.95rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
              `}
            >
              <span>No XP per win at this level</span>
              <button
                className={primaryBtnCss}
                onClick={() => onLevelChange?.(maxLevelUnlocked)}
                aria-label="Go to XP Levels"
              >
                <Icon icon="bolt" style={{ fontSize: 16 }} />
                Go to XP Levels
                <Icon icon="arrow-right" style={{ fontSize: 16 }} />
              </button>
            </div>
          ) : (
            <div
              className={css`
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                color: #065f46;
                border-radius: 8px;
                padding: 0.625rem 0.75rem;
                font-size: 0.95rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              ⚡ XP Eligible: +1000 XP per win at this level
            </div>
          )}

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
            onUnlockPromotion={onUnlockPromotion}
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

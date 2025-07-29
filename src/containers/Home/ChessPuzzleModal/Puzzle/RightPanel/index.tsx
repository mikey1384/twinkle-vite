import React from 'react';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { MultiPlyPuzzleState } from '~/types/chess';

import PuzzleLevelSelector from './PuzzleLevelSelector';
import CurrentLevelBadge from './CurrentLevelBadge';
import TimeAttackProgress from './TimeAttackProgress';
import PromotionCTA from './PromotionCTA';
import XpCard from './XpCard';
import StreakProgressCard from './StreakProgressCard';
import ActionButtons from './ActionButtons';

import { surfaceAlt, borderSubtle, shadowCard, radiusCard } from '../styles';

export default function RightPanel({
  levels,
  maxLevelUnlocked,
  levelsLoading,
  currentLevel,
  onLevelChange,
  needsPromotion,
  cooldownUntilTomorrow,
  startingPromotion,
  onPromotionClick,
  dailyStats,
  currentStreak,
  puzzleState,
  nextPuzzleLoading,
  onNewPuzzleClick,
  onResetPosition,
  onGiveUp,
  inTimeAttack,
  runResult,
  onCelebrationComplete,
  promoSolved
}: {
  levels: number[] | null;
  maxLevelUnlocked: number;
  levelsLoading: boolean;
  currentLevel: number;
  onLevelChange?: (level: number) => void;
  needsPromotion: boolean;
  cooldownUntilTomorrow: boolean;
  startingPromotion: boolean;
  onPromotionClick: () => void | Promise<void>;
  dailyStats: {
    puzzlesSolved: number;
    xpEarnedToday: number;
  } | null;
  currentStreak: number;
  puzzleState: MultiPlyPuzzleState;
  nextPuzzleLoading: boolean;
  onNewPuzzleClick: () => void;
  onResetPosition: () => void;
  onGiveUp?: () => void;
  inTimeAttack: boolean;
  runResult: 'PLAYING' | 'SUCCESS' | 'FAIL';
  onCelebrationComplete?: () => void;
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
    background: ${surfaceAlt};
    border: 1px solid ${borderSubtle};
    border-radius: ${radiusCard};
    padding: 1.25rem;
    box-shadow: ${shadowCard};
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
        startingPromotion={startingPromotion}
        onPromotionClick={onPromotionClick}
      />

      {!inTimeAttack && currentLevel === maxLevelUnlocked && (
        <StreakProgressCard
          currentStreak={currentStreak}
          needsPromotion={needsPromotion}
          xpNumberColor={xpNumberColor}
        />
      )}

      {/* XP Card: Shows when playing at max level or 1 below */}
      {dailyStats && currentLevel >= maxLevelUnlocked - 1 && (
        <XpCard 
          xpEarnedToday={dailyStats.xpEarnedToday} 
          xpNumberColor={xpNumberColor} 
        />
      )}

      <ActionButtons
        inTimeAttack={inTimeAttack}
        runResult={runResult}
        maxLevelUnlocked={maxLevelUnlocked}
        currentLevel={currentLevel}
        nextPuzzleLoading={nextPuzzleLoading}
        puzzleState={puzzleState}
        onNewPuzzleClick={onNewPuzzleClick}
        onResetPosition={onResetPosition}
        onCelebrationComplete={onCelebrationComplete}
        onGiveUp={onGiveUp}
        onLevelChange={onLevelChange}
        levelsLoading={levelsLoading}
      />
    </div>
  );
}

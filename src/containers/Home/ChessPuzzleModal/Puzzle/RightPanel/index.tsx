import React from 'react';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { MultiPlyPuzzleState } from '../../types';

import PuzzleLevelSelector from './PuzzleLevelSelector';
import CurrentLevelBadge from './CurrentLevelBadge';
import TimeAttackProgress from './TimeAttackProgress';
import PromotionCTA from './PromotionCTA';
import DailyStatsCard from './DailyStatsCard';
import ActionButtons from './ActionButtons';

import { surfaceAlt, borderSubtle, shadowCard, radiusCard } from '../styles';

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
      {/* 1. level picker (hidden in time-attack) */}
      {!inTimeAttack && (
        <PuzzleLevelSelector
          levels={levels}
          maxLevelUnlocked={maxLevelUnlocked}
          levelsLoading={levelsLoading}
          currentLevel={currentLevel}
          onLevelChange={onLevelChange}
        />
      )}

      {/* 2. badge */}
      <CurrentLevelBadge currentLevel={currentLevel} />

      {/* 3. time-attack progress */}
      {inTimeAttack && runResult === 'PLAYING' && (
        <TimeAttackProgress solved={promoSolved} />
      )}

      {/* 4. promotion button / cooldown */}
      <PromotionCTA
        needsPromotion={needsPromotion}
        inTimeAttack={inTimeAttack}
        cooldownSeconds={cooldownSeconds}
        startingPromotion={startingPromotion}
        onPromotionClick={onPromotionClick}
      />

      {/* 5. daily XP card */}
      {dailyStats && (
        <DailyStatsCard dailyStats={dailyStats} xpNumberColor={xpNumberColor} />
      )}

      {/* 6. everything that clicks */}
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

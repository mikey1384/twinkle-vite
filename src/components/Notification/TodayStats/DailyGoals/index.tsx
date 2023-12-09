import React, { useCallback } from 'react';
import Badge from './Badge';
import { css } from '@emotion/css';

export default function DailyGoals({
  achievedGoals
}: {
  achievedGoals: string[];
}) {
  const isAchieved = useCallback(
    (goal: any) => achievedGoals.includes(goal),
    [achievedGoals]
  );
  return (
    <div
      style={{ marginTop: '0.5rem' }}
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <style>
        {`:root {
          --color-not-achieved: #b3b3b3;
        }`}
      </style>
      <Badge isAchieved={isAchieved('W')}>W</Badge>
      <Badge isAchieved={isAchieved('G')}>G</Badge>
      <Badge isAchieved={isAchieved('A')}>A</Badge>
    </div>
  );
}

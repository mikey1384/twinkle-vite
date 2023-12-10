import React, { useCallback } from 'react';
import Badge from './Badge';
import { css } from '@emotion/css';

const badgeItems = ['W', 'G', 'A'];

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
      {badgeItems.map((item) => (
        <Badge key={item} isAchieved={isAchieved(item)}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

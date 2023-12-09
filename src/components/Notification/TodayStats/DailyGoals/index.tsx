import React from 'react';
import Badge from './Badge';
import { css } from '@emotion/css';

export default function DailyGoals() {
  const achievedGoals = [];

  const isAchieved = (goal: any) => achievedGoals.includes(goal);

  const containerStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  return (
    <div style={{ marginTop: '0.5rem' }} className={containerStyle}>
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

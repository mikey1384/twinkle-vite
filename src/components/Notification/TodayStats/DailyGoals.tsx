import React from 'react';
import { css } from '@emotion/css';

export default function DailyGoals() {
  const achievedGoals = ['G', 'A'];

  const isAchieved = (goal: any) => achievedGoals.includes(goal);

  const badgeStyle = css`
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    margin: 5px;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;

    &.W {
      background: ${isAchieved('W')
        ? `linear-gradient(135deg, #ff8c00 0%, #ffc040 100%)`
        : 'var(--color-not-achieved)'};
    }
    &.G {
      background: ${isAchieved('G')
        ? `linear-gradient(135deg, #db0076 0%, #ff4088 100%)`
        : 'var(--color-not-achieved)'};
    }
    &.A {
      background: ${isAchieved('A')
        ? `linear-gradient(135deg, #0047ab 0%, #408cff 100%)`
        : 'var(--color-not-achieved)'};
    }
  `;

  const containerStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  return (
    <div className={containerStyle}>
      <style>
        {`:root {
          --color-not-achieved: #b3b3b3; // A solid grey for unachieved goals
        }`}
      </style>
      <div className={`${badgeStyle} G`}>G</div>
      <div className={`${badgeStyle} A`}>A</div>
      <div className={`${badgeStyle} W`}>W</div>
    </div>
  );
}

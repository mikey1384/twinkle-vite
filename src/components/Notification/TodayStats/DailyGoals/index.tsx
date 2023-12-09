import React from 'react';
import { css } from '@emotion/css';

export default function DailyGoals() {
  const achievedGoals = ['W', 'G', 'A'];

  const isAchieved = (goal: any) => achievedGoals.includes(goal);

  const badgeStyle = css`
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    margin: 0.5rem;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease;

    &.W {
      &:hover {
        transform: scale(1.1);
        background: ${isAchieved('W')
          ? ''
          : `linear-gradient(135deg, rgba(255, 140, 0, 0.3) 0%, rgba(255, 192, 64, 0.3) 100%)`};
      }
      background: ${isAchieved('W')
        ? `linear-gradient(135deg, #ff8c00 0%, #ffc040 100%)`
        : 'var(--color-not-achieved)'};
    }
    &.G {
      &:hover {
        transform: scale(1.1);
        background: ${isAchieved('G')
          ? ''
          : `linear-gradient(135deg, rgba(219, 0, 118, 0.3) 0%, rgba(255, 64, 136, 0.3) 100%)`};
      }
      background: ${isAchieved('G')
        ? `linear-gradient(135deg, #db0076 0%, #ff4088 100%)`
        : 'var(--color-not-achieved)'};
    }
    &.A {
      &:hover {
        transform: scale(1.1);
        background: ${isAchieved('A')
          ? ''
          : `linear-gradient(135deg, rgba(0, 71, 171, 0.3) 0%, rgba(64, 140, 255, 0.3) 100%)`};
      }
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
    <div style={{ marginTop: '0.5rem' }} className={containerStyle}>
      <style>
        {`:root {
          --color-not-achieved: #b3b3b3;
        }`}
      </style>
      <div className={`${badgeStyle} W`}>W</div>
      <div className={`${badgeStyle} G`}>G</div>
      <div className={`${badgeStyle} A`}>A</div>
    </div>
  );
}

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
  const allGoalsAchieved = achievedGoals.length === badgeItems.length;

  return (
    <div>
      <div
        style={{ marginTop: '0.5rem' }}
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
        `}
      >
        {badgeItems.map((item) => (
          <Badge key={item} isAchieved={isAchieved(item)}>
            {item}
          </Badge>
        ))}
      </div>
      {allGoalsAchieved && (
        <div
          className={css`
            text-align: center;
            margin-top: 1rem;
          `}
        >
          <p
            className={css`
              font-size: 1.2rem;
              color: #333;
              margin-bottom: 0.5rem;
            `}
          >
            {`Great job! You've completed your daily goals!`}
          </p>
          <button
            className={css`
              background-image: linear-gradient(
                to right,
                #6a11cb 0%,
                #2575fc 100%
              );
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 20px;
              cursor: pointer;
              font-weight: bold;
              font-size: 1rem;
              transition: transform 0.3s;
              animation: pulse 2s infinite;

              &:hover {
                transform: scale(1.05);
              }

              @keyframes pulse {
                0% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.05);
                }
                100% {
                  transform: scale(1);
                }
              }
            `}
          >
            Collect Rewards
          </button>
        </div>
      )}
    </div>
  );
}

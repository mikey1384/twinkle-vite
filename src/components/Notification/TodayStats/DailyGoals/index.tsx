import React, { useCallback } from 'react';
import Badge from './Badge';
import { css } from '@emotion/css';

const badgeItems = ['W', 'G', 'A'];

export default function DailyGoals({
  dailyRewardModalShown,
  achievedGoals,
  onCollectRewardButtonClick
}: {
  dailyRewardModalShown: boolean;
  achievedGoals: string[];
  onCollectRewardButtonClick: () => void;
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
            margin-top: 1.2rem;
            margin-bottom: 1rem;
          `}
        >
          <p
            className={css`
              font-size: 1.2rem;
              font-weight: bold;
              color: #333;
              margin-bottom: 1rem;
            `}
          >
            {`Great job! You've completed your daily goals!`}
          </p>
          <button
            onClick={onCollectRewardButtonClick}
            disabled={dailyRewardModalShown}
            className={css`
              background-image: linear-gradient(
                -45deg,
                #6a11cb,
                #2575fc,
                #ec008c,
                #fc6767
              );
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 20px;
              cursor: pointer;
              font-weight: bold;
              font-size: 1.2rem;
              background-size: 400% 400%;
              animation: ${dailyRewardModalShown
                ? 'none'
                : 'colorShift 6s ease infinite, pulse 2s infinite'};
              opacity: ${dailyRewardModalShown ? 0.5 : 1};
              cursor: ${dailyRewardModalShown ? 'default' : 'pointer'};

              @keyframes colorShift {
                0%,
                100% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
              }

              @keyframes pulse {
                0%,
                100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.07);
                }
              }

              &:disabled {
                background-image: none;
                background-color: #ccc;
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

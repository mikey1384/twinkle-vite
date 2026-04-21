import React from 'react';
import { css } from '@emotion/css';
import { Color, getStreakColor, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import {
  fireAnimation,
  gradeColors,
  gradeLabels,
  gradeSymbols,
  masterpieceTypeLabels,
  pulseAnimation
} from './constants';

export default function GradeOverview({
  feedback,
  grade,
  masterpieceType,
  rewardColor,
  streak,
  streakMultiplier,
  usedRepair,
  xpAwarded,
  xpNumberColor
}: {
  feedback: string;
  grade: string;
  masterpieceType?: 'heart' | 'mind' | 'heart_and_mind' | null;
  rewardColor: string;
  streak: number;
  streakMultiplier: number;
  usedRepair: boolean;
  xpAwarded: number;
  xpNumberColor: string;
}) {
  const gradeColor = gradeColors[grade] || Color.darkerGray();
  const gradeLabel =
    grade === 'Masterpiece' && masterpieceType
      ? masterpieceTypeLabels[masterpieceType] || 'Masterpiece'
      : gradeLabels[grade] || '';
  const gradeSymbol = gradeSymbols[grade] || '?';

  return (
    <>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        `}
      >
        <div
          className={css`
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: ${gradeColor};
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ${pulseAnimation} 2s ease-in-out infinite;
            box-shadow: 0 4px 20px ${gradeColor}40;
          `}
        >
          <span
            className={css`
              font-size: 3rem;
              font-weight: bold;
              color: white;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            `}
          >
            {gradeSymbol}
          </span>
        </div>
        <p
          className={css`
            font-size: 1.5rem;
            color: ${gradeColor};
            margin-top: 0.5rem;
            font-weight: 600;
          `}
        >
          {gradeLabel}
        </p>
      </div>

      {xpAwarded > 0 && (
        <div
          className={css`
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            font-weight: bold;
          `}
        >
          <span style={{ color: xpNumberColor }}>
            +{addCommasToNumber(xpAwarded)}
          </span>{' '}
          <span style={{ color: rewardColor }}>XP</span>
        </div>
      )}

      {streak > 0 && grade !== 'Fail' && (
        <div
          className={css`
            text-align: center;
            margin-bottom: 1.5rem;
            padding: 1rem 1.5rem;
            background: ${getStreakColor(streak)}15;
            border-radius: 12px;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
            `}
          >
            <span
              className={css`
                font-size: ${streak >= 10
                  ? '2.5rem'
                  : streak >= 5
                    ? '2.2rem'
                    : '2rem'};
                animation: ${streak >= 5 ? fireAnimation : 'none'} 0.6s
                  ease-in-out infinite;
              `}
            >
              🔥
            </span>
            <span
              className={css`
                font-size: ${streak >= 10
                  ? '2rem'
                  : streak >= 5
                    ? '1.8rem'
                    : '1.6rem'};
                font-weight: bold;
                color: ${getStreakColor(streak)};
              `}
            >
              {streak}-day streak
            </span>
          </div>
          {streakMultiplier > 1 && (
            <p
              className={css`
                font-size: 1.3rem;
                color: ${getStreakColor(streak)};
                margin-top: 0.5rem;
                font-weight: 600;
              `}
            >
              {streakMultiplier >= 10
                ? 'x10 MAX!'
                : `x${streakMultiplier} XP multiplier!`}
            </p>
          )}
          {usedRepair && (
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.green()};
                margin-top: 0.5rem;
                font-weight: 600;
              `}
            >
              ✨ Streak saved with repair!
            </p>
          )}
        </div>
      )}

      <div
        className={css`
          background: ${Color.highlightGray()};
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        `}
      >
        <h4
          className={css`
            font-size: 1.3rem;
            color: ${Color.darkerGray()};
            margin-bottom: 0.5rem;
          `}
        >
          Feedback
        </h4>
        <p
          className={css`
            font-size: 1.4rem;
            color: ${Color.black()};
            line-height: 1.6;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
            }
          `}
        >
          {feedback}
        </p>
      </div>
    </>
  );
}

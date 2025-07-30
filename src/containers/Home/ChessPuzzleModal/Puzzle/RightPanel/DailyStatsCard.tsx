import React from 'react';
import { css } from '@emotion/css';
import { Color, tabletMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function DailyStatsCard({
  dailyStats,
  xpNumberColor
}: {
  dailyStats: {
    puzzlesSolved: number;
    xpEarnedToday: number;
  };
  xpNumberColor: string;
}) {
  return (
    <div
      className={css`
        font-family: 'Courier New', monospace;
        background: linear-gradient(145deg, #f0fdf4, #dcfce7);
        border: 3px solid #86efac;
        border-top-color: #bbf7d0;
        border-left-color: #bbf7d0;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        margin-bottom: 0.75rem;
        box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8),
          inset -2px -2px 4px rgba(21, 128, 61, 0.1),
          0 4px 8px rgba(21, 128, 61, 0.15);

        @media (max-width: ${tabletMaxWidth}) {
          padding: 0.8rem;
        }
      `}
    >
      <div
        className={css`
          font-size: 0.9rem;
          color: #15803d;
          font-weight: bold;
          margin-bottom: 0.5rem;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 0.8rem;
          }
        `}
      >
        Today's Progress
      </div>

      <div
        className={css`
          font-size: 1.3rem;
          font-weight: bold;
          color: ${Color[xpNumberColor]()};
          margin-bottom: 0.25rem;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
      >
        {addCommasToNumber(dailyStats.xpEarnedToday)}{' '}
        <span style={{ color: '#15803d' }}>XP</span>
      </div>

      <div
        className={css`
          font-size: 0.85rem;
          color: #15803d;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 0.75rem;
          }
        `}
      >
        {dailyStats.puzzlesSolved} puzzle
        {dailyStats.puzzlesSolved !== 1 ? 's' : ''} solved
      </div>
    </div>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { radiusSmall } from '../styles';

export default function XpCard({
  xpEarnedToday,
  xpNumberColor
}: {
  xpEarnedToday: number;
  xpNumberColor: string;
}) {
  return (
    <div
      className={css`
        background: ${Color.logoBlue(0.08)};
        border: 1px solid ${Color.logoBlue(0.2)};
        border-radius: ${radiusSmall};
        padding: 1rem;
        text-align: center;
        margin-bottom: 0.75rem;
      `}
    >
      <div
        className={css`
          font-size: 0.9rem;
          color: ${Color.logoBlue()};
          font-weight: 600;
          margin-bottom: 0.5rem;
        `}
      >
        Today's XP
      </div>

      <div
        className={css`
          font-size: 1.3rem;
          font-weight: 700;
          color: ${Color[xpNumberColor]()};
        `}
      >
        {addCommasToNumber(xpEarnedToday)}{' '}
        <span style={{ color: Color.gold() }}>XP</span>
      </div>
    </div>
  );
}
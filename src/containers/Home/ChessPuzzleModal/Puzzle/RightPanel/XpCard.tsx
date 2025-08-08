import React from 'react';
import { css } from '@emotion/css';
import { Color, tabletMaxWidth } from '~/constants/css';
import { cardCls } from '../styles';
import { addCommasToNumber } from '~/helpers/stringHelpers';

function XpCard({
  xpEarnedToday,
  xpNumberColor
}: {
  xpEarnedToday: number;
  xpNumberColor: string;
}) {
  return (
    <div
      className={css`
        ${cardCls};
        text-align: center;
        margin-bottom: 0.75rem;
      `}
    >
      <div
        className={css`
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 0.5rem;

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 0.8rem;
          }
        `}
      >
        Today's XP
      </div>

      <div
        className={css`
          font-size: 1.3rem;
          font-weight: 700;
          color: ${Color[xpNumberColor]()};

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
      >
        {addCommasToNumber(xpEarnedToday)}{' '}
        <span style={{ color: Color.gold() }}>XP</span>
      </div>
    </div>
  );
}

export default React.memo(XpCard);

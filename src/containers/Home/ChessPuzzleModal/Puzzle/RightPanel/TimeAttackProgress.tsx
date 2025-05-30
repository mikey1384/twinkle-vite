import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusSmall } from '../styles';

export default function TimeAttackProgress({ solved }: { solved: number }) {
  return (
    <div
      className={css`
        align-self: center;
        padding: 0.25rem 0.75rem;
        background: ${Color.logoBlue(0.08)};
        border: 1px solid ${Color.logoBlue(0.25)};
        border-radius: ${radiusSmall};
        font-weight: 600;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: ${Color.logoBlue()};
      `}
    >
      {solved}/3 solved
    </div>
  );
}

import { css } from '@emotion/css';
import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

export default function EmptyState() {
  return (
    <div
      className={css`
        padding: 1rem;
        font-size: 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        background: ${Color.black()};
        color: #fff;

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.7rem;
        }
      `}
    >
      <div>
        <span>Type a word below...</span>
        <Icon style={{ marginLeft: '1rem' }} icon="arrow-down" />
      </div>
    </div>
  );
}

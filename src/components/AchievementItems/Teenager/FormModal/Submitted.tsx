import React from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function Submitted() {
  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          font-size: 1.6rem;
          font-weight: bold;
          margin-bottom: 1rem;
          text-align: center;
          color: ${Color.darkerGray()};
          p {
            margin-bottom: 0.5rem;
          }
        `}
      >
        <p>Your birthdate has been submitted</p>
        <p>Please wait for verification</p>
      </div>
    </div>
  );
}

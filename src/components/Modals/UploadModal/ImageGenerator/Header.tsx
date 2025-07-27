import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function Header() {
  return (
    <div
      className={css`
        text-align: center;
        margin-bottom: -0.5rem;
      `}
    >
      <h2
        className={css`
          font-size: 1.75rem;
          font-weight: 700;
          color: ${Color.logoBlue()};
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        `}
      >
        AI Image Generator ✨
      </h2>
      <p
        className={css`
          color: ${Color.darkerGray()};
          font-size: 1rem;
          margin: 0;
          font-weight: 400;
        `}
      >
        Describe your vision and watch it come to life!
      </p>
    </div>
  );
}
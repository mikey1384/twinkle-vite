import { css } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';

export default function Backdrop() {
  return (
    <div
      className={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        background: ${Color.black()};
        color: #fff;
        z-index: 0;
      `}
    />
  );
}

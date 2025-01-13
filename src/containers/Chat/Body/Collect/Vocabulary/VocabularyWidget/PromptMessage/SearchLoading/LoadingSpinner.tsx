import { css, keyframes } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export default function LoadingSpinner() {
  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        border: 2px solid ${Color.borderGray()};
        border-top: 2px solid ${Color.darkerGray()};
        border-radius: 50%;
        animation: ${rotate} 1s linear infinite;
      `}
    />
  );
}

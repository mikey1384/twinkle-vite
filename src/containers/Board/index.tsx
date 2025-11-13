import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

export default function Board() {
  return (
    <ErrorBoundary componentPath="Board/index">
      <div
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          min-height: calc(100vh - 4.5rem);
          font-size: 2.4rem;
          font-weight: bold;
          text-transform: lowercase;
        `}
      >
        board
      </div>
    </ErrorBoundary>
  );
}


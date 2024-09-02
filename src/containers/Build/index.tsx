import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

export default function Build() {
  return (
    <ErrorBoundary componentPath="Build/index">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
        `}
      >
        <h1>Build</h1>
        <p>Welcome to the Build section!</p>
      </div>
    </ErrorBoundary>
  );
}

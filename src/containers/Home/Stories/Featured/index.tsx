import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FeaturedSubjects from './FeaturedSubjects';
import CallZero from './CallZero';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function Featured() {
  const { userId } = useKeyContext((v) => v.myState);

  return (
    <ErrorBoundary componentPath="Home/Stories/Featured/index">
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 17rem;
          margin-bottom: 1rem;
        `}
      >
        <div
          className={css`
            z-index: 10;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: ${userId ? '80%' : '100%'};
            transition: width 0.5s ease-in-out;
            overflow: hidden;
          `}
        >
          <FeaturedSubjects />
        </div>
        {userId && (
          <div
            className={css`
              position: absolute;
              top: 0;
              right: 0;
              bottom: 0;
              width: 30%;
              transition: width 0.5s ease-in-out;
              overflow: visible;
            `}
          >
            <CallZero />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

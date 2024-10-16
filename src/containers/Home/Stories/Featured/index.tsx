import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FeaturedSubjects from './FeaturedSubjects';
import CallZero from './CallZero';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function Featured() {
  const { userId } = useKeyContext((v) => v.myState);
  const [callButtonHovered, setCallButtonHovered] = useState(false);

  return (
    <ErrorBoundary componentPath="Home/Stories/Featured/index">
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 17rem;
          margin-bottom: 1rem;
          overflow: hidden;
          ${callButtonHovered
            ? 'box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);'
            : 'box-shadow: none;'}
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
            transition: transform 0.5s ease-in-out;
            transform: ${callButtonHovered
              ? 'translateX(-100%)'
              : 'translateX(0)'};
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
              width: ${callButtonHovered ? '100%' : '25%'};
              transition: width 0.5s ease-in-out;
              overflow: visible;
            `}
          >
            <CallZero
              callButtonHovered={callButtonHovered}
              setCallButtonHovered={setCallButtonHovered}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

import { css } from '@emotion/css';
import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import LoadingSpinner from './LoadingSpinner';

interface SearchLoadingProps {
  text: string;
}

export default function SearchLoading({ text }: SearchLoadingProps) {
  return (
    <div
      className={css`
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: ${Color.darkerGray()};
        font-size: 1.5rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        padding: 0.7rem 2rem;
        background: ${Color.white()};

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.3rem;
          padding: 0.5rem 1.5rem;
          gap: 0.7rem;
        }
      `}
    >
      <div
        className={css`
          width: 1.7rem;
          height: 1.7rem;
          min-height: 1.7rem;
        `}
      >
        <LoadingSpinner />
      </div>
      <span>{text}</span>
    </div>
  );
}

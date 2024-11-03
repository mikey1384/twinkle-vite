import React from 'react';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const shimmerEffect = css`
  animation: ${shimmer} 2s infinite linear;
  background: linear-gradient(
    to right,
    ${Color.lighterGray()} 4%,
    ${Color.extraLightGray()} 25%,
    ${Color.lighterGray()} 36%
  );
  background-size: 1000px 100%;
`;

export default function LoadingPlaceholder() {
  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        padding: 1rem;
        position: relative;
        .menu-button {
          display: none;
        }
        @media (max-width: ${mobileMaxWidth}) {
          .menu-button {
            display: block;
          }
        }
      `}
    >
      <div
        className={css`
          width: 5vw;
          height: 5vw;
          min-width: 4rem;
          min-height: 4rem;
          max-width: 7rem;
          max-height: 7rem;
          border-radius: 50%;
          ${shimmerEffect}
          @media (max-width: ${mobileMaxWidth}) {
            width: 4rem;
            height: 4rem;
          }
        `}
      />
      <div
        className={css`
          width: CALC(100% - 5vw - 3rem);
          display: flex;
          flex-direction: column;
          margin-left: 2rem;
          position: relative;
          @media (max-width: ${mobileMaxWidth}) {
            margin-left: 1rem;
          }
        `}
      >
        <div
          className={css`
            width: 25%;
            height: 1.5rem;
            ${shimmerEffect}
            margin-bottom: 1rem;
            border-radius: 0.5rem;
          `}
        />
        <div
          className={css`
            width: 100%;
            height: 4rem;
            ${shimmerEffect}
            border-radius: 0.5rem;
          `}
        />
      </div>
    </div>
  );
}

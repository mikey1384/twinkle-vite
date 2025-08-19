import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export default function TimeAttackProgress({ solved }: { solved: number }) {
  return (
    <div
      className={css`
        font-family: 'Courier New', monospace;
        align-self: center;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #fef2f2;
        border: 2px solid #fecaca;
        color: #be123c;
        font-weight: 700;
        font-size: 0.9rem;
        border-radius: 9999px;
        padding: 0.25rem 0.75rem;
        margin-bottom: 0.5rem;

        @media (max-width: ${tabletMaxWidth}) {
          font-size: 0.8rem;
          padding: 0.2rem 0.6rem;
        }
      `}
    >
      <span>{solved}/3 solved</span>
      <span
        className={css`
          display: inline-flex;
          gap: 3px;
          margin-left: 4px;
        `}
      >
        <span>⏱</span>
        <span
          className={css`
            display: inline-block;
            width: 3px;
            height: 3px;
            background: currentColor;
            border-radius: 50%;
            animation: timeattack-pulse 1s infinite ease-in-out;
            @keyframes timeattack-pulse {
              0%,
              100% {
                opacity: 0.2;
              }
              50% {
                opacity: 1;
              }
            }
          `}
        />
      </span>
    </div>
  );
}

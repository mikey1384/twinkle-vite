import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export default function TimeAttackProgress({ solved }: { solved: number }) {
  return (
    <div
      className={css`
        font-family: 'Courier New', monospace;
        align-self: center;
        display: inline-block;
        background: linear-gradient(145deg, #fef2f2, #fecaca);
        border: 3px solid #fca5a5;
        border-top-color: #fed7d7;
        border-left-color: #fed7d7;
        color: #dc2626;
        font-weight: bold;
        font-size: 0.9rem;
        border-radius: 8px;
        padding: 0.25rem 0.75rem;
        margin-bottom: 0.5rem;
        box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8),
          inset -2px -2px 4px rgba(220, 38, 38, 0.1),
          0 4px 8px rgba(220, 38, 38, 0.15);
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

        @media (max-width: ${tabletMaxWidth}) {
          font-size: 0.8rem;
          padding: 0.2rem 0.6rem;
        }
      `}
    >
      {solved}/3 solved
    </div>
  );
}

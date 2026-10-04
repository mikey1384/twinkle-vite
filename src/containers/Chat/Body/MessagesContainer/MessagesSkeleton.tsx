import React from 'react';
import { css, keyframes } from '@emotion/css';

// What a topic's first page will look like, while it loads: message-shaped
// rows instead of an empty pane with a spinner. Opacity-only pulse (looping
// animations stay on transform/opacity).
const pulse = keyframes`
  from { opacity: 0.55; }
  to { opacity: 1; }
`;

const WIDTHS = [
  ['38%', '72%'],
  ['30%', '54%'],
  ['42%', '80%'],
  ['26%', '46%']
];

export default function MessagesSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading messages"
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1.8rem;
        padding: 1.6rem 1.6rem 2.4rem;
        animation: ${pulse} 0.9s ease-in-out infinite alternate;
      `}
    >
      {WIDTHS.map(([name, text], index) => (
        <div
          key={index}
          className={css`
            display: flex;
            gap: 1rem;
            align-items: flex-start;
          `}
        >
          <div
            className={css`
              flex: none;
              width: 3.6rem;
              height: 3.6rem;
              border-radius: 50%;
              background: var(--ui-border, #e5e7eb);
            `}
          />
          <div
            className={css`
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 0.7rem;
              padding-top: 0.3rem;
            `}
          >
            <div className={bar(name, '1.1rem')} />
            <div className={bar(text, '1.4rem')} />
          </div>
        </div>
      ))}
    </div>
  );
}

function bar(width: string, height: string) {
  return css`
    width: ${width};
    height: ${height};
    border-radius: 0.6rem;
    background: var(--ui-border, #e5e7eb);
  `;
}

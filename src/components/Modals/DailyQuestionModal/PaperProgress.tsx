import React from 'react';
import { css } from '@emotion/css';
import { PAPER } from './paperTheme';

// A slim progress line in Daily Reflection's paper style (replaces the
// site-wide coloured ProgressBar inside the page).
export default function PaperProgress({
  progress,
  label,
  complete = false
}: {
  progress: number;
  label?: React.ReactNode;
  complete?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      {label && (
        <div
          className={css`
            margin-bottom: 0.5rem;
            font-size: 1.2rem;
            font-weight: 600;
            color: ${complete ? PAPER.done : PAPER.inkSoft};
          `}
        >
          {label}
        </div>
      )}
      <div
        className={css`
          height: 6px;
          border-radius: 999px;
          background: ${PAPER.paperDeep};
          overflow: hidden;
        `}
      >
        <div
          className={css`
            height: 100%;
            width: 100%;
            border-radius: 999px;
            background: ${complete ? PAPER.done : PAPER.accent};
            transform-origin: left center;
            transition: transform 0.4s ease-out;
          `}
          style={{ transform: `scaleX(${clamped / 100})` }}
        />
      </div>
    </div>
  );
}

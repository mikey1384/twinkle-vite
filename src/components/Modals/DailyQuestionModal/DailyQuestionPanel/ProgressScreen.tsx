import React from 'react';
import { css } from '@emotion/css';
import PaperProgress from '../PaperProgress';
import { PAPER, paperWorkingDotsCls } from '../paperTheme';

// Loading and grading in Daily Reflection's paper style: what is happening,
// in a calm serif line, over a slim progress line.
export default function ProgressScreen({
  text,
  progress
}: {
  text: string;
  progress: number;
}) {
  return (
    <div
      className={css`
        min-height: 360px;
        padding: 3rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.6rem;
      `}
    >
      <span className={paperWorkingDotsCls} aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <p
        className={css`
          margin: 0;
          font-family: ${PAPER.serif};
          font-size: 2.2rem;
          color: ${PAPER.ink};
          text-align: center;
        `}
      >
        {text}
      </p>
      <div
        className={css`
          width: 100%;
          max-width: 420px;
        `}
      >
        <PaperProgress progress={progress} />
      </div>
    </div>
  );
}

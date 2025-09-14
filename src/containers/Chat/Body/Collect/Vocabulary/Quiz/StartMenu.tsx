import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function StartMenu({ onStart }: { onStart: () => void }) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, ${Color.highlightGray()}, #ffffff);
      `}
    >
      <div
        className={css`
          background: #fff;
          border: 1px solid ${Color.borderGray()};
          border-radius: 12px;
          box-shadow: 0 8px 24px ${Color.black(0.1)};
          padding: 2rem 2.4rem;
          max-width: 42rem;
          width: 90%;
          text-align: center;
        `}
      >
        <h3
          className={css`
            margin: 0 0 0.8rem 0;
            font-size: 2rem;
          `}
        >
          Word Master Quiz
        </h3>
        <p
          className={css`
            margin: 0 0 1.6rem 0;
            color: ${Color.darkerGray()};
            line-height: 1.5;
          `}
        >
          You have 10 unresolved attempts. Press Start to begin today’s quiz.
        </p>
        <button
          className={css`
            padding: 1rem 2rem;
            background: ${Color.blue()};
            color: #fff;
            border: none;
            border-radius: 9999px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 12px ${Color.blue(0.3)};
          `}
          onClick={onStart}
        >
          Start
        </button>
      </div>
    </div>
  );
}


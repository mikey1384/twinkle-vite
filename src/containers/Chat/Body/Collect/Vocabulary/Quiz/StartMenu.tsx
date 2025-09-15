import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function StartMenu({
  onStart,
  onCancel,
  title,
  questionCount
}: {
  onStart: () => void;
  onCancel?: () => void;
  title?: string;
  questionCount?: number;
}) {
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
          {title || 'Word Master Quiz'}
        </h3>
        <p
          className={css`
            margin: 0 0 1.6rem 0;
            color: ${Color.darkerGray()};
            line-height: 1.5;
          `}
        >
          {questionCount
            ? `${questionCount} questions are ready.`
            : 'Press Start to begin the quiz.'}
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
            margin-right: ${onCancel ? '1rem' : '0'};
          `}
          onClick={onStart}
        >
          Start
        </button>
        {onCancel && (
          <button
            className={css`
              padding: 1rem 2rem;
              background: transparent;
              color: ${Color.darkerGray()};
              border: 1px solid ${Color.borderGray()};
              border-radius: 9999px;
              font-weight: 600;
              cursor: pointer;
            `}
            onClick={onCancel}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

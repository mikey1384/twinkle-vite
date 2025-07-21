import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

export default function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  return (
    <div
      className={css`
        background: ${Color.lightRed(0.2)};
        border: 1px solid ${Color.red()};
        border-radius: 16px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 3px ${Color.red(0.1)};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.75rem;
        `}
      >
        <div
          className={css`
            width: 6px;
            height: 6px;
            background: ${Color.red()};
            border-radius: 50%;
          `}
        />
        <span
          className={css`
            color: ${Color.red()};
            font-weight: 500;
            font-size: 0.95rem;
          `}
        >
          {error}
        </span>
      </div>
      <button
        onClick={onDismiss}
        className={css`
          background: none;
          border: none;
          color: ${Color.red()};
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 1.25rem;
          line-height: 1;
          transition: background-color 0.2s ease;

          &:hover {
            background: ${Color.red(0.1)};
          }
        `}
      >
        ×
      </button>
    </div>
  );
}
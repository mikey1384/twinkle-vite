import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface LoadingStateProps {
  isGenerating: boolean;
  getProgressLabel: () => string;
}

export default function LoadingState({
  isGenerating,
  getProgressLabel
}: LoadingStateProps) {
  return (
    <div
      className={css`
        background: ${Color.white()};
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid ${Color.borderGray()};
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
      `}
    >
      <div
        className={css`
          background: ${Color.highlightGray()};
          border: 2px dashed ${Color.borderGray()};
          border-radius: 16px;
          width: 100%;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${Color.gray()};
          font-size: 1rem;
          text-align: center;
          position: relative;
        `}
      >
        {isGenerating ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
            `}
          >
            <div
              className={css`
                width: 32px;
                height: 32px;
                border: 4px solid ${Color.borderGray()};
                border-top: 4px solid ${Color.logoBlue()};
                border-radius: 50%;
                animation: spin 1s linear infinite;

                @keyframes spin {
                  0% {
                    transform: rotate(0deg);
                  }
                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}
            />
            <div
              className={css`
                font-weight: 600;
                color: ${Color.black()};
                font-size: 1.1rem;
              `}
            >
              {getProgressLabel()}
            </div>
          </div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.75rem;
            `}
          >
            <div
              className={css`
                width: 48px;
                height: 48px;
                background: ${Color.logoBlue()};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
              `}
            >
              🎨
            </div>
            <span
              className={css`
                font-weight: 500;
                font-size: 1rem;
              `}
            >
              Your generated image will appear here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
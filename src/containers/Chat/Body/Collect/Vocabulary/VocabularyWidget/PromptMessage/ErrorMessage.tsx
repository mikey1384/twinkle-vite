import { css } from '@emotion/css';
import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      className={css`
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 0);
        width: 95%;
        max-width: 800px;
        font-size: 2rem;
        font-weight: bold;
        color: #fff;
        padding: 3rem 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 12rem;
        text-align: center;
        word-break: break-word;
        white-space: pre-wrap;
        line-height: 1.6;
        background: ${Color.rose()};
        border-radius: 1rem;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        transform-origin: bottom center;
        animation: errorAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        @keyframes errorAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, 1rem);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: ${mobileMaxWidth}) {
          width: 95%;
          font-size: 1.5rem;
          min-height: 10rem;
          padding: 2.5rem 1.5rem;
          line-height: 1.5;
        }
      `}
    >
      <div
        style={{
          maxWidth: '90%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {message}
      </div>
    </div>
  );
}

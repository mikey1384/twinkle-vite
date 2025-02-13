import { css } from '@emotion/css';
import React from 'react';
import { mobileMaxWidth } from '~/constants/css';

interface StatusBarProps {
  message: string;
  background: string | { [key: string]: string };
}

export default function StatusBar({ message, background }: StatusBarProps) {
  return (
    <div
      className={css`
        width: 100%;
        font-size: 2rem;
        font-weight: bold;
        color: #fff;
        padding: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 9rem;
        text-align: center;
        line-height: 1.6;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.5rem;
          min-height: 8rem;
          padding: 1.5rem;
          line-height: 1.5;
        }
      `}
      style={{
        ...(typeof background === 'string' ? { background } : background)
      }}
    >
      {message}
    </div>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import { dotAnimation } from './animations';

interface StatusDotsProps {
  color: string;
}

export default function StatusDots({ color }: StatusDotsProps) {
  return (
    <div
      className={css`
        display: flex;
        gap: 0.3rem;
        align-items: center;
      `}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={css`
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${color};
            animation: ${dotAnimation} 1.4s infinite ease-in-out both;
            animation-delay: ${i * 0.16}s;
          `}
        />
      ))}
    </div>
  );
}
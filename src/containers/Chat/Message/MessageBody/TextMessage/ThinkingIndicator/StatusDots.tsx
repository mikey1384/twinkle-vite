import React from 'react';
import { css } from '@emotion/css';
import { dotAnimation } from '~/components/StreamingThoughtContent/animations';

interface StatusDotsProps {
  color: string;
  small?: boolean;
}

export default function StatusDots({ color, small }: StatusDotsProps) {
  const dotSize = small ? '4px' : '6px';

  return (
    <div
      className={css`
        display: flex;
        gap: ${small ? '0.2rem' : '0.3rem'};
        align-items: center;
      `}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={css`
            width: ${dotSize};
            height: ${dotSize};
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

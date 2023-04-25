import React, { useMemo } from 'react';
import { borderRadius, Color } from '~/constants/css';
import { REVEAL_TIME_MS } from '../../constants/settings';
import { css } from '@emotion/css';

export default function Cell({
  isCompleted,
  isRevealing,
  status,
  value,
  isWaving,
  position = 0
}: {
  isCompleted?: boolean;
  isRevealing?: boolean;
  status?: string;
  value?: string;
  isWaving?: boolean;
  position?: number;
}) {
  const shouldWave = isWaving && isCompleted;
  const shouldReveal = isRevealing && isCompleted;
  const animationDelay = useMemo(() => {
    return shouldWave
      ? `${(position * REVEAL_TIME_MS) / 5}ms`
      : `${position * REVEAL_TIME_MS}ms`;
  }, [position, shouldWave]);

  return (
    <div
      className={`unselectable ${css`
        border: 1px solid ${Color.lightBlueGray()};
        background: ${value ? Color.lightBlueGray() : ''};
      `} ${shouldWave ? 'cell-waving' : shouldReveal ? 'cell-reveal' : ''} ${
        status || ''
      }`}
      style={{
        borderRadius,
        width: '3.7rem',
        height: '3.7rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        color: '#fff',
        marginRight: '0.5rem',
        animationDelay
      }}
    >
      <div className="letter-container" style={{ animationDelay }}>
        {value}
      </div>
    </div>
  );
}

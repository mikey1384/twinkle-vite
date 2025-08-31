import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function RejectedTracker({
  count = 0,
  total = 10,
  style
}: {
  count?: number;
  total?: number;
  style?: React.CSSProperties;
}) {
  const filled = Math.max(0, Math.min(count, total));
  const items = useMemo(() => new Array(total).fill(0), [total]);

  const className = css`
    .ball {
      display: inline-block;
      width: 100%;
      height: 100%;
      border-radius: 100%;
      position: relative;
      background: ${Color.lightGray()};
    }
    .ball:after {
      content: '';
      position: absolute;
      top: 5%;
      left: 10%;
      width: 80%;
      height: 80%;
      border-radius: 100%;
      filter: blur(1px);
      z-index: 2;
      transform: rotateZ(-30deg);
    }
    .gloss {
      background: radial-gradient(
        rgba(240, 245, 255, 0.9),
        rgba(240, 245, 255, 0.9) 40%,
        rgba(225, 238, 255, 0.8) 60%,
        rgba(43, 130, 255, 0.4)
      );
    }
    .gloss {
      width: 22px;
      height: 22px;
      display: inline-block;
      @media (max-width: ${mobileMaxWidth}) {
        width: 16px;
        height: 16px;
      }
    }
    .filled {
      background: radial-gradient(
        ${Color.redOrange(0.95)},
        ${Color.redOrange(0.95)} 40%,
        ${Color.redOrange(0.85)} 60%,
        ${Color.orange(0.6)}
      );
    }
  `;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...style
      }}
      aria-label={`Untested/unsolved: ${filled} of ${total}`}
    >
      {items.map((_, idx) => (
        <div key={idx} className={`ball gloss ${idx < filled ? 'filled' : ''}`} />
      ))}
    </div>
  );
}


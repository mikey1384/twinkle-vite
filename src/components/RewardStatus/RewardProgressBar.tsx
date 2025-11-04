import React, { memo, useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default memo(function RewardProgressBar({
  amount,
  max,
  color
}: {
  amount: number;
  max: number;
  color: string;
}) {
  const ratio = useMemo(() => {
    if (!max || max <= 0) return 0;
    return Math.max(0, Math.min(1, amount / max));
  }, [amount, max]);

  const segments = 5;
  const filled = useMemo(() => ratio * segments, [ratio]);

  const containerClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        color: ${color};
        position: relative;
      `,
    [color]
  );

  return (
    <div className={containerClass} aria-label="Reward progress">
      {Array.from({ length: segments }).map((_, i) => {
        const segFill = Math.max(0, Math.min(1, filled - i));
        return (
          <div
            key={i}
            className={css`
              position: relative;
              flex: 1 1 0;
              height: 10px;
              background: ${Color.highlightGray()};
              border: 1px solid transparent;
              border-radius: 999px;
              overflow: hidden;
              box-shadow: none;
              @media (max-width: ${mobileMaxWidth}) {
                height: 8px;
              }
            `}
          >
            <div
              className={css`
                position: absolute;
                inset: 0;
                transform-origin: left center;
                background: ${color};
                width: ${Math.round(segFill * 100)}%;
                transition: width 200ms ease;
              `}
            />
          </div>
        );
      })}
    </div>
  );
});

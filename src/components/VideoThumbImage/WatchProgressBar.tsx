import React, { memo } from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

function WatchProgressBar({
  className,
  style,
  percentage = 0
}: {
  className?: string;
  percentage?: number;
  style?: React.CSSProperties;
}) {
  const value = Number.isFinite(percentage)
    ? Math.max(0, Math.min(100, percentage))
    : 0;
  return (
    <div
      className={className}
      style={style}
      role="progressbar"
      aria-label="Video watched"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={css`
          background: ${Color.red()};
          height: 5px;
          width: ${value}%;
          @media (max-width: ${mobileMaxWidth}) {
            height: 3px;
          }
        `}
      />
    </div>
  );
}

export default memo(WatchProgressBar);

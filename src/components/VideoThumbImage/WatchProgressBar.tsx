import React, { memo } from 'react';
import PropTypes from 'prop-types';
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
  return (
    <div className={className} style={style}>
      <div
        className={css`
          background: ${Color.red()};
          height: 5px;
          width: ${percentage}%;
          @media (max-width: ${mobileMaxWidth}) {
            height: 3px;
          }
        `}
      />
    </div>
  );
}

export default memo(WatchProgressBar);

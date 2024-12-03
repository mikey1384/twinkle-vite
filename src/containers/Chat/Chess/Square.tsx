import React, { memo } from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

function Square({
  count = 0,
  className,
  img,
  shade,
  onClick,
  color,
  style
}: {
  count?: number;
  className?: string;
  img?: any;
  shade?: string;
  onClick?: () => void;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${css`
        background-repeat: no-repeat;
        background-position: center;
        font-size: 1.5rem;
        &.blurred {
          background: ${Color.brownOrange()};
          > img {
            opacity: 0.1;
          }
        }
        &.highlighted {
          cursor: pointer;
        }
        &:focus {
          outline: none;
        }
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1rem;
        }
      `} ${shade} ${className}`}
      style={{ position: 'relative', ...(style || {}) }}
      onClick={onClick}
    >
      {img && (
        <img
          {...img}
          loading="lazy"
          fetchPriority="low"
          style={img?.style || {}}
          className={css`
            width: 100%;
          `}
        />
      )}
      {count > 1 && (
        <div
          className={css`
            cursor: default;
            position: absolute;
            font-weight: bold;
            left: 18px;
            bottom: -2px;
            color: ${color === 'black' ? '#fff' : '#000'};
            @media (max-width: ${mobileMaxWidth}) {
              left: 10px;
            }
          `}
        >
          &times;{count}
        </div>
      )}
    </div>
  );
}

export default memo(Square);

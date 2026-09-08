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
  style,
  label,
  interactive = false,
  navigationIndex,
  tabIndex,
  onFocus
}: {
  count?: number;
  className?: string;
  img?: any;
  shade?: string;
  onClick?: () => void;
  color?: string;
  style?: React.CSSProperties;
  label?: string;
  interactive?: boolean;
  navigationIndex?: number;
  tabIndex?: number;
  onFocus?: () => void;
}) {
  const Element = interactive ? 'button' : 'div';
  return (
    <Element
      type={interactive ? 'button' : undefined}
      role={!interactive && label ? 'img' : undefined}
      aria-label={label}
      data-chess-index={navigationIndex}
      tabIndex={tabIndex}
      onFocus={onFocus}
      className={`${css`
        background-repeat: no-repeat;
        background-position: center;
        font-size: 1.5rem;
        border: 0;
        padding: 0;
        min-width: 0;
        min-height: 0;
        appearance: none;
        &.blurred {
          background: ${Color.brownOrange()};
          > img {
            opacity: 0.1;
          }
        }
        &.highlighted {
          cursor: pointer;
        }
        &:focus-visible {
          outline: 3px solid #334155;
          outline-offset: -3px;
          z-index: 1;
        }
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `} ${shade} ${className}`}
      style={{ position: 'relative', ...(style || {}) }}
      onClick={onClick}
    >
      {img && (
        <img
          {...img}
          alt={label ? '' : img.alt || ''}
          loading="lazy"
          style={{ ...img?.style, top: 0, left: 0, height: '100%', objectFit: 'contain' }}
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
    </Element>
  );
}

export default memo(Square);

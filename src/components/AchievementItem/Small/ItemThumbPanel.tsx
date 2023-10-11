import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ItemThumbPanel({
  isThumb,
  thumbSize = '4rem',
  itemName,
  badgeSrc,
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  itemName: string;
  badgeSrc?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={
        isThumb
          ? ''
          : css`
              display: flex;
              align-items: center;
              gap: 1rem;
            `
      }
      style={style}
    >
      {badgeSrc && (
        <img
          src={badgeSrc}
          alt="Badge"
          className={css`
            width: ${thumbSize};
            height: ${thumbSize};
          `}
        />
      )}
      {!isThumb && (
        <span
          className={css`
            font-weight: bold;
            color: ${Color.black()};
            font-size: 1.5rem;
          `}
        >
          {itemName}
        </span>
      )}
    </div>
  );
}

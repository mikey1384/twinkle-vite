import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ItemThumbPanel({
  itemName,
  badgeSrc,
  style
}: {
  itemName: string;
  badgeSrc?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        gap: 1rem;
      `}
      style={style}
    >
      {badgeSrc && (
        <img
          src={badgeSrc}
          alt="Badge"
          className={css`
            width: 4rem;
            height: 4rem;
          `}
        />
      )}
      <span
        className={css`
          font-weight: bold;
          color: ${Color.black()};
          font-size: 1.5rem;
        `}
      >
        {itemName}
      </span>
    </div>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function RecentGroupItem({
  imageUrl,
  name
}: {
  imageUrl: string;
  name: string;
}) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        font-size: 1.2rem;
        color: ${Color.darkGray()};
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}
    >
      <img
        src={imageUrl}
        alt={name}
        className={css`
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 0.5rem;
        `}
      />
      <span>{name}</span>
    </div>
  );
}

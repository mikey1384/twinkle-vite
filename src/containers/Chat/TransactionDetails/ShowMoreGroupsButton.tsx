import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

export default function ShowMoreGroupsButton({
  onClick,
  numMore
}: {
  onClick: () => void;
  numMore: number;
}) {
  return (
    <button
      className={css`
        width: calc(50% - 0.5rem);
        background: none;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 1rem;
        margin-bottom: 1rem;
        &:hover {
          opacity: 0.8;
        }
      `}
      onClick={onClick}
    >
      <span>{`Show ${numMore} More`}</span>
    </button>
  );
}

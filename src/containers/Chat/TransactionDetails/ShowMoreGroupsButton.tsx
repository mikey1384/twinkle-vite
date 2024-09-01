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
        height: 70px;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.highlightGray()};
        border-radius: ${borderRadius};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
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

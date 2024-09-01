import React from 'react';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ShowMoreGroupsButton({
  onClick,
  hideNumMore,
  numMore
}: {
  onClick?: () => void;
  hideNumMore?: boolean;
  numMore?: number;
}) {
  return (
    <div
      className={css`
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        border-radius: ${borderRadius};
        cursor: ${onClick ? 'pointer' : 'inherit'};
        border: 1px solid ${Color.borderGray()};
        font-weight: bold;
        color: ${Color.black()};
        width: calc(50% - 0.5rem);
        margin-bottom: 1rem;
        font-size: 1.2rem;

        ${onClick &&
        `
          &:hover {
            background-color: ${Color.highlightGray()};
            font-size: 1.1rem;
          }
        `}

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1rem;
          ${onClick &&
          `
            &:hover {
              font-size: 1.2rem;
            }
          `}
        }
      `}
      onClick={onClick}
    >
      {hideNumMore ? '...more' : numMore ? `...${numMore} more` : '+ Add'}
    </div>
  );
}

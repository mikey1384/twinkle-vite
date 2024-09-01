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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        borderRadius,
        cursor: onClick ? 'pointer' : 'inherit',
        border: `1px solid ${Color.borderGray()}`,
        fontWeight: 'bold',
        color: Color.black(),
        width: 'calc(50% - 0.5rem)',
        marginBottom: '1rem'
      }}
      className={css`
        font-size: 1.2rem;
        ${onClick
          ? `&:hover {
          background-color: ${Color.highlightGray()};
          font-size: 1.1rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        }`
          : ''}
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1rem;
        }
      `}
      onClick={onClick}
    >
      {hideNumMore ? '...more' : numMore ? `...${numMore} more` : '+ Add'}
    </div>
  );
}

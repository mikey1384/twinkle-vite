import React from 'react';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ShowMoreCardsButton({
  onClick,
  hideNumMore,
  numMore
}: {
  onClick?: () => void;
  hideNumMore?: boolean;
  numMore?: number;
}) {
  return (
    <div style={{ marginTop: '2.5rem', display: 'flex' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          marginLeft: '2rem',
          borderRadius,
          cursor: onClick ? 'pointer' : 'inherit',
          border: '1px solid var(--ui-border)',
          fontWeight: 'bold',
          color: Color.black(),
          marginBottom: '3rem',
          flexGrow: 1
        }}
        className={css`
          min-width: 9rem;
          font-size: 1.4rem;
          ${onClick
            ? `&:hover {
            background-color: ${Color.highlightGray()};
            font-size: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.4rem;
            }
          }`
            : ''}
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
            min-width: 6rem;
          }
        `}
        onClick={onClick}
      >
        {hideNumMore ? '...more' : numMore ? `...${numMore} more` : '+ Add'}
      </div>
    </div>
  );
}

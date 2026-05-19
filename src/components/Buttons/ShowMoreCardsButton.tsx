import React from 'react';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ShowMoreCardsButton({
  compact,
  onClick,
  hideNumMore,
  numMore
}: {
  compact?: boolean;
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
          padding: compact ? '0.4rem' : '1rem',
          marginLeft: compact ? '1rem' : '2rem',
          borderRadius,
          cursor: onClick ? 'pointer' : 'inherit',
          border: '1px solid var(--ui-border)',
          fontWeight: 'bold',
          color: Color.black(),
          marginBottom: '3rem',
          flexGrow: 1
        }}
        aria-label={compact ? 'Show more cards' : undefined}
        className={css`
          min-width: ${compact ? '5.2rem' : '9rem'};
          font-size: ${compact ? '1rem' : '1.4rem'};
          ${onClick
            ? `&:hover {
            background-color: ${Color.highlightGray()};
            font-size: ${compact ? '1rem' : '1.3rem'};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${compact ? '1rem' : '1.4rem'};
            }
          }`
            : ''}
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${compact ? '1rem' : '1.1rem'};
            min-width: ${compact ? '5.2rem' : '6rem'};
          }
        `}
        onClick={onClick}
      >
        {compact
          ? '...more'
          : hideNumMore
            ? '...more'
            : numMore
              ? `...${numMore} more`
              : '+ Add'}
      </div>
    </div>
  );
}

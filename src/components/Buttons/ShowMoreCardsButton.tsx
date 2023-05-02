import React from 'react';
import PropTypes from 'prop-types';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ShowMoreCardsButton.propTypes = {
  onClick: PropTypes.func,
  numMore: PropTypes.number
};
export default function ShowMoreCardsButton({
  onClick,
  numMore
}: {
  onClick?: () => void;
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
          border: `1px solid ${Color.borderGray()}`,
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
            min-width: 7rem;
          }
        `}
        onClick={onClick}
      >
        {numMore ? `...${numMore} more` : '+ Add'}
      </div>
    </div>
  );
}

import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Body({
  children,
  onClick
}: {
  children: any;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={onClick}
      className={`unselectable ${css`
        width: 100%;
        max-width: 65rem;
        cursor: ${onClick ? 'pointer' : 'default'};
        ${onClick
          ? `&:hover {
          > .panel {
            background-color: ${Color.highlightGray()};
            @media (max-width: ${mobileMaxWidth}) {
              background-color: transparent;
            }
          }
        }`
          : ''}
      `}`}
    >
      {children}
    </div>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

export default function ItemPanel({
  children,
  itemName,
  style
}: {
  children?: React.ReactNode;
  itemName: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        padding: 1rem;
        background: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `}
      style={style}
    >
      <div
        style={{ fontWeight: 'bold', fontSize: '2rem', color: Color.black() }}
      >
        {itemName}
      </div>
      {children}
    </div>
  );
}

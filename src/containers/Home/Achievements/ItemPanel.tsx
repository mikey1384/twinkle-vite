import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

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
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `}
      style={{
        background: '#fff',
        transition: 'border 0.2s, box-shadow 0.2s',
        padding: '1rem',
        ...style
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '2rem' }}>{itemName}</div>
      {children}
    </div>
  );
}

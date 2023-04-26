import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Heading({
  isCurrent,
  color,
  children
}: {
  isCurrent: boolean;
  color: string;
  children: any;
}) {
  return (
    <div
      className={css`
        font-size: 2rem;
        padding: 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.7rem;
          padding: 1.5rem;
        }
      `}
      style={{
        marginTop: '1rem',
        marginBottom: '0.5rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'Roboto, monospace',
        fontWeight: 'bold',
        backgroundColor: Color[color](isCurrent ? 1 : 0.7),
        color: '#fff'
      }}
    >
      {children}
    </div>
  );
}

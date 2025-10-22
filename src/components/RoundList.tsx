import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

export default function RoundList({
  children,
  width = '100%',
  mobileWidth,
  style
}: {
  children: any;
  width?: string;
  mobileWidth?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        list-style: none;
        padding: 0;
        margin-top: 0;
        margin-bottom: 0;
        width: ${width};
        font-size: 1.5rem;
        nav {
          position: relative;
          width: 100%;
          padding: 1.2rem 1.5rem;
          border: none;
          background: #fff;
          border-radius: ${borderRadius};
          margin-bottom: 1rem;
        }
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: 2rem;
          ${mobileWidth ? `width: ${mobileWidth};` : ''}
        }
      `}
      style={style}
    >
      {children}
    </div>
  );
}

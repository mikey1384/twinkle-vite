import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

export default function Card({
  children,
  style,
  edgeToEdgeOnMobile = true,
  noShadow = false
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  edgeToEdgeOnMobile?: boolean;
  noShadow?: boolean;
}) {
  return (
    <div
      className={css`
        background-color: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        ${noShadow
          ? ''
          : 'box-shadow: var(--card-shadow, 0 4px 8px rgba(0, 0, 0, 0.08));'}
        @media (max-width: ${mobileMaxWidth}) {
          ${edgeToEdgeOnMobile
            ? 'border: 0; border-radius: 0; box-shadow: none;'
            : ''}
        }
      `}
      style={style}
    >
      {children}
    </div>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function InvalidPage({
  title,
  text,
  style
}: {
  title?: string;
  text?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={css`
        padding: 1rem;
        padding-top: 25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        p {
          font-size: 4rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 3rem;
          }
        }
        span {
          margin-top: 1rem;
        }
      `}
    >
      <p>{title || 'Not Found'}</p>
      <span>{text || 'The page you requested does not exist'}</span>
    </div>
  );
}

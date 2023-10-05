import React from 'react';
import NewStats from './NewStats';
import { css } from '@emotion/css';
import { Content, User } from '~/types';

export default function ToPanel({
  achievements,
  target
}: {
  achievements: Content[];
  target: User;
}) {
  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      <div
        className={css`
          margin: 2rem 0rem 1rem 0;
          font-weight: bold;
          font-family: Roboto, sans-serif;
        `}
      >
        To
      </div>
      <div
        className={css`
          width: 100%;
          border-radius: 8px;
          border: 1px solid #ccc;
          padding: 1rem;
          margin-bottom: 1rem;
        `}
      >
        <NewStats achievements={achievements} target={target} />
      </div>
    </div>
  );
}

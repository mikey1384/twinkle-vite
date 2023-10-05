import React from 'react';
import CurrentPerks from './CurrentPerks';
import AchievementStatus from './AchievementStatus';
import { css } from '@emotion/css';
import { Content, User } from '~/types';

export default function FromPanel({
  achievements,
  loading,
  target
}: {
  achievements: Content[];
  loading: boolean;
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
          font-weight: bold;
          font-family: Roboto, sans-serif;
          margin: 1rem 0;
        `}
      >
        From
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
        <CurrentPerks target={target} />
        <AchievementStatus achievements={achievements} loading={loading} />
      </div>
    </div>
  );
}

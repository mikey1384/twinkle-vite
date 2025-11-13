import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function DrawOffer({
  onClick,
  username,
  userId,
  myId
}: {
  onClick: () => void;
  username: string;
  userId: number;
  myId: number;
}) {
  const displayedUserLabel = useMemo(() => {
    if (userId === myId) {
      return 'You';
    }
    return username;
  }, [myId, userId, username]);

  const offeredDrawLabel = useMemo(() => {
    return `${displayedUserLabel} offered a draw`;
  }, [displayedUserLabel]);

  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 2.5rem 1rem 1.5rem 1rem;
        position: relative;
      `}
    >
      <span
        className={css`
          cursor: pointer;
          font-size: 2rem;
          display: flex;
          font-weight: bold;
          color: ${Color.logoBlue()};
        `}
        onClick={onClick}
      >
        {offeredDrawLabel}
      </span>
    </div>
  );
}

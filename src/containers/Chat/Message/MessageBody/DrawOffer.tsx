import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useReplyCardPresentation } from './ReplyCardPresentation';

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
  const inReply = useReplyCardPresentation();
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
        justify-content: ${inReply ? 'flex-start' : 'center'};
        width: 100%;
        padding: ${inReply ? '0.2rem 0' : '2.5rem 1rem 1.5rem 1rem'};
        position: relative;
      `}
    >
      <span
        data-quote-own-click
        className={css`
          cursor: pointer;
          font-size: ${inReply ? '1.4rem' : '2rem'};
          display: flex;
          font-weight: bold;
          color: ${Color.logoBlue()};
        `}
        onClick={onClick}
      >
        {inReply ? 'Offered a draw' : offeredDrawLabel}
      </span>
    </div>
  );
}

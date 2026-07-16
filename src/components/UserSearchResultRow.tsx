import React from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import { Color } from '~/constants/css';

export default function UserSearchResultRow({
  profilePicUrl,
  realName,
  userId,
  username
}: {
  profilePicUrl?: string | null;
  realName?: string | null;
  userId: number;
  username: string;
}) {
  return (
    <span
      className={css`
        display: flex;
        width: 100%;
        min-width: 0;
        align-items: center;
        gap: 0.8rem;
      `}
    >
      <ProfilePic
        userId={userId}
        profilePicUrl={profilePicUrl || undefined}
        preferProvidedProfilePicUrl
        size="2.4rem"
        style={{ cursor: 'inherit', flex: '0 0 auto' }}
      />
      <span
        className={css`
          display: flex;
          min-width: 0;
          align-items: baseline;
          gap: 0.55rem;
          overflow: hidden;
          line-height: 1.3;
        `}
      >
        <span
          className={css`
            min-width: 0;
            overflow: hidden;
            color: ${Color.darkerGray()};
            font-size: 1.2rem;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;
          `}
        >
          {username}
        </span>
        {realName ? (
          <span
            className={css`
              min-width: 0;
              flex: 1 1 auto;
              overflow: hidden;
              color: ${Color.darkGray()};
              font-size: 1.1rem;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            ({realName})
          </span>
        ) : null}
      </span>
    </span>
  );
}

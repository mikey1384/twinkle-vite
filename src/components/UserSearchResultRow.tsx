import React from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import { Color } from '~/constants/css';

export default function UserSearchResultRow({
  chat = false,
  profilePicUrl,
  realName,
  userId,
  username
}: {
  chat?: boolean;
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
        size={chat ? 32 : '2.4rem'}
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
            color: ${chat ? '#253247' : Color.darkerGray()};
            font-size: ${chat ? '14px' : '1.2rem'};
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
              color: ${chat ? '#526176' : Color.darkGray()};
              font-size: ${chat ? '13px' : '1.1rem'};
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

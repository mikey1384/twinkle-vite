import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';

export default function UserInfo({
  user,
  style
}: {
  user: any;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
    >
      <div
        className={css`
          width: 8rem;
          @media (max-width: ${mobileMaxWidth}) {
            width: 5rem;
          }
        `}
      >
        <ProfilePic
          style={{ width: '100%' }}
          profilePicUrl={user.profilePicUrl}
          userId={user.id}
        />
      </div>
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div>
          <UsernameText
            className={css`
              font-size: 1.7rem;
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
            user={{
              id: user.id,
              username: user.username
            }}
          />
        </div>
      </div>
    </div>
  );
}

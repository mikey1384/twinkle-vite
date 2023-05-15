import React from 'react';
import UserDetails from '~/components/UserDetails';
import ProfilePic from '~/components/ProfilePic';
import { useChatContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function DefaultComponent({
  src,
  profile
}: {
  src: string;
  profile: {
    id: number;
    username: string;
    profilePicUrl: string;
  };
  profileId: number;
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  return (
    <div
      style={{
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`,
        borderRadius
      }}
      className={`${css`
        background: #fff;
        padding: 1rem;
        transition: background 0.5s;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        cursor: pointer;
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}`}
    >
      <div style={{ fontWeight: 'bold' }}>default page {src}</div>
      <div
        style={{
          display: 'flex',
          marginTop: '2rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div style={{ width: '18rem' }}>
          <ProfilePic
            userId={profile.id}
            profilePicUrl={profile.profilePicUrl || ''}
            online={chatStatus[profile.id]?.isOnline}
            statusShown
            large
          />
        </div>
        <div style={{ marginLeft: '3rem', flexGrow: 1 }}>
          <UserDetails
            noLink
            small
            unEditable
            profile={profile}
            userId={profile.id}
          />
        </div>
      </div>
    </div>
  );
}

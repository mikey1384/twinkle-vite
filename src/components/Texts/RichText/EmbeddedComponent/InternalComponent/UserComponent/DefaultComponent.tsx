import React from 'react';
import UserDetails from '~/components/UserDetails';
import ProfilePic from '~/components/ProfilePic';
import { useChatContext } from '~/contexts';

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
    <div>
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

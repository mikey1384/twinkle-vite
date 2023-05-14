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
      <div style={{ display: 'flex', marginTop: '2rem', alignItems: 'center' }}>
        <div style={{ width: '10rem' }}>
          <ProfilePic
            userId={profile.id}
            profilePicUrl={profile.profilePicUrl || ''}
            online={chatStatus[profile.id]?.isOnline}
            statusShown
            large
          />
        </div>
        <div style={{ marginLeft: '2rem' }}>
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

import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import RankBar from '~/components/RankBar';
import UserDetails from '~/components/UserDetails';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { User } from '~/types';

const profileContainerCSS = css`
  display: flex;
  flex-direction: column;
`;

const profileHeaderCSS = css`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const profilePicContainerCSS = css`
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const rankBarCSS = css`
  @media (max-width: ${mobileMaxWidth}) {
    margin-left: 0;
    margin-right: 0;
  }
`;

export default function Profile({ profile }: { profile: User }) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const { userId } = useKeyContext((v) => v.myState);

  return (
    <div className={profileContainerCSS}>
      <div className={profileHeaderCSS}>
        <div className={profilePicContainerCSS}>
          <ProfilePic
            style={{ width: '15rem', cursor: 'pointer' }}
            userId={profile.id}
            profilePicUrl={profile.profilePicUrl || ''}
            online={chatStatus[profile.id]?.isOnline}
            statusShown
            large
          />
        </div>
        <UserDetails
          noLink
          small
          unEditable
          profile={profile}
          style={{
            width: 'CALC(100% - 18rem)',
            marginLeft: '1rem',
            fontSize: '1.5rem'
          }}
          userId={userId}
        />
      </div>
      {!!profile.twinkleXP && (
        <RankBar
          profile={profile}
          className={rankBarCSS}
          style={{
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: 0,
            marginLeft: profile.rank && profile.rank < 4 ? '-1px' : '',
            marginRight: profile.rank && profile.rank < 4 ? '-1px' : ''
          }}
        />
      )}
    </div>
  );
}

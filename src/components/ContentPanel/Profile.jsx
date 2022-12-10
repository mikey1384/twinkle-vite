import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import RankBar from '~/components/RankBar';
import UserDetails from '~/components/UserDetails';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';

Profile.propTypes = {
  profile: PropTypes.object.isRequired
};

export default function Profile({ profile }) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const { userId } = useKeyContext((v) => v.myState);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <ProfilePic
            style={{ width: '15rem', cursor: 'pointer' }}
            userId={profile.id}
            profilePicUrl={profile.profilePicUrl}
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
          className={css`
            margin-left: ${!!profile.rank && profile.rank < 4 ? '-1px' : ''};
            margin-right: ${!!profile.rank && profile.rank < 4 ? '-1px' : ''};
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 0;
              margin-right: 0;
            }
          `}
          style={{
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: 0
          }}
        />
      )}
    </div>
  );
}

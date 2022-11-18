import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { MessageStyle } from '../../../../../Styles';
import moment from 'moment';

UserInfo.propTypes = {
  user: PropTypes.object.isRequired,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object
};

export default function UserInfo({ user, timeStamp, style }) {
  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

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
          width: 10rem;
          @media (min-width: ${mobileMaxWidth}) {
            width: 7rem;
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
                font-size: 1.6rem;
              }
            `}
            user={{
              id: user.id,
              username: user.username
            }}
          />
        </div>
        <div className={MessageStyle.timeStamp}>{displayedTimeStamp}</div>
      </div>
    </div>
  );
}

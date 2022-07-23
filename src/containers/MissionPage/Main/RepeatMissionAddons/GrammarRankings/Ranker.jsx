import { useMemo } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';

Ranker.propTypes = {
  myId: PropTypes.number,
  style: PropTypes.object,
  user: PropTypes.object
};

export default function Ranker({ myId, style, user }) {
  const rankColor = useMemo(() => {
    return user.rank === 1
      ? Color.gold()
      : user.rank === 2
      ? Color.lighterGray()
      : user.rank === 3
      ? Color.orange()
      : undefined;
  }, [user.rank]);
  const textColor = useMemo(
    () => rankColor || (user.rank <= 10 ? Color.logoBlue() : Color.darkGray()),
    [rankColor, user.rank]
  );

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background:
          user.id === myId && user.rank > 3 ? Color.highlightGray() : '#fff',
        padding: '1rem',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '1.5rem',
            width: '3rem',
            marginRight: '1rem',
            textAlign: 'center',
            color:
              rankColor ||
              (user.rank <= 10 ? Color.logoBlue() : Color.darkGray())
          }}
        >
          {user.rank ? `#${user.rank}` : '--'}
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div>
            <ProfilePic
              style={{ width: '3rem' }}
              profilePicUrl={user.profilePicUrl}
              userId={user.id}
            />
          </div>
          <UsernameText
            color={textColor}
            user={{ ...user, username: user.username }}
            userId={myId}
            style={{
              marginTop: '0.5rem',
              textAlign: 'center',
              fontSize: '1.2rem'
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          color: textColor,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}
      >
        <Icon icon="times" />
        <span style={{ marginLeft: '0.7rem' }}>
          {addCommasToNumber(user.value || 0)}
        </span>
      </div>
    </nav>
  );
}

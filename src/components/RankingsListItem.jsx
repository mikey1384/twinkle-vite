import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

RankingsListItem.propTypes = {
  myId: PropTypes.number,
  small: PropTypes.bool,
  style: PropTypes.object,
  target: PropTypes.string,
  user: PropTypes.object,
  onUsermenuShownChange: PropTypes.func
};

export default function RankingsListItem({
  myId,
  small,
  style,
  target = 'twinkleXP',
  user,
  onUsermenuShownChange = () => {}
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const rankColor = useMemo(() => {
    return user.rank === 1
      ? Color.gold()
      : user.rank === 2
      ? Color.lighterGray()
      : user.rank === 3
      ? Color.orange()
      : undefined;
  }, [user.rank]);

  const rankFontSize = useMemo(() => {
    if (small) {
      return user.rank < 100 ? '1.5rem' : '1rem';
    }
    return user.rank < 100 ? '2rem' : '1.5rem';
  }, [small, user.rank]);

  const mobileRankFontSize = useMemo(() => {
    if (small) {
      return user.rank < 100 ? '1.2rem' : '1rem';
    }
    return user.rank < 100 ? '1.5rem' : '1.2rem';
  }, [small, user.rank]);

  const usernameFontSize = useMemo(() => {
    return small ? '1.2rem' : '1.5rem';
  }, [small]);

  const mobileUsernameFontSize = useMemo(() => {
    return small ? '1rem' : '1.2rem';
  }, [small]);

  const xpFontSize = useMemo(() => {
    return small ? '1.3rem' : '1.5rem';
  }, [small]);

  const mobileXpFontSize = useMemo(() => {
    return small ? '1.1rem' : '1.3rem';
  }, [small]);

  const profileSize = useMemo(() => {
    return small ? '3rem' : '5rem';
  }, [small]);

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background:
          user.id === myId && user.rank > 3 ? Color.highlightGray() : '#fff',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <span
          className={css`
            font-weight: bold;
            font-size: ${rankFontSize};
            width: 3rem;
            margin-right: 1rem;
            text-align: center;
            color: ${rankColor ||
            (user.rank <= 10 ? Color.logoBlue() : Color.darkGray())};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${mobileRankFontSize};
            }
          `}
        >
          {user.rank ? `#${user.rank}` : '--'}
        </span>
        <div
          style={{
            marginLeft: '1.3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div>
            <ProfilePic
              style={{ width: profileSize }}
              profilePicUrl={user.profilePicUrl}
              userId={user.id}
            />
          </div>
          <UsernameText
            color={
              rankColor ||
              (user.rank <= 10 ? Color.logoBlue() : Color.darkGray())
            }
            user={{ ...user, username: user.username }}
            userId={myId}
            onMenuShownChange={onUsermenuShownChange}
            className={css`
              max-width: 15rem;
              margin-top: 0.5rem;
              text-align: center;
              font-size: ${usernameFontSize};
              @media (max-width: ${mobileMaxWidth}) {
                max-width: 7rem;
                font-size: ${mobileUsernameFontSize};
              }
            `}
          />
        </div>
      </div>
      <div
        className={css`
          font-weight: bold;
          font-size: ${xpFontSize};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${mobileXpFontSize};
          }
        `}
      >
        <span style={{ color: Color[xpNumberColor]() }}>
          {addCommasToNumber(user[target] || 0)}
        </span>{' '}
        <span style={{ color: Color.gold() }}>XP</span>
      </div>
    </nav>
  );
}

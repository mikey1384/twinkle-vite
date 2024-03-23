import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import UserListModal from '~/components/Modals/UserListModal';
import UsernameText from '~/components/Texts/UsernameText';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { returnTheme } from '~/helpers';
import { User } from '~/types';
import localize from '~/constants/localize';

const youLabel = localize('You');

StreakItem.propTypes = {
  myId: PropTypes.number.isRequired,
  rank: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
  streakObj: PropTypes.object.isRequired,
  theme: PropTypes.string.isRequired
};

export default function StreakItem({
  myId,
  streak,
  rank,
  streakObj,
  theme
}: {
  myId: number;
  rank: number;
  streak: number;
  streakObj: any;
  theme: string;
}) {
  const {
    link: { color: linkColor },
    active: { color: activeColor }
  } = useMemo(() => returnTheme(theme), [theme]);

  const [userListModalShown, setUserListModalShown] = useState(false);
  const rankColor = useMemo(() => {
    return rank === 1
      ? Color.gold()
      : rank === 2
      ? Color.lighterGray()
      : rank === 3
      ? Color.orange()
      : undefined;
  }, [rank]);
  const textColor = useMemo(
    () => rankColor || (rank <= 10 ? Color.logoBlue() : Color.darkGray()),
    [rankColor, rank]
  );
  const mobileRankFontSize = useMemo(() => {
    return rank <= 5 ? '1.2rem' : '1rem';
  }, [rank]);
  const imIncluded = useMemo(() => {
    for (const { id } of streakObj[streak]) {
      if (id === myId) {
        return true;
      }
    }
    return false;
  }, [myId, streak, streakObj]);
  const includedUsers = useMemo(() => {
    const users = [];
    for (const user of streakObj[streak]) {
      if (user.id === myId) {
        users.unshift(user);
      } else {
        users.push(user);
      }
    }
    return users;
  }, [myId, streak, streakObj]);

  const displayedUsers = useMemo(() => {
    return includedUsers.slice(0, 2);
  }, [includedUsers]);

  const otherUserNumber = useMemo(() => {
    return streakObj[streak].length - displayedUsers.length;
  }, [displayedUsers.length, streak, streakObj]);

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: imIncluded && rank > 3 ? Color.highlightGray() : '#fff'
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
            font-size: 1.5rem;
            width: 3rem;
            margin-right: 1rem;
            text-align: center;
            color: ${rankColor ||
            (rank <= 10 ? Color.logoBlue() : Color.darkGray())};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${mobileRankFontSize};
            }
          `}
        >
          {rank ? `#${rank}` : '--'}
        </span>
        {displayedUsers.map((user, index) => {
          const userStreakIsOngoing = user.currentStreak === streak;
          return (
            <div
              style={{ display: 'inline', marginRight: '0.5rem' }}
              key={user.id}
            >
              <UsernameText
                displayedName={myId === user.id ? youLabel : ''}
                color={Color[
                  userStreakIsOngoing ? activeColor : 'darkerGray'
                ]()}
                user={user}
              />
              {otherUserNumber === 0 &&
              displayedUsers.length === 2 &&
              index === 0 ? (
                <span style={{ marginLeft: '0.5rem' }}>and</span>
              ) : index === displayedUsers.length - 1 ? (
                ''
              ) : (
                ','
              )}
            </div>
          );
        })}
        {otherUserNumber > 0 ? (
          <span>
            <a
              style={{
                color: Color[linkColor](),
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={() => setUserListModalShown(true)}
            >
              and {otherUserNumber} other
              {otherUserNumber === 1 ? '' : 's'}
            </a>
          </span>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          color: textColor,
          fontWeight: 'bold'
        }}
      >
        <Icon style={{ fontSize: '1.3rem' }} icon="times" />
        <span
          className={css`
            font-size: ${rank === 1
              ? '2.1rem'
              : rank <= 3
              ? '1.9rem'
              : '1.7rem'};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${rank === 1
                ? '2rem'
                : rank <= 3
                ? '1.5rem'
                : '1.3rem'};
            }
          `}
          style={{ marginLeft: '0.5rem' }}
        >
          {addCommasToNumber(streak || 0)}
        </span>
      </div>
      {userListModalShown && (
        <UserListModal
          modalOverModal
          title="People who achieved this streak"
          users={streakObj[streak]}
          onHide={() => setUserListModalShown(false)}
          descriptionColor={Color[activeColor]()}
          descriptionShown={(user: User) => user.currentStreak === streak}
          description="(active)"
        />
      )}
    </nav>
  );
}

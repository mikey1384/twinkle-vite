import React, { useMemo, useState } from 'react';
import Icon from '~/components/Icon';
import UserListModal from '~/components/Modals/UserListModal';
import UsernameText from '~/components/Texts/UsernameText';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { User } from '~/types';import { useRoleColor } from '~/theme/useRoleColor';
import RankBadge from '~/components/RankBadge';

const youLabel = 'You';

export default function StreakItem({
  myId,
  streak,
  rank,
  streakObj,
  theme,
  bordered = false
}: {
  myId: number;
  rank: number;
  streak: number;
  streakObj: any;
  theme: string;
  bordered?: boolean;
}) {
  const { color: linkColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { color: activeColor } = useRoleColor('active', {
    themeName: theme,
    fallback: 'green'
  });

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
  const rankFontSize = useMemo(() => {
    return rank < 100 ? '1.6rem' : '1.3rem';
  }, [rank]);
  const mobileRankFontSize = useMemo(() => {
    return rank <= 5 ? '1.2rem' : '1rem';
  }, [rank]);
  const rankBadgeClass = useMemo(
    () =>
      css`
        min-width: 3rem;
        height: 2.4rem;
        font-size: ${rankFontSize};
        @media (max-width: ${mobileMaxWidth}) {
          min-width: 2.6rem;
          height: 2.1rem;
          font-size: ${mobileRankFontSize};
        }
      `,
    [mobileRankFontSize, rankFontSize]
  );
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
  const containerClass = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    border: ${bordered ? '1px solid var(--ui-border)' : 'none'};
    border-radius: 12px;
    padding: 0.85rem 1.1rem;
    background: #fff;
    box-shadow: ${bordered ? '0 1px 0 rgba(15, 23, 42, 0.08)' : 'none'};
    @media (max-width: ${mobileMaxWidth}) {
      padding: 0.7rem 0.85rem;
      gap: 0.75rem;
    }
  `;
  const leftGroupClass = css`
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
    flex: 1;
    flex-wrap: wrap;
    row-gap: 0.35rem;
    @media (max-width: ${mobileMaxWidth}) {
      gap: 0.6rem;
    }
  `;
  const namesListClass = css`
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3rem;
    color: ${Color.darkerGray()};
    font-size: 1.3rem;
    line-height: 1.4;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.1rem;
    }
  `;
  const scoreBlockClass = css`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: ${textColor};
    font-weight: 700;
    font-size: ${rank === 1 ? '2.1rem' : rank <= 3 ? '1.9rem' : '1.7rem'};
    white-space: nowrap;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: ${rank === 1 ? '2rem' : rank <= 3 ? '1.5rem' : '1.3rem'};
      gap: 0.45rem;
    }
  `;
  const highlightBackground = useMemo(() => '#eef2ff', []);
  const containerStyle = {
    background: imIncluded && rank > 3 ? highlightBackground : '#fff'
  };

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={leftGroupClass}>
        <RankBadge rank={rank} className={rankBadgeClass} />
        <div className={namesListClass}>
          {displayedUsers.map((user, index) => {
            const userStreakIsOngoing = user.currentStreak === streak;
            return (
              <React.Fragment key={user.id}>
                <UsernameText
                  displayedName={myId === user.id ? youLabel : ''}
                  color={
                    userStreakIsOngoing ? activeColor : Color.darkerGray()
                  }
                  user={user}
                />
                {otherUserNumber === 0 &&
                displayedUsers.length === 2 &&
                index === 0 ? (
                  <span>and</span>
                ) : index === displayedUsers.length - 1 ? null : (
                  <span>,</span>
                )}
              </React.Fragment>
            );
          })}
          {otherUserNumber > 0 ? (
            <span>
              <a
                style={{
                  color: linkColor,
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
      </div>
      <div className={scoreBlockClass}>
        <Icon style={{ fontSize: '1.3rem' }} icon="times" />
        <span>{addCommasToNumber(streak || 0)}</span>
      </div>
      {userListModalShown && (
        <UserListModal
          modalOverModal
          title="People who achieved this streak"
          users={streakObj[streak]}
          onHide={() => setUserListModalShown(false)}
          descriptionColor={activeColor}
          descriptionShown={(user: User) => user.currentStreak === streak}
          description="(active)"
        />
      )}
    </div>
  );
}

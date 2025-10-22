import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, tabletMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function RankingsListItem({
  myId,
  small,
  style,
  target = 'twinkleXP',
  user,
  onUsermenuShownChange = () => null,
  activityContext
}: {
  myId: number;
  small?: boolean;
  style?: React.CSSProperties;
  target?: string;
  user: any;
  onUsermenuShownChange?: (v: boolean) => void;
  activityContext?: string;
}) {
  const { getColor: getXpNumberColor } = useRoleColor('xpNumber', {
    fallback: 'logoGreen'
  });
  const userRank = useMemo(() => Number(user.rank), [user.rank]);
  const isSelf = user.id === myId;
  const rankColor = useMemo(() => {
    return userRank === 1
      ? Color.gold()
      : userRank === 2
      ? Color.lighterGray()
      : userRank === 3
      ? Color.orange()
      : undefined;
  }, [userRank]);

  const rankFontSize = useMemo(() => {
    if (small) {
      return userRank < 100 ? '1.5rem' : '1rem';
    }
    return userRank < 100 ? '2rem' : '1.5rem';
  }, [small, userRank]);

  const mobileRankFontSize = useMemo(() => {
    if (small) {
      return userRank < 100 ? '1.2rem' : '1rem';
    }
    return userRank < 100 ? '1.5rem' : '1.2rem';
  }, [small, userRank]);

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

  const containerClass = css`
    display: grid;
    grid-template-columns: 3.2rem 1fr auto;
    align-items: center;
    gap: 1.2rem;
    background: ${isSelf && userRank > 3 ? Color.highlightGray() : '#fff'};
  `;
  const rankClass = css`
    font-weight: bold;
    font-size: ${rankFontSize};
    width: 3.2rem;
    text-align: center;
    color: ${rankColor || (userRank <= 10 ? Color.logoBlue() : Color.darkGray())};
    @media (max-width: ${tabletMaxWidth}) {
      font-size: ${mobileRankFontSize};
    }
  `;
  const userBlockClass = css`
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  `;
  const usernameClass = css`
    display: block;
    max-width: 16rem;
    font-size: ${usernameFontSize};
    @media (max-width: ${tabletMaxWidth}) {
      max-width: 9rem;
      font-size: ${mobileUsernameFontSize};
    }
  `;
  const xpBlockClass = css`
    font-weight: bold;
    font-size: ${xpFontSize};
    white-space: nowrap;
    @media (max-width: ${tabletMaxWidth}) {
      font-size: ${mobileXpFontSize};
    }
  `;

  return (
    <nav className={containerClass} style={style}>
      <span className={rankClass}>{userRank ? `#${userRank}` : '--'}</span>
      <div className={userBlockClass}>
        <ProfilePic
          style={{ width: profileSize }}
          profilePicUrl={user.profilePicUrl}
          userId={user.id}
        />
        <UsernameText
          color={rankColor || (userRank <= 10 ? Color.logoBlue() : Color.darkGray())}
          user={{ ...user, username: user.username }}
          onMenuShownChange={onUsermenuShownChange}
          className={usernameClass}
          activityContext={activityContext}
          activityPoints={user[target] || 0}
        />
      </div>
      <div className={xpBlockClass}>
        <span style={{ color: getXpNumberColor() }}>
          {addCommasToNumber(user[target] || 0)}
        </span>{' '}
        <span style={{ color: Color.gold() }}>XP</span>
      </div>
    </nav>
  );
}

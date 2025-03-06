import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, tabletMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

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
  activityContext?: string; // 'aiStories', 'grammar', etc.
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const userRank = useMemo(() => Number(user.rank), [user.rank]);
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

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background:
          user.id === myId && userRank > 3 ? Color.highlightGray() : '#fff',
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
            (userRank <= 10 ? Color.logoBlue() : Color.darkGray())};
            @media (max-width: ${tabletMaxWidth}) {
              font-size: ${mobileRankFontSize};
            }
          `}
        >
          {userRank ? `#${userRank}` : '--'}
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
              (userRank <= 10 ? Color.logoBlue() : Color.darkGray())
            }
            user={{ ...user, username: user.username }}
            onMenuShownChange={onUsermenuShownChange}
            className={css`
              max-width: 15rem;
              margin-top: 0.5rem;
              text-align: center;
              font-size: ${usernameFontSize};
              @media (max-width: ${tabletMaxWidth}) {
                max-width: 7rem;
                font-size: ${mobileUsernameFontSize};
              }
            `}
            activityContext={activityContext}
            activityPoints={user[target] || 0}
          />
        </div>
      </div>
      <div
        className={css`
          font-weight: bold;
          font-size: ${xpFontSize};
          @media (max-width: ${tabletMaxWidth}) {
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

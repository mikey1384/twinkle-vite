import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, tabletMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';
import RankBadge from '~/components/RankBadge';

export default function RankingsListItem({
  myId,
  small,
  style,
  target = 'twinkleXP',
  user,
  onUsermenuShownChange = () => null,
  activityContext,
  bordered = false
}: {
  myId: number;
  small?: boolean;
  style?: React.CSSProperties;
  target?: string;
  user: any;
  onUsermenuShownChange?: (v: boolean) => void;
  activityContext?: string;
  bordered?: boolean;
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
    if (small) return userRank < 100 ? '1.2rem' : '1rem';
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

  const containerClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: ${small ? '0.8rem' : '1.2rem'};
        width: 100%;
        border: ${bordered ? '1px solid var(--ui-border)' : 'none'};
        border-radius: 12px;
        padding: ${small ? '0.75rem 1rem' : '1rem 1.4rem'};
        background: #fff;
        box-shadow: ${bordered ? '0 1px 0 rgba(15, 23, 42, 0.08)' : 'none'};
        @media (max-width: ${tabletMaxWidth}) {
          padding: ${small ? '0.6rem 0.75rem' : '0.85rem 1rem'};
          gap: ${small ? '0.6rem' : '0.9rem'};
        }
      `,
    [bordered, small]
  );
  const rankBadgeStyle = useMemo<React.CSSProperties>(
    () => ({
      minWidth: small ? '2.8rem' : '3.2rem',
      height: small ? '2.2rem' : '2.4rem',
      fontSize: rankFontSize
    }),
    [rankFontSize, small]
  );
  const leftGroupClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        gap: ${small ? '0.65rem' : '0.9rem'};
        flex: 1;
        min-width: 0;
      `,
    [small]
  );
  const profileWrapperClass = useMemo(
    () =>
      css`
        width: ${profileSize};
        min-width: ${profileSize};
        flex: 0 0 auto;
      `,
    [profileSize]
  );
  const userInfoClass = useMemo(
    () =>
      css`
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
      `,
    []
  );
  const usernameClass = useMemo(
    () =>
      css`
        display: block;
        max-width: ${small ? '14rem' : '18rem'};
        font-size: ${usernameFontSize};
        font-weight: 600;
        @media (max-width: ${tabletMaxWidth}) {
          max-width: ${small ? '9rem' : '12rem'};
          font-size: ${mobileUsernameFontSize};
        }
      `,
    [mobileUsernameFontSize, small, usernameFontSize]
  );
  const xpBlockClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
        font-weight: 700;
        font-size: ${xpFontSize};
        white-space: nowrap;
        @media (max-width: ${tabletMaxWidth}) {
          font-size: ${mobileXpFontSize};
        }
      `,
    [mobileXpFontSize, xpFontSize]
  );
  const highlightBackground = useMemo(() => '#eef2ff', []);
  const containerStyle = useMemo(() => {
    const background =
      isSelf && userRank > 3 ? highlightBackground : '#fff';
    return style ? { background, ...style } : { background };
  }, [highlightBackground, isSelf, style, userRank]);

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={leftGroupClass}>
        <RankBadge rank={userRank} style={rankBadgeStyle} />
        <div className={profileWrapperClass}>
          <ProfilePic
            style={{ width: '100%' }}
            profilePicUrl={user.profilePicUrl}
            userId={user.id}
          />
        </div>
        <div className={userInfoClass}>
          <UsernameText
            color={rankColor || (userRank <= 10 ? Color.logoBlue() : Color.darkGray())}
            user={{ ...user, username: user.username }}
            onMenuShownChange={onUsermenuShownChange}
            className={usernameClass}
            activityContext={activityContext}
            activityPoints={user[target] || 0}
          />
        </div>
      </div>
      <div className={xpBlockClass}>
        <span style={{ color: getXpNumberColor() }}>
          {addCommasToNumber(user[target] || 0)}
        </span>{' '}
        <span style={{ color: Color.gold() }}>XP</span>
      </div>
    </div>
  );
}

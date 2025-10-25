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
  const { getColor: getHighlightColor } = useRoleColor('filter', {
    fallback: 'logoBlue'
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
  const rankBadgeClass = useMemo(
    () =>
      css`
        min-width: ${small ? '2.8rem' : '3.2rem'};
        height: ${small ? '2.2rem' : '2.4rem'};
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${rankFontSize};
        @media (max-width: ${tabletMaxWidth}) {
          font-size: ${mobileRankFontSize};
        }
      `,
    [mobileRankFontSize, rankFontSize, small]
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
  const rankBadgeBackground = useMemo(() => {
    if (userRank === 1) return '#fef3c7';
    if (userRank === 2) return '#e2e8f0';
    if (userRank === 3) return '#ffedd5';
    return '#f1f5f9';
  }, [userRank]);
  const rankBadgeTextColor = useMemo(() => {
    if (userRank === 2) return '#ffffff';
    if (rankColor) return rankColor;
    return userRank <= 10 ? Color.logoBlue() : '#475569';
  }, [rankColor, userRank]);
  const rankBadgeTextShadow = useMemo(() => {
    if (userRank === 2) {
      return '0 0 0.2rem rgba(37, 99, 235, 0.62)';
    }
    return 'none';
  }, [userRank]);
  const highlightBackground = useMemo(() => {
    return getHighlightColor(0.22) || Color.highlightGray();
  }, [getHighlightColor]);
  const containerStyle = useMemo(() => {
    const background =
      isSelf && userRank > 3 ? highlightBackground : '#fff';
    return style ? { background, ...style } : { background };
  }, [highlightBackground, isSelf, style, userRank]);

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={leftGroupClass}>
        <span
          className={rankBadgeClass}
          style={{
            background: rankBadgeBackground,
            color: rankBadgeTextColor,
            textShadow: rankBadgeTextShadow
          }}
        >
          {userRank ? `#${userRank}` : '--'}
        </span>
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

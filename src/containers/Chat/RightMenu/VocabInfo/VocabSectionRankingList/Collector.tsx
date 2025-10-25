import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import Icon from '~/components/Icon';
import { useRoleColor } from '~/theme/useRoleColor';

const deviceIsMobile = isMobile(navigator);

export default function Collector({
  style,
  user,
  collectedLabel,
  targetLabel,
  bordered = false
}: {
  style?: React.CSSProperties;
  user: {
    id: number;
    rank: number;
    username: string;
    profilePicUrl: string;
    [key: string]: string | number;
  };
  collectedLabel?: string;
  targetLabel?: string;
  bordered?: boolean;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const { getColor: getHighlightColor } = useRoleColor('filter', {
    fallback: 'logoBlue'
  });
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

  const rankBadgeTextColor = useMemo(() => {
    if (user.rank === 2) return '#ffffff';
    return textColor;
  }, [textColor, user.rank]);

  const containerClass = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    border: ${bordered ? '1px solid var(--ui-border)' : 'none'};
    border-radius: 12px;
    padding: 0.8rem 1rem;
    background: #fff;
    box-shadow: ${bordered ? '0 1px 0 rgba(15, 23, 42, 0.08)' : 'none'};
    @media (max-width: ${mobileMaxWidth}) {
      padding: 0.65rem 0.75rem;
      gap: 0.75rem;
    }
  `;
  const rankBadgeClass = css`
    min-width: 3rem;
    height: 2.4rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.35rem;
    background: ${user.rank === 1
      ? '#fef3c7'
      : user.rank === 2
      ? '#e2e8f0'
      : user.rank === 3
      ? '#ffedd5'
      : '#f1f5f9'};
    color: ${rankBadgeTextColor};
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.1rem;
      min-width: 2.6rem;
      height: 2.1rem;
    }
  `;
  const leftGroupClass = css`
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
    flex: 1;
    @media (max-width: ${mobileMaxWidth}) {
      gap: 0.7rem;
    }
  `;
  const profileWrapperClass = css`
    width: 3.4rem;
    min-width: 3.4rem;
    flex: 0 0 auto;
    @media (max-width: ${mobileMaxWidth}) {
      width: 2.8rem;
      min-width: 2.8rem;
    }
  `;
  const highlightBackground = useMemo(() => {
    return getHighlightColor(0.22) || Color.highlightGray();
  }, [getHighlightColor]);
  const usernameClass = css`
    max-width: 16rem;
    font-size: 1.25rem;
    font-weight: 600;
    @media (max-width: ${mobileMaxWidth}) {
      max-width: 9rem;
      font-size: 1.05rem;
    }
  `;
  const infoGroupClass = css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  `;
  const statBlockClass = css`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: ${textColor};
    font-size: 1.45rem;
    font-weight: 700;
    white-space: nowrap;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.1rem;
      gap: 0.45rem;
    }
  `;
  const containerStyle = {
    background:
      user.id === myId && user.rank > 3 ? highlightBackground : '#fff',
    ...(style || {})
  };
  const rankBadgeTextShadow =
    user.rank === 2 ? '0 0 0.2rem rgba(37, 99, 235, 0.62)' : 'none';

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={leftGroupClass}>
        <span
          className={rankBadgeClass}
          style={{
            textShadow: rankBadgeTextShadow
          }}
        >
          {user.rank ? `#${user.rank}` : '--'}
        </span>
        <div className={profileWrapperClass}>
          <ProfilePic
            style={{ width: '100%' }}
            profilePicUrl={user.profilePicUrl}
            userId={user.id}
          />
        </div>
        <div className={infoGroupClass}>
          <UsernameText
            color={textColor}
            user={{ ...user, username: user.username }}
            className={usernameClass}
            wordMasterContext={true}
            wordMasterPoints={Number(user[targetLabel || 'numWords'])}
            wordMasterLabel={collectedLabel}
            activityContext="wordMaster"
            activityPoints={user[targetLabel || 'numWords'] as number}
          />
        </div>
      </div>
      <div className={statBlockClass}>
        {deviceIsMobile && !['pts', 'pt'].includes(collectedLabel || '') && (
          <Icon style={{ color: textColor }} icon="times" />
        )}
        <span>
          {addCommasToNumber((user[targetLabel || 'numWords'] as number) || 0)}
          {(!deviceIsMobile ||
            ['pts', 'pt'].includes(collectedLabel || '')) && (
            <span> {collectedLabel}</span>
          )}
        </span>
      </div>
    </div>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import { tabletMaxWidth } from '~/constants/css';

export default function Item({ user, myId }: { user: any; myId: number }) {
  const isMe = user.id === myId;
  const rank = Number(user.rank) || 0;
  const clears = Number(user.currentLevelClears ?? 0);

  return (
    <div className={rowCss(isMe)}>
      <div className={leftCss}>
        <div className={badgeCss(rank)}>{rank ? `#${rank}` : '--'}</div>
        <div className={avatarWrapCss}>
          <ProfilePic
            style={{ width: '100%' }}
            profilePicUrl={user.profilePicUrl}
            userId={user.id}
          />
        </div>
        <div className={userBoxCss}>
          <UsernameText
            user={{ id: user.id, username: user.username }}
            color={
              rank <= 3 && rank > 0
                ? ['gold', 'lighterGray', 'orange'][rank - 1]
                : undefined
            }
          />
        </div>
      </div>
      <div className={statsRightCss}>
        <span className={levelPillCss}>Level {user.maxLevelUnlocked}</span>
        <span className={clearsPillCss}>Clears {clears}</span>
      </div>
    </div>
  );
}

const rowCss = (isMe: boolean) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${isMe ? '#eef2ff' : '#fff'};
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
`;

const leftCss = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const avatarWrapCss = css`
  width: 3.6rem;
  min-width: 3.6rem;
  flex: 0 0 auto;
`;

const badgeCss = (rank: number) => css`
  min-width: 2.8rem;
  height: 2.1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  color: ${rank === 1
    ? '#b45309'
    : rank === 2
    ? '#334155'
    : rank === 3
    ? '#9a3412'
    : '#475569'};
  background: ${rank === 1
    ? '#fef3c7'
    : rank === 2
    ? '#e2e8f0'
    : rank === 3
    ? '#ffedd5'
    : '#f1f5f9'};

  @media (max-width: ${tabletMaxWidth}) {
    font-size: 0.9rem;
    min-width: 2.4rem;
    height: 1.9rem;
  }
`;

const userBoxCss = css`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
`;

const statsRightCss = css`
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
`;

const levelPillCss = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 800;
  color: #1d4ed8;
  background: #dbeafe;
  border: 1px solid #93c5fd;
`;

const clearsPillCss = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  border: 1px solid #86efac;
`;

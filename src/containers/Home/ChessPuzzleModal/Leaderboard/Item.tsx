import React from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import RankBadge from '~/components/RankBadge';

export default function Item({ user, myId }: { user: any; myId: number }) {
  const isMe = user.id === myId;
  const rank = Number(user.rank) || 0;
  const clears = Number(user.currentLevelClears ?? 0);

  return (
    <div className={rowCss(isMe)}>
      <div className={leftCss}>
        <RankBadge rank={rank} />
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
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  box-shadow: none;
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

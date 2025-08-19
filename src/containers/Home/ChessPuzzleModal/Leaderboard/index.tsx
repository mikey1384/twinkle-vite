import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';
import Item from './Item';

export default function Leaderboard({
  users,
  myId
}: {
  users: any[];
  myId: number;
}) {
  return (
    <div className={containerCss}>
      <div className={listCss}>
        {users.map((user) => (
          <Item key={user.id} user={user} myId={myId} />
        ))}
      </div>
    </div>
  );
}

const containerCss = css`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const listCss = css`
  width: 42rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
  overflow-y: auto;
  max-height: calc(100vh - 36rem);

  @media (max-width: ${tabletMaxWidth}) {
    gap: 0.5rem;
    padding: 0 0.5rem 0.75rem;
  }
`;

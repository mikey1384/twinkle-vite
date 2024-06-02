import React from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';

export default function GroupItem({
  groupName,
  allMemberIds,
  description,
  isOwner,
  isMember
}: {
  groupName: string;
  allMemberIds: number[];
  description: string;
  isOwner: boolean;
  isMember: boolean;
}) {
  const numTotalMembers = allMemberIds.length;
  return (
    <ErrorBoundary componentPath="Home/Groups/GroupItem">
      <div
        className={css`
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto auto;
          gap: 1rem;
          background: #fff;
          padding: 1.5rem;
          margin: 1rem 0;
          border: 1px solid gray;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `}
      >
        <img
          src="https://via.placeholder.com/50"
          alt="Group"
          className={css`
            grid-row: 1 / 2;
            grid-column: 1 / 2;
            border-radius: 50%;
            width: 5rem;
            height: 5rem;
            object-fit: cover;
          `}
        />
        <h2
          className={css`
            grid-row: 1 / 2;
            grid-column: 2 / 3;
            margin: 0;
            font-size: 1.7rem;
            font-weight: bold;
          `}
        >
          {groupName}
        </h2>
        <p
          className={css`
            grid-row: 2 / 3;
            grid-column: 1 / 3;
            margin: 0;
            font-size: 1.5rem;
            color: #666;
          `}
        >
          Member{numTotalMembers === 1 ? '' : 's'}:{' '}
          <strong>{numTotalMembers}</strong>
        </p>
        <p
          className={css`
            grid-row: 3 / 4;
            grid-column: 1 / 3;
            margin: 0;
            font-size: 1.5rem;
            color: #666;
          `}
        >
          {description}
        </p>
        {isOwner ? null : isMember ? (
          <div
            className={css`
              grid-row: 4 / 5;
              grid-column: 1 / 3;
              margin: 0;
              font-size: 1.5rem;
              color: #4caf50;
              text-align: end;
            `}
          >
            <Icon icon="check" />
            <span style={{ marginLeft: '0.7rem' }}>Joined</span>
          </div>
        ) : (
          <button
            className={css`
              grid-row: 4 / 5;
              grid-column: 1 / 3;
              background: #4caf50;
              color: white;
              border: none;
              border-radius: 0.5rem;
              padding: 1rem 2rem;
              cursor: pointer;
              font-size: 1.5rem;
              margin-top: 2rem;
              &:hover {
                background: #45a049;
              }
            `}
          >
            Join
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
}

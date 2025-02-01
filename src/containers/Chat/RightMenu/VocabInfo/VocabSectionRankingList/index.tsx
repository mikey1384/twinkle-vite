import React, { useMemo } from 'react';
import FilterBar from '~/components/FilterBar';
import Collector from './Collector';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

const rankingsLabel = localize('rankings');
const top30Label = localize('top30');

interface UserType {
  id: number;
  rank: number;
  username: string;
  profilePicUrl: string;
  [key: string]: string | number;
}

export default function VocabSectionRankingList({
  allUsers = [],
  top30Users = [],
  allSelected,
  onSetAllSelected,
  target
}: {
  allUsers: UserType[];
  top30Users: UserType[];
  allSelected: boolean;
  onSetAllSelected: (allSelected: boolean) => void;
  target: string;
}) {
  const users = useMemo(
    () => (allSelected ? allUsers : top30Users),
    [allSelected, allUsers, top30Users]
  );

  const filteredUsers = useMemo(
    () => (users || []).filter((user) => Number(user[target]) > 0),
    [users, target]
  );

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/VocabInfo/CollectorRankingList">
      {allUsers.length > 0 && (
        <FilterBar style={{ fontSize: '1.5rem', height: '4rem' }}>
          <nav
            onClick={() => onSetAllSelected(true)}
            className={allSelected ? 'active' : ''}
          >
            {rankingsLabel}
          </nav>
          <nav
            onClick={() => onSetAllSelected(false)}
            className={!allSelected ? 'active' : ''}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}
      <div style={{ marginTop: '1rem' }}>
        {filteredUsers.length === 0 ? (
          <div
            className={css`
              background: #fff;
              padding: 10rem 2rem;
              text-align: center;
            `}
          >
            Be the first to join this leaderboard by collecting vocabulary
          </div>
        ) : (
          filteredUsers.map((user) => {
            return (
              <Collector
                key={user.username}
                style={{ padding: '1rem' }}
                collectedLabel={
                  target === 'totalPoints'
                    ? `pt${Number(user[target]) === 1 ? '' : 's'}`
                    : 'discovered'
                }
                targetLabel={target}
                user={user}
              />
            );
          })
        )}
      </div>
    </ErrorBoundary>
  );
}

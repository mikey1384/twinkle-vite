import React, { useMemo } from 'react';
import FilterBar from '~/components/FilterBar';
import Collector from './Collector';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

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
  allUsers,
  top30Users,
  hasWordsCollected,
  allSelected,
  onSetAllSelected,
  collectedLabel = '',
  targetLabel = ''
}: {
  allUsers: UserType[];
  top30Users: UserType[];
  hasWordsCollected: boolean;
  allSelected: boolean;
  onSetAllSelected: (allSelected: boolean) => void;
  collectedLabel?: string;
  targetLabel?: string;
}) {
  const users = useMemo(
    () => (allSelected ? allUsers : top30Users),
    [allSelected, allUsers, top30Users]
  );

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/VocabInfo/CollectorRankingList">
      {hasWordsCollected && (
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
        {(users || [])
          .filter((user) => (user[targetLabel] as number) > 0)
          .map((user) => (
            <Collector
              key={user.username}
              style={{ padding: '1rem' }}
              collectedLabel={collectedLabel}
              targetLabel={targetLabel}
              user={user}
            />
          ))}
      </div>
    </ErrorBoundary>
  );
}

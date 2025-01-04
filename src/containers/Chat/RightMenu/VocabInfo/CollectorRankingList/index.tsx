import React, { useMemo } from 'react';
import FilterBar from '~/components/FilterBar';
import Collector from './Collector';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const rankingsLabel = localize('rankings');
const top30Label = localize('top30');

interface CollectorType {
  id: number;
  username: string;
  rank: number;
  profilePicUrl: string;
  numWords: number;
}

export default function CollectorRankingList({
  allCollectors,
  top30Collectors,
  hasWordsCollected,
  allSelected,
  onSetAllSelected
}: {
  allCollectors: CollectorType[];
  top30Collectors: CollectorType[];
  hasWordsCollected: boolean;
  allSelected: boolean;
  onSetAllSelected: (allSelected: boolean) => void;
}) {
  const wordCollectors = useMemo(
    () => (allSelected ? allCollectors : top30Collectors),
    [allSelected, allCollectors, top30Collectors]
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
        {(wordCollectors || [])
          .filter((collector) => collector.numWords > 0)
          .map((collector) => (
            <Collector
              key={collector.username}
              style={{ padding: '1rem' }}
              user={collector}
            />
          ))}
      </div>
    </ErrorBoundary>
  );
}

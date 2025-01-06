import React, { useMemo } from 'react';
import FilterBar from '~/components/FilterBar';
import Collector from './Collector';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const rankingsLabel = localize('rankings');
const top30Label = localize('top30');

interface CollectorType {
  id: number;
  rank: number;
  username: string;
  profilePicUrl: string;
  [key: string]: string | number;
}

export default function VocabSectionRankingList({
  allCollectors,
  top30Collectors,
  hasWordsCollected,
  allSelected,
  onSetAllSelected,
  collectedLabel = '',
  targetLabel = ''
}: {
  allCollectors: CollectorType[];
  top30Collectors: CollectorType[];
  hasWordsCollected: boolean;
  allSelected: boolean;
  onSetAllSelected: (allSelected: boolean) => void;
  collectedLabel?: string;
  targetLabel?: string;
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
          .filter((collector) => (collector[targetLabel] as number) > 0)
          .map((collector) => (
            <Collector
              key={collector.username}
              style={{ padding: '1rem' }}
              collectedLabel={collectedLabel}
              targetLabel={targetLabel}
              user={collector}
            />
          ))}
      </div>
    </ErrorBoundary>
  );
}

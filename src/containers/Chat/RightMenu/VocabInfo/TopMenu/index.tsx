import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Color } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';
import Collector from './Collector';
import FilterBar from '~/components/FilterBar';
import localize from '~/constants/localize';
import Loading from '~/components/Loading';

const collectorsOfHighLevelWordsLabel = localize('collectorsOfHighLevelWords');
const rankingsLabel = localize('rankings');
const top30Label = localize('top30');

export default function TopMenu() {
  const { numWordsCollected } = useKeyContext((v) => v.myState);
  const { all, top30s } = useChatContext((v) => v.state.wordCollectors);
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const [allSelected, setAllSelected] = useState(numWordsCollected > 0);
  const wordCollectors = useMemo(
    () => (allSelected ? all : top30s),
    [all, allSelected, top30s]
  );
  const prevNumWordsCollectedRef = useRef(0);

  useEffect(() => {
    if (prevNumWordsCollectedRef.current === 0 && numWordsCollected > 0) {
      setAllSelected(true);
    }
    prevNumWordsCollectedRef.current = numWordsCollected;
  }, [numWordsCollected]);

  return (
    <div
      style={{
        height: '50%',
        borderBottom: `1px solid ${Color.borderGray()}`,
        overflow: 'scroll'
      }}
    >
      {loadingVocabulary ? (
        <Loading style={{ height: '100%' }} />
      ) : (
        <>
          <div
            style={{
              fontSize: '1.7rem',
              padding: '1rem',
              textAlign: 'center',
              fontWeight: 'bold',
              background: Color.brownOrange(),
              color: '#fff'
            }}
          >
            {collectorsOfHighLevelWordsLabel}
          </div>
          {numWordsCollected > 0 && (
            <FilterBar style={{ fontSize: '1.5rem', height: '4rem' }}>
              <nav
                onClick={() => setAllSelected(true)}
                className={allSelected ? 'active' : ''}
              >
                {rankingsLabel}
              </nav>
              <nav
                onClick={() => setAllSelected(false)}
                className={!allSelected ? 'active' : ''}
              >
                {top30Label}
              </nav>
            </FilterBar>
          )}
          <div style={{ marginTop: '1rem' }}>
            {(wordCollectors || [])
              .filter(
                (collector: { numWords: number }) => collector.numWords > 0
              )
              .map(
                (collector: {
                  id: number;
                  username: string;
                  rank: number;
                  profilePicUrl: string;
                  numWords: number;
                }) => (
                  <Collector
                    key={collector.username}
                    style={{ padding: '1rem' }}
                    user={collector}
                  />
                )
              )}
          </div>
        </>
      )}
    </div>
  );
}

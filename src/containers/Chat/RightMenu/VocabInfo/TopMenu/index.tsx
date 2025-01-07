import React, { useState } from 'react';
import { Color } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';
import VocabSectionRankingList from './VocabSectionRankingList';
import localize from '~/constants/localize';
import Loading from '~/components/Loading';

const collectorsOfHighLevelWordsLabel = localize('collectorsOfHighLevelWords');

export default function TopMenu() {
  const { numWordsCollected } = useKeyContext((v) => v.myState);
  const { all, top30s } = useChatContext((v) => v.state.wordCollectors);
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const [allSelected, setAllSelected] = useState(numWordsCollected > 0);

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
          <VocabSectionRankingList
            allUsers={all || []}
            top30Users={top30s || []}
            hasWordsCollected={numWordsCollected > 0}
            allSelected={allSelected}
            onSetAllSelected={setAllSelected}
            collectedLabel="collected"
            targetLabel="numWords"
          />
        </>
      )}
    </div>
  );
}

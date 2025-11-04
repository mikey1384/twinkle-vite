import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';
import { useChatContext } from '~/contexts';
import VocabSectionRankingList from './VocabSectionRankingList';
import Loading from '~/components/Loading';

export default function TopMenu() {
  const { all, top30s } = useChatContext((v) => v.state.collectorRankings);
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const [allSelected, setAllSelected] = useState(all?.length > 0);

  return (
    <div
      style={{
        height: '50%',
        borderBottom: '1px solid var(--ui-border)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        minHeight: 0
      }}
    >
      {loadingVocabulary ? (
        <Loading style={{ height: '100%' }} />
      ) : (
        <>
          <div
            className={css`
              width: 100%;
              padding: 0 1rem;
              margin: 1rem 0 1rem;
            `}
          >
            <ScopedTheme theme="gold">
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.8rem;
                  padding: 0.9rem 1.2rem;
                  border-radius: 12px;
                  background: var(--chat-title-bg);
                  border: 1px solid var(--ui-border);
                  color: var(--chat-text);
                `}
              >
                <Icon icon="trophy" color="var(--theme-bg)" />
                <div
                  className={css`
                    font-size: 1.6rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                  `}
                >
                  Word Discoverer Hall of Fame
                </div>
              </div>
            </ScopedTheme>
          </div>
          <VocabSectionRankingList
            allUsers={all || []}
            top30Users={top30s || []}
            allSelected={allSelected}
            onSetAllSelected={setAllSelected}
            target="numWords"
          />
        </>
      )}
    </div>
  );
}

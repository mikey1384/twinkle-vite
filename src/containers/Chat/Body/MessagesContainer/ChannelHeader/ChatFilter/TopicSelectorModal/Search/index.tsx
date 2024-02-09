import React from 'react';
import Results from './Results';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function Search({
  currentTopicId,
  displayedThemeColor,
  onSelectTopic,
  searchedTopics,
  searched
}: {
  currentTopicId: number;
  displayedThemeColor: string;
  onSelectTopic: (id: number) => void;
  searchedTopics: any[];
  searched: boolean;
}) {
  return (
    <div style={{ width: '100%', position: 'relative', minHeight: '10rem' }}>
      {!searched && !searchedTopics.length ? (
        <Loading style={{ height: '10rem' }} />
      ) : (
        <div style={{ width: '100%' }}>
          {!!searchedTopics.length && (
            <h3
              className={css`
                margin-top: 3rem;
                margin-bottom: 2rem;
                color: ${Color[displayedThemeColor]()};
              `}
            >
              Search Results
            </h3>
          )}
          {searchedTopics.length ? (
            <Results
              currentTopicId={currentTopicId}
              displayedThemeColor={displayedThemeColor}
              onSelectTopic={onSelectTopic}
              results={searchedTopics}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '10rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              No Results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

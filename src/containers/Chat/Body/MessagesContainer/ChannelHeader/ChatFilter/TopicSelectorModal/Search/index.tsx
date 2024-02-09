import React, { useMemo } from 'react';
import Results from './Results';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

export default function Search({
  currentTopicId,
  displayedThemeColor,
  maxTopicLength,
  onSelectTopic,
  searchedTopics,
  searched,
  searchText
}: {
  currentTopicId: number;
  displayedThemeColor: string;
  maxTopicLength: number;
  onSelectTopic: (id: number) => void;
  searchedTopics: any[];
  searched: boolean;
  searchText: string;
}) {
  const searchTextExceedsMax = useMemo(
    () => searchText.length > maxTopicLength,
    [searchText, maxTopicLength]
  );

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
              className={css`
                padding: 5rem 0;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: #333;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 2rem;
                text-align: center;
                font-weight: bold;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.7rem;
                }
              `}
            >
              <p>
                {searchTextExceedsMax
                  ? `The topic is too long. Please keep it within ${maxTopicLength} characters.`
                  : `"${searchText}"`}
              </p>
              {!searchTextExceedsMax && (
                <button
                  className={css`
                    margin-top: 3rem;
                    padding: 1rem 2rem;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #fff;
                    background-color: #007bff;
                    border: none;
                    border-radius: ${borderRadius};
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.5);
                    transition: background-color 0.3s ease;

                    &:hover {
                      background-color: #0056b3;
                    }
                  `}
                  onClick={() => console.log('Starting new topic:', searchText)}
                >
                  Start Topic
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

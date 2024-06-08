import React, { useMemo } from 'react';
import Results from './Results';
import Loading from '~/components/Loading';
import StartTopicButton from '../StartTopicButton';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function Search({
  canAddTopic,
  channelId,
  channelName,
  currentTopicId,
  displayedThemeColor,
  featuredTopicId,
  isOwner,
  maxTopicLength,
  onSelectTopic,
  onHide,
  pathId,
  pinnedTopicIds,
  searchedTopics,
  searched,
  searchText
}: {
  canAddTopic: boolean;
  channelId: number;
  channelName: string;
  currentTopicId: number;
  displayedThemeColor: string;
  featuredTopicId: number;
  isOwner: boolean;
  maxTopicLength: number;
  onSelectTopic: (id: number) => void;
  onHide: () => void;
  pathId: string;
  pinnedTopicIds: number[];
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
      {!searched ? (
        <Loading style={{ height: '20rem' }} />
      ) : (
        <div
          className={css`
            width: 100%;
            p {
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
            }
          `}
        >
          {searched &&
            canAddTopic &&
            !searchTextExceedsMax &&
            !searchedTopics
              .map(({ content }) => content)
              .includes(searchText) && (
              <div
                style={{
                  marginTop: '2rem',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <p>{`"${searchText}"`}</p>
                <div>
                  <StartTopicButton
                    channelId={channelId}
                    channelName={channelName}
                    onStartTopic={onHide}
                    topicTitle={searchText}
                    themeColor={displayedThemeColor}
                    pathId={pathId}
                  />
                </div>
              </div>
            )}
          <div
            className={css`
              margin-top: 3rem;
            `}
          >
            {!!searchedTopics.length && (
              <h3
                className={css`
                  margin-bottom: 2rem;
                  color: ${Color[displayedThemeColor]()};
                `}
              >
                Search Results
              </h3>
            )}
            {searchedTopics.length ? (
              <Results
                channelId={channelId}
                currentTopicId={currentTopicId}
                displayedThemeColor={displayedThemeColor}
                isOwner={isOwner}
                featuredTopicId={featuredTopicId}
                onSelectTopic={onSelectTopic}
                pinnedTopicIds={pinnedTopicIds}
                results={searchedTopics}
              />
            ) : (
              <div
                className={css`
                  padding: 5rem;
                `}
              >
                <p>
                  {searchTextExceedsMax
                    ? `The topic is too long. Please keep it within ${maxTopicLength} characters.`
                    : ''}
                </p>
                {!searchTextExceedsMax && (
                  <p>{`No topics found for "${searchText}"`}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

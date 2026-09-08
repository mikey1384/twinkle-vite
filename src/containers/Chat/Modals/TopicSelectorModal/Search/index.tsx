import React, { useMemo } from 'react';
import Results from './Results';
import Loading from '~/components/Loading';
import StartTopicButton from '../StartTopicButton';
import { css } from '@emotion/css';
import TopicRequestStatus from '../../TopicRequestStatus';
import { chatTopicSectionClass } from '../../topicStyles';

export default function Search({
  canAddTopic,
  channelId,
  currentTopicId,
  displayedThemeColor,
  featuredTopicId,
  isOwner,
  isAIChannel,
  isTwoPeopleChat,
  maxTopicLength,
  onSelectTopic,
  onHide,
  pathId,
  pinnedTopicIds,
  searchedTopics,
  searched,
  searchError,
  onRetry,
  searchText
}: {
  canAddTopic: boolean;
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  featuredTopicId: number;
  isOwner: boolean;
  isAIChannel: boolean;
  isTwoPeopleChat: boolean;
  maxTopicLength: number;
  onSelectTopic: (id: number) => void;
  onHide: () => void;
  pathId: string;
  pinnedTopicIds: number[];
  searchedTopics: any[];
  searched: boolean;
  searchError: boolean;
  onRetry: () => void;
  searchText: string;
}) {
  const searchTextExceedsMax = useMemo(
    () => searchText.length > maxTopicLength,
    [searchText, maxTopicLength]
  );

  return (
    <div style={{ width: '100%', position: 'relative', minHeight: '10rem' }}>
      {!searched ? (
        <Loading text="Searching topics" innerStyle={{ fontSize: '14px' }} style={{ minHeight: 120 }} />
      ) : searchError ? (
        <TopicRequestStatus message="Couldn't search topics. Please try again." onRetry={onRetry} />
      ) : (
        <div
          className={css`
            width: 100%;
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
                <p
                  className={css`
                    color: #333;
                    font-size: max(16px, 1.8rem);
                    max-width: 100%;
                    overflow-wrap: anywhere;
                    text-align: center;
                    font-weight: bold;
                  `}
                >{`"${searchText}"`}</p>
                <div>
                  <StartTopicButton
                    channelId={channelId}
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
              <h3 className={chatTopicSectionClass}>
                Search Results
              </h3>
            )}
            {searchedTopics.length ? (
              <Results
                channelId={channelId}
                currentTopicId={currentTopicId}
                displayedThemeColor={displayedThemeColor}
                isAIChannel={isAIChannel}
                isTwoPeopleChat={isTwoPeopleChat}
                isOwner={isOwner}
                featuredTopicId={featuredTopicId}
                onSelectTopic={onSelectTopic}
                pinnedTopicIds={pinnedTopicIds}
                results={searchedTopics}
                pathId={pathId}
              />
            ) : (
              <div
                className={css`
                  padding: 24px 0;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                `}
              >
                <p
                  className={css`
                    color: #333;
                    font-size: max(16px, 1.8rem);
                    max-width: 100%;
                    overflow-wrap: anywhere;
                    text-align: center;
                    font-weight: bold;
                  `}
                >
                  {searchTextExceedsMax
                    ? `The topic is too long. Please keep it within ${maxTopicLength} characters.`
                    : `No topics found for "${searchText}"`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

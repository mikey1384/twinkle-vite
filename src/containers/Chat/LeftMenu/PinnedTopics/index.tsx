import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import TopicItem from './TopicItem';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function PinnedTopics({
  channelId,
  featuredTopicId,
  channelName,
  displayedThemeColor,
  topicObj,
  lastTopicId,
  selectedTab,
  selectedTopicId
}: {
  selectedTab: string;
  channelId: number;
  featuredTopicId: number;
  channelName: string;
  displayedThemeColor: string;
  topicObj: Record<string, any>;
  lastTopicId: number;
  selectedTopicId: number;
}) {
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const featuredTopic = useMemo(() => {
    if (!featuredTopicId) return null;
    return topicObj?.[featuredTopicId] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, topicObj?.[featuredTopicId]]);
  const lastTopic = useMemo(() => {
    if (!lastTopicId) return null;
    return topicObj?.[lastTopicId] && lastTopicId !== featuredTopicId
      ? topicObj?.[lastTopicId]
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, lastTopicId, topicObj?.[lastTopicId]]);

  if (!featuredTopic && !lastTopic) return null;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        className={css`
          width: CALC(100% - 2rem);
          a {
            &:hover {
              text-decoration: none;
            }
          }
          nav {
            color: ${Color.darkerGray()};
            cursor: pointer;
            width: 100%;
            padding: 0.7rem 2.5rem;
            text-align: left;
            font-size: 1.4rem;
            font-family: Helvetica;
            &:hover {
              background: ${Color.checkboxAreaGray()};
            }
            &.active {
              color: ${Color.vantaBlack()};
              background: ${Color.highlightGray()};
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem 1rem;
              font-size: 1.2rem;
            }
          }
        `}
        style={{
          border: `1px solid ${Color[displayedThemeColor](0.5)}`,
          padding: '0.5rem 0',
          marginTop: '2rem',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: '-1rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <TopicItem
          icon="home"
          onClick={handleMainNavClick}
          className={selectedTab !== 'topic' ? 'active' : ''}
        >
          {channelName}
        </TopicItem>
        {featuredTopic && (
          <TopicItem
            icon="star"
            onClick={() => handleTopicNavClick(featuredTopic.id)}
            className={
              selectedTab === 'topic' && selectedTopicId === featuredTopic.id
                ? 'active'
                : ''
            }
          >
            {featuredTopic.content}
          </TopicItem>
        )}
        {lastTopic && (
          <TopicItem
            icon="left-to-line"
            onClick={() => handleTopicNavClick(lastTopic.id)}
            className={
              selectedTab === 'topic' && selectedTopicId === lastTopic.id
                ? 'active'
                : ''
            }
          >
            {lastTopic.content}
          </TopicItem>
        )}
        <button
          className={css`
            margin: 1rem;
            padding: 0.7rem 2.5rem;
            font-size: 1.4rem;
            color: ${Color.darkerGray()};
            background: ${Color.checkboxAreaGray()};
            border: none;
            cursor: pointer;
            &:hover {
              background: ${Color.highlightGray()};
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem 1rem;
              font-size: 1.2rem;
            }
          `}
          onClick={handleAddTopicClick}
        >
          Add Topic
        </button>
      </div>
    </ErrorBoundary>
  );

  function handleMainNavClick() {
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'all' }
    });
  }

  function handleTopicNavClick(topicId: number) {
    updateLastTopicId({
      channelId,
      topicId
    });
    onEnterTopic({ channelId, topicId });
  }

  function handleAddTopicClick() {
    console.log('Add Topic button clicked');
  }
}
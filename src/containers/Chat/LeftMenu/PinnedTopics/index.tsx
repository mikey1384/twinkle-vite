import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';

const buttonStyle = css`
  margin: 1rem 1rem 0.5rem 1rem;
  padding: 0.7rem 2.5rem;
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  background: ${Color.checkboxAreaGray()};
  font-family: Roboto, sans-serif;
  border: none;
  cursor: pointer;
  &:hover {
    background: ${Color.highlightGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.7rem 1rem;
    font-size: 1.2rem;
  }
`;

export default function PinnedTopics({
  channelId,
  featuredTopicId,
  channelName,
  displayedThemeColor,
  isAIChat,
  isTwoPeopleChat,
  isOwner,
  topicObj,
  lastTopicId,
  pinnedTopicIds = [],
  selectedTab,
  selectedTopicId,
  onSetTopicSelectorModalShown
}: {
  selectedTab: string;
  channelId: number;
  featuredTopicId: number;
  channelName: string;
  displayedThemeColor: string;
  isAIChat: boolean;
  isTwoPeopleChat: boolean;
  isOwner: boolean;
  topicObj: Record<string, any>;
  lastTopicId: number;
  pinnedTopicIds: number[];
  selectedTopicId: number;
  onSetTopicSelectorModalShown: (v: boolean) => void;
}) {
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  const featuredTopic = useMemo(() => {
    if (!featuredTopicId) {
      const topicObjKeys = Object.keys(topicObj) || [];
      const lastKey = topicObjKeys[topicObjKeys.length - 1];
      return topicObj?.[lastKey]?.content ? topicObj?.[lastKey] : null;
    }
    return topicObj?.[featuredTopicId] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, topicObj?.[featuredTopicId]]);

  const pinnedTopics = useMemo(() => {
    return (pinnedTopicIds || [])
      .map((topicId) => topicObj?.[topicId])
      .filter((topic) => topic.id !== featuredTopic?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedTopicIds, topicObj, featuredTopic?.id]);

  const lastTopic = useMemo(() => {
    if (!lastTopicId) return null;
    return topicObj?.[lastTopicId] &&
      lastTopicId !== featuredTopic?.id &&
      !(pinnedTopicIds || []).includes(lastTopicId)
      ? topicObj?.[lastTopicId]
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopic?.id, lastTopicId, pinnedTopicIds, topicObj?.[lastTopicId]]);

  const additionalTopics = useMemo(() => {
    if (!topicObj) return [];
    return Object.values(topicObj).filter(
      (topic) =>
        !(pinnedTopicIds || []).includes(topic.id) &&
        topic.id !== featuredTopic?.id &&
        topic.id !== lastTopicId
    );
  }, [featuredTopic?.id, lastTopicId, pinnedTopicIds, topicObj]);

  if (!featuredTopic && !pinnedTopics.length && !lastTopic) return null;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/PinnedTopics">
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
        {pinnedTopics.map((topic) => (
          <TopicItem
            key={topic.id}
            icon="thumb-tack"
            onClick={() => handleTopicNavClick(topic.id)}
            className={
              selectedTab === 'topic' && selectedTopicId === topic.id
                ? 'active'
                : ''
            }
          >
            {topic.content}
          </TopicItem>
        ))}
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
        {additionalTopics.length > 0 && !isOwner && !isAIChat && (
          <button
            className={buttonStyle}
            onClick={() => onSetTopicSelectorModalShown(true)}
          >
            Show more...
          </button>
        )}
        {((!isTwoPeopleChat && isOwner) || isAIChat) && (
          <button className={buttonStyle} onClick={handleAddTopicClick}>
            <Icon icon="plus" />
          </button>
        )}
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
    onSetTopicSelectorModalShown(true);
  }
}

import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isMobile, isTablet } from '~/helpers';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);
const deviceIsMobileOrTablet = deviceIsMobile || deviceIsTablet;

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

function PinnedTopics({
  channelId,
  featuredTopicId,
  channelName,
  displayedThemeColor,
  isAIChat,
  isTwoPeopleChat,
  isOwner,
  isFixed,
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
  isFixed: boolean;
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

  const { featuredTopic, appliedFeaturedTopicId, pinnedTopics, lastTopic } =
    useMemo(() => {
      let featuredTopicResult = null;
      let appliedFeaturedTopicIdResult = null;
      let pinnedTopicsResult = [];
      let lastTopicResult = null;

      if (!featuredTopicId) {
        const topicObjKeys = Object.keys(topicObj).filter(
          (key) => key !== 'null'
        );
        const lastKey = topicObjKeys[topicObjKeys.length - 1];
        featuredTopicResult = topicObj?.[lastKey]?.content
          ? topicObj?.[lastKey]
          : null;
      } else {
        featuredTopicResult = topicObj?.[featuredTopicId] || null;
      }

      appliedFeaturedTopicIdResult =
        featuredTopicResult?.subjectId || featuredTopicResult?.id;

      pinnedTopicsResult = (pinnedTopicIds || [])
        .map((topicId) => topicObj?.[topicId])
        .filter(
          (topic) =>
            !!topic &&
            (topic?.subjectId || topic?.id) !== appliedFeaturedTopicIdResult
        );

      if (
        lastTopicId &&
        lastTopicId !== appliedFeaturedTopicIdResult &&
        !(pinnedTopicIds || []).includes(lastTopicId)
      ) {
        lastTopicResult = topicObj?.[lastTopicId] || null;
      }

      return {
        featuredTopic: featuredTopicResult,
        appliedFeaturedTopicId: appliedFeaturedTopicIdResult,
        pinnedTopics: pinnedTopicsResult,
        lastTopic: lastTopicResult
      };
    }, [featuredTopicId, topicObj, pinnedTopicIds, lastTopicId]);

  const additionalTopics = useMemo(() => {
    if (!topicObj) return [];
    return Object.values(topicObj).filter((topic) => {
      const topicId = topic.subjectId || topic.id;
      return (
        !(pinnedTopicIds || []).includes(topicId) &&
        topicId !== appliedFeaturedTopicId &&
        topicId !== lastTopicId
      );
    });
  }, [appliedFeaturedTopicId, lastTopicId, pinnedTopicIds, topicObj]);

  if (!featuredTopic && !pinnedTopics.length && !lastTopic) return null;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/PinnedTopics">
      <div
        className={css`
          margin-top: 1rem;
          width: CALC(100% - 2rem);
          ${isFixed
            ? `
            max-height: 15rem;
            overflow-y: auto;
          `
            : `
            height: auto;
            ${deviceIsMobileOrTablet ? 'max-height: 20vh;' : ''}
            overflow-y: ${deviceIsMobileOrTablet ? 'scroll' : 'visible'};
          `}
          transition: height 0.3s ease-in-out;
          a {
            &:hover {
              text-decoration: none;
            }
          }
        `}
        style={{
          border: `1px solid ${Color[displayedThemeColor](0.5)}`,
          padding: '0.5rem 0',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <TopicItem
          icon="home"
          onClick={handleMainNavClick}
          isSelected={selectedTab !== 'topic'}
        >
          {channelName}
        </TopicItem>
        {featuredTopic && (
          <TopicItem
            icon="star"
            onClick={() => handleTopicNavClick(appliedFeaturedTopicId)}
            isSelected={
              selectedTab === 'topic' &&
              selectedTopicId === appliedFeaturedTopicId
            }
          >
            {featuredTopic.content}
          </TopicItem>
        )}
        {pinnedTopics.map((topic) => (
          <TopicItem
            key={topic.subjectId || topic.id}
            icon="thumb-tack"
            isSelected={
              selectedTab === 'topic' &&
              selectedTopicId === (topic.subjectId || topic.id)
            }
            onClick={() => handleTopicNavClick(topic.subjectId || topic.id)}
          >
            {topic.content}
          </TopicItem>
        ))}
        {lastTopic && (
          <TopicItem
            icon="left-to-line"
            onClick={() =>
              handleTopicNavClick(lastTopic.subjectId || lastTopic.id)
            }
            isSelected={
              selectedTab === 'topic' &&
              selectedTopicId === (lastTopic.subjectId || lastTopic.id)
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

export default memo(PinnedTopics);

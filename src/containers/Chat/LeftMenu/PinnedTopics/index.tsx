import React, { memo, useContext, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import LocalContext from '../../Context';
import { useAppContext } from '~/contexts';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { resolveColorValue } from '~/theme/resolveColor';
import { useNavigate, useParams } from 'react-router-dom';
import type { TopicNavigation } from '../helpers/topicNavigation';

const buttonStyle = css`
  flex-shrink: 0;
  min-height: 36px;
  margin: 1rem 1rem 0.5rem 1rem;
  padding: 0.7rem 2.5rem;
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  background: ${Color.checkboxAreaGray()};
  font-family: Roboto, sans-serif;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${Color.highlightGray()};
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 44px;
    padding: 0.7rem 1rem;
    font-size: max(14px, 1.2rem);
  }
`;

function PinnedTopics({
  channelId,
  navigation,
  channelName,
  displayedThemeColor,
  isAIChat,
  isTwoPeopleChat,
  isOwner,
  selectedTab,
  selectedTopicId,
  onSetTopicSelectorModalShown,
  pathId
}: {
  selectedTab: string;
  channelId: number;
  navigation: TopicNavigation;
  channelName: string;
  displayedThemeColor: string;
  isAIChat: boolean;
  isTwoPeopleChat: boolean;
  isOwner: boolean;
  selectedTopicId: number;
  onSetTopicSelectorModalShown: (v: boolean) => void;
  pathId: string;
}) {
  const navigate = useNavigate();
  const { subchannelPath } = useParams();
  const {
    actions: { onSaveScrollPositionForAll }
  } = useContext(LocalContext);
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );

  const {
    featuredTopic,
    appliedFeaturedTopicId,
    pinnedTopics,
    lastTopic,
    additionalTopics
  } = navigation;
  const borderColor = useMemo(
    () =>
      resolveColorValue(displayedThemeColor, 0.5) ??
      resolveColorValue('logoBlue', 0.5) ??
      Color.logoBlue(0.5),
    [displayedThemeColor]
  );
  const aiButtonClass = useMemo(() => {
    if (!isAIChat) return '';
    const themedBackground =
      resolveColorValue(displayedThemeColor) ?? Color.logoBlue();
    const themedHover =
      resolveColorValue(displayedThemeColor, 0.8) ?? Color.logoBlue(0.8);
    const themedBorder =
      resolveColorValue(displayedThemeColor, 0.7) ?? Color.logoBlue(0.7);
    return css`
      background: ${themedBackground};
      border: 1px solid ${themedBorder};
      color: ${Color.white()};
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.12);
      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: ${themedHover};
        }
      }
      @media (max-width: ${mobileMaxWidth}) {
        gap: 0.5rem;
      }
    `;
  }, [displayedThemeColor, isAIChat]);
  const aiIconClassName = useMemo(
    () =>
      isAIChat
        ? css`
            color: ${Color.white()};
            filter: drop-shadow(0 0 0.15rem rgba(0, 0, 0, 0.3));
          `
        : '',
    [isAIChat]
  );

  if (!featuredTopic && !pinnedTopics.length && !lastTopic) return null;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/PinnedTopics">
      <div
        className={css`
          margin-top: 1rem;
          width: CALC(100% - 2rem);
          border: 1px solid var(--chat-panel-border, ${borderColor});
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
        `}
        style={{
          padding: '0.5rem 0',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: 0
        }}
      >
        <div
          aria-label="Pinned topics"
          tabIndex={0}
          className={css`
            width: 100%;
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior-y: contain;
            scrollbar-width: thin;
            transition: height 0.3s ease-in-out;
            a {
              &:hover {
                text-decoration: none;
              }
            }
          `}
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
        </div>
        {additionalTopics.length > 0 && !isOwner && !isAIChat && (
          <button
            type="button"
            className={buttonStyle}
            onClick={() => onSetTopicSelectorModalShown(true)}
          >
            Show more...
          </button>
        )}
        {((!isTwoPeopleChat && isOwner) || isAIChat) && (
          <button
            type="button"
            aria-label={isAIChat ? 'Manage AI topics' : 'Add a topic'}
            title={isAIChat ? 'Manage AI topics' : 'Add a topic'}
            className={cx(buttonStyle, aiButtonClass)}
            onClick={handleAddTopicClick}
          >
            {isAIChat ? (
              <>
                <Icon icon="robot" size="lg" className={aiIconClassName} />
                <Icon icon="plus" size="sm" className={aiIconClassName} />
                <Icon icon="gear" size="lg" className={aiIconClassName} />
              </>
            ) : (
              <Icon icon="plus" />
            )}
          </button>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleMainNavClick() {
    updateLastTopicId({
      channelId,
      topicId: 0
    });
    navigate(`/chat/${pathId}${subchannelPath ? `/${subchannelPath}` : ''}`);
  }

  function handleTopicNavClick(topicId: number) {
    if (selectedTab !== 'topic') {
      onSaveScrollPositionForAll?.();
    }
    updateLastTopicId({
      channelId,
      topicId
    });
    navigate(
      `/chat/${pathId}${
        subchannelPath ? `/${subchannelPath}` : ''
      }/topic/${topicId}`
    );
  }

  function handleAddTopicClick() {
    onSetTopicSelectorModalShown(true);
  }
}

export default memo(PinnedTopics);

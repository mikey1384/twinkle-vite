import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import TopicSelectorModal from './TopicSelectorModal';
import { useAppContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  channelName,
  creatorId,
  canChangeSubject,
  isTwoPeopleChat,
  featuredTopicId,
  pathId,
  themeColor,
  selectedTab,
  style,
  topicObj,
  topicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  channelName: string;
  creatorId: number;
  canChangeSubject: string;
  isTwoPeopleChat: boolean;
  featuredTopicId: number;
  pathId: string;
  themeColor: string;
  selectedTab: string;
  style?: React.CSSProperties;
  topicId: number;
  topicObj: Record<string, any>;
}) {
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [topicSelectorModalShown, setTopicSelectorModalShown] = useState(false);
  const currentTopicTitle = useMemo(() => {
    if (topicObj?.[topicId]) {
      return topicObj[topicId]?.content || '';
    }
    return '';
  }, [topicId, topicObj]);

  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div
        style={style}
        className={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <ChatFilterBar
          themeColor={themeColor}
          channelId={channelId}
          canChangeTopic={canChangeTopic}
          onShowTopicSelectorModal={() => setTopicSelectorModalShown(true)}
          selectedTab={selectedTab}
          topic={currentTopicTitle}
          topicId={topicId}
        />
      </div>
      {topicSelectorModalShown && (
        <TopicSelectorModal
          channelId={channelId}
          channelName={channelName}
          creatorId={creatorId}
          isTwoPeopleChat={isTwoPeopleChat}
          displayedThemeColor={themeColor}
          canChangeSubject={canChangeSubject}
          featuredTopic={topicObj?.[featuredTopicId]}
          currentTopic={topicObj?.[topicId] || { id: topicId }}
          onSelectTopic={handleSelectTopic}
          onHide={() => setTopicSelectorModalShown(false)}
          pathId={pathId}
        />
      )}
    </ErrorBoundary>
  );

  async function handleSelectTopic(topicId: number) {
    await updateLastTopicId({
      channelId,
      topicId
    });
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'topic', selectedTopicId: topicId }
    });
    setTopicSelectorModalShown(false);
  }
}

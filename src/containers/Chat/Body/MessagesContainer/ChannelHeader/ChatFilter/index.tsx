import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import TopicSelectorModal from './TopicSelectorModal';
import { useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  creatorId,
  themeColor,
  selectedTab,
  topicObj,
  topicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  creatorId: number;
  themeColor: string;
  selectedTab: string;
  topicId: number;
  topicObj: Record<string, any>;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const { userId } = useKeyContext((v) => v.myState);
  const [topicSelectorModalShown, setTopicSelectorModalShown] = useState(false);
  const currentTopic = useMemo(() => {
    if (topicObj?.[topicId]) {
      return topicObj[topicId]?.content || '';
    }
    return '';
  }, [topicId, topicObj]);

  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div
        className={css`
          width: 100%;
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
          topic={currentTopic}
          topicId={topicId}
        />
      </div>
      {topicSelectorModalShown && (
        <TopicSelectorModal
          channelId={channelId}
          currentTopicId={topicId}
          displayedThemeColor={themeColor}
          onSelectTopic={handleSelectTopic}
          onHide={() => setTopicSelectorModalShown(false)}
          userIsOwner={creatorId === userId}
        />
      )}
    </ErrorBoundary>
  );

  function handleSelectTopic(topicId: number) {
    onSetChannelState({
      channelId,
      newState: { selectedTopicId: topicId }
    });
    setTopicSelectorModalShown(false);
  }
}

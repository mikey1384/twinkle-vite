import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  onScrollToBottom,
  themeColor,
  selectedTab,
  topicObj,
  topicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  onScrollToBottom: () => void;
  themeColor: string;
  selectedTab: string;
  topicId: number;
  topicObj: Record<string, any>;
}) {
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
          onScrollToBottom={onScrollToBottom}
          selectedTab={selectedTab}
          topic={currentTopic}
          topicId={topicId}
        />
      </div>
    </ErrorBoundary>
  );
}

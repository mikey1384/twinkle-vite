import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  themeColor,
  selectedTab,
  topicObj,
  featuredTopicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  themeColor: string;
  selectedTab: string;
  featuredTopicId: number;
  topicObj: Record<string, any>;
}) {
  const featuredTopic = useMemo(() => {
    if (topicObj?.[featuredTopicId]) {
      return topicObj[featuredTopicId]?.content || '';
    }
    return '';
  }, [featuredTopicId, topicObj]);

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
          selectedTab={selectedTab}
          topic={featuredTopic}
        />
      </div>
    </ErrorBoundary>
  );
}

import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  themeColor,
  selectedTab,
  legacyTopicObj
}: {
  canChangeTopic: boolean;
  channelId: number;
  themeColor: string;
  selectedTab: string;
  legacyTopicObj: {
    content: string;
    timeStamp: number;
    reloadTimeStamp: number;
    reloader: any;
    uploader: any;
  };
}) {
  const { content } = legacyTopicObj;

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
          topic={content}
        />
      </div>
    </ErrorBoundary>
  );
}

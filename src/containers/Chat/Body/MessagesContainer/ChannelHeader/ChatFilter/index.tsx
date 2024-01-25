import React from 'react';

import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  topicObj
}: {
  canChangeTopic: boolean;
  topicObj: {
    content: string;
    timeStamp: number;
    reloadTimeStamp: number;
    reloader: any;
    uploader: any;
  };
}) {
  const { content } = topicObj;

  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: flex-end;
        `}
      >
        <ChatFilterBar canChangeTopic={canChangeTopic} topic={content} />
      </div>
    </ErrorBoundary>
  );
}

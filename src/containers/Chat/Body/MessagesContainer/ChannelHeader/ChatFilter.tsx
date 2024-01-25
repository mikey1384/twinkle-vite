import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  subjectObj
}: {
  canChangeTopic: boolean;
  subjectObj: {
    content: string;
    timeStamp: number;
    reloadTimeStamp: number;
    reloader: any;
    uploader: any;
  };
}) {
  const { content } = subjectObj;

  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: flex-end;
        `}
      >
        <Button
          disabled={!canChangeTopic}
          skeuomorphic
          onClick={() => console.log('clicked')}
        >
          <Icon icon="chevron-down" />
          <span style={{ marginLeft: '0.7rem' }}>
            {canChangeTopic
              ? content || 'Topic'
              : 'Topic feature not purchased'}
          </span>
        </Button>
      </div>
    </ErrorBoundary>
  );
}

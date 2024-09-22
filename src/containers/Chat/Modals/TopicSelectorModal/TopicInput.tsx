import React from 'react';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

export default function TopicInput({
  maxTopicLength = 100,
  topicSearchText,
  onSetTopicSearchText
}: {
  maxTopicLength?: number;
  topicSearchText: string;
  onSetTopicSearchText: (text: string) => void;
}) {
  return (
    <ErrorBoundary componentPath="MessagesContainer/ChannelHeader/EditSubjectForm">
      <div style={{ width: '100%' }}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}
          className={css`
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
          `}
        >
          <div style={{ width: '100%' }}>
            <Input
              placeholder="Enter Topic..."
              value={topicSearchText}
              onChange={onSetTopicSearchText}
            />
          </div>
        </div>
        <div style={{ background: '#fff' }}>
          <small
            style={{
              color: topicSearchText.length > maxTopicLength ? 'red' : ''
            }}
          >
            {topicSearchText.length}/{maxTopicLength} Characters
          </small>
        </div>
      </div>
    </ErrorBoundary>
  );
}

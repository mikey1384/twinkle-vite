import React, { useState } from 'react';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

export default function TopicInput({
  maxLength = 100
}: {
  maxLength?: number;
}) {
  const [topicLabel, setTopicLabel] = useState('');

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
            <form
              style={{
                width: '100%',
                position: 'relative'
              }}
            >
              <Input
                placeholder="Enter Topic..."
                value={topicLabel}
                onChange={setTopicLabel}
              />
            </form>
          </div>
        </div>
        <div style={{ background: '#fff' }}>
          <small style={{ color: topicLabel.length > maxLength ? 'red' : '' }}>
            {topicLabel.length}/{maxLength} Characters
          </small>
        </div>
      </div>
    </ErrorBoundary>
  );
}

import React, { useId } from 'react';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';
import { charLimit } from '~/constants/defaultValues';

export default function TopicInput({
  maxTopicLength = charLimit.chat.topic,
  topicSearchText,
  onSetTopicSearchText
}: {
  maxTopicLength?: number;
  topicSearchText: string;
  onSetTopicSearchText: (text: string) => void;
}) {
  const inputId = useId();
  const tooLong = topicSearchText.length > maxTopicLength;
  return (
    <ErrorBoundary componentPath="MessagesContainer/ChannelHeader/EditSubjectForm">
      <div style={{ width: '100%' }}>
        <Input
          id={inputId}
          aria-label="Search topics or enter a new topic title"
          aria-describedby={`${inputId}-count`}
          aria-invalid={tooLong}
          placeholder="Enter Topic..."
          value={topicSearchText}
          onChange={onSetTopicSearchText}
          style={{ minHeight: 44, fontSize: '16px' }}
        />
        <small
          id={`${inputId}-count`}
          style={{
            display: 'block',
            marginTop: 6,
            textAlign: 'right',
            fontSize: '12px',
            color: tooLong ? '#b42318' : '#526176'
          }}
        >
          {topicSearchText.length}/{maxTopicLength} Characters
          {tooLong && ' — shorten the title to start a new topic.'}
        </small>
      </div>
    </ErrorBoundary>
  );
}

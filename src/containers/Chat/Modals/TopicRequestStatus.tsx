import React from 'react';
import Button from '~/components/Button';
import { chatTopicActionStyle } from './topicStyles';

export default function TopicRequestStatus({ message, onRetry }: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" style={{ padding: '16px 0', textAlign: 'center', fontSize: '16px', color: '#334155' }}>
      <p style={{ margin: '0 0 8px' }}>{message}</p>
      <Button variant="ghost" style={chatTopicActionStyle} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

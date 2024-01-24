import React from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function ChatFilter() {
  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <Button skeuomorphic onClick={() => console.log('clicked')}>
        something something
      </Button>
    </ErrorBoundary>
  );
}

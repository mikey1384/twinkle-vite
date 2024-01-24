import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function ChatFilter() {
  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div>this is chat filter</div>
    </ErrorBoundary>
  );
}

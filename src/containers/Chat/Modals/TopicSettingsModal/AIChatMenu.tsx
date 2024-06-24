import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function AIChatMenu() {
  return (
    <ErrorBoundary componentPath="Chat/Modals/TopicSettingsModal/AIChatMenu">
      <div>
        <div>AIChatMenu</div>
      </div>
    </ErrorBoundary>
  );
}

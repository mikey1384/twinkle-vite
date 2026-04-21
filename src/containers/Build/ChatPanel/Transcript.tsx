import React, { RefObject } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import MessageRow from './MessageRow';
import {
  BuildCurrentActivity,
  BuildStatusStepEntry,
  ChatMessage,
  ChatPanelRunMode
} from './types';
import { findLastIndex } from './utils';

interface TranscriptProps {
  messages: ChatMessage[];
  runMode: ChatPanelRunMode;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  currentActivity: BuildCurrentActivity | null;
  statusStepEntries: BuildStatusStepEntry[];
  runError: string | null;
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
  onDeleteMessage: (message: ChatMessage) => void;
}

const Transcript = React.memo(function Transcript({
  messages,
  runMode,
  generating,
  generatingStatus,
  assistantStatusSteps,
  currentActivity,
  statusStepEntries,
  runError,
  activeStreamMessageIds,
  isOwner,
  chatEndRef,
  onFixRuntimeObservationMessage,
  onDeleteMessage
}: TranscriptProps) {
  const normalizedRunError =
    !generating && typeof runError === 'string' ? runError.trim() : '';
  const shouldShowRunFailureNotice =
    Boolean(normalizedRunError) &&
    !messages.some(
      (message) =>
        message.role === 'assistant' &&
        String(message.content || '').trim() === normalizedRunError
    );
  const emptyState = (
    <div
      className={css`
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 1.5rem;
        color: var(--chat-text);
        opacity: 0.7;
      `}
    >
      <Icon
        icon="comments"
        size="2x"
        style={{ marginBottom: '0.8rem' }}
      />
      <p
        style={{
          margin: 0,
          fontSize: 'var(--build-workshop-message-font-size)'
        }}
      >
        {isOwner
          ? 'Describe what you want to build and I will help you create it.'
          : 'No messages yet.'}
      </p>
    </div>
  );

  if (messages.length === 0) {
    if (!normalizedRunError) {
      return emptyState;
    }
    return (
      <div
        className={css`
          display: grid;
          gap: 1rem;
        `}
      >
        <FailureNotice runError={normalizedRunError} />
        {emptyState}
        <div ref={chatEndRef} />
      </div>
    );
  }

  const lastAssistantIndex = findLastIndex(
    messages,
    (message) =>
      message.role === 'assistant' && message.source !== 'runtime_observation'
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}
    >
      {shouldShowRunFailureNotice ? (
        <FailureNotice runError={normalizedRunError} />
      ) : null}
      {messages.map((message, index) => (
        <MessageRow
          key={message.id}
          message={message}
          messages={messages}
          runMode={runMode}
          index={index}
          lastAssistantIndex={lastAssistantIndex}
          generating={generating}
          generatingStatus={generatingStatus}
          assistantStatusSteps={assistantStatusSteps}
          currentActivity={currentActivity}
          statusStepEntries={statusStepEntries}
          activeStreamMessageIds={activeStreamMessageIds}
          isOwner={isOwner}
          onFixRuntimeObservationMessage={onFixRuntimeObservationMessage}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
});

export default Transcript;

function FailureNotice({ runError }: { runError: string }) {
  const normalizedRunError = String(runError || '').trim();
  if (!normalizedRunError) return null;

  return (
    <div
      className={css`
        border: 1px solid ${Color.rose(0.32)};
        background: ${Color.rose(0.08)};
        border-radius: 10px;
        padding: 0.75rem 0.8rem;
        display: grid;
        gap: 0.45rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: ${Color.rose()};
          font-weight: 800;
          font-size: var(--build-workshop-label-font-size);
        `}
      >
        <Icon icon="exclamation-triangle" />
        <span>Last run failed</span>
      </div>
      <div
        className={css`
          font-size: var(--build-workshop-body-font-size);
          line-height: 1.45;
          color: var(--chat-text);
          white-space: pre-wrap;
          word-break: break-word;
        `}
      >
        {normalizedRunError}
      </div>
    </div>
  );
}

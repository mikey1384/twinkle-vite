import React, { RefObject, useMemo, useState } from 'react';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import ThinkingIndicator from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import CodeDiff from '~/components/CodeDiff';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { computeLineDiff } from '~/components/CodeDiff/diffUtils';

const panelClass = css`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--ui-border);
  background: #fff;
  gap: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-right: none;
    border-bottom: 1px solid var(--ui-border);
  }
`;

const headerClass = css`
  padding: 1.1rem 1.2rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const headerTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  color: var(--chat-text);
  font-size: 1.1rem;
`;

const headerSubtitleClass = css`
  font-size: 0.95rem;
  color: var(--chat-text);
  opacity: 0.7;
`;

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'reviewer';
  content: string;
  codeGenerated: string | null;
  artifactVersionId?: number | null;
  createdAt: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  inputMessage: string;
  generating: boolean;
  generatingStatus: string | null;
  reviewerStatusSteps: string[];
  assistantStatusSteps: string[];
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onDeleteMessage: (message: ChatMessage) => void;
}

export default function ChatPanel({
  messages,
  inputMessage,
  generating,
  generatingStatus,
  reviewerStatusSteps,
  assistantStatusSteps,
  activeStreamMessageIds,
  isOwner,
  chatScrollRef,
  chatEndRef,
  onInputChange,
  onSendMessage,
  onStopGeneration,
  onDeleteMessage
}: ChatPanelProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }

  return (
    <div className={panelClass}>
      <div className={headerClass}>
        <div className={headerTitleClass}>
          <Icon icon="sparkles" />
          Build Copilot
        </div>
        <div className={headerSubtitleClass}>
          Describe the app you want and iterate on the results.
        </div>
      </div>
      <div
        ref={chatScrollRef}
        className={css`
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 1.2rem;
          background: #fff;
          min-height: 0;
        `}
      >
        {messages.length === 0 ? (
          <div
            className={css`
              text-align: center;
              padding: 2rem;
              color: var(--chat-text);
              opacity: 0.7;
            `}
          >
            <Icon icon="comments" size="2x" style={{ marginBottom: '0.8rem' }} />
            <p style={{ margin: 0, fontSize: '1.05rem' }}>
              {isOwner
                ? 'Describe what you want to build and I will help you create it.'
                : 'No messages yet.'}
            </p>
          </div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
            `}
          >
            {messages.map((message, index) => {
              const isLastReviewer =
                message.role === 'reviewer' &&
                index === findLastIndex(messages, (m) => m.role === 'reviewer');
              const isLastAssistant =
                message.role === 'assistant' &&
                index === findLastIndex(messages, (m) => m.role === 'assistant');
              const isActiveStreamMessage = activeStreamMessageIds.includes(
                message.id
              );
              const isStreamingTarget =
                (generating && isActiveStreamMessage) ||
                (generating &&
                  ((message.role === 'assistant' && isLastAssistant) ||
                    (message.role === 'reviewer' && isLastReviewer)));

              return (
                <div
                  key={message.id}
                    className={css`
                      display: flex;
                      flex-direction: column;
                      align-items: ${message.role === 'user'
                        ? 'flex-end'
                        : 'flex-start'};
                      position: relative;
                  `}
                >
                  <button
                    onClick={() => onDeleteMessage(message)}
                    disabled={isStreamingTarget}
                    title={
                      isStreamingTarget
                        ? 'Cannot delete while this request is in progress'
                        : 'Delete message'
                    }
                    className={`${css`
                      position: absolute;
                      top: -0.35rem;
                      right: ${message.role === 'user' ? '-0.25rem' : 'auto'};
                      left: ${message.role === 'user' ? 'auto' : '-0.25rem'};
                      padding: 0;
                      border: none;
                      background: transparent;
                      color: var(--chat-text);
                      font-size: 1.05rem;
                      line-height: 1;
                      opacity: 0.55;
                      pointer-events: auto;
                      transition: opacity 0.15s ease, transform 0.15s ease,
                        color 0.15s ease;
                      transform: translateY(0);
                      cursor: pointer;
                      z-index: 2;
                      &:hover,
                      &:focus-visible {
                        opacity: 1;
                        color: ${Color.rose()};
                        transform: translateY(-1px);
                      }

                      &:disabled {
                        opacity: 0.35;
                        pointer-events: none;
                        cursor: not-allowed;
                      }
                    `} build-chat-delete-button`}
                  >
                    <Icon icon="times-circle" />
                  </button>
                  {message.role === 'reviewer' && (
                    <span
                      className={css`
                        display: inline-flex;
                        align-items: center;
                        gap: 0.3rem;
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: ${Color.orange()};
                        margin-bottom: 0.25rem;
                        padding: 0 0.3rem;
                      `}
                    >
                      <Icon icon="magnifying-glass" />
                      Code Review
                    </span>
                  )}
                  <div
                    className={css`
                      max-width: 85%;
                      padding: 0.75rem 1rem;
                      border-radius: 12px;
                      background: ${message.role === 'user'
                        ? 'var(--theme-bg)'
                        : message.role === 'reviewer'
                        ? '#fff8f0'
                        : 'var(--chat-bg)'};
                      color: ${message.role === 'user'
                        ? 'var(--theme-text)'
                        : 'var(--chat-text)'};
                      word-break: break-word;
                      font-size: 0.95rem;
                      line-height: 1.4;
                      border: 1px solid ${message.role === 'reviewer'
                        ? Color.orange(0.3)
                        : 'var(--ui-border)'};
                    `}
                  >
                    {message.role === 'assistant' ? (
                      <AssistantMessage
                        message={message}
                        messages={messages}
                        isLatestAssistant={isLastAssistant}
                        generating={generating}
                        generatingStatus={generatingStatus}
                        statusSteps={isLastAssistant ? assistantStatusSteps : []}
                      />
                    ) : message.role === 'reviewer' ? (
                      <ReviewerMessage
                        message={message}
                        generating={generating}
                        generatingStatus={generatingStatus}
                        statusSteps={isLastReviewer ? reviewerStatusSteps : []}
                      />
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </span>
                    )}
                  </div>
                  <span
                    className={css`
                      font-size: 0.7rem;
                      color: var(--chat-text);
                      opacity: 0.5;
                      margin-top: 0.25rem;
                      padding: 0 0.5rem;
                    `}
                  >
                    {timeSince(message.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {isOwner && (
        <div
          className={css`
            padding: 0.9rem 1rem 1.1rem;
            background: #fff;
          `}
        >
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
            `}
          >
            <textarea
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              disabled={generating}
              className={css`
                flex: 1;
                padding: 0.75rem;
                border: 1px solid var(--ui-border);
                border-radius: 10px;
                resize: none;
                font-size: 0.95rem;
                font-family: inherit;
                min-height: 44px;
                max-height: 120px;
                background: #fff;
                &:focus {
                  outline: none;
                  border-color: var(--theme-border);
                }
                &:disabled {
                  background: var(--chat-bg);
                }
              `}
              rows={1}
            />
            {generating ? (
              <button
                onClick={onStopGeneration}
                className={css`
                  padding: 0 1rem;
                  background: ${Color.orange(0.95)};
                  color: #fff;
                  border: none;
                  border-radius: 10px;
                  cursor: pointer;
                  transition: transform 0.2s, background 0.2s;
                  &:hover {
                    background: ${Color.orange()};
                    transform: translateY(-1px);
                  }
                `}
                title="Stop Copilot"
              >
                <Icon icon="stop" />
              </button>
            ) : (
              <button
                onClick={onSendMessage}
                disabled={!inputMessage.trim() || generating}
                className={css`
                  padding: 0 1rem;
                  background: ${inputMessage.trim() && !generating
                    ? 'var(--theme-bg)'
                    : 'var(--theme-disabled-bg)'};
                  color: var(--theme-text);
                  border: none;
                  border-radius: 10px;
                  cursor: ${inputMessage.trim() && !generating
                    ? 'pointer'
                    : 'not-allowed'};
                  transition: transform 0.2s, background 0.2s;
                  &:hover:not(:disabled) {
                    background: var(--theme-hover-bg);
                    transform: translateY(-1px);
                  }
                `}
              >
                <Icon icon="paper-plane" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  messages,
  isLatestAssistant,
  generating,
  generatingStatus,
  statusSteps
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  isLatestAssistant: boolean;
  generating: boolean;
  generatingStatus: string | null;
  statusSteps: string[];
}) {
  const [showDiff, setShowDiff] = useState(true);

  const previousCode = useMemo(() => {
    if (!message.codeGenerated) return null;
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].codeGenerated) {
        return messages[i].codeGenerated;
      }
    }
    return '';
  }, [message, messages]);

  const diffStats = useMemo(() => {
    if (!message.codeGenerated || previousCode === null) return null;
    const { stats } = computeLineDiff(previousCode, message.codeGenerated);
    return stats;
  }, [message.codeGenerated, previousCode]);

  const hasCodePayload = Boolean(message.codeGenerated || message.artifactVersionId);
  const hasChanges = diffStats && (diffStats.added > 0 || diffStats.removed > 0);
  const showSteps = statusSteps.length > 0 && generating;
  const waitingForCurrentAssistantResponse = generating && isLatestAssistant;
  const showNoCodeWarning =
    !hasCodePayload &&
    !waitingForCurrentAssistantResponse &&
    looksLikeCompletedCodeChangeClaim(message.content);

  return (
    <div>
      {hasCodePayload && (
        <div
          className={css`
            margin-bottom: 0.75rem;
            border-radius: 8px;
            border: 1px solid var(--ui-border);
            overflow: hidden;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.5rem;
              padding: 0.5rem 0.75rem;
              background: var(--chat-bg);
              color: var(--chat-text);
              font-size: 0.85rem;
              font-weight: 600;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
              `}
            >
              <Icon icon="check" style={{ color: Color.green() }} />
              <span>Code updated</span>
              {hasChanges && (
                <span
                  className={css`
                    display: inline-flex;
                    gap: 0.4rem;
                    font-family: 'SF Mono', monospace;
                    font-size: 0.8rem;
                    font-weight: 500;
                  `}
                >
                  <span style={{ color: Color.green() }}>+{diffStats.added}</span>
                  <span style={{ color: Color.rose() }}>-{diffStats.removed}</span>
                </span>
              )}
            </div>
            {hasChanges && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={css`
                  background: none;
                  border: none;
                  color: ${Color.logoBlue()};
                  cursor: pointer;
                  font-size: 0.8rem;
                  padding: 0;
                  display: flex;
                  align-items: center;
                  gap: 0.25rem;
                  &:hover {
                    text-decoration: underline;
                  }
                `}
              >
                {showDiff ? 'Hide' : 'Show'} diff
                <Icon icon={showDiff ? 'chevron-up' : 'chevron-down'} />
              </button>
            )}
          </div>
          {showDiff && hasChanges && previousCode !== null && (
            <CodeDiff
              oldCode={previousCode}
              newCode={message.codeGenerated || ''}
              collapsible={false}
              className={css`
                border: none;
                border-radius: 0;
                border-top: 1px solid var(--ui-border);
              `}
            />
          )}
        </div>
      )}
      {showNoCodeWarning && (
        <div
          className={css`
            margin-bottom: 0.75rem;
            border-radius: 8px;
            border: 1px solid ${Color.orange(0.35)};
            background: ${Color.orange(0.08)};
            padding: 0.6rem 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.45rem;
              font-size: 0.82rem;
              font-weight: 700;
              color: ${Color.orange()};
            `}
          >
            <Icon icon="exclamation-triangle" />
            No code changes were applied
          </div>
          <div
            className={css`
              font-size: 0.8rem;
              line-height: 1.35;
              color: var(--chat-text);
              opacity: 0.85;
            `}
          >
            Copilot replied like it made changes, but it did not return updated
            code. Your workspace stayed the same.
          </div>
        </div>
      )}
      {message.content ? (
        <RichText isAIMessage aiActionPlacement="inline" maxLines={15}>
          {message.content}
        </RichText>
      ) : generating && !showSteps ? (
        <ThinkingIndicator status={generatingStatus || 'thinking'} compact />
      ) : null}
      {showSteps && <StatusStepLog steps={statusSteps} />}
    </div>
  );
}

function ReviewerMessage({
  message,
  generating,
  generatingStatus,
  statusSteps
}: {
  message: ChatMessage;
  generating: boolean;
  generatingStatus: string | null;
  statusSteps: string[];
}) {
  const showSteps = statusSteps.length > 0 && generating;

  return (
    <div>
      {message.content ? (
        <RichText isAIMessage aiActionPlacement="inline" maxLines={20}>
          {message.content}
        </RichText>
      ) : generating && !showSteps ? (
        <ThinkingIndicator status={generatingStatus || 'Reviewing code...'} compact />
      ) : null}
      {showSteps && <StatusStepLog steps={statusSteps} />}
    </div>
  );
}

function StatusStepLog({ steps }: { steps: string[] }) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      `}
    >
      {steps.map((step, index) => {
        const isCurrent = index === steps.length - 1;
        const label = formatStepLabel(step);
        return (
          <div
            key={index}
            className={css`
              display: flex;
              align-items: center;
              gap: 0.4rem;
              color: ${isCurrent ? 'var(--chat-text)' : Color.gray()};
              line-height: 1.5;
            `}
          >
            {isCurrent ? (
              <span style={{ color: Color.logoBlue() }}>&#9679;</span>
            ) : (
              <Icon
                icon="check"
                style={{ color: Color.green(), fontSize: '0.7rem' }}
              />
            )}
            <span>
              {label}
              {isCurrent && <AnimatedDots />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const dotAnimation = css`
  @keyframes dotPulse {
    0%, 20% { opacity: 0; }
    40% { opacity: 1; }
    100% { opacity: 1; }
  }
`;

function AnimatedDots() {
  return (
    <span
      className={css`
        ${dotAnimation}
        margin-left: 1px;
      `}
    >
      <span
        className={css`
          animation: dotPulse 1.4s infinite;
          animation-delay: 0s;
        `}
      >
        .
      </span>
      <span
        className={css`
          animation: dotPulse 1.4s infinite;
          animation-delay: 0.2s;
        `}
      >
        .
      </span>
      <span
        className={css`
          animation: dotPulse 1.4s infinite;
          animation-delay: 0.4s;
        `}
      >
        .
      </span>
    </span>
  );
}

const STATUS_LABEL_MAP: Record<string, string> = {
  thinking: 'Thinking',
  thinking_hard: 'Thinking hard',
  analyzing_code: 'Analyzing code',
  responding: 'Writing response',
  searching_web: 'Searching the web',
  reading_file: 'Reading files',
  retrieving_memory: 'Remembering',
  saving_file: 'Saving file',
  reading: 'Reading and thinking',
  recalling: 'Recalling memories'
};

function formatStepLabel(status: string): string {
  if (STATUS_LABEL_MAP[status]) return STATUS_LABEL_MAP[status];
  // If it already looks like a human label (e.g. "Loading build code..."), strip trailing dots
  if (status.includes(' ')) return status.replace(/\.+$/, '');
  return status;
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

function looksLikeCompletedCodeChangeClaim(content: string) {
  if (!content || typeof content !== 'string') return false;

  const normalized = content.replace(/[’]/g, "'").toLowerCase();
  if (
    /(can't|cannot|unable|couldn't|could not|won't|didn't|did not|not possible|cannot do)/.test(
      normalized
    )
  ) {
    return false;
  }

  return [
    /\b(i|we)\s+(have|ve|did|just)?\s*(added|updated|fixed|implemented|wired|hooked|changed|created|built|patched|refactored)\b/,
    /\b(here('s| is)\s+(it|the updated version)|it('s| is)\s+(done|fixed|updated))\b/,
    /\b(wired up|changes?\s+(are in|applied|made)|updated code|follow\/unfollow buttons)\b/
  ].some((pattern) => pattern.test(normalized));
}

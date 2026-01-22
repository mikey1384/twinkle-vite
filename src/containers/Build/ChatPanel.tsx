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
  width: 380px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--ui-border);
  background: #fff;
  gap: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    height: 50%;
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
  role: 'user' | 'assistant';
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
  isOwner: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export default function ChatPanel({
  messages,
  inputMessage,
  generating,
  generatingStatus,
  isOwner,
  chatEndRef,
  onInputChange,
  onSendMessage
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
        className={css`
          flex: 1;
          overflow-y: auto;
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={css`
                  display: flex;
                  flex-direction: column;
                  align-items: ${message.role === 'user'
                    ? 'flex-end'
                    : 'flex-start'};
                `}
              >
                <div
                  className={css`
                    max-width: 85%;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    background: ${message.role === 'user'
                      ? 'var(--theme-bg)'
                      : 'var(--chat-bg)'};
                    color: ${message.role === 'user'
                      ? 'var(--theme-text)'
                      : 'var(--chat-text)'};
                    word-break: break-word;
                    font-size: 0.95rem;
                    line-height: 1.4;
                    border: 1px solid var(--ui-border);
                  `}
                >
                  {message.role === 'assistant' ? (
                    <AssistantMessage
                      message={message}
                      messages={messages}
                      generating={generating}
                      generatingStatus={generatingStatus}
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
            ))}
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
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  messages,
  generating,
  generatingStatus
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  generating: boolean;
  generatingStatus: string | null;
}) {
  const [showDiff, setShowDiff] = useState(false);

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

  const hasChanges = diffStats && (diffStats.added > 0 || diffStats.removed > 0);

  return (
    <div>
      {(message.codeGenerated || message.artifactVersionId) && (
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
      {message.content ? (
        <RichText isAIMessage maxLines={15}>
          {message.content}
        </RichText>
      ) : generating ? (
        <ThinkingIndicator status={generatingStatus || 'thinking'} compact />
      ) : null}
    </div>
  );
}

import React, { RefObject } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  createdAt: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  inputMessage: string;
  generating: boolean;
  isOwner: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export default function ChatPanel({
  messages,
  inputMessage,
  generating,
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
    <div
      className={css`
        width: 400px;
        display: flex;
        flex-direction: column;
        border-right: 1px solid ${Color.borderGray()};
        background: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          height: 50%;
          border-right: none;
          border-bottom: 1px solid ${Color.borderGray()};
        }
      `}
    >
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        `}
      >
        {messages.length === 0 ? (
          <div
            className={css`
              text-align: center;
              padding: 2rem;
              color: ${Color.darkGray()};
            `}
          >
            <Icon icon="comments" size="2x" style={{ marginBottom: '1rem' }} />
            <p style={{ margin: 0 }}>
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
                      ? Color.logoBlue()
                      : Color.wellGray()};
                    color: ${message.role === 'user' ? '#fff' : 'inherit'};
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-size: 0.95rem;
                    line-height: 1.4;
                  `}
                >
                  {message.role === 'assistant' && message.codeGenerated ? (
                    <span style={{ color: Color.darkGray() }}>
                      <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                      Code generated
                    </span>
                  ) : (
                    message.content
                  )}
                </div>
                <span
                  className={css`
                    font-size: 0.7rem;
                    color: ${Color.gray()};
                    margin-top: 0.25rem;
                    padding: 0 0.5rem;
                  `}
                >
                  {timeSince(message.createdAt)}
                </span>
              </div>
            ))}
            {generating && (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  align-items: flex-start;
                `}
              >
                <div
                  className={css`
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    background: ${Color.wellGray()};
                    color: ${Color.darkGray()};
                    font-size: 0.95rem;
                  `}
                >
                  <Icon icon="spinner" pulse style={{ marginRight: '0.5rem' }} />
                  Generating...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {isOwner && (
        <div
          className={css`
            padding: 0.75rem 1rem;
            border-top: 1px solid ${Color.borderGray()};
            background: ${Color.wellGray()};
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
                border: 1px solid ${Color.borderGray()};
                border-radius: 8px;
                resize: none;
                font-size: 0.95rem;
                font-family: inherit;
                min-height: 44px;
                max-height: 120px;
                &:focus {
                  outline: none;
                  border-color: ${Color.logoBlue()};
                }
                &:disabled {
                  background: ${Color.wellGray()};
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
                  ? Color.logoBlue()
                  : Color.gray(0.3)};
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: ${inputMessage.trim() && !generating
                  ? 'pointer'
                  : 'not-allowed'};
                transition: background 0.2s;
                &:hover:not(:disabled) {
                  background: ${Color.logoBlue(0.8)};
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

import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Textarea from '~/components/Texts/Textarea';
import RichText from '~/components/Texts/RichText';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface PreviewProps {
  chatMessages: ChatMessage[];
  error: string;
  userMessage: string;
  hasPrompt: boolean;
  canSend: boolean;
  sending: boolean;
  trimmedTitle: string;
  messageListRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
  onUserMessageChange: (text: string) => void;
  onSendMessage: () => void;
  style?: React.CSSProperties;
}

export default function SystemPromptPreview({
  chatMessages,
  error,
  userMessage,
  hasPrompt,
  canSend,
  sending,
  trimmedTitle,
  messageListRef,
  onClear,
  onUserMessageChange,
  onSendMessage,
  style
}: PreviewProps) {
  const cardClass = useMemo(
    () =>
      css`
        width: 100%;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: 1.4rem 1.6rem;
        box-shadow: none;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem;
        }
      `,
    []
  );

  const sectionHeaderClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      `,
    []
  );

  const labelClass = useMemo(
    () =>
      css`
        font-size: 1.45rem;
        font-weight: 700;
        color: ${Color.darkerGray()};
      `,
    []
  );

  const chatWindowClass = useMemo(
    () =>
      css`
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        background: ${Color.highlightGray(0.5)};
        padding: 1.2rem;
        min-height: 24rem;
        max-height: 40rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        position: relative;
      `,
    []
  );

  const bubbleLabelClass = useMemo(
    () =>
      css`
        font-size: 1.2rem;
        font-weight: 700;
        color: ${Color.gray()};
        margin-bottom: 0.35rem;
        display: inline-flex;
        align-items: center;
      `,
    []
  );

  return (
    <section
      className={`${cardClass} ${css`
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      `}`}
      style={style}
    >
      <div className={sectionHeaderClass}>
        <div className={labelClass}>Chat Preview</div>
        <Button
          color="rose"
          variant="ghost"
          disabled={!chatMessages.length}
          onClick={onClear}
        >
          <Icon style={{ marginRight: '0.5rem' }} icon="broom" />
          Clear Conversation
        </Button>
      </div>
      <div ref={messageListRef} className={chatWindowClass}>
        {chatMessages.length === 0 ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              min-height: 18rem;
              width: 100%;
              flex: 1 1 auto;
              margin: auto 0;
              padding: 2rem;
              gap: 1rem;
            `}
          >
            <div
              className={css`
                width: 5rem;
                height: 5rem;
                border-radius: 50%;
                background: linear-gradient(
                  135deg,
                  ${Color.logoBlue(0.15)},
                  ${Color.magenta(0.15)}
                );
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <Icon
                icon="comments"
                style={{ fontSize: '2rem', color: Color.logoBlue() }}
              />
            </div>
            <div
              className={css`
                font-size: 1.6rem;
                font-weight: 700;
                color: ${Color.darkerGray()};
              `}
            >
              Test Your Agent
            </div>
            <div
              className={css`
                font-size: 1.4rem;
                color: ${Color.gray()};
                max-width: 32rem;
                line-height: 1.5;
              `}
            >
              Send a message below to see how{' '}
              <strong style={{ color: Color.darkerGray() }}>
                {trimmedTitle || 'your agent'}
              </strong>{' '}
              responds with your system prompt.
            </div>
          </div>
        ) : (
          chatMessages.map((message) => {
            const content =
              typeof message.content === 'string' ? message.content : '';
            return (
              <div
                key={message.id}
                className={css`
                  align-self: ${message.role === 'assistant'
                    ? 'flex-start'
                    : 'flex-end'};
                  background: ${message.role === 'assistant'
                    ? Color.white()
                    : Color.skyBlue(0.1)};
                  color: ${Color.black()};
                  border: 1px solid var(--ui-border);
                  border-radius: ${borderRadius};
                  padding: 1rem 1.2rem;
                  max-width: 85%;
                `}
              >
                <div className={bubbleLabelClass}>
                  {message.role === 'assistant'
                    ? trimmedTitle || 'Agent'
                    : 'You'}
                </div>
                <RichText
                  isAIMessage={message.role === 'assistant'}
                  isAudioButtonShown={false}
                  contentId={message.id}
                  contentType="systemPromptPreview"
                  section="main"
                  maxLines={5000}
                  style={{
                    fontSize: '1.4rem',
                    lineHeight: 1.6
                  }}
                >
                  {content}
                </RichText>
              </div>
            );
          })
        )}
      </div>
      {error && (
        <div
          className={css`
            color: ${Color.red()};
            font-size: 1.3rem;
          `}
        >
          {error}
        </div>
      )}
      <div
        className={css`
          display: flex;
          gap: 1rem;
          flex-direction: column;
          ${chatMessages.length === 0
            ? `
            background: linear-gradient(135deg, ${Color.logoBlue(0.03)}, ${Color.magenta(0.03)});
            border-radius: ${borderRadius};
            padding: 1rem;
            border: 1px dashed ${Color.logoBlue(0.3)};
          `
            : ''}
        `}
      >
        {chatMessages.length === 0 && (
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 1.3rem;
              color: ${Color.logoBlue()};
              font-weight: 600;
            `}
          >
            <Icon icon="arrow-down" />
            Try it out
          </div>
        )}
        <Textarea
          minRows={2}
          maxRows={6}
          placeholder={
            hasPrompt
              ? `e.g., "Hello, can you help me with..."`
              : 'Enter a system prompt before chatting.'
          }
          value={userMessage}
          disabled={!hasPrompt || sending}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            onUserMessageChange(event.target.value)
          }
        />
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
          `}
        >
          <Button
            color="darkBlue"
            variant="soft"
            tone="raised"
            disabled={!canSend}
            onClick={onSendMessage}
            style={{ minWidth: '10rem' }}
          >
            {sending ? (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                Thinking...
              </>
            ) : (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="paper-plane" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

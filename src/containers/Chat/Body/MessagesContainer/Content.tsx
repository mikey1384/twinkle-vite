import React, { type ComponentProps } from 'react';
import { css } from '@emotion/css';
import ChannelHeader from './ChannelHeader';
import DisplayedMessages from './DisplayedMessages';
import MessageInput from './MessageInput';

export default function Content({
  catchUpStatusShown,
  catchUpTerminalError,
  containerHeight,
  subchannel,
  channelHeaderProps,
  displayedMessagesProps,
  messageInputKey,
  messageInputProps,
  onRetryCatchUp
}: {
  catchUpStatusShown: boolean;
  catchUpTerminalError: boolean;
  containerHeight: string;
  subchannel: any;
  channelHeaderProps: ComponentProps<typeof ChannelHeader>;
  displayedMessagesProps: ComponentProps<typeof DisplayedMessages>;
  messageInputKey: number;
  messageInputProps: ComponentProps<typeof MessageInput>;
  onRetryCatchUp: () => void;
}) {
  return (
    <>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: relative;
        `}
        style={{ height: containerHeight }}
      >
        {!subchannel?.isRestricted && <ChannelHeader {...channelHeaderProps} />}
        <DisplayedMessages {...displayedMessagesProps} />
      </div>
      <div
        style={{
          background: 'var(--chat-bg)',
          padding: '1rem',
          borderTop: '1px solid var(--ui-border)'
        }}
      >
        {catchUpStatusShown && (
          <div
            role="status"
            aria-live="polite"
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              width: fit-content;
              max-width: 100%;
              height: 3rem;
              margin: 0 auto 1rem;
              padding: 0 1rem;
              border: 1px solid var(--ui-border);
              border-radius: 999px;
              background: var(--chat-title-bg);
              box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.12);
              color: var(--chat-text);
              font-size: 1.3rem;
              font-weight: 600;
              white-space: nowrap;
            `}
          >
            Catching up&hellip;
          </div>
        )}
        {catchUpTerminalError && (
          <div
            role="alert"
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.8rem;
              width: fit-content;
              max-width: 100%;
              min-height: 3rem;
              margin: 0 auto 1rem;
              padding: 0.5rem 0.8rem 0.5rem 1rem;
              border: 1px solid var(--ui-border);
              border-radius: 0.5rem;
              background: var(--chat-title-bg);
              color: var(--chat-text);
              font-size: 1.1rem;
            `}
          >
            <span>
              Couldn&rsquo;t refresh. You&rsquo;re seeing the last confirmed
              messages.
            </span>
            <button
              type="button"
              onClick={onRetryCatchUp}
              className={css`
                flex: 0 0 auto;
                min-height: 2.4rem;
                padding: 0.3rem 0.8rem;
                border: 1px solid var(--ui-border);
                border-radius: 0.5rem;
                background: var(--chat-bg);
                color: var(--chat-text);
                font-size: 1rem;
                font-weight: 650;
                cursor: pointer;
              `}
            >
              Retry
            </button>
          </div>
        )}
        <MessageInput key={messageInputKey} {...messageInputProps} />
      </div>
    </>
  );
}

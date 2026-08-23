import React, { type ComponentProps } from 'react';
import { css } from '@emotion/css';
import ChannelHeader from './ChannelHeader';
import DisplayedMessages from './DisplayedMessages';
import MessageInput from './MessageInput';

export default function Content({
  catchUpStatusShown,
  containerHeight,
  subchannel,
  channelHeaderProps,
  displayedMessagesProps,
  messageInputKey,
  messageInputProps
}: {
  catchUpStatusShown: boolean;
  containerHeight: string;
  subchannel: any;
  channelHeaderProps: ComponentProps<typeof ChannelHeader>;
  displayedMessagesProps: ComponentProps<typeof DisplayedMessages>;
  messageInputKey: number;
  messageInputProps: ComponentProps<typeof MessageInput>;
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
      {catchUpStatusShown && (
        <div
          role="status"
          aria-live="polite"
          className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 100%;
            height: 4rem;
            border-top: 1px solid var(--ui-border);
            background: var(--chat-title-bg);
            color: var(--chat-text);
            font-size: 1.4rem;
            font-weight: 500;
            letter-spacing: 0.02em;
          `}
        >
          Catching up&hellip;
        </div>
      )}
      <div
        style={{
          background: 'var(--chat-bg)',
          padding: '1rem',
          borderTop: catchUpStatusShown
            ? undefined
            : '1px solid var(--ui-border)'
        }}
      >
        <MessageInput key={messageInputKey} {...messageInputProps} />
      </div>
    </>
  );
}

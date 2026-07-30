import React, { type ComponentProps } from 'react';
import { css } from '@emotion/css';
import ChannelHeader from './ChannelHeader';
import DisplayedMessages from './DisplayedMessages';
import MessageInput from './MessageInput';

export default function Content({
  containerHeight,
  subchannel,
  channelHeaderProps,
  displayedMessagesProps,
  messageInputKey,
  messageInputProps
}: {
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
      <div
        style={{
          background: 'var(--chat-bg)',
          padding: '1rem',
          borderTop: '1px solid var(--ui-border)'
        }}
      >
        <MessageInput key={messageInputKey} {...messageInputProps} />
      </div>
    </>
  );
}

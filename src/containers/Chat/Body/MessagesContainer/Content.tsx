import React, { type ComponentProps } from 'react';
import { css } from '@emotion/css';
import ChannelHeader from './ChannelHeader';
import DisplayedMessages from './DisplayedMessages';
import MessageInput from './MessageInput';

export default function Content({
  subchannel,
  channelHeaderProps,
  displayedMessagesProps,
  messageInputKey,
  messageInputProps
}: {
  subchannel: any;
  channelHeaderProps: ComponentProps<typeof ChannelHeader>;
  displayedMessagesProps: ComponentProps<typeof DisplayedMessages>;
  messageInputKey: number;
  messageInputProps: ComponentProps<typeof MessageInput>;
}) {
  // The message area takes whatever the composer does not, measured by the
  // layout engine rather than by us. This used to be an explicit
  // `height: CALC(100% - <measured textarea px> - <magic rems>)`, which is a
  // hand-rolled `flex: 1` that has to re-guess the composer's rendered height
  // for every variant it can take — reply target, chess target, call screen, AI
  // usage banner, a grown textarea. It was permanently 5px short even in the
  // plain case (54px reserved for a 59px composer), and the surplus turned into
  // real scroll room on `#App` (which is `overflow-y: scroll`), so the browser
  // could scroll the composer up under the keyboard and strand the messages
  // above it. min-height: 0 is what lets the message list actually shrink
  // instead of forcing the column past its parent.
  return (
    <>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          flex: 1 1 auto;
          min-height: 0;
          position: relative;
        `}
      >
        {!subchannel?.isRestricted && <ChannelHeader {...channelHeaderProps} />}
        <DisplayedMessages {...displayedMessagesProps} />
      </div>
      <div
        className={css`
          flex: 0 0 auto;
          background: var(--chat-bg);
          padding: 1rem;
          border-top: 1px solid var(--ui-border);
        `}
      >
        <MessageInput key={messageInputKey} {...messageInputProps} />
      </div>
    </>
  );
}

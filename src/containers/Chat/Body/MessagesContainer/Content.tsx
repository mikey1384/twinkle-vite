import React, { type ComponentProps } from 'react';
import { css } from '@emotion/css';
import ChannelHeader from './ChannelHeader';
import DisplayedMessages from './DisplayedMessages';
import MessageInput from './MessageInput';
import { chatComposerClass } from '../../containers';
import ChatPinsProvider from '../../Pins';
import { useKeyContext } from '~/contexts';
import { useChatPins } from '../../Pins/context';

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
  const userId = useKeyContext((v) => v.myState.userId);
  const channelId = Number(channelHeaderProps.selectedChannelId || 0);
  const subchannelId = Number(subchannel?.id || 0);
  const topicId =
    channelHeaderProps.currentChannel.selectedTab === 'topic'
      ? Number(
          channelHeaderProps.currentChannel.selectedTopicId ||
            channelHeaderProps.currentChannel.featuredTopicId ||
            0
        )
      : 0;
  return (
    <ChatPinsProvider
      key={`${userId}:${channelId}`}
      channelId={channelId}
      subchannelId={subchannelId}
      topicId={topicId}
    >
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
      <div data-chat-composer className={chatComposerClass}>
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
        <PinAwareMessageInput key={messageInputKey} {...messageInputProps} />
      </div>
    </ChatPinsProvider>
  );
}

function PinAwareMessageInput(props: ComponentProps<typeof MessageInput>) {
  const pins = useChatPins();
  return (
    <MessageInput
      {...props}
      onMessageSubmit={(input) => {
        pins?.leaveHistory();
        return props.onMessageSubmit(input);
      }}
    />
  );
}

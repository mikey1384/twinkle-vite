import React from 'react';
import { css } from '@emotion/css';
import { useChatContext } from '~/contexts';

export default function TopicMessagePreview({
  channelId,
  nextMessageHasTopic,
  prevMessageHasTopic,
  topicObj,
  username
}: {
  channelId: number;
  nextMessageHasTopic: boolean;
  prevMessageHasTopic: boolean;
  topicObj: { id: number; content: string };
  username: string;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  return (
    <div
      className={css`
        font-family: 'Roboto', sans-serif;
        color: #333;
        background-color: #f9f9f9;
        border-top: 1px solid #d0e0f0;
        border-bottom: 1px solid #d0e0f0;
        cursor: pointer;
        text-align: center;
        padding: 1rem;
        margin-top: ${prevMessageHasTopic ? '0.5rem' : '1rem'};
        margin-bottom: ${nextMessageHasTopic ? '0.5rem' : '1rem'};
        transition: all 0.3s ease;

        &:hover {
          background-color: #e9f2f9;
          border-color: #b0c4de;
        }
      `}
      onClick={handleClick}
    >
      <div
        className={css`
          font-size: 16px;
        `}
      >
        {username} posted a message on {topicObj.content}
      </div>
    </div>
  );

  function handleClick() {
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'topic', selectedTopicId: topicObj.id }
    });
  }
}

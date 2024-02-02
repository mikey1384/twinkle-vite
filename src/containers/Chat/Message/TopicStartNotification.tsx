import React from 'react';
import { css } from '@emotion/css';
import { useChatContext } from '~/contexts';

export default function TopicStartNotification({
  channelId,
  topicObj,
  username
}: {
  channelId: number;
  topicObj: { id: number; title: string };
  username: string;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  return (
    <div
      className={css`
        font-family: 'Roboto', sans-serif;
        color: #333;
        background-color: #f9f9f9;
        border: 1px solid #d0e0f0;
        cursor: pointer;
        text-align: center;
        padding: 1rem;
        margin: 1rem 0;
        transition: all 0.3s ease;

        &:hover {
          background-color: #e9f2f9;
          border-color: #b0c4de;
        }
      `}
      onClick={() => handleTopicClick(topicObj.id)}
    >
      <div
        className={css`
          font-size: 16px;
          font-weight: bold;
        `}
      >
        {username} started a new topic: {topicObj.title}
      </div>
    </div>
  );

  function handleTopicClick(topicId: number) {
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'topic', selectedTopicId: topicId }
    });
  }
}

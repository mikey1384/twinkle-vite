import React from 'react';
import { useChatContext } from '~/contexts';

export default function TopicMessagePreview({
  channelId,
  topicObj,
  username
}: {
  channelId: number;
  topicObj: { id: number; content: string };
  username: string;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  return (
    <div
      onClick={handleClick}
      style={{ width: '100%', border: '1px solid red', cursor: 'pointer' }}
    >
      <div>{topicObj.content}</div>
      <div>{username}</div>
    </div>
  );

  function handleClick() {
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'topic', selectedTopicId: topicObj.id }
    });
  }
}

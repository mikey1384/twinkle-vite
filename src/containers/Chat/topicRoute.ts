interface EnterRoutedTopicParams {
  channelId: number;
  topicId: number;
  onEnterTopic: (params: { channelId: number; topicId: number }) => void;
  onSetChannelState: (params: {
    channelId: number;
    newState: { selectedTab: 'topic' };
  }) => void;
  updateLastTopicId: (params: {
    channelId: number;
    topicId: number;
  }) => void;
}

export function enterRoutedTopic({
  channelId,
  topicId,
  onEnterTopic,
  onSetChannelState,
  updateLastTopicId
}: EnterRoutedTopicParams) {
  if (!Number.isInteger(topicId) || topicId <= 0) {
    return false;
  }

  onSetChannelState({
    channelId,
    newState: { selectedTab: 'topic' }
  });
  onEnterTopic({ channelId, topicId });
  updateLastTopicId({ channelId, topicId });
  return true;
}

export const MAX_CHAT_TOPIC_PROJECTION_IDS = 100;

export function getRoutedChatTopicId(pathname: string) {
  const segments = String(pathname || '')
    .split('/')
    .filter(Boolean);
  const topicSegmentIndex = segments.lastIndexOf('topic');
  if (topicSegmentIndex < 0) return 0;
  const topicId = Number(segments[topicSegmentIndex + 1]);
  return Number.isSafeInteger(topicId) && topicId > 0 ? topicId : 0;
}

export function getChatTopicProjectionIds({
  pathname,
  channel
}: {
  pathname: string;
  channel?: {
    selectedTopicId?: number | null;
    topicHistory?: number[];
  } | null;
}) {
  return Array.from(
    new Set(
      [
        getRoutedChatTopicId(pathname),
        Number(channel?.selectedTopicId || 0),
        ...(channel?.topicHistory || []).slice().reverse()
      ]
        .map((topicId) => Number(topicId))
        .filter((topicId) => Number.isSafeInteger(topicId) && topicId > 0)
    )
  ).slice(0, MAX_CHAT_TOPIC_PROJECTION_IDS);
}

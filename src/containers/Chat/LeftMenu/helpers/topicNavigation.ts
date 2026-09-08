interface TopicNavigationOptions {
  featuredTopicId?: number | null;
  lastTopicId?: number;
  pinnedTopicIds?: number[] | null;
  topicObj?: Record<string, any> | null;
}

export function getTopicNavigation({
  featuredTopicId,
  lastTopicId,
  pinnedTopicIds,
  topicObj
}: TopicNavigationOptions) {
  const topics = topicObj || {};
  const pinnedIds = pinnedTopicIds || [];
  const topicKeys = Object.keys(topics).filter((key) => key !== 'null');
  const latestTopic = topics[topicKeys[topicKeys.length - 1]];
  const featuredTopic = featuredTopicId
    ? topics[featuredTopicId] || null
    : latestTopic?.content
      ? latestTopic
      : null;
  const appliedFeaturedTopicId = featuredTopic?.subjectId || featuredTopic?.id;
  const pinnedTopics = pinnedIds
    .map((topicId) => topics[topicId])
    .filter(
      (topic) =>
        !!topic && (topic.subjectId || topic.id) !== appliedFeaturedTopicId
    );
  const lastTopic =
    lastTopicId &&
    lastTopicId !== appliedFeaturedTopicId &&
    !pinnedIds.includes(lastTopicId)
      ? topics[lastTopicId] || null
      : null;
  const additionalTopics = Object.values(topics).filter((topic) => {
    if (!topic) return false;
    const topicId = topic.subjectId || topic.id;
    return (
      !pinnedIds.includes(topicId) &&
      topicId !== appliedFeaturedTopicId &&
      topicId !== lastTopicId
    );
  });

  return {
    featuredTopic,
    appliedFeaturedTopicId,
    pinnedTopics,
    lastTopic,
    additionalTopics,
    isVisible: !!featuredTopic || pinnedTopics.length > 0 || !!lastTopic
  };
}

export type TopicNavigation = ReturnType<typeof getTopicNavigation>;

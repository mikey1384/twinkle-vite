function resetTopicMessageCachesForCanonicalChannelLoad(
  topicObj: Record<string, any> | null | undefined
) {
  const invalidatedTopicObj: Record<string, any> = {};
  for (const [topicId, topic] of Object.entries(topicObj || {})) {
    // A channel load does not include each topic's message page. Never carry a
    // pre-snapshot ID list across that boundary: an offline deletion or
    // moderation event may have made it stale. Keeping `loaded: false` lets
    // the existing topic loader repopulate the selected topic canonically.
    invalidatedTopicObj[topicId] = {
      ...topic,
      loaded: false,
      messageIds: []
    };
  }
  return invalidatedTopicObj;
}

export function mergeCanonicalTopicProjection({
  existingTopicObj,
  serverChannel,
  preserveUnrequestedTopics
}: {
  existingTopicObj?: Record<string, any> | null;
  serverChannel?: any;
  preserveUnrequestedTopics: boolean;
}) {
  const serverTopicObj = serverChannel?.topicObj || {};
  const topicCatalogComplete = serverChannel?.topicCatalogComplete !== false;
  const topicProjectionRequestedIds = Array.isArray(
    serverChannel?.topicProjectionRequestedIds
  )
    ? serverChannel.topicProjectionRequestedIds
        .map((topicId: unknown) => Number(topicId))
        .filter(
          (topicId: number) =>
            Number.isSafeInteger(topicId) && topicId > 0
        )
    : [];
  const mergedTopicObj =
    topicCatalogComplete || !preserveUnrequestedTopics
      ? { ...serverTopicObj }
      : { ...(existingTopicObj || {}), ...serverTopicObj };

  if (!topicCatalogComplete && preserveUnrequestedTopics) {
    for (const topicId of topicProjectionRequestedIds) {
      if (!serverTopicObj[topicId]) delete mergedTopicObj[topicId];
    }
  }

  return {
    topicObj: resetTopicMessageCachesForCanonicalChannelLoad(mergedTopicObj),
    topicCatalogComplete,
    topicProjectionRequestedIds
  };
}

export function reconcileCanonicalTopicNavigation({
  existingChannel,
  canonicalTopicObj,
  topicCatalogComplete = true,
  topicProjectionRequestedIds = []
}: {
  existingChannel: any;
  canonicalTopicObj: Record<string, any>;
  topicCatalogComplete?: boolean;
  topicProjectionRequestedIds?: number[];
}) {
  const requestedTopicIds = new Set(
    topicProjectionRequestedIds.map((topicId) => Number(topicId))
  );
  const topicVisibilityWasConfirmed = (topicId: number) =>
    topicCatalogComplete || requestedTopicIds.has(Number(topicId));
  const selectedTopicId = Number(existingChannel?.selectedTopicId || 0);
  const selectedTopicIsVisible =
    selectedTopicId <= 0 ||
    !topicVisibilityWasConfirmed(selectedTopicId) ||
    Boolean(canonicalTopicObj[selectedTopicId]);
  const visibleTopicHistory = (existingChannel?.topicHistory || []).filter(
    (topicId: number) =>
      !topicVisibilityWasConfirmed(topicId) ||
      Boolean(canonicalTopicObj[topicId])
  );

  if (!selectedTopicIsVisible) {
    return {
      selectedTab: 'all',
      selectedTopicId: null,
      topicHistory: [],
      currentTopicIndex: -1
    };
  }

  const topicHistory =
    selectedTopicId > 0 &&
    !visibleTopicHistory.some(
      (topicId: number) => Number(topicId) === selectedTopicId
    )
      ? [...visibleTopicHistory, selectedTopicId]
      : visibleTopicHistory;
  const selectedTopicIndex = topicHistory.findIndex(
    (topicId: number) => Number(topicId) === selectedTopicId
  );
  const existingTopicIndex = Number(existingChannel?.currentTopicIndex ?? -1);

  return {
    selectedTab: existingChannel?.selectedTab,
    selectedTopicId: existingChannel?.selectedTopicId,
    topicHistory,
    currentTopicIndex:
      selectedTopicId > 0
        ? selectedTopicIndex
        : Math.max(-1, Math.min(existingTopicIndex, topicHistory.length - 1))
  };
}

export { resetTopicMessageCachesForCanonicalChannelLoad };

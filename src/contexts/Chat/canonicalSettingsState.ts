export function applyCanonicalTopicSettings({
  channel,
  topicId,
  topicTitle,
  isOwnerPostingOnly,
  postingMode,
  postingSetBy,
  posters,
  customInstructions
}: {
  channel: any;
  topicId: number;
  // absent when only the posting rule changed (a refused send's reply)
  topicTitle?: string;
  isOwnerPostingOnly: boolean;
  postingMode?: string;
  postingSetBy?: string;
  posters?: Array<{ id: number; username: string }>;
  customInstructions?: string;
}) {
  const currentTopic = channel?.topicObj?.[topicId];
  // The server sends who the rule belongs to already resolved; a stale
  // postingSetById from an earlier load must not override it.
  const { postingSetById: _staleSetById, ...currentSettings } =
    currentTopic?.settings || {};
  // A rule-only update never invents a topic this chat hasn't loaded.
  if (!currentTopic && typeof topicTitle !== 'string') return channel;
  return {
    ...channel,
    topicObj: {
      ...channel?.topicObj,
      [topicId]: {
        ...currentTopic,
        ...(typeof topicTitle === 'string' ? { content: topicTitle } : {}),
        settings: {
          ...(typeof postingSetBy === 'string' ? currentSettings : currentTopic?.settings),
          isOwnerPostingOnly,
          // An API from before chosen members sends neither field.
          ...(typeof postingMode === 'string' ? { postingMode } : {}),
          ...(typeof postingSetBy === 'string' ? { postingSetBy } : {}),
          ...(Array.isArray(posters) ? { posters } : {}),
          ...(typeof customInstructions === 'string'
            ? { customInstructions }
            : {})
        }
      }
    }
  };
}

export function applyCanonicalChannelSettings({
  channel,
  channelName,
  description,
  isClosed,
  isPublic,
  isOwnerPostingOnly,
  canChangeSubject,
  theme,
  thumbPath
}: {
  channel: any;
  channelName: string;
  description: string;
  isClosed: boolean;
  isPublic: boolean;
  isOwnerPostingOnly: boolean;
  canChangeSubject: boolean;
  theme?: string | null;
  thumbPath: string;
}) {
  return {
    ...channel,
    channelName,
    description,
    isClosed,
    isPublic,
    isOwnerPostingOnly,
    canChangeSubject,
    theme: typeof theme === 'undefined' ? channel?.theme : theme,
    thumbPath
  };
}

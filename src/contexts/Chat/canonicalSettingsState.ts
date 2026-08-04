export function applyCanonicalTopicSettings({
  channel,
  topicId,
  topicTitle,
  isOwnerPostingOnly,
  customInstructions
}: {
  channel: any;
  topicId: number;
  topicTitle: string;
  isOwnerPostingOnly: boolean;
  customInstructions?: string;
}) {
  const currentTopic = channel?.topicObj?.[topicId];
  return {
    ...channel,
    topicObj: {
      ...channel?.topicObj,
      [topicId]: {
        ...currentTopic,
        content: topicTitle,
        settings: {
          ...currentTopic?.settings,
          isOwnerPostingOnly,
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

export function applyCanonicalChatAttachmentThumbnail({
  channel,
  messageId,
  subchannelId,
  thumbUrl
}: {
  channel: any;
  messageId: number;
  subchannelId?: number | null;
  thumbUrl: string;
}) {
  const normalizedSubchannelId = Number(subchannelId || 0);
  const message = normalizedSubchannelId
    ? channel?.subchannelObj?.[normalizedSubchannelId]?.messagesObj?.[messageId]
    : channel?.messagesObj?.[messageId];
  if (!channel || !message || !thumbUrl) return channel;

  if (normalizedSubchannelId) {
    return {
      ...channel,
      subchannelObj: {
        ...channel.subchannelObj,
        [normalizedSubchannelId]: {
          ...channel.subchannelObj[normalizedSubchannelId],
          messagesObj: {
            ...channel.subchannelObj[normalizedSubchannelId].messagesObj,
            [messageId]: {
              ...message,
              thumbUrl
            }
          }
        }
      }
    };
  }

  return {
    ...channel,
    messagesObj: {
      ...channel.messagesObj,
      [messageId]: {
        ...message,
        thumbUrl
      }
    }
  };
}

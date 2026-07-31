export function getRealtimeChatMessageKey(message: {
  channelId?: number | string | null;
  id?: number | string | null;
  subchannelId?: number | string | null;
}) {
  const channelId = Number(message?.channelId || 0);
  const messageId = message?.id;
  if (channelId <= 0 || messageId == null || String(messageId).length === 0) {
    return null;
  }
  return [
    channelId,
    Number(message?.subchannelId || 0),
    String(messageId)
  ].join(':');
}

export function hasCanonicalChatMessage({
  channelsObj,
  message
}: {
  channelsObj: Record<number | string, any>;
  message: {
    channelId?: number | string | null;
    id?: number | string | null;
    subchannelId?: number | string | null;
  };
}) {
  const messageKey = getRealtimeChatMessageKey(message);
  if (!messageKey) return false;
  const channel = channelsObj?.[Number(message.channelId)];
  const subchannelId = Number(message.subchannelId || 0);
  const messagesObj = subchannelId
    ? channel?.subchannelObj?.[subchannelId]?.messagesObj
    : channel?.messagesObj;
  return Object.prototype.hasOwnProperty.call(
    messagesObj || {},
    String(message.id)
  );
}

export function createRealtimeChatMessageReplayWindow(maxSize = 1000) {
  const messageKeys = new Set<string>();

  return {
    has(message: {
      channelId?: number | string | null;
      id?: number | string | null;
      subchannelId?: number | string | null;
    }) {
      const messageKey = getRealtimeChatMessageKey(message);
      return Boolean(messageKey && messageKeys.has(messageKey));
    },
    remember(message: {
      channelId?: number | string | null;
      id?: number | string | null;
      subchannelId?: number | string | null;
    }) {
      const messageKey = getRealtimeChatMessageKey(message);
      if (!messageKey) return;
      messageKeys.add(messageKey);
      if (messageKeys.size <= maxSize) return;
      const oldestMessageKey = messageKeys.values().next().value;
      if (oldestMessageKey) {
        messageKeys.delete(oldestMessageKey);
      }
    },
    reset() {
      messageKeys.clear();
    }
  };
}

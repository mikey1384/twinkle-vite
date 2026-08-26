export function applyCanonicalAiMessageFailure({
  channel,
  messageId,
  content,
  settings
}: {
  channel: any;
  messageId: number;
  content?: string;
  settings: Record<string, unknown>;
}) {
  let changed = false;
  let messagesObj = channel?.messagesObj;
  if (messagesObj?.[messageId]) {
    changed = true;
    messagesObj = {
      ...messagesObj,
      [messageId]: {
        ...messagesObj[messageId],
        ...(content !== undefined ? { content } : {}),
        settings
      }
    };
  }

  let subchannelObj = channel?.subchannelObj;
  for (const [subchannelId, subchannel] of Object.entries(
    channel?.subchannelObj || {}
  )) {
    const typedSubchannel = subchannel as any;
    if (!typedSubchannel?.messagesObj?.[messageId]) continue;
    changed = true;
    subchannelObj = {
      ...subchannelObj,
      [subchannelId]: {
        ...typedSubchannel,
        messagesObj: {
          ...typedSubchannel.messagesObj,
          [messageId]: {
            ...typedSubchannel.messagesObj[messageId],
            ...(content !== undefined ? { content } : {}),
            settings
          }
        }
      }
    };
  }

  if (!changed) return channel;
  return {
    ...channel,
    messagesObj,
    ...(subchannelObj ? { subchannelObj } : {})
  };
}

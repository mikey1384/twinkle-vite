function normalizeConfirmedChatMessageId(messageId: unknown) {
  const normalizedMessageId = Number(messageId || 0);
  return Number.isSafeInteger(normalizedMessageId) && normalizedMessageId > 0
    ? normalizedMessageId
    : 0;
}

function isConfirmedMessageInReadScope({
  channelId,
  message,
  messageId,
  subchannelId
}: {
  channelId: number;
  message: unknown;
  messageId: number;
  subchannelId: number;
}) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return false;
  }
  const candidate = message as {
    channelId?: unknown;
    id?: unknown;
    subchannelId?: unknown;
  };
  return Boolean(
    normalizeConfirmedChatMessageId(candidate.id) === messageId &&
      Number(candidate.channelId || 0) === channelId &&
      Number(candidate.subchannelId || 0) === subchannelId
  );
}

export function getVisibleChatReadMessageId({
  channelId,
  confirmedMessage,
  subchannelId,
  visibleMessageIds,
  visibleMessagesObj
}: {
  channelId: number;
  confirmedMessage?: unknown;
  subchannelId: number;
  visibleMessageIds?: readonly unknown[] | null;
  visibleMessagesObj?: Readonly<Record<string | number, unknown>> | null;
}) {
  const confirmedMessageId = normalizeConfirmedChatMessageId(
    (confirmedMessage as { id?: unknown } | null)?.id
  );
  const scopedConfirmedMessageId = isConfirmedMessageInReadScope({
    channelId,
    message: confirmedMessage,
    messageId: confirmedMessageId,
    subchannelId
  })
    ? confirmedMessageId
    : 0;
  const scopedVisibleMessageIds = (visibleMessageIds || [])
    .map(normalizeConfirmedChatMessageId)
    .filter(
      (messageId) =>
        messageId > 0 &&
        isConfirmedMessageInReadScope({
          channelId,
          message: visibleMessagesObj?.[messageId],
          messageId,
          subchannelId
        })
    );
  return Math.max(
    scopedConfirmedMessageId,
    ...scopedVisibleMessageIds
  );
}

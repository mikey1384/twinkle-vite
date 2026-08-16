function normalizeConfirmedChatMessageId(messageId: unknown) {
  const normalizedMessageId = Number(messageId || 0);
  return Number.isSafeInteger(normalizedMessageId) && normalizedMessageId > 0
    ? normalizedMessageId
    : 0;
}

export function getVisibleChatReadMessageId({
  confirmedMessageId,
  visibleMessageIds
}: {
  confirmedMessageId?: unknown;
  visibleMessageIds?: readonly unknown[] | null;
}) {
  return Math.max(
    normalizeConfirmedChatMessageId(confirmedMessageId),
    ...(visibleMessageIds || []).map(normalizeConfirmedChatMessageId)
  );
}

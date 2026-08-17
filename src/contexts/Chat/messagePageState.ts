export function applyCanonicalChatMessagePage({
  existingMessagesObj = {},
  messages,
  messagesHydrated
}: {
  existingMessagesObj?: Record<string, any>;
  messages: any[];
  messagesHydrated: boolean;
}) {
  const nextMessagesObj = { ...existingMessagesObj };
  for (const message of messages) {
    if (message?.id == null) continue;
    nextMessagesObj[message.id] = {
      ...message,
      isLoaded: messagesHydrated
    };
  }
  return nextMessagesObj;
}

export function buildCanonicalChatMessagePageState({
  messages,
  existingMessagesObj,
  messagesHydrated = false
}: {
  messages: any[];
  existingMessagesObj?: Record<number, any>;
  messagesHydrated?: boolean;
}) {
  const messagesLoadMoreButton = messages.length === 21;
  const canonicalMessages = messagesLoadMoreButton
    ? messages.slice(0, 20)
    : messages;

  return {
    messageIds: canonicalMessages.map((message) => message.id),
    messagesObj: applyCanonicalChatMessagePage({
      existingMessagesObj,
      messages: canonicalMessages,
      messagesHydrated
    }),
    messagesLoadMoreButton
  };
}

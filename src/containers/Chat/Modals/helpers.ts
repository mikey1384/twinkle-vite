export function buildCanonicalChannelMessagesState({
  messages,
  existingMessagesObj
}: {
  messages: any[];
  existingMessagesObj?: Record<number, any>;
}) {
  const messagesLoadMoreButton = messages.length === 21;
  const canonicalMessages = messagesLoadMoreButton
    ? messages.slice(0, 20)
    : messages;
  const messagesObj: Record<number, any> = {
    ...(existingMessagesObj || {})
  };

  for (const message of canonicalMessages) {
    messagesObj[message.id] = {
      ...message,
      isLoaded: false
    };
  }

  return {
    messageIds: canonicalMessages.map((message) => message.id),
    messagesObj,
    messagesLoadMoreButton
  };
}

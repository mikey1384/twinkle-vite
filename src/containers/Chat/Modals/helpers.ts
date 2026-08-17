import { buildCanonicalChatMessagePageState } from '~/contexts/Chat/messagePageState';

export function buildCanonicalChannelMessagesState({
  messages,
  existingMessagesObj,
  messagesHydrated = false
}: {
  messages: any[];
  existingMessagesObj?: Record<number, any>;
  messagesHydrated?: boolean;
}) {
  return buildCanonicalChatMessagePageState({
    messages,
    existingMessagesObj,
    messagesHydrated
  });
}

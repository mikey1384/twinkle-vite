import {
  mergeDuplicateAssistantMessages,
  normalizeBuildChatClientMessageId
} from '../domain/chatMessages';
import type { ChatMessage } from '../types';
import type { SharedBuildRunIdentityState } from './useRunIdentity';

interface LocalChatMessagesRunIdentity {
  setAssistantMessageId(messageId?: number | null): void;
  getCurrentActiveUserMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
  getCurrentActiveAssistantMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
}

interface UseLocalChatMessagesOptions {
  buildId: number;
  getCurrentSharedRunIdentityState: () => SharedBuildRunIdentityState | null;
  getLatestChatMessages: () => ChatMessage[];
  hasCurrentPageRunActivity: () => boolean;
  onForceChatAutoScroll: () => void;
  onRemoveBuildRunMessage: (options: {
    buildId: number;
    messageId: number;
    messageRole: ChatMessage['role'];
    clientMessageId?: string | null;
  }) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  runIdentity: LocalChatMessagesRunIdentity;
}

export default function useLocalChatMessages({
  buildId,
  getCurrentSharedRunIdentityState,
  getLatestChatMessages,
  hasCurrentPageRunActivity,
  onForceChatAutoScroll,
  onRemoveBuildRunMessage,
  replaceChatMessages,
  runIdentity
}: UseLocalChatMessagesOptions) {
  function appendLocalBuildChatAssistantMessage(text: string) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    const messageId = Date.now() + Math.floor(Math.random() * 1000);
    const nextMessage: ChatMessage = {
      id: messageId,
      role: 'assistant',
      content: trimmedText,
      codeGenerated: null,
      billingState: null,
      streamCodePreview: null,
      uploadProgressPercent: 6,
      createdAt: Math.floor(Date.now() / 1000),
      persisted: false
    };
    const nextMessages = [...getLatestChatMessages(), nextMessage].sort(
      (a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt - b.createdAt;
        }
        return a.id - b.id;
      }
    );
    replaceChatMessages(nextMessages);
    onForceChatAutoScroll();
    return messageId;
  }

  function upsertLocalBuildChatAssistantMessage(
    messageId: number | null,
    text: string
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return messageId;
    }
    if (
      messageId &&
      getLatestChatMessages().some((entry) => entry.id === messageId)
    ) {
      const nextMessages = getLatestChatMessages().map((entry) =>
        entry.id === messageId
          ? {
              ...entry,
              role: 'assistant' as const,
              content: trimmedText,
              codeGenerated: null,
              streamCodePreview: null,
              artifactVersionId: null
            }
          : entry
      );
      replaceChatMessages(nextMessages);
      return messageId;
    }
    return appendLocalBuildChatAssistantMessage(trimmedText);
  }

  function adoptPersistedBuildRunMessages({
    userMessageId,
    assistantMessageId,
    assistantMessageCreatedAt
  }: {
    userMessageId?: number | null;
    assistantMessageId?: number | null;
    assistantMessageCreatedAt?: number | null;
  }) {
    const normalizedUserMessageId =
      Number(userMessageId || 0) > 0 ? Number(userMessageId) : null;
    const normalizedAssistantMessageId =
      Number(assistantMessageId || 0) > 0 ? Number(assistantMessageId) : null;
    const normalizedAssistantCreatedAt =
      Number(assistantMessageCreatedAt || 0) > 0
        ? Number(assistantMessageCreatedAt)
        : null;
    let nextMessages = getLatestChatMessages();
    let changed = false;
    const currentSharedRunIdentityState = getCurrentSharedRunIdentityState();
    const currentUserMessageId = runIdentity.getCurrentActiveUserMessageId(
      undefined,
      currentSharedRunIdentityState,
      hasCurrentPageRunActivity()
    );
    const localCurrentUserMessageId = runIdentity.getCurrentActiveUserMessageId(
      undefined,
      null,
      hasCurrentPageRunActivity()
    );
    const currentAssistantMessageId =
      runIdentity.getCurrentActiveAssistantMessageId(
        undefined,
        currentSharedRunIdentityState,
        hasCurrentPageRunActivity()
      );
    const localCurrentAssistantMessageId =
      runIdentity.getCurrentActiveAssistantMessageId(
        undefined,
        null,
        hasCurrentPageRunActivity()
      );

    if (normalizedUserMessageId) {
      nextMessages = nextMessages.map((entry) => {
        if (
          entry.id !== normalizedUserMessageId &&
          entry.id !== currentUserMessageId &&
          entry.id !== localCurrentUserMessageId
        ) {
          return entry;
        }
        const nextEntry = {
          ...entry,
          id: normalizedUserMessageId,
          persisted: true
        };
        if (
          nextEntry.id !== entry.id ||
          Boolean(nextEntry.persisted) !== Boolean(entry.persisted)
        ) {
          changed = true;
        }
        return nextEntry;
      });
    }

    if (normalizedAssistantMessageId) {
      runIdentity.setAssistantMessageId(normalizedAssistantMessageId);
      let matchedAssistant = false;
      nextMessages = nextMessages.map((entry) => {
        if (
          entry.id !== normalizedAssistantMessageId &&
          entry.id !== currentAssistantMessageId &&
          entry.id !== localCurrentAssistantMessageId
        ) {
          return entry;
        }
        matchedAssistant = true;
        const nextEntry = {
          ...entry,
          id: normalizedAssistantMessageId,
          persisted: true,
          createdAt: normalizedAssistantCreatedAt || entry.createdAt
        };
        if (
          nextEntry.id !== entry.id ||
          nextEntry.createdAt !== entry.createdAt ||
          Boolean(nextEntry.persisted) !== Boolean(entry.persisted)
        ) {
          changed = true;
        }
        return nextEntry;
      });
      if (!matchedAssistant) {
        nextMessages = [
          ...nextMessages,
          {
            id: normalizedAssistantMessageId,
            role: 'assistant' as const,
            content: '',
            codeGenerated: null,
            billingState: null,
            streamCodePreview: null,
            createdAt:
              normalizedAssistantCreatedAt || Math.floor(Date.now() / 1000),
            persisted: true
          }
        ];
        changed = true;
      }
      const assistantEntries = nextMessages
        .map((entry, index) => ({ entry, index }))
        .filter(
          ({ entry }: { entry: ChatMessage; index: number }) =>
            entry.role === 'assistant' &&
            entry.id === normalizedAssistantMessageId
        );
      if (assistantEntries.length > 1) {
        const mergedAssistant = assistantEntries
          .map(({ entry }) => entry)
          .reduce((result, entry) =>
            mergeDuplicateAssistantMessages(result, entry)
          );
        const primaryAssistantIndex = assistantEntries[0].index;
        nextMessages = nextMessages.filter((entry, index) => {
          if (
            entry.role !== 'assistant' ||
            entry.id !== normalizedAssistantMessageId
          ) {
            return true;
          }
          return index === primaryAssistantIndex;
        });
        nextMessages[primaryAssistantIndex] = mergedAssistant;
        changed = true;
      }
    }

    if (!changed) {
      return;
    }
    const sortedMessages = [...nextMessages].sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
        return a.createdAt - b.createdAt;
      }
      return a.id - b.id;
    });
    replaceChatMessages(sortedMessages);
  }

  function removeLocalMessageByIds(ids: number[]) {
    removeLocalMessagesByIdentity({ ids });
  }

  function removeLocalMessagesByIdentity({
    ids = [],
    clientMessageIds = []
  }: {
    ids?: Array<number | null | undefined>;
    clientMessageIds?: Array<string | null | undefined>;
  }) {
    const idSet = new Set(
      ids
        .map((id) => Number(id || 0))
        .filter((id) => Number.isFinite(id) && id > 0)
    );
    const clientMessageIdSet = new Set(
      clientMessageIds
        .map((clientMessageId) =>
          normalizeBuildChatClientMessageId(clientMessageId)
        )
        .filter(Boolean)
    );
    if (idSet.size === 0 && clientMessageIdSet.size === 0) {
      return;
    }
    const nextMessages = getLatestChatMessages().filter(
      (entry) =>
        !idSet.has(entry.id) &&
        !clientMessageIdSet.has(
          normalizeBuildChatClientMessageId(entry.clientMessageId)
        )
    );
    replaceChatMessages(nextMessages);
  }

  function removeDeletedBuildRunMessage(message: ChatMessage) {
    onRemoveBuildRunMessage({
      buildId,
      messageId: message.id,
      messageRole: message.role,
      clientMessageId: normalizeBuildChatClientMessageId(message.clientMessageId)
    });
    removeLocalMessageByIds([message.id]);
  }

  return {
    adoptPersistedBuildRunMessages,
    appendLocalBuildChatAssistantMessage,
    removeDeletedBuildRunMessage,
    removeLocalMessagesByIdentity,
    upsertLocalBuildChatAssistantMessage
  };
}

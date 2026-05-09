import type {
  BuildLiveRunMessage,
  BuildLiveRunState
} from '~/contexts/Build/reducer';
import type { ChatMessage } from '../types';
import { normalizeProjectFilePath } from './projectFiles';

export function mergeChatMessagesWithBuildRun({
  persistedMessages,
  buildRun
}: {
  persistedMessages: ChatMessage[];
  buildRun: BuildLiveRunState | null;
}) {
  if (!buildRun) return persistedMessages;
  const nextMessages = [...persistedMessages];
  const liveMessages = [buildRun.userMessage, buildRun.assistantMessage].filter(
    (message): message is BuildLiveRunMessage => Boolean(message)
  );

  for (const liveMessage of liveMessages) {
    const nextLiveMessage =
      liveMessage.role === 'assistant' &&
      isBuildAssistantPlaceholderContent(liveMessage.content)
        ? {
            ...liveMessage,
            content: ''
          }
        : liveMessage;
    const existingIndex = nextMessages.findIndex((message) => {
      if (message.id === nextLiveMessage.id) return true;
      return doChatMessagesRepresentSameBuildMessage(message, nextLiveMessage);
    });
    if (existingIndex >= 0) {
      const existingMessage = nextMessages[existingIndex];
      const shouldPreserveExistingAssistantContent =
        existingMessage.role === 'assistant' &&
        nextLiveMessage.role === 'assistant' &&
        isBuildAssistantPlaceholderContent(nextLiveMessage.content);
      const shouldAdoptPersistedMessageId =
        existingMessage.persisted !== true &&
        nextLiveMessage.persisted === true &&
        Number(nextLiveMessage.id || 0) > 0 &&
        (doChatMessagesShareClientMessageId(existingMessage, nextLiveMessage) ||
          nextLiveMessage.role === 'user');
      nextMessages[existingIndex] = {
        ...existingMessage,
        ...nextLiveMessage,
        id: shouldAdoptPersistedMessageId
          ? Number(nextLiveMessage.id)
          : existingMessage.id,
        content: shouldPreserveExistingAssistantContent
          ? existingMessage.content
          : nextLiveMessage.content,
        streamCodePreview: shouldPreserveExistingAssistantContent
          ? (existingMessage.streamCodePreview ?? null)
          : (nextLiveMessage.streamCodePreview ?? null),
        persisted:
          existingMessage.persisted ||
          nextLiveMessage.persisted ||
          false
      };
      removeDuplicateMessagesForClientMessageId(
        nextMessages,
        nextMessages[existingIndex],
        existingIndex
      );
      continue;
    }
    nextMessages.push({
      ...nextLiveMessage
    });
  }

  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

export function normalizeSharedBuildRunBaseProjectFiles(
  buildRun: BuildLiveRunState | null | undefined
) {
  return Array.isArray(buildRun?.baseProjectFiles)
    ? buildRun.baseProjectFiles.map((file: any) => ({
        path: normalizeProjectFilePath(file.path),
        content: typeof file.content === 'string' ? file.content : ''
      }))
    : [];
}

export function mergeDisplayedChatMessages({
  baseMessages,
  supplementalMessages
}: {
  baseMessages: ChatMessage[];
  supplementalMessages: ChatMessage[];
}) {
  if (supplementalMessages.length === 0) {
    return baseMessages;
  }
  const nextMessages = [...baseMessages];
  for (const supplementalMessage of supplementalMessages) {
    if (nextMessages.some((message) => message.id === supplementalMessage.id)) {
      continue;
    }
    nextMessages.push(supplementalMessage);
  }
  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

export function formatTrailingRuntimeObservationMessageContext(
  messages: ChatMessage[]
) {
  const trailingNotes: string[] = [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.source !== 'runtime_observation') {
      break;
    }
    const content = String(message.content || '').trim();
    if (!content) {
      continue;
    }
    trailingNotes.unshift(content);
  }
  if (trailingNotes.length === 0) {
    return '';
  }
  return [
    'RECENT_PREVIEW_CHAT_NOTES:',
    ...trailingNotes.map((note, index) => {
      const normalizedNote = note.replace(/\s*\n\s*/g, '\n').trim();
      return `${index + 1}. ${normalizedNote.replace(/\n/g, '\n   ')}`;
    }),
    'The user may be referring to one of these preview issue notes directly.'
  ].join('\n');
}

export function mergeHiddenBuildMessageContext(
  ...parts: Array<string | null | undefined>
) {
  const seen = new Set<string>();
  return parts
    .map((part) => String(part || '').trim())
    .filter((part) => {
      if (!part || seen.has(part)) {
        return false;
      }
      seen.add(part);
      return true;
    })
    .join('\n\n');
}

export function mergePersistedChatMessagesIntoLocalMessages({
  localMessages,
  persistedMessages,
  activeUserMessage,
  activeAssistantMessageId,
  preserveActiveAssistantState = false
}: {
  localMessages: ChatMessage[];
  persistedMessages: ChatMessage[];
  activeUserMessage?: ChatMessage | null;
  activeAssistantMessageId?: number | null;
  preserveActiveAssistantState?: boolean;
}) {
  const nextMessages = [...localMessages];
  for (const persistedMessage of persistedMessages) {
    const normalizedPersistedMessage =
      persistedMessage.role === 'assistant' &&
      isBuildAssistantPlaceholderContent(persistedMessage.content)
        ? {
            ...persistedMessage,
            content: ''
          }
        : persistedMessage;
    let existingIndex = nextMessages.findIndex((message) => {
      if (message.id === normalizedPersistedMessage.id) return true;
      return doChatMessagesRepresentSameBuildMessage(
        message,
        normalizedPersistedMessage as BuildLiveRunMessage
      );
    });
    if (existingIndex < 0) {
      existingIndex = nextMessages.findIndex((message) => {
        if (
          message.id !== Number(activeAssistantMessageId || 0) ||
          message.persisted
        ) {
          return false;
        }
        return doesRecoveredBuildAssistantMessageMatchTarget({
          candidateMessage: normalizedPersistedMessage,
          targetMessage: message,
          activeUserMessage
        });
      });
    }
    if (existingIndex >= 0) {
      const existingMessage = nextMessages[existingIndex];
      const isActiveAssistantMessage =
        preserveActiveAssistantState &&
        existingMessage.role === 'assistant' &&
        Number(activeAssistantMessageId || 0) > 0 &&
        (existingMessage.id === Number(activeAssistantMessageId) ||
          normalizedPersistedMessage.id === Number(activeAssistantMessageId));
      const persistedAssistantContent = String(
        normalizedPersistedMessage.content || ''
      ).trim();
      const shouldPreserveLocalAssistantState =
        isActiveAssistantMessage &&
        !String(normalizedPersistedMessage.codeGenerated || '').trim() &&
        Number(normalizedPersistedMessage.artifactVersionId || 0) <= 0 &&
        (!persistedAssistantContent ||
          isBuildAssistantPlaceholderContent(persistedAssistantContent));
      nextMessages[existingIndex] = {
        ...existingMessage,
        ...normalizedPersistedMessage,
        persisted: true,
        content:
          shouldPreserveLocalAssistantState
            ? existingMessage.content
            : normalizedPersistedMessage.content,
        streamCodePreview: shouldPreserveLocalAssistantState
          ? (existingMessage.streamCodePreview ?? null)
          : null
      };
      removeDuplicateMessagesForClientMessageId(
        nextMessages,
        nextMessages[existingIndex],
        existingIndex
      );
      continue;
    }
    nextMessages.push({
      ...normalizedPersistedMessage,
      persisted: true,
      streamCodePreview: null
    });
  }
  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

export function isBuildAssistantPlaceholderContent(content: string) {
  const normalizedContent = String(content || '').trim();
  return (
    !normalizedContent ||
    normalizedContent === 'Would you like me to continue working on this?'
  );
}

export function hasBuildAssistantStructuredOutput(
  message:
    | Pick<ChatMessage, 'codeGenerated' | 'artifactVersionId'>
    | null
    | undefined
) {
  return (
    Boolean(String(message?.codeGenerated || '').trim()) ||
    Number(message?.artifactVersionId || 0) > 0
  );
}

export function doesRecoveredBuildAssistantMessageMatchTarget({
  candidateMessage,
  targetMessage,
  activeUserMessage
}: {
  candidateMessage: ChatMessage;
  targetMessage: ChatMessage;
  activeUserMessage?: ChatMessage | null;
}) {
  if (
    candidateMessage.role !== 'assistant' ||
    targetMessage.role !== 'assistant'
  ) {
    return false;
  }
  if (!candidateMessage.persisted) {
    return false;
  }
  if (hasBuildAssistantStructuredOutput(targetMessage)) {
    return false;
  }
  const candidateCreatedAt = Number(candidateMessage.createdAt || 0);
  const targetCreatedAt = Number(targetMessage.createdAt || 0);
  if (!candidateCreatedAt || !targetCreatedAt) {
    return false;
  }
  if (Math.abs(candidateCreatedAt - targetCreatedAt) > 5) {
    return false;
  }
  const activeUserCreatedAt = Number(activeUserMessage?.createdAt || 0);
  return (
    activeUserCreatedAt <= 0 || candidateCreatedAt >= activeUserCreatedAt - 5
  );
}

export function mergeDuplicateAssistantMessages(
  left: ChatMessage,
  right: ChatMessage
) {
  const leftContent = String(left.content || '').trim();
  const rightContent = String(right.content || '').trim();
  const leftHasStructuredOutput = hasBuildAssistantStructuredOutput(left);
  const rightHasStructuredOutput = hasBuildAssistantStructuredOutput(right);
  const leftHasStreamPreview = Boolean(left.streamCodePreview?.trim());
  const rightHasStreamPreview = Boolean(right.streamCodePreview?.trim());
  const leftHasMeaningfulContent =
    Boolean(leftContent) && !isBuildAssistantPlaceholderContent(leftContent);
  const rightHasMeaningfulContent =
    Boolean(rightContent) && !isBuildAssistantPlaceholderContent(rightContent);
  const preferRight =
    (!leftHasStructuredOutput && rightHasStructuredOutput) ||
    (!leftHasStreamPreview && rightHasStreamPreview) ||
    (!leftHasMeaningfulContent &&
      rightHasMeaningfulContent &&
      !rightHasStructuredOutput) ||
    (leftHasMeaningfulContent === rightHasMeaningfulContent &&
      leftHasStructuredOutput === rightHasStructuredOutput &&
      leftHasStreamPreview === rightHasStreamPreview &&
      rightContent.length > leftContent.length);
  const preferred = preferRight ? right : left;
  const fallback = preferRight ? left : right;

  return {
    ...fallback,
    ...preferred,
    id: preferred.id,
    role: 'assistant' as const,
    content:
      preferred.content ||
      (!isBuildAssistantPlaceholderContent(fallback.content)
        ? fallback.content
        : preferred.content),
    codeGenerated: preferred.codeGenerated ?? fallback.codeGenerated ?? null,
    streamCodePreview:
      preferred.streamCodePreview ?? fallback.streamCodePreview ?? null,
    billingState: preferred.billingState ?? fallback.billingState ?? null,
    artifactVersionId:
      preferred.artifactVersionId ?? fallback.artifactVersionId ?? null,
    createdAt: Math.min(
      Number(left.createdAt || 0) || Number(right.createdAt || 0),
      Number(right.createdAt || 0) || Number(left.createdAt || 0)
    ),
    persisted: Boolean(left.persisted || right.persisted)
  };
}

export function doChatMessagesRepresentSameBuildMessage(
  persistedMessage: ChatMessage,
  liveMessage: BuildLiveRunMessage
) {
  if (!persistedMessage || !liveMessage) return false;
  if (persistedMessage.role !== liveMessage.role) return false;
  if (doChatMessagesShareClientMessageId(persistedMessage, liveMessage)) {
    return true;
  }
  const persistedClientMessageId = normalizeBuildChatClientMessageId(
    persistedMessage.clientMessageId
  );
  const liveClientMessageId = normalizeBuildChatClientMessageId(
    liveMessage.clientMessageId
  );
  if (persistedClientMessageId && liveClientMessageId) {
    return false;
  }
  if (
    String(persistedMessage.content || '') !== String(liveMessage.content || '')
  ) {
    return false;
  }
  if (
    String(persistedMessage.codeGenerated || '') !==
    String(liveMessage.codeGenerated || '')
  ) {
    return false;
  }
  if (
    Number(persistedMessage.artifactVersionId || 0) !==
    Number(liveMessage.artifactVersionId || 0)
  ) {
    return false;
  }
  return (
    Math.abs(
      Number(persistedMessage.createdAt || 0) -
        Number(liveMessage.createdAt || 0)
    ) <= 5
  );
}

export function normalizeBuildChatClientMessageId(value: unknown) {
  return String(value || '').trim();
}

export function doChatMessagesShareClientMessageId(
  left:
    | Pick<ChatMessage, 'clientMessageId' | 'role'>
    | Pick<BuildLiveRunMessage, 'clientMessageId' | 'role'>,
  right:
    | Pick<ChatMessage, 'clientMessageId' | 'role'>
    | Pick<BuildLiveRunMessage, 'clientMessageId' | 'role'>
) {
  const leftClientMessageId = normalizeBuildChatClientMessageId(
    left.clientMessageId
  );
  return Boolean(
    leftClientMessageId &&
      left.role === right.role &&
      leftClientMessageId ===
        normalizeBuildChatClientMessageId(right.clientMessageId)
  );
}

export function removeDuplicateMessagesForClientMessageId(
  messages: ChatMessage[],
  canonicalMessage: ChatMessage,
  preservedIndex: number
) {
  const canonicalClientMessageId = normalizeBuildChatClientMessageId(
    canonicalMessage.clientMessageId
  );
  if (!canonicalClientMessageId) {
    return;
  }
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (index === preservedIndex) {
      continue;
    }
    if (
      messages[index].role === canonicalMessage.role &&
      normalizeBuildChatClientMessageId(messages[index].clientMessageId) ===
        canonicalClientMessageId
    ) {
      messages.splice(index, 1);
    }
  }
}

export function createBuildChatClientMessageId({
  buildId,
  role
}: {
  buildId: number;
  role: 'user' | 'assistant';
}) {
  const randomSegment =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `build-${Number(buildId) || 0}-${role}-${randomSegment}`;
}

export function findMatchingBuildChatMessageId({
  messages,
  targetMessage,
  activeUserMessage
}: {
  messages: ChatMessage[];
  targetMessage: ChatMessage | null;
  activeUserMessage?: ChatMessage | null;
}) {
  if (!targetMessage) {
    return null;
  }
  const matchedMessage = messages.find((message) => {
    if (message.id === targetMessage.id) {
      return true;
    }
    return doChatMessagesRepresentSameBuildMessage(
      message,
      targetMessage as BuildLiveRunMessage
    );
  });
  if (matchedMessage) {
    return matchedMessage.id || null;
  }
  if (targetMessage.role !== 'assistant') {
    return null;
  }
  const recoveredAssistantMessage = messages.find((message) =>
    doesRecoveredBuildAssistantMessageMatchTarget({
      candidateMessage: message,
      targetMessage,
      activeUserMessage
    })
  );
  return recoveredAssistantMessage?.id || null;
}

export function resolveStoppedRunAssistantMessage({
  runMode,
  userRequestedStop
}: {
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  userRequestedStop: boolean;
}) {
  if (userRequestedStop) {
    return 'Stopped this run.';
  }
  return runMode === 'user' ? 'Lumine stopped this run.' : 'Lumine stopped.';
}

export function chatMessagesEqual(a: ChatMessage[], b: ChatMessage[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.role !== right.role ||
      left.content !== right.content ||
      left.codeGenerated !== right.codeGenerated ||
      left.streamCodePreview !== right.streamCodePreview ||
      Number(left.uploadProgressPercent ?? -1) !==
        Number(right.uploadProgressPercent ?? -1) ||
      left.artifactVersionId !== right.artifactVersionId ||
      left.createdAt !== right.createdAt ||
      Boolean(left.persisted) !== Boolean(right.persisted)
    ) {
      return false;
    }
  }
  return true;
}

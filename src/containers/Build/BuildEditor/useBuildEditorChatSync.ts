import {
  findMatchingBuildChatMessageId,
  mergePersistedChatMessagesIntoLocalMessages
} from './domain/chatMessages';
import type {
  Build,
  BuildCopilotPolicy,
  ChatMessage
} from './types';
import type { SharedBuildRunIdentityState } from './useBuildRunIdentity';

export interface SyncChatMessagesFromServerOptions {
  preserveLocalMessages?: boolean;
  preserveActiveAssistantState?: boolean;
}

interface UseBuildEditorChatSyncOptions {
  applyBuildUpdate: (build: Build) => void;
  buildId: number;
  getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null;
  getCurrentActiveAssistantMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentActiveRunRequestId: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getCurrentActiveUserMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentRunRequestId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getLatestBuild: () => Build;
  getLatestChatMessages: () => ChatMessage[];
  loadBuild: (
    buildId: number,
    options?: { fromWriter?: boolean }
  ) => Promise<any>;
  markActiveBuildRunActivity: (activityAt?: number | null) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  runIdentity: {
    adoptMessageIds(options: {
      userMessageId?: number | null;
      assistantMessageId?: number | null;
    }): void;
  };
  setRequiresProjectFilesResyncBeforeSave: (nextValue: boolean) => void;
}

export default function useBuildEditorChatSync({
  applyBuildUpdate,
  buildId,
  getBuildRunIdentity,
  getCurrentActiveAssistantMessageId,
  getCurrentActiveRunRequestId,
  getCurrentActiveUserMessageId,
  getCurrentRunRequestId,
  getLatestBuild,
  getLatestChatMessages,
  loadBuild,
  markActiveBuildRunActivity,
  replaceChatMessages,
  replaceCopilotPolicy,
  runIdentity,
  setRequiresProjectFilesResyncBeforeSave
}: UseBuildEditorChatSyncOptions) {
  async function syncChatMessagesFromServer(
    serverMessages?: any[],
    fromWriter = false,
    options?: SyncChatMessagesFromServerOptions
  ) {
    let messages = Array.isArray(serverMessages) ? serverMessages : null;
    if (!messages) {
      const buildPayload = await loadBuild(
        buildId,
        fromWriter ? { fromWriter: true } : undefined
      );
      const latestSharedRunIdentityState = getBuildRunIdentity(
        Number(getLatestBuild()?.id || buildId)
      );
      if (buildPayload?.build) {
        const nextBuild = {
          ...buildPayload.build,
          executionPlan: buildPayload.executionPlan || null,
          followUpPrompt: buildPayload.followUpPrompt || null,
          runtimeExplorationPlan: buildPayload.runtimeExplorationPlan || null,
          projectManifest: buildPayload.projectManifest || null,
          projectFiles: Array.isArray(buildPayload.projectFiles)
            ? buildPayload.projectFiles
            : []
        };
        applyBuildUpdate(nextBuild);
        if (fromWriter) {
          setRequiresProjectFilesResyncBeforeSave(false);
        }
      }
      if (
        buildPayload?.activeRun?.requestId &&
        buildPayload.activeRun.requestId ===
          getCurrentRunRequestId(
            buildPayload.activeRun.requestId,
            latestSharedRunIdentityState
          ) &&
        Number(buildPayload.activeRun.lastActivityAt || 0) > 0
      ) {
        markActiveBuildRunActivity(Number(buildPayload.activeRun.lastActivityAt));
      }
      messages = buildPayload?.chatMessages;
      if (
        buildPayload &&
        Object.prototype.hasOwnProperty.call(buildPayload, 'copilotPolicy')
      ) {
        replaceCopilotPolicy(buildPayload.copilotPolicy || null);
      }
    }
    if (!Array.isArray(messages)) return;

    const currentMessages = getLatestChatMessages();
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || buildId)
    );
    const activeRequestId = getCurrentActiveRunRequestId(
      latestSharedRunIdentityState
    );
    const activeUserMessageId = getCurrentActiveUserMessageId(
      activeRequestId,
      latestSharedRunIdentityState
    );
    const activeAssistantMessageId =
      getCurrentActiveAssistantMessageId(
        activeRequestId,
        latestSharedRunIdentityState
      );
    const activeUserMessage =
      typeof activeUserMessageId === 'number' && activeUserMessageId > 0
        ? currentMessages.find(
            (message) => message.id === activeUserMessageId
          ) || null
        : null;
    const activeAssistantMessage =
      typeof activeAssistantMessageId === 'number' &&
      activeAssistantMessageId > 0
        ? currentMessages.find(
            (message) => message.id === activeAssistantMessageId
          ) || null
        : null;
    const localBillingStateById = new Map<
      number,
      ChatMessage['billingState']
    >();
    for (const message of currentMessages) {
      if (typeof message?.id !== 'number' || message.id <= 0) continue;
      if (message.billingState == null) continue;
      localBillingStateById.set(message.id, message.billingState);
    }
    const normalized = messages.map((entry: any) => ({
      ...entry,
      billingState: localBillingStateById.get(Number(entry?.id || 0)) ?? null,
      persisted: true,
      streamCodePreview: null
    }));
    const nextMessages = options?.preserveLocalMessages
      ? mergePersistedChatMessagesIntoLocalMessages({
          localMessages: currentMessages,
          persistedMessages: normalized,
          activeUserMessage,
          activeAssistantMessageId: activeAssistantMessage?.id || null,
          preserveActiveAssistantState:
            options?.preserveActiveAssistantState === true
        })
      : normalized;
    runIdentity.adoptMessageIds({
      userMessageId: findMatchingBuildChatMessageId({
        messages: nextMessages,
        targetMessage: activeUserMessage
      }),
      assistantMessageId: findMatchingBuildChatMessageId({
        messages: nextMessages,
        targetMessage: activeAssistantMessage,
        activeUserMessage
      })
    });
    replaceChatMessages(nextMessages);
  }

  return {
    syncChatMessagesFromServer
  };
}

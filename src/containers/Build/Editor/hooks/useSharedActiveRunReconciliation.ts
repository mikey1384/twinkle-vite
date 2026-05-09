import { useEffect } from 'react';
import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import {
  chatMessagesEqual,
  mergeChatMessagesWithBuildRun,
  normalizeSharedBuildRunBaseProjectFiles
} from '../helpers/chatMessages';
import { serializedComparableValue } from '../helpers/projectFiles';
import type { ChatMessage } from '../types';
import type {
  BuildRunMode,
  SharedBuildRunIdentityState
} from './useRunIdentity';

interface SharedActiveRunIdentity {
  beginRun(options: {
    requestId: string;
    runMode: BuildRunMode;
    userMessageId?: number | null;
    assistantMessageId?: number | null;
  }): void;
}

interface SharedActiveRunOrchestration {
  hasCurrentPageRunActivity(): boolean;
  clearPendingRunStartEvents(): void;
  isDedupedProcessingInFlight(requestId?: string | null): boolean;
}

interface SharedActiveRunReconciliation {
  recordSharedRunStreamSync(key: string): {
    isInitialSync: boolean;
    didChange: boolean;
  };
  claimSharedRunStatusSync(options: {
    requestId: string;
    status: string;
    assistantStatusStepCount: number;
  }): boolean;
}

interface UseSharedActiveRunReconciliationOptions {
  adoptPersistedBuildRunMessages: (options: {
    userMessageId?: number | null;
    assistantMessageId?: number | null;
    assistantMessageCreatedAt?: number | null;
  }) => void;
  currentSharedRunIdentityState: SharedBuildRunIdentityState | null;
  dedupedProcessingRecoveryStatus: string;
  getCurrentRunRequestId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getLatestChatMessages: () => ChatMessage[];
  markActiveBuildRunActivity: (activityAt?: number | null) => void;
  markCurrentPageRunActivityActive: () => void;
  maybeAutoScrollDuringStream: () => void;
  maybeStartSharedDedupedProcessingRecovery: (requestId: string) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  resetDedupedProcessingReconcileState: () => void;
  runIdentity: SharedActiveRunIdentity;
  runOrchestration: SharedActiveRunOrchestration;
  sharedBuildRun: BuildLiveRunState | null;
  sharedRunReconciliation: SharedActiveRunReconciliation;
}

export default function useSharedActiveRunReconciliation({
  adoptPersistedBuildRunMessages,
  currentSharedRunIdentityState,
  dedupedProcessingRecoveryStatus,
  getCurrentRunRequestId,
  getLatestChatMessages,
  markActiveBuildRunActivity,
  markCurrentPageRunActivityActive,
  maybeAutoScrollDuringStream,
  maybeStartSharedDedupedProcessingRecovery,
  replaceChatMessages,
  resetDedupedProcessingReconcileState,
  runIdentity,
  runOrchestration,
  sharedBuildRun,
  sharedRunReconciliation
}: UseSharedActiveRunReconciliationOptions) {
  useEffect(() => {
    if (!sharedBuildRun?.generating) return;
    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const currentRequestId = getCurrentRunRequestId(
      sharedRequestId,
      currentSharedRunIdentityState
    );
    if (!sharedRequestId || !currentRequestId) return;

    adoptPersistedBuildRunMessages({
      userMessageId: sharedBuildRun.userMessage?.id,
      assistantMessageId: sharedBuildRun.assistantMessage?.id,
      assistantMessageCreatedAt: sharedBuildRun.assistantMessage?.createdAt
    });

    const nextMessages = mergeChatMessagesWithBuildRun({
      persistedMessages: getLatestChatMessages(),
      buildRun: sharedBuildRun
    });
    if (!chatMessagesEqual(getLatestChatMessages(), nextMessages)) {
      replaceChatMessages(nextMessages);
    }

    const nextStreamSyncKey = serializedComparableValue({
      requestId: sharedRequestId,
      userMessage: sharedBuildRun.userMessage
        ? {
            id: sharedBuildRun.userMessage.id,
            role: sharedBuildRun.userMessage.role,
            content: sharedBuildRun.userMessage.content,
            codeGenerated: sharedBuildRun.userMessage.codeGenerated,
            streamCodePreview:
              sharedBuildRun.userMessage.streamCodePreview ?? null,
            createdAt: sharedBuildRun.userMessage.createdAt,
            persisted: Boolean(sharedBuildRun.userMessage.persisted)
          }
        : null,
      assistantMessage: sharedBuildRun.assistantMessage
        ? {
            id: sharedBuildRun.assistantMessage.id,
            role: sharedBuildRun.assistantMessage.role,
            content: sharedBuildRun.assistantMessage.content,
            codeGenerated: sharedBuildRun.assistantMessage.codeGenerated,
            streamCodePreview:
              sharedBuildRun.assistantMessage.streamCodePreview ?? null,
            artifactVersionId:
              sharedBuildRun.assistantMessage.artifactVersionId ?? null,
            createdAt: sharedBuildRun.assistantMessage.createdAt,
            persisted: Boolean(sharedBuildRun.assistantMessage.persisted)
          }
        : null,
      baseProjectFiles: normalizeSharedBuildRunBaseProjectFiles(sharedBuildRun),
      streamingProjectFiles: sharedBuildRun.streamingProjectFiles || null,
      streamingFocusFilePath: sharedBuildRun.streamingFocusFilePath || null,
      runEvents: sharedBuildRun.runEvents || []
    });
    const {
      isInitialSync: isInitialStreamSync,
      didChange: didStreamSyncChange
    } = sharedRunReconciliation.recordSharedRunStreamSync(nextStreamSyncKey);

    if (!currentRequestId || sharedRequestId !== currentRequestId) {
      return;
    }

    if (isInitialStreamSync) {
      if (!runOrchestration.hasCurrentPageRunActivity()) {
        runIdentity.beginRun({
          requestId: sharedRequestId,
          runMode: sharedBuildRun.runMode || 'user',
          userMessageId: sharedBuildRun.userMessage?.id,
          assistantMessageId: sharedBuildRun.assistantMessage?.id
        });
      }
      markCurrentPageRunActivityActive();
      runOrchestration.clearPendingRunStartEvents();
      markActiveBuildRunActivity(sharedBuildRun.updatedAt);
      return;
    }

    if (!didStreamSyncChange) {
      return;
    }

    markActiveBuildRunActivity(sharedBuildRun.updatedAt);
    resetDedupedProcessingReconcileState();
    maybeAutoScrollDuringStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);

  useEffect(() => {
    if (!sharedBuildRun?.generating) return;
    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const currentRequestId = getCurrentRunRequestId(
      sharedRequestId,
      currentSharedRunIdentityState
    );
    if (!sharedRequestId || sharedRequestId !== currentRequestId) return;
    const nextStatus = String(sharedBuildRun.status || '').trim();
    if (!nextStatus) return;
    if (
      !sharedRunReconciliation.claimSharedRunStatusSync({
        requestId: sharedRequestId,
        status: nextStatus,
        assistantStatusStepCount: sharedBuildRun.assistantStatusSteps.length
      })
    ) {
      return;
    }
    if (nextStatus === dedupedProcessingRecoveryStatus) {
      maybeStartSharedDedupedProcessingRecovery(sharedRequestId);
    } else if (
      !(
        nextStatus === 'Stopping...' &&
        runOrchestration.isDedupedProcessingInFlight(sharedRequestId)
      )
    ) {
      resetDedupedProcessingReconcileState();
    }
    markActiveBuildRunActivity(sharedBuildRun.updatedAt);
    maybeAutoScrollDuringStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);
}

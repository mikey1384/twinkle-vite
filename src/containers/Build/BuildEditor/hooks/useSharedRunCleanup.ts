import { useEffect } from 'react';
import type {
  BuildLiveRunMessage,
  BuildLiveRunState
} from '~/contexts/Build/reducer';
import { doChatMessagesRepresentSameBuildMessage } from '../domain/chatMessages';
import {
  normalizeProjectFilesForBuild,
  projectFilesEqual,
  serializedComparableValue
} from '../domain/projectFiles';
import type { ChatMessage } from '../types';

interface SharedRunCleanupReconciliation {
  claimSharedRunReplicaCheck(options: {
    buildId: number;
    updatedAt?: number | null;
  }): boolean;
  resetSharedRunReplicaCheck(): void;
}

interface UseSharedRunCleanupOptions {
  buildId: number;
  chatMessages: ChatMessage[];
  isPostCompleteSyncInFlight: () => boolean;
  loadBuild: (
    buildId: number,
    options?: { fromWriter?: boolean }
  ) => Promise<any>;
  onClearBuildRun: (buildId: number) => void;
  runtimeFollowUpRevision: number;
  sharedBuildRun: BuildLiveRunState | null;
  sharedRunReconciliation: SharedRunCleanupReconciliation;
  shouldHoldTerminalSharedBuildRun: (requestId: string) => boolean;
}

export default function useSharedRunCleanup({
  buildId,
  chatMessages,
  isPostCompleteSyncInFlight,
  loadBuild,
  onClearBuildRun,
  runtimeFollowUpRevision,
  sharedBuildRun,
  sharedRunReconciliation,
  shouldHoldTerminalSharedBuildRun
}: UseSharedRunCleanupOptions) {
  useEffect(() => {
    if (!sharedBuildRun || sharedBuildRun.generating) return;
    const terminalSharedBuildRun = sharedBuildRun;
    if (isPostCompleteSyncInFlight()) {
      return;
    }
    if (shouldHoldTerminalSharedBuildRun(terminalSharedBuildRun.requestId)) {
      return;
    }
    const liveMessages = [
      terminalSharedBuildRun.userMessage,
      terminalSharedBuildRun.assistantMessage
    ].filter((message): message is BuildLiveRunMessage => Boolean(message));
    if (
      liveMessages.some(
        (liveMessage) =>
          !chatMessages.some(
            (message) =>
              message.id === liveMessage.id ||
              doChatMessagesRepresentSameBuildMessage(message, liveMessage)
          )
      )
    ) {
      return;
    }
    const sharedHasRuntimeExplorationPlan = Object.prototype.hasOwnProperty.call(
      terminalSharedBuildRun,
      'runtimeExplorationPlan'
    );
    if (
      !sharedRunReconciliation.claimSharedRunReplicaCheck({
        buildId,
        updatedAt: terminalSharedBuildRun.updatedAt
      })
    ) {
      return;
    }
    let cancelled = false;

    async function maybeClearSharedBuildRun() {
      const sharedHasFollowUpPrompt = Object.prototype.hasOwnProperty.call(
        terminalSharedBuildRun,
        'followUpPrompt'
      );
      const shouldVerifyReplica =
        terminalSharedBuildRun.baseProjectFiles.length > 0 ||
        Object.prototype.hasOwnProperty.call(
          terminalSharedBuildRun,
          'executionPlan'
        ) ||
        Number(
          terminalSharedBuildRun.assistantMessage?.artifactVersionId || 0
        ) > 0 ||
        sharedHasFollowUpPrompt ||
        sharedHasRuntimeExplorationPlan;

      if (shouldVerifyReplica) {
        const buildPayload = await loadBuild(buildId, { fromWriter: true });
        if (cancelled) return;
        if (!buildPayload?.build) {
          sharedRunReconciliation.resetSharedRunReplicaCheck();
          return;
        }
        const replicaProjectFiles = normalizeProjectFilesForBuild(
          Array.isArray(buildPayload.projectFiles)
            ? buildPayload.projectFiles
            : [],
          buildPayload.build.code || ''
        );
        const expectedProjectFiles = normalizeProjectFilesForBuild(
          terminalSharedBuildRun.baseProjectFiles || [],
          terminalSharedBuildRun.assistantMessage?.codeGenerated ??
            buildPayload.build.code ??
            ''
        );
        const hasExpectedProjectFiles = expectedProjectFiles.length > 0;
        const replicaArtifactVersionId =
          Number(buildPayload.build.currentArtifactVersionId || 0) || null;
        const expectedArtifactVersionId =
          Number(
            terminalSharedBuildRun.assistantMessage?.artifactVersionId || 0
          ) || null;
        const hasExpectedExecutionPlan = Object.prototype.hasOwnProperty.call(
          terminalSharedBuildRun,
          'executionPlan'
        );
        const replicaExecutionPlan = buildPayload.executionPlan || null;
        const replicaFollowUpPrompt = buildPayload.followUpPrompt || null;
        const replicaRuntimeExplorationPlan =
          buildPayload.runtimeExplorationPlan || null;

        if (
          (hasExpectedProjectFiles &&
            !projectFilesEqual(replicaProjectFiles, expectedProjectFiles)) ||
          (expectedArtifactVersionId !== null &&
            replicaArtifactVersionId !== expectedArtifactVersionId) ||
          (hasExpectedExecutionPlan &&
            serializedComparableValue(replicaExecutionPlan) !==
              serializedComparableValue(
                terminalSharedBuildRun.executionPlan ?? null
              )) ||
          (sharedHasFollowUpPrompt &&
            serializedComparableValue(replicaFollowUpPrompt) !==
              serializedComparableValue(
                terminalSharedBuildRun.followUpPrompt ?? null
              )) ||
          (sharedHasRuntimeExplorationPlan &&
            serializedComparableValue(replicaRuntimeExplorationPlan) !==
              serializedComparableValue(
                terminalSharedBuildRun.runtimeExplorationPlan ?? null
              ))
        ) {
          sharedRunReconciliation.resetSharedRunReplicaCheck();
          return;
        }
      }

      onClearBuildRun(buildId);
    }

    void maybeClearSharedBuildRun();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, chatMessages, runtimeFollowUpRevision, sharedBuildRun]);
}

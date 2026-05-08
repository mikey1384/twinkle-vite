import { useEffect } from 'react';
import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import type { BuildRuntimeExplorationPlan } from '../../runtimeObservationTypes';
import {
  markBuildContributionWorkspaceEdited,
  markBuildReleaseStatusUnpublished
} from '../domain/branches';
import {
  applyArtifactCodeToProjectFiles,
  normalizeProjectFilesForBuild,
  projectFilesEqual,
  resolveIndexEntryPathFromProjectFiles,
  resolveIndexHtmlFromProjectFiles,
  serializedComparableValue
} from '../domain/projectFiles';
import {
  isBuildAssistantPlaceholderContent,
  normalizeSharedBuildRunBaseProjectFiles
} from '../domain/chatMessages';
import type {
  Build,
  BuildCopilotPolicy,
  BuildExecutionPlan,
  BuildFollowUpPrompt,
  ChatMessage,
  DeferredBuildRequest
} from '../types';
import type {
  BuildRunMode,
  SharedBuildRunIdentityState
} from './useRunIdentity';

interface ApplyGenerateCompleteOptions {
  requestId?: string;
  assistantText?: string;
  artifact?: {
    content?: string;
    id?: number | null;
    versionId?: number | null;
  };
  code?: string | null;
  projectFiles?: Array<{ path: string; content?: string }> | null;
  interruptionReason?: 'tool_limit' | 'energy_depleted' | null;
  executionPlan?: BuildExecutionPlan | null;
  followUpPrompt?: BuildFollowUpPrompt | null;
  deferredBuildRequest?: DeferredBuildRequest | null;
  runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
  runtimePlanRefined?: boolean;
  billingState?: ChatMessage['billingState'];
  requestLimits?: BuildCopilotPolicy['requestLimits'] | null;
  message?: {
    id?: number | null;
    userMessageId?: number | null;
    artifactVersionId?: number | null;
    createdAt?: number;
  };
}

interface UseSharedTerminalRunReconciliationOptions {
  applyBuildUpdate: (build: Build) => void;
  applyGenerateComplete: (
    options: ApplyGenerateCompleteOptions
  ) => void | Promise<void>;
  applyGenerateError: (options: {
    requestId?: string;
    error?: string;
    requestLimits?: BuildCopilotPolicy['requestLimits'] | null;
  }) => void | Promise<void>;
  applyGenerateStopped: (options: {
    requestId?: string;
    runMode?: BuildRunMode;
    assistantText?: string;
    stopReason?: 'user' | 'replacement' | string | null;
  }) => void | Promise<void>;
  currentSharedRunIdentityState: SharedBuildRunIdentityState | null;
  getCurrentActiveRunRequestId: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getLatestBuild: () => Build;
  handledSharedTerminalStateKeyRef: { current: string };
  maybeAutoCaptureBranchThumbnailAfterProgressSave: (
    savedBuild: Build | null | undefined
  ) => void;
  maybeStartNextQueuedRequest: () => void | Promise<void>;
  releaseQueuedRequestsWaitingForStop: (requestId: string) => boolean;
  sharedBuildRun: BuildLiveRunState | null;
  syncAvailableBranchSummary: (build: Build) => void;
}

export default function useSharedTerminalRunReconciliation({
  applyBuildUpdate,
  applyGenerateComplete,
  applyGenerateError,
  applyGenerateStopped,
  currentSharedRunIdentityState,
  getCurrentActiveRunRequestId,
  getLatestBuild,
  handledSharedTerminalStateKeyRef,
  maybeAutoCaptureBranchThumbnailAfterProgressSave,
  maybeStartNextQueuedRequest,
  releaseQueuedRequestsWaitingForStop,
  sharedBuildRun,
  syncAvailableBranchSummary
}: UseSharedTerminalRunReconciliationOptions) {
  useEffect(() => {
    if (
      !sharedBuildRun ||
      sharedBuildRun.generating ||
      !sharedBuildRun.terminalState
    ) {
      return;
    }

    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const activeCurrentPageRequestId = getCurrentActiveRunRequestId(
      currentSharedRunIdentityState
    );
    if (!sharedRequestId || sharedRequestId !== activeCurrentPageRequestId) {
      if (
        sharedRequestId &&
        sharedBuildRun.terminalState &&
        releaseQueuedRequestsWaitingForStop(sharedRequestId)
      ) {
        void Promise.resolve().then(() => maybeStartNextQueuedRequest());
      }
      return;
    }

    const sharedTerminalStateKey = [
      sharedRequestId,
      sharedBuildRun.terminalState
    ].join(':');
    if (handledSharedTerminalStateKeyRef.current === sharedTerminalStateKey) {
      return;
    }
    handledSharedTerminalStateKeyRef.current = sharedTerminalStateKey;

    const normalizedBaseProjectFiles =
      normalizeSharedBuildRunBaseProjectFiles(sharedBuildRun);
    const sharedUserMessage = sharedBuildRun.userMessage;
    const sharedAssistantMessage = sharedBuildRun.assistantMessage;
    const sharedAssistantText = String(
      sharedAssistantMessage?.content || ''
    ).trim();

    if (sharedBuildRun.terminalState === 'complete') {
      const currentBuild = getLatestBuild();
      const shouldApplySharedProjectFiles =
        normalizedBaseProjectFiles.length > 0 &&
        (!currentBuild ||
          !projectFilesEqual(
            currentBuild.projectFiles,
            normalizedBaseProjectFiles
          ));
      void applyGenerateComplete({
        requestId: sharedRequestId,
        assistantText: sharedAssistantText || undefined,
        code: sharedAssistantMessage?.codeGenerated ?? null,
        projectFiles: shouldApplySharedProjectFiles
          ? normalizedBaseProjectFiles
          : null,
        interruptionReason: sharedBuildRun.interruptionReason ?? null,
        executionPlan: sharedBuildRun.executionPlan ?? null,
        followUpPrompt: sharedBuildRun.followUpPrompt ?? null,
        deferredBuildRequest: sharedBuildRun.deferredBuildRequest ?? null,
        runtimeExplorationPlan: sharedBuildRun.runtimeExplorationPlan ?? null,
        runtimePlanRefined: Boolean(sharedBuildRun.runtimePlanRefined),
        billingState:
          sharedAssistantMessage?.billingState ??
          sharedBuildRun.billingState ??
          null,
        requestLimits: sharedBuildRun.requestLimits ?? null,
        message: {
          id: sharedAssistantMessage?.id,
          userMessageId: sharedUserMessage?.id,
          artifactVersionId: sharedAssistantMessage?.artifactVersionId,
          createdAt: sharedAssistantMessage?.createdAt
        }
      });
      return;
    }

    if (sharedBuildRun.terminalState === 'error') {
      void applyGenerateError({
        requestId: sharedRequestId,
        error:
          sharedBuildRun.error ||
          sharedAssistantText ||
          'Failed to generate code.',
        requestLimits: sharedBuildRun.requestLimits ?? null
      });
      return;
    }

    void applyGenerateStopped({
      requestId: sharedRequestId,
      runMode: sharedBuildRun.runMode,
      stopReason: sharedBuildRun.stopReason ?? null,
      assistantText:
        sharedAssistantText &&
        !isBuildAssistantPlaceholderContent(sharedAssistantText)
          ? sharedAssistantMessage?.content
          : undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);

  useEffect(() => {
    if (
      !sharedBuildRun ||
      sharedBuildRun.generating ||
      sharedBuildRun.terminalState !== 'complete'
    ) {
      return;
    }

    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const activeCurrentPageRequestId = getCurrentActiveRunRequestId(
      currentSharedRunIdentityState
    );
    if (sharedRequestId && sharedRequestId === activeCurrentPageRequestId) {
      return;
    }

    const currentBuild = getLatestBuild();
    if (!currentBuild) {
      return;
    }

    const normalizedBaseProjectFiles =
      normalizeSharedBuildRunBaseProjectFiles(sharedBuildRun);
    const sharedArtifactCode =
      typeof sharedBuildRun.assistantMessage?.codeGenerated === 'string'
        ? sharedBuildRun.assistantMessage.codeGenerated
        : null;
    const sharedArtifactVersionId =
      Number(sharedBuildRun.assistantMessage?.artifactVersionId || 0) > 0
        ? Number(sharedBuildRun.assistantMessage?.artifactVersionId)
        : null;
    const sharedHasFollowUpPrompt = Object.prototype.hasOwnProperty.call(
      sharedBuildRun,
      'followUpPrompt'
    );
    const nextFollowUpPrompt = sharedHasFollowUpPrompt
      ? (sharedBuildRun.followUpPrompt ?? null)
      : currentBuild.followUpPrompt ?? null;
    const shouldUpdateFollowUpPrompt =
      sharedHasFollowUpPrompt &&
      serializedComparableValue(currentBuild.followUpPrompt ?? null) !==
        serializedComparableValue(nextFollowUpPrompt);
    const sharedHasRuntimeExplorationPlan = Object.prototype.hasOwnProperty.call(
      sharedBuildRun,
      'runtimeExplorationPlan'
    );
    const nextRuntimeExplorationPlan = sharedHasRuntimeExplorationPlan
      ? (sharedBuildRun.runtimeExplorationPlan ?? null)
      : currentBuild.runtimeExplorationPlan ?? null;
    const shouldUpdateRuntimeExplorationPlan =
      sharedHasRuntimeExplorationPlan &&
      serializedComparableValue(currentBuild.runtimeExplorationPlan ?? null) !==
        serializedComparableValue(nextRuntimeExplorationPlan);

    const hasSharedTerminalWorkspaceSnapshot =
      normalizedBaseProjectFiles.length > 0 ||
      sharedArtifactCode !== null ||
      sharedArtifactVersionId !== null;
    let nextProjectFiles =
      hasSharedTerminalWorkspaceSnapshot &&
      normalizedBaseProjectFiles.length > 0
        ? normalizeProjectFilesForBuild(
            normalizedBaseProjectFiles,
            currentBuild.code || ''
          )
        : currentBuild.projectFiles || [];
    let shouldUpdateProjectFiles =
      hasSharedTerminalWorkspaceSnapshot &&
      normalizedBaseProjectFiles.length > 0 &&
      !projectFilesEqual(currentBuild.projectFiles, nextProjectFiles);

    if (hasSharedTerminalWorkspaceSnapshot && sharedArtifactCode !== null) {
      const nextProjectFilesWithArtifactCode = applyArtifactCodeToProjectFiles({
        projectFiles: nextProjectFiles,
        artifactCode: sharedArtifactCode,
        entryPath: currentBuild.projectManifest?.entryPath || '/index.html'
      });
      if (
        !projectFilesEqual(nextProjectFiles, nextProjectFilesWithArtifactCode)
      ) {
        shouldUpdateProjectFiles = true;
        nextProjectFiles = nextProjectFilesWithArtifactCode;
      }
    }

    const nextCode =
      hasSharedTerminalWorkspaceSnapshot && sharedArtifactCode !== null
        ? sharedArtifactCode
        : hasSharedTerminalWorkspaceSnapshot &&
            normalizedBaseProjectFiles.length > 0
          ? resolveIndexHtmlFromProjectFiles(
              nextProjectFiles,
              currentBuild.code || ''
            )
          : currentBuild.code || null;
    const nextArtifactVersionId =
      hasSharedTerminalWorkspaceSnapshot
        ? sharedArtifactVersionId ?? currentBuild.currentArtifactVersionId ?? null
        : currentBuild.currentArtifactVersionId ?? null;

    if (
      !shouldUpdateProjectFiles &&
      !shouldUpdateRuntimeExplorationPlan &&
      !shouldUpdateFollowUpPrompt &&
      String(currentBuild.code || '') === String(nextCode || '') &&
      Number(currentBuild.currentArtifactVersionId || 0) ===
        Number(nextArtifactVersionId || 0)
    ) {
      return;
    }

    const nextBuild = {
      ...currentBuild,
      code: nextCode,
      currentArtifactVersionId: nextArtifactVersionId,
      followUpPrompt: nextFollowUpPrompt,
      runtimeExplorationPlan: nextRuntimeExplorationPlan,
      projectManifest: shouldUpdateProjectFiles
        ? {
            entryPath: resolveIndexEntryPathFromProjectFiles(
              nextProjectFiles,
              currentBuild.projectManifest?.entryPath || '/index.html'
            ),
            storageMode: 'project-files',
            fileCount: nextProjectFiles.length
          }
        : currentBuild.projectManifest || null,
      projectFiles: shouldUpdateProjectFiles
        ? nextProjectFiles
        : currentBuild.projectFiles
    };
    const workspaceUpdatedBuild = hasSharedTerminalWorkspaceSnapshot
      ? markBuildContributionWorkspaceEdited(nextBuild)
      : nextBuild;
    const appliedBuild = hasSharedTerminalWorkspaceSnapshot
      ? markBuildReleaseStatusUnpublished(workspaceUpdatedBuild)
      : workspaceUpdatedBuild;
    applyBuildUpdate(appliedBuild);
    syncAvailableBranchSummary(appliedBuild);
    if (hasSharedTerminalWorkspaceSnapshot) {
      maybeAutoCaptureBranchThumbnailAfterProgressSave(appliedBuild);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);
}

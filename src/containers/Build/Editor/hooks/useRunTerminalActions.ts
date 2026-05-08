import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import type { BuildRuntimeExplorationPlan } from '../../runtimeObservationTypes';
import {
  markBuildContributionWorkspaceEdited,
  markBuildReleaseStatusUnpublished
} from '../domain/branches';
import {
  normalizeProjectFilePath,
  normalizeProjectFilesForBuild,
  resolveIndexEntryPathFromProjectFiles,
  resolveIndexHtmlFromProjectFiles,
  serializedComparableValue
} from '../domain/projectFiles';
import {
  normalizeBuildChatClientMessageId,
  resolveStoppedRunAssistantMessage
} from '../domain/chatMessages';
import type {
  Build,
  BuildCopilotPolicy,
  BuildExecutionPlan,
  BuildFollowUpPrompt,
  BuildPlanAction,
  BuildPromptBinding,
  BuildRunEvent,
  ChatMessage,
  DeferredBuildRequest,
  MobilePanelTab
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

interface RunTerminalActionsIdentity {
  clearRunOwnership(): void;
  resetRunMode(): void;
  setAssistantMessageId(messageId?: number | null): void;
  getCurrentActiveAssistantMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
}

interface RunTerminalActionsOrchestration {
  setUserRequestedStop(requested: boolean): void;
  setPostCompleteSyncInFlight(inFlight: boolean): void;
  setRequiresProjectFilesResyncBeforeSave(required: boolean): void;
  requiresProjectFilesResyncBeforeSave(): boolean;
  consumeReplacementStop(requestId?: string | null): boolean;
  didUserRequestStop(): boolean;
  hasCurrentPageRunActivity(): boolean;
}

interface RunTerminalActionsRuntimeFollowUp {
  bumpRuntimeFollowUpRevision(): void;
  handleCompletedRunFollowUp(options: {
    completedRunMode: BuildRunMode;
    requestId: string | null;
    artifactVersionId?: number | null;
    generatedCodeSuccessfully: boolean;
    pausedForToolLimit: boolean;
    planWasRefined: boolean;
  }): boolean;
  processPendingRuntimeFollowUp(): boolean;
  resetRuntimeHealthFollowUpState(): void;
}

interface AppendLocalRunEventOptions {
  kind: BuildRunEvent['kind'];
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface UseRunTerminalActionsOptions {
  appendLocalRunEvent: (event: AppendLocalRunEventOptions) => void;
  applyBuildUpdate: (build: Build) => void;
  applyCopilotRequestLimitsSnapshot: (
    requestLimits: BuildCopilotPolicy['requestLimits'] | null | undefined
  ) => void;
  beginDedupedProcessingRecovery: (requestId: string) => void;
  clearCurrentPageRunActivity: () => void;
  dedupedProcessingRecoveryStatus: string;
  enqueueLatestBuildRequest: (
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
      stopActiveRun?: boolean;
      stopRequestId?: string | null;
    }
  ) => void;
  getActiveBuildId: () => number;
  getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null;
  getCurrentActiveAssistantMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentActiveUserMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentRunMode: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => BuildRunMode;
  getCurrentRunRequestId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getLatestBuild: () => Build;
  getLatestBuildRun: (buildId: number) => BuildLiveRunState | null;
  getLatestChatMessages: () => ChatMessage[];
  markActiveBuildRunActivity: (activityAt?: number | null) => void;
  markCurrentPageRunActivityActive: () => void;
  maybeAutoCaptureBranchThumbnailAfterProgressSave: (
    savedBuild: Build | null | undefined
  ) => void;
  maybeStartNextQueuedRequest: () => void | Promise<void>;
  onCompleteBuildRun: (options: Record<string, any>) => void;
  onFailBuildRun: (options: Record<string, any>) => void;
  onStopBuildRun: (options: Record<string, any>) => void;
  onUpdateBuildRunStatus: (options: {
    buildId?: number;
    requestId: string;
    status: string;
  }) => void;
  releaseQueuedRequestsIfStopTargetAlreadySettled: (
    requestId: string
  ) => boolean;
  releaseQueuedRequestsWaitingForStop: (requestId: string) => boolean;
  removeLocalMessagesByIdentity: (options: {
    ids?: Array<number | null | undefined>;
    clientMessageIds?: Array<string | null | undefined>;
  }) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  resetDedupedProcessingReconcileState: () => void;
  runIdentity: RunTerminalActionsIdentity;
  runOrchestration: RunTerminalActionsOrchestration;
  runtimeFollowUp: RunTerminalActionsRuntimeFollowUp;
  scrollChatToBottom: (behavior?: ScrollBehavior) => void;
  setMobilePanelTab: (tab: MobilePanelTab) => void;
  syncAvailableBranchSummary: (build: Build) => void;
  syncChatMessagesFromServer: (
    serverMessages?: any[],
    fromWriter?: boolean,
    options?: {
      preserveLocalMessages?: boolean;
      preserveActiveAssistantState?: boolean;
    }
  ) => Promise<void>;
  upsertLocalBuildChatAssistantMessage: (
    messageId: number | null,
    text: string
  ) => number | null;
}

export default function useRunTerminalActions({
  appendLocalRunEvent,
  applyBuildUpdate,
  applyCopilotRequestLimitsSnapshot,
  beginDedupedProcessingRecovery,
  clearCurrentPageRunActivity,
  dedupedProcessingRecoveryStatus,
  enqueueLatestBuildRequest,
  getActiveBuildId,
  getBuildRunIdentity,
  getCurrentActiveAssistantMessageId,
  getCurrentActiveUserMessageId,
  getCurrentRunMode,
  getCurrentRunRequestId,
  getLatestBuild,
  getLatestBuildRun,
  getLatestChatMessages,
  markActiveBuildRunActivity,
  markCurrentPageRunActivityActive,
  maybeAutoCaptureBranchThumbnailAfterProgressSave,
  maybeStartNextQueuedRequest,
  onCompleteBuildRun,
  onFailBuildRun,
  onStopBuildRun,
  onUpdateBuildRunStatus,
  releaseQueuedRequestsIfStopTargetAlreadySettled,
  releaseQueuedRequestsWaitingForStop,
  removeLocalMessagesByIdentity,
  replaceChatMessages,
  resetDedupedProcessingReconcileState,
  runIdentity,
  runOrchestration,
  runtimeFollowUp,
  scrollChatToBottom,
  setMobilePanelTab,
  syncAvailableBranchSummary,
  syncChatMessagesFromServer,
  upsertLocalBuildChatAssistantMessage
}: UseRunTerminalActionsOptions) {
  async function applyGenerateComplete(options: ApplyGenerateCompleteOptions) {
    const {
      requestId,
      assistantText,
      artifact,
      code,
      projectFiles,
      interruptionReason,
      executionPlan,
      followUpPrompt,
      deferredBuildRequest,
      runtimeExplorationPlan,
      runtimePlanRefined,
      billingState,
      requestLimits,
      message
    } = options;
    const latestSharedRunIdentityState = getBuildRunIdentity(getActiveBuildId());
    const currentRequestId = getCurrentRunRequestId(
      requestId,
      latestSharedRunIdentityState
    );
    if (!requestId || requestId !== currentRequestId) return;
    markActiveBuildRunActivity();
    resetDedupedProcessingReconcileState();
    applyCopilotRequestLimitsSnapshot(requestLimits);
    const completedRunMode = getCurrentRunMode(
      requestId,
      latestSharedRunIdentityState
    );
    const userMessageTempId = getCurrentActiveUserMessageId(
      requestId,
      latestSharedRunIdentityState
    );
    const assistantId = getCurrentActiveAssistantMessageId(
      requestId,
      latestSharedRunIdentityState
    );
    const currentMessages = getLatestChatMessages();
    const artifactCode = artifact?.content ?? code ?? null;
    const payloadProjectFiles = Array.isArray(projectFiles)
      ? normalizeProjectFilesForBuild(
          projectFiles,
          artifactCode ?? getLatestBuild()?.code ?? ''
        )
      : null;
    const artifactVersionId =
      message?.artifactVersionId ?? artifact?.versionId ?? null;
    const createdAt = message?.createdAt ?? Math.floor(Date.now() / 1000);
    const hasFollowUpPromptField = Object.prototype.hasOwnProperty.call(
      options,
      'followUpPrompt'
    );
    const hasRuntimeExplorationPlanField = Object.prototype.hasOwnProperty.call(
      options,
      'runtimeExplorationPlan'
    );
    const persistedAssistantId =
      typeof message?.id === 'number' && message.id > 0 ? message.id : null;
    const persistedUserId =
      typeof message?.userMessageId === 'number' && message.userMessageId > 0
        ? message.userMessageId
        : null;
    onCompleteBuildRun({
      requestId,
      assistantText,
      artifactCode,
      projectFiles: payloadProjectFiles,
      executionPlan,
      followUpPrompt: hasFollowUpPromptField
        ? (followUpPrompt ?? null)
        : undefined,
      runtimeExplorationPlan,
      runtimePlanRefined,
      billingState,
      artifactVersionId,
      persistedAssistantId,
      persistedUserId,
      createdAt,
      workspaceChanged:
        artifactCode !== null ||
        (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0)
    });
    let nextMessages = currentMessages.map((entry) => {
      if (
        userMessageTempId &&
        persistedUserId &&
        entry.id === userMessageTempId
      ) {
        return { ...entry, id: persistedUserId, persisted: true };
      }
      if (assistantId && entry.id === assistantId) {
        return {
          ...entry,
          id: persistedAssistantId || entry.id,
          persisted: Boolean(persistedAssistantId),
          content: assistantText || entry.content,
          codeGenerated: artifactCode,
          billingState: billingState ?? null,
          streamCodePreview: null,
          artifactVersionId,
          createdAt
        };
      }
      return entry;
    });

    if (!assistantId) {
      nextMessages = [
        ...nextMessages,
        {
          id: persistedAssistantId || Date.now(),
          role: 'assistant' as const,
          content: assistantText || '',
          codeGenerated: artifactCode,
          billingState: billingState ?? null,
          streamCodePreview: null,
          artifactVersionId,
          createdAt,
          persisted: Boolean(persistedAssistantId)
        }
      ];
    }

    replaceChatMessages(nextMessages);

    if (artifactCode !== null || payloadProjectFiles) {
      const activeBuild = getLatestBuild();
      if (activeBuild) {
        let completionUsedFallbackProjectFiles = false;
        let nextProjectFiles = payloadProjectFiles
          ? payloadProjectFiles
          : normalizeProjectFilesForBuild(
              activeBuild.projectFiles || [],
              activeBuild.code || ''
            );
        if (!payloadProjectFiles && artifactCode !== null) {
          completionUsedFallbackProjectFiles = true;
          const entryPath = resolveIndexEntryPathFromProjectFiles(
            nextProjectFiles,
            activeBuild.projectManifest?.entryPath || '/index.html'
          );
          const entryLookupPath =
            normalizeProjectFilePath(entryPath).toLowerCase();
          let updatedEntry = false;
          nextProjectFiles = nextProjectFiles.map((file) => {
            if (
              normalizeProjectFilePath(file.path).toLowerCase() !==
              entryLookupPath
            ) {
              return file;
            }
            updatedEntry = true;
            return {
              ...file,
              content: artifactCode,
              sizeBytes: artifactCode.length
            };
          });
          if (!updatedEntry) {
            nextProjectFiles = normalizeProjectFilesForBuild(
              [...nextProjectFiles, { path: entryPath, content: artifactCode }],
              artifactCode
            );
          }
        }
        const resolvedCode =
          artifactCode !== null
            ? artifactCode
            : resolveIndexHtmlFromProjectFiles(
                nextProjectFiles,
                activeBuild.code || ''
              );
        const nextBuild = {
          ...activeBuild,
          code: resolvedCode,
          primaryArtifactId: artifact?.id ?? activeBuild.primaryArtifactId,
          currentArtifactVersionId:
            artifactVersionId ?? activeBuild.currentArtifactVersionId ?? null,
          executionPlan:
            executionPlan !== undefined
              ? executionPlan || null
              : activeBuild.executionPlan || null,
          followUpPrompt: hasFollowUpPromptField
            ? followUpPrompt || null
            : activeBuild.followUpPrompt || null,
          runtimeExplorationPlan: hasRuntimeExplorationPlanField
            ? runtimeExplorationPlan || null
            : activeBuild.runtimeExplorationPlan || null,
          projectManifest: {
            entryPath: resolveIndexEntryPathFromProjectFiles(
              nextProjectFiles,
              activeBuild.projectManifest?.entryPath || '/index.html'
            ),
            storageMode: 'project-files',
            fileCount: nextProjectFiles.length
          },
          projectFiles: nextProjectFiles
        };
        const appliedBuild = markBuildReleaseStatusUnpublished(
          markBuildContributionWorkspaceEdited(nextBuild)
        );
        applyBuildUpdate(appliedBuild);
        syncAvailableBranchSummary(appliedBuild);
        maybeAutoCaptureBranchThumbnailAfterProgressSave(appliedBuild);
        if (payloadProjectFiles) {
          runOrchestration.setRequiresProjectFilesResyncBeforeSave(false);
        } else if (completionUsedFallbackProjectFiles) {
          runOrchestration.setRequiresProjectFilesResyncBeforeSave(true);
        }
      }
    } else if (
      getLatestBuild() &&
      ((executionPlan !== undefined &&
        getLatestBuild().executionPlan !== (executionPlan || null)) ||
        (hasFollowUpPromptField &&
          getLatestBuild().followUpPrompt !== (followUpPrompt || null)) ||
        (hasRuntimeExplorationPlanField &&
          serializedComparableValue(
            getLatestBuild().runtimeExplorationPlan ?? null
          ) !== serializedComparableValue(runtimeExplorationPlan || null)))
    ) {
      const nextBuild = {
        ...getLatestBuild(),
        executionPlan:
          executionPlan !== undefined
            ? executionPlan || null
            : getLatestBuild().executionPlan || null,
        followUpPrompt: hasFollowUpPromptField
          ? followUpPrompt || null
          : getLatestBuild().followUpPrompt || null,
        runtimeExplorationPlan: hasRuntimeExplorationPlanField
          ? runtimeExplorationPlan || null
          : getLatestBuild().runtimeExplorationPlan || null
      };
      applyBuildUpdate(nextBuild);
    }
    const generatedCodeSuccessfully =
      artifactCode !== null ||
      (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0);
    const pausedForToolLimit = interruptionReason === 'tool_limit';
    const planWasRefined = Boolean(runtimePlanRefined && runtimeExplorationPlan);
    if (generatedCodeSuccessfully || planWasRefined) {
      setMobilePanelTab('preview');
    } else {
      setMobilePanelTab('chat');
    }
    const shouldDelayQueuedRequestsForRuntimeFollowUp =
      runtimeFollowUp.handleCompletedRunFollowUp({
        completedRunMode,
        requestId: requestId || null,
        artifactVersionId,
        generatedCodeSuccessfully,
        pausedForToolLimit,
        planWasRefined
      });

    runIdentity.clearRunOwnership();
    runOrchestration.setUserRequestedStop(false);
    clearCurrentPageRunActivity();
    runIdentity.resetRunMode();
    scrollChatToBottom();
    runOrchestration.setPostCompleteSyncInFlight(true);
    runtimeFollowUp.bumpRuntimeFollowUpRevision();
    try {
      await syncChatMessagesFromServer(undefined, true);
      runOrchestration.setRequiresProjectFilesResyncBeforeSave(false);
    } catch (error) {
      console.error('Failed to sync chat messages after completion:', error);
      if (runOrchestration.requiresProjectFilesResyncBeforeSave()) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'completed',
          message:
            'Build completed, but project file sync is pending. Save is temporarily blocked until a refresh succeeds.',
          targetRequestId: requestId || null
        });
      }
    } finally {
      runOrchestration.setPostCompleteSyncInFlight(false);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
    }
    if (runtimeFollowUp.processPendingRuntimeFollowUp()) {
      return;
    }
    let shouldHoldQueuedRequestForDeferredStop = false;
    if (deferredBuildRequest?.message?.trim()) {
      const deferredStopRequestId =
        String(deferredBuildRequest.stopRequestId || '').trim() || null;
      shouldHoldQueuedRequestForDeferredStop = Boolean(
        deferredBuildRequest.stopActiveRun === true && deferredStopRequestId
      );
      enqueueLatestBuildRequest(deferredBuildRequest.message, {
        messageContext: deferredBuildRequest.messageContext || null,
        planAction: deferredBuildRequest.planAction || null,
        stopActiveRun: deferredBuildRequest.stopActiveRun === true,
        stopRequestId: deferredStopRequestId
      });
      if (
        shouldHoldQueuedRequestForDeferredStop &&
        deferredStopRequestId &&
        releaseQueuedRequestsIfStopTargetAlreadySettled(deferredStopRequestId)
      ) {
        shouldHoldQueuedRequestForDeferredStop = false;
      }
    }
    if (
      !shouldDelayQueuedRequestsForRuntimeFollowUp &&
      !shouldHoldQueuedRequestForDeferredStop
    ) {
      await maybeStartNextQueuedRequest();
    }
  }

  async function applyGenerateError({
    requestId,
    error,
    requestLimits
  }: {
    requestId?: string;
    error?: string;
    requestLimits?: BuildCopilotPolicy['requestLimits'] | null;
  }) {
    const latestSharedRunIdentityState = getBuildRunIdentity(getActiveBuildId());
    const currentRequestId = getCurrentRunRequestId(
      requestId,
      latestSharedRunIdentityState
    );
    if (!requestId || requestId !== currentRequestId) return;
    markActiveBuildRunActivity();
    resetDedupedProcessingReconcileState();
    runtimeFollowUp.resetRuntimeHealthFollowUpState();
    const assistantId = getCurrentActiveAssistantMessageId(
      requestId,
      latestSharedRunIdentityState
    );
    const errorMessage = error || 'Failed to generate code.';
    const shouldPreserveAssistantArtifacts = Boolean(
      assistantId &&
        getLatestChatMessages().some(
          (entry) =>
            entry.id === assistantId &&
            entry.role === 'assistant' &&
            (Number(entry.artifactVersionId || 0) > 0 ||
              (typeof entry.codeGenerated === 'string' &&
                entry.codeGenerated.trim().length > 0))
        )
    );
    applyCopilotRequestLimitsSnapshot(requestLimits);
    if (!shouldPreserveAssistantArtifacts) {
      const nextAssistantId = upsertLocalBuildChatAssistantMessage(
        assistantId,
        errorMessage
      );
      if (nextAssistantId) {
        runIdentity.setAssistantMessageId(nextAssistantId);
      }
    }
    onFailBuildRun({
      requestId,
      error: errorMessage,
      assistantText: errorMessage,
      preserveAssistantArtifactsOnError: shouldPreserveAssistantArtifacts,
      preserveTransientUserMessage: true,
      preserveTransientAssistantMessage: true
    });
    setMobilePanelTab('chat');
    clearCurrentPageRunActivity();
    runOrchestration.setPostCompleteSyncInFlight(true);
    runtimeFollowUp.bumpRuntimeFollowUpRevision();
    try {
      await syncChatMessagesFromServer(undefined, true, {
        preserveLocalMessages: true
      });
    } catch (syncError) {
      console.error('Failed to sync chat messages after error:', syncError);
    } finally {
      runOrchestration.setPostCompleteSyncInFlight(false);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
    }
    runIdentity.clearRunOwnership();
    runOrchestration.setUserRequestedStop(false);
    runIdentity.resetRunMode();
    scrollChatToBottom();
    void Promise.resolve().then(() => maybeStartNextQueuedRequest());
  }

  async function applyGenerateStopped({
    requestId,
    deduped,
    guardStatus,
    runMode,
    assistantText,
    stopReason
  }: {
    requestId?: string;
    deduped?: boolean;
    guardStatus?: 'processing' | 'completed' | 'conflict';
    runMode?: BuildRunMode;
    assistantText?: string;
    stopReason?: 'user' | 'replacement' | string | null;
  }) {
    const normalizedRequestId = String(requestId || '').trim();
    const releasedQueuedStop =
      guardStatus !== 'processing'
        ? releaseQueuedRequestsWaitingForStop(normalizedRequestId)
        : false;
    const latestSharedRunIdentityState = getBuildRunIdentity(getActiveBuildId());
    const currentRequestId = getCurrentRunRequestId(
      normalizedRequestId,
      latestSharedRunIdentityState
    );
    if (!normalizedRequestId || normalizedRequestId !== currentRequestId) {
      if (releasedQueuedStop) {
        await maybeStartNextQueuedRequest();
      }
      return;
    }
    markActiveBuildRunActivity();
    const stoppedRunMode =
      runMode ||
      getCurrentRunMode(normalizedRequestId, latestSharedRunIdentityState);
    const queuedReplacementStop =
      runOrchestration.consumeReplacementStop(normalizedRequestId);
    const isReplacementStop =
      stopReason === 'replacement' || queuedReplacementStop;
    const normalizedStopReason =
      isReplacementStop ? 'replacement' : stopReason === 'user' ? 'user' : null;
    const userRequestedStop = runOrchestration.didUserRequestStop();
    if (deduped) {
      resetDedupedProcessingReconcileState();
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      let shouldStartQueuedRequest = true;
      if (guardStatus === 'completed') {
        runOrchestration.setUserRequestedStop(false);
        try {
          await syncChatMessagesFromServer(undefined, true);
        } catch (error) {
          console.error(
            'Failed to sync chat messages after deduped completed stop:',
            error
          );
        } finally {
          runIdentity.clearRunOwnership();
        }
      } else if (guardStatus === 'processing') {
        runOrchestration.setUserRequestedStop(userRequestedStop);
        // Keep request refs live and recover through canonical shared replay.
        shouldStartQueuedRequest = false;
        if (!userRequestedStop && !isReplacementStop) {
          const nextAssistantId = upsertLocalBuildChatAssistantMessage(
            getCurrentActiveAssistantMessageId(
              normalizedRequestId,
              latestSharedRunIdentityState
            ),
            'I lost the live response for this run, but another Lumine worker still reports it in progress. I am trying to recover the latest result.'
          );
          if (nextAssistantId) {
            runIdentity.setAssistantMessageId(nextAssistantId);
          }
        }
        markCurrentPageRunActivityActive();
        onUpdateBuildRunStatus({
          requestId: normalizedRequestId,
          status: isReplacementStop
            ? 'Switching to your latest request...'
            : userRequestedStop
              ? 'Stopping...'
              : dedupedProcessingRecoveryStatus
        });
        setMobilePanelTab('chat');
        scrollChatToBottom();
        beginDedupedProcessingRecovery(normalizedRequestId);
        return;
      } else {
        runOrchestration.setUserRequestedStop(false);
        try {
          await syncChatMessagesFromServer(undefined, true);
        } catch (error) {
          console.error(
            'Failed to sync chat messages after deduped stop:',
            error
          );
        } finally {
          runIdentity.clearRunOwnership();
        }
      }
      clearCurrentPageRunActivity();
      onStopBuildRun({
        requestId: normalizedRequestId,
        stopReason: normalizedStopReason,
        preserveTransientUserMessage: true,
        preserveTransientAssistantMessage: !isReplacementStop
      });
      setMobilePanelTab('chat');
      runIdentity.resetRunMode();
      scrollChatToBottom();
      if (shouldStartQueuedRequest) {
        await maybeStartNextQueuedRequest();
      }
      return;
    }
    runOrchestration.setUserRequestedStop(false);
    resetDedupedProcessingReconcileState();
    runtimeFollowUp.resetRuntimeHealthFollowUpState();
    if (isReplacementStop) {
      const latestBuildRun = getLatestBuildRun(getActiveBuildId());
      const replacementAssistantMessage =
        String(latestBuildRun?.requestId || '').trim() === normalizedRequestId
          ? latestBuildRun?.assistantMessage || null
          : null;
      const replacementAssistantMessageId = getCurrentActiveAssistantMessageId(
        normalizedRequestId,
        latestSharedRunIdentityState
      );
      const localReplacementAssistantMessageId =
        runIdentity.getCurrentActiveAssistantMessageId(
          normalizedRequestId,
          null,
          runOrchestration.hasCurrentPageRunActivity()
        );
      const replacementAssistantClientMessageId =
        normalizeBuildChatClientMessageId(
          replacementAssistantMessage?.clientMessageId ||
            getLatestChatMessages().find(
              (message) =>
                message.role === 'assistant' &&
                (message.id === replacementAssistantMessageId ||
                  message.id === localReplacementAssistantMessageId)
            )?.clientMessageId
        );
      onStopBuildRun({
        requestId: normalizedRequestId,
        stopReason: 'replacement',
        preserveTransientUserMessage: true
      });
      removeLocalMessagesByIdentity({
        ids: [
          replacementAssistantMessageId,
          localReplacementAssistantMessageId,
          replacementAssistantMessage?.id
        ],
        clientMessageIds: [replacementAssistantClientMessageId]
      });
      setMobilePanelTab('chat');
      clearCurrentPageRunActivity();
      runIdentity.resetRunMode();
      runOrchestration.setPostCompleteSyncInFlight(true);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
      try {
        await syncChatMessagesFromServer(undefined, true, {
          preserveLocalMessages: true
        });
      } catch (error) {
        console.error(
          'Failed to sync chat messages after replacement stop:',
          error
        );
      } finally {
        runOrchestration.setPostCompleteSyncInFlight(false);
        runtimeFollowUp.bumpRuntimeFollowUpRevision();
      }
      runIdentity.clearRunOwnership();
      await maybeStartNextQueuedRequest();
      return;
    }
    const stopMessage =
      typeof assistantText === 'string' && assistantText.trim().length > 0
        ? assistantText
        : resolveStoppedRunAssistantMessage({
            runMode: stoppedRunMode,
            userRequestedStop
          });
    const nextAssistantId = upsertLocalBuildChatAssistantMessage(
      getCurrentActiveAssistantMessageId(
        normalizedRequestId,
        latestSharedRunIdentityState
      ),
      stopMessage
    );
    if (nextAssistantId) {
      runIdentity.setAssistantMessageId(nextAssistantId);
    }
    onStopBuildRun({
      requestId: normalizedRequestId,
      assistantText: stopMessage,
      stopReason: normalizedStopReason,
      preserveTransientUserMessage: true,
      preserveTransientAssistantMessage: true
    });
    setMobilePanelTab('chat');
    clearCurrentPageRunActivity();
    runIdentity.resetRunMode();
    runOrchestration.setPostCompleteSyncInFlight(true);
    runtimeFollowUp.bumpRuntimeFollowUpRevision();
    try {
      await syncChatMessagesFromServer(undefined, true, {
        preserveLocalMessages: true
      });
    } catch (error) {
      console.error('Failed to sync chat messages after stop:', error);
    } finally {
      runOrchestration.setPostCompleteSyncInFlight(false);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
    }
    runIdentity.clearRunOwnership();
    scrollChatToBottom();
    await maybeStartNextQueuedRequest();
  }

  return {
    applyGenerateComplete,
    applyGenerateError,
    applyGenerateStopped
  };
}

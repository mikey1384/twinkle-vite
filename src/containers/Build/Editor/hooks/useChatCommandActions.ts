import { socket } from '~/constants/sockets/api';
import {
  buildFollowUpAcceptPromptBinding,
  buildScopedPlanContinuePromptBinding,
  resolveBuildFollowUpPromptKey
} from '../domain/promptBindings';
import {
  formatTrailingRuntimeObservationMessageContext,
  mergeHiddenBuildMessageContext
} from '../domain/chatMessages';
import type {
  Build,
  BuildPlanAction,
  BuildPromptBinding,
  ChatMessage,
  CurrentBuildRunView
} from '../types';
import type { SharedBuildRunIdentityState } from './useRunIdentity';

interface ChatCommandRuntimeFollowUp {
  hasPendingRuntimeFollowUp(): boolean;
  removeRuntimeObservationChatNote(messageId: number): void;
  resetRuntimeHealthFollowUpState(): void;
}

interface ChatCommandRunOrchestration {
  isDedupedProcessingInFlight(requestId?: string | null): boolean;
  setUserRequestedStop(requested: boolean): void;
  markReplacementStop(requestId?: string | null): void;
}

interface UseChatCommandActionsOptions {
  build: Build;
  buildChatUploadInFlight: boolean;
  currentBuildIsContributionFork: boolean;
  currentBuildRunView: CurrentBuildRunView;
  deleteBuildChatMessage: (options: Record<string, any>) => Promise<any>;
  enqueueLatestBuildRequest: (
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ) => void;
  getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null;
  getCurrentPageRunActivityRequestId: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getLatestBuild: () => Build;
  handleBuildWorkspaceCommunicationModeChange: (
    communicationMode: 'lumine' | 'people' | 'versions'
  ) => void;
  handlePendingBuildChatUploadMessage: (
    trimmedMessage: string
  ) => Promise<boolean | null>;
  isOwner: boolean;
  isRunActivityInFlight: (options?: {
    includeBootstrap?: boolean;
    sharedRunState?: SharedBuildRunIdentityState | null;
  }) => boolean;
  mergedChatMessages: ChatMessage[];
  navigate: (path: string, options?: Record<string, any>) => void;
  onUpdateBuildRunStatus: (options: {
    requestId: string;
    status: string;
  }) => void;
  removeDeletedBuildRunMessage: (message: ChatMessage) => void;
  requestStopForRecoveredBuildRun: (
    requestId: string,
    stopReason?: 'user' | 'replacement'
  ) => void;
  runOrchestration: ChatCommandRunOrchestration;
  runtimeFollowUp: ChatCommandRuntimeFollowUp;
  scheduleDedupedProcessingReconcile: (requestId: string) => void;
  scrollChatToBottom: (behavior?: ScrollBehavior) => void;
  setDismissedFollowUpPromptKey: (key: string) => void;
  setMobilePanelTab: (tab: 'chat' | 'preview') => void;
  startGeneration: (
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ) => Promise<boolean>;
  syncChatMessagesFromServer: (
    serverMessages?: any[],
    fromWriter?: boolean,
    options?: {
      preserveLocalMessages?: boolean;
      preserveActiveAssistantState?: boolean;
    }
  ) => Promise<void>;
  userId: number;
}

export default function useChatCommandActions({
  build,
  buildChatUploadInFlight,
  currentBuildIsContributionFork,
  currentBuildRunView,
  deleteBuildChatMessage,
  enqueueLatestBuildRequest,
  getBuildRunIdentity,
  getCurrentPageRunActivityRequestId,
  getLatestBuild,
  handleBuildWorkspaceCommunicationModeChange,
  handlePendingBuildChatUploadMessage,
  isOwner,
  isRunActivityInFlight,
  mergedChatMessages,
  navigate,
  onUpdateBuildRunStatus,
  removeDeletedBuildRunMessage,
  requestStopForRecoveredBuildRun,
  runOrchestration,
  runtimeFollowUp,
  scheduleDedupedProcessingReconcile,
  scrollChatToBottom,
  setDismissedFollowUpPromptKey,
  setMobilePanelTab,
  startGeneration,
  syncChatMessagesFromServer,
  userId
}: UseChatCommandActionsOptions) {
  async function handleSendMessage(messageText: string) {
    return await sendBuildMessageText(messageText);
  }

  async function handleAskLumineToResolveMergeConflicts(paths: string[] = []) {
    const rootBuildId = Number(build.contributionRootBuildId || 0);
    const requesterOwnsRootBuild =
      currentBuildIsContributionFork &&
      rootBuildId > 0 &&
      Number(build.rootBuildUserId || 0) === Number(userId || 0);
    const canResolveFromMainProject =
      requesterOwnsRootBuild &&
      String(build.contributionStatus || '').trim() === 'merging';
    if (!isOwner && !canResolveFromMainProject) return false;
    const normalizedPaths = Array.from(
      new Set(
        (Array.isArray(paths) ? paths : [])
          .map((path) => String(path || '').trim())
          .filter(Boolean)
      )
    );
    const pathsText =
      normalizedPaths.length > 0
        ? ` in ${normalizedPaths.join(', ')}`
        : '';
    const prompt = [
      `Please resolve the merge conflict markers${pathsText}.`,
      'First inspect the conflict and decide whether it is a mechanical code merge or a product decision.',
      'For mechanical conflicts, keep the intended changes from both Current Build and Contribution, remove every <<<<<<< Current Build / ======= / >>>>>>> Contribution marker, and make sure the app still runs.',
      'If the conflict changes product identity, core gameplay, main workflow, data model, or requires choosing between mutually exclusive features, do not guess or edit yet. Ask the owner clear questions until the intended direction is unambiguous, then resolve the markers.'
    ].join(' ');
    if (!isOwner) {
      navigate(`/build/${rootBuildId}`, {
        state: {
          initialPrompt: prompt,
          forceInitialPrompt: true
        }
      });
      return true;
    }
    handleBuildWorkspaceCommunicationModeChange('lumine');
    return await sendBuildMessageText(prompt);
  }

  async function handleContinueScopedPlan() {
    if (!isOwner) return;
    const promptBinding = buildScopedPlanContinuePromptBinding(
      currentBuildRunView.executionPlan
    );
    if (!promptBinding) return;
    await sendBuildMessageText('Continue current plan.', {
      planAction: 'continue',
      promptBinding
    });
  }

  async function handleCancelScopedPlan() {
    if (!isOwner) return;
    await sendBuildMessageText('Stop current plan.', {
      planAction: 'cancel'
    });
  }

  async function handleAcceptFollowUpPrompt() {
    if (!isOwner) return;
    const promptBinding = buildFollowUpAcceptPromptBinding(
      currentBuildRunView.followUpPrompt
    );
    if (!promptBinding) return;
    await sendBuildMessageText(promptBinding.suggestedMessage, {
      promptBinding
    });
  }

  function handleDismissFollowUpPrompt() {
    const nextKey = resolveBuildFollowUpPromptKey(
      currentBuildRunView.followUpPrompt
    );
    if (!nextKey) return;
    setDismissedFollowUpPromptKey(nextKey);
  }

  async function sendBuildMessageText(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
      ignoreUploadInFlight?: boolean;
    }
  ) {
    const trimmedMessage = String(messageText || '').trim();
    if (
      !trimmedMessage ||
      !isOwner ||
      (buildChatUploadInFlight && options?.ignoreUploadInFlight !== true)
    ) {
      return false;
    }
    const trailingRuntimeObservationMessageContext =
      formatTrailingRuntimeObservationMessageContext(mergedChatMessages);
    const enrichedMessageContext = mergeHiddenBuildMessageContext(
      options?.messageContext,
      trailingRuntimeObservationMessageContext
    );
    const requestOptions =
      enrichedMessageContext || options
        ? {
            ...options,
            messageContext: enrichedMessageContext || null
          }
        : undefined;
    const uploadClarificationHandled =
      await handlePendingBuildChatUploadMessage(trimmedMessage);
    if (uploadClarificationHandled !== null) {
      return uploadClarificationHandled;
    }

    if (
      isRunActivityInFlight() ||
      runtimeFollowUp.hasPendingRuntimeFollowUp()
    ) {
      enqueueLatestBuildRequest(trimmedMessage, requestOptions);
      return true;
    }

    const started = await startGeneration(trimmedMessage, requestOptions);
    if (!started) {
      if (
        isRunActivityInFlight({
          sharedRunState: getBuildRunIdentity(
            Number(getLatestBuild()?.id || build.id)
          )
        })
      ) {
        enqueueLatestBuildRequest(trimmedMessage, requestOptions);
        return true;
      }
      return false;
    }
    return true;
  }

  function handleStopGeneration(options?: {
    stopReason?: 'user' | 'replacement';
  }) {
    const requestId = getCurrentPageRunActivityRequestId(
      getBuildRunIdentity(Number(getLatestBuild()?.id || build.id))
    );
    if (!requestId || !isOwner) {
      return;
    }
    const stopReason =
      options?.stopReason === 'replacement' ? 'replacement' : 'user';
    if (runOrchestration.isDedupedProcessingInFlight()) {
      runOrchestration.setUserRequestedStop(stopReason !== 'replacement');
      if (stopReason === 'replacement') {
        runOrchestration.markReplacementStop(requestId);
      }
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      onUpdateBuildRunStatus({
        requestId,
        status:
          stopReason === 'replacement'
            ? 'Switching to your latest request...'
            : 'Stopping...'
      });
      setMobilePanelTab('chat');
      scrollChatToBottom();
      requestStopForRecoveredBuildRun(requestId, stopReason);
      scheduleDedupedProcessingReconcile(requestId);
      return;
    }
    runOrchestration.setUserRequestedStop(stopReason !== 'replacement');
    if (stopReason === 'replacement') {
      runOrchestration.markReplacementStop(requestId);
    }
    onUpdateBuildRunStatus({
      requestId,
      status:
        stopReason === 'replacement'
          ? 'Switching to your latest request...'
          : 'Stopping...'
    });
    socket.emit('build_stop', {
      buildId: build.id,
      requestId,
      stopReason
    });
  }

  async function handleDeleteMessage(message: ChatMessage) {
    if (!isOwner) return;
    if (message.source === 'runtime_observation') {
      runtimeFollowUp.removeRuntimeObservationChatNote(message.id);
      return;
    }
    if (isMessageLockedForActiveRequest(message)) return;

    try {
      if (message.persisted === false) {
        removeDeletedBuildRunMessage(message);
        await syncChatMessagesFromServer(undefined, true);
        return;
      }

      const result = await deleteBuildChatMessage({
        buildId: build.id,
        messageId: message.id
      });

      if (result?.success !== true) {
        await syncChatMessagesFromServer(undefined, true);
        return;
      }

      removeDeletedBuildRunMessage(message);
      if (result?.deleted !== true) {
        await syncChatMessagesFromServer(undefined, true);
      }
    } catch (error) {
      console.error('Failed to delete build chat message:', error);
      await syncChatMessagesFromServer(undefined, true);
    }
  }

  async function handleFixRuntimeObservationMessage(message: ChatMessage) {
    if (!isOwner || message.source !== 'runtime_observation') {
      return false;
    }
    const accepted = await sendBuildMessageText('Fix this preview issue.', {
      messageContext: String(message.content || '').trim() || null
    });
    if (accepted) {
      runtimeFollowUp.removeRuntimeObservationChatNote(message.id);
    }
    return accepted;
  }

  function isMessageLockedForActiveRequest(message: ChatMessage) {
    if (!currentBuildRunView.generating) return false;
    return currentBuildRunView.activeStreamMessageIds.includes(message.id);
  }

  return {
    handleAcceptFollowUpPrompt,
    handleAskLumineToResolveMergeConflicts,
    handleCancelScopedPlan,
    handleContinueScopedPlan,
    handleDeleteMessage,
    handleDismissFollowUpPrompt,
    handleFixRuntimeObservationMessage,
    handleSendMessage,
    handleStopGeneration,
    sendBuildMessageText
  };
}

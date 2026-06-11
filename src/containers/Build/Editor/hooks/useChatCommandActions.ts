import { socket } from '~/constants/sockets/api';
import {
  CURRENT_THREE_VENDOR_PREFIX,
  LEGACY_THREE_VENDOR_PREFIX
} from '../helpers/threeVendorUpgrade';
import {
  buildFollowUpAcceptPromptBinding,
  buildScopedPlanContinuePromptBinding,
  resolveBuildFollowUpPromptKey
} from '../helpers/promptBindings';
import {
  formatTrailingRuntimeObservationMessageContext,
  mergeHiddenBuildMessageContext
} from '../helpers/chatMessages';
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
  getBuildRunIdentity: (buildId: number) => SharedBuildRunIdentityState | null;
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
  function openLumineChatShortcutTarget() {
    handleBuildWorkspaceCommunicationModeChange('lumine');
    setMobilePanelTab('chat');
    window.requestAnimationFrame(() => {
      scrollChatToBottom('smooth');
    });
  }

  async function handleSendMessage(messageText: string) {
    return await sendBuildMessageText(messageText);
  }

  async function handleAskLumineToResolveMergeConflicts(paths: string[] = []) {
    const rootBuildId = Number(build.contributionRootBuildId || 0);
    const requesterOwnsRootBuild =
      currentBuildIsContributionFork &&
      rootBuildId > 0 &&
      Number(build.rootBuildUserId || 0) === Number(userId || 0);
    const normalizedPaths = Array.from(
      new Set(
        (Array.isArray(paths) ? paths : [])
          .map((path) => String(path || '').trim())
          .filter(Boolean)
      )
    );
    const canResolveFromMainProject =
      requesterOwnsRootBuild &&
      (normalizedPaths.length > 0 ||
        String(build.contributionStatus || '').trim() === 'merging');
    if (!isOwner && !canResolveFromMainProject) return false;
    const prompt =
      'Resolve the conflict markers in the main project files and save the project.';
    const knownPathsContext =
      normalizedPaths.length > 0
        ? `Known marker paths: ${normalizedPaths.join(', ')}.`
        : 'Known marker paths were not provided.';
    const mergeConflictContext = [
      'MERGE_CONFLICT_CONTEXT:',
      knownPathsContext,
      'Marker labels: <<<<<<< Current Build / ======= / >>>>>>> Contribution.',
      'These markers are in main project files after a branch merge.',
      'This is a normal workspace repair request. Use workspace tools as needed; there may be additional marker paths beyond the known list.',
      'Do not rely on chat excerpts.',
      'Resolve all markers that have a coherent safe resolution, preserve intended behavior from both sides where the code context supports it, and keep the app runnable.',
      'Before saving, make sure every project file that contains markers has been considered and all markers are removed.',
      'Ask only if the actual marked files and nearby code still leave no coherent safe resolution.'
    ].join('\n');
    if (!isOwner) {
      navigate(`/build/${rootBuildId}`, {
        state: {
          initialPrompt: prompt,
          initialPromptContext: mergeConflictContext,
          forceInitialPrompt: true
        }
      });
      return true;
    }
    openLumineChatShortcutTarget();
    return await sendBuildMessageText(prompt, {
      messageContext: mergeConflictContext
    });
  }

  async function handleAskLumineToUpgradeThreeVendor(paths: string[] = []) {
    if (!isOwner) return false;
    const normalizedPaths = Array.from(
      new Set(
        (Array.isArray(paths) ? paths : [])
          .map((path) => String(path || '').trim())
          .filter(Boolean)
      )
    );
    const prompt = 'Upgrade this project to the current Three.js vendor version.';
    const upgradeContext = [
      'THREE_VENDOR_UPGRADE_CONTEXT:',
      `Replace every reference to ${LEGACY_THREE_VENDOR_PREFIX} with ${CURRENT_THREE_VENDOR_PREFIX} across all project files.`,
      normalizedPaths.length > 0
        ? `Known files using the old path: ${normalizedPaths.join(', ')}. There may be more; verify with workspace tools.`
        : 'Scan the project files for the old vendor path.',
      `Three.js addons are available under ${CURRENT_THREE_VENDOR_PREFIX}addons/ (for example controls/OrbitControls.js or loaders/GLTFLoader.js). Do not refactor working code to use them as part of this upgrade.`,
      'After switching the imports, check the project for Three.js APIs whose behavior changed between r160 and r184 (renamed or removed APIs, color management and lighting defaults) and adjust only what the project actually uses.',
      'Keep behavior identical, confirm the preview renders without errors, then save the project.'
    ].join('\n');
    openLumineChatShortcutTarget();
    return await sendBuildMessageText(prompt, {
      messageContext: upgradeContext
    });
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
    handleAskLumineToUpgradeThreeVendor,
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

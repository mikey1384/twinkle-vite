import { socket } from '~/constants/sockets/api';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../../types/runtimeObservationTypes';
import {
  createBuildChatClientMessageId,
  normalizeBuildChatClientMessageId
} from '../helpers/chatMessages';
import { normalizeProjectFilesForBuild } from '../helpers/projectFiles';
import type {
  Build,
  BuildPlanAction,
  BuildPromptBinding,
  BuildRunEvent,
  ChatMessage
} from '../types';
import type { BuildLumineModelPreference } from '../ChatPanel/types';

interface RunStartIdentity {
  beginRun(options: {
    requestId: string;
    runMode: 'user' | 'greeting' | 'runtime-autofix';
    userMessageId?: number | null;
    assistantMessageId?: number | null;
    messageContext?: string | null;
  }): void;
}

interface RunStartOrchestration {
  setStartingGeneration(inFlight: boolean): void;
  setUserRequestedStop(requested: boolean): void;
  resetStalledRunRecovery(): void;
}

interface RunStartRuntimeFollowUp {
  getCurrentRuntimeObservationSummary(
    observationState?: BuildRuntimeObservationState
  ): string;
  prepareRuntimeAutoFixRun(
    observationState: BuildRuntimeObservationState,
    options?: { remainingRepairsAfterVerification?: number }
  ): void;
  resetRuntimeHealthFollowUpState(): void;
}

interface AppendLocalRunEventOptions {
  kind: BuildRunEvent['kind'];
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface UseRunStartActionsOptions {
  aiFeaturesDisabled: boolean;
  appendLocalRunEvent: (event: AppendLocalRunEventOptions) => void;
  clearBufferedRunStartEvents: () => void;
  clearLocalFollowUpPrompt: () => void;
  ensureProjectFilesPersistedBeforeRun: (options: {
    runType: 'copilot';
  }) => Promise<boolean>;
  flushBufferedRunStartEvents: (requestId: string) => void;
  flushBufferedRunStartEventsToPageFeedback: () => void;
  forceChatAutoScroll: () => void;
  getLatestBuild: () => Build;
  getLatestChatMessages: () => ChatMessage[];
  getLumineModelSelection: () => BuildLumineModelPreference | null;
  getRuntimeExplorationPlan: () => BuildRuntimeExplorationPlan | null;
  isOwner: boolean;
  isRunActivityInFlight: () => boolean;
  markActiveBuildRunActivity: (activityAt?: number | null) => void;
  markCurrentPageRunActivityActive: () => void;
  onRegisterBuildRun: (options: Record<string, any>) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  resetDedupedProcessingReconcileState: () => void;
  runIdentity: RunStartIdentity;
  runOrchestration: RunStartOrchestration;
  runtimeAutoFixEnabled: boolean;
  runtimeFollowUp: RunStartRuntimeFollowUp;
  setBuildRuntimeExplorationPlanValue: (
    nextRuntimeExplorationPlan: BuildRuntimeExplorationPlan | null
  ) => void;
  setDismissedFollowUpPromptKey: (key: string) => void;
}

export default function useRunStartActions({
  aiFeaturesDisabled,
  appendLocalRunEvent,
  clearBufferedRunStartEvents,
  clearLocalFollowUpPrompt,
  ensureProjectFilesPersistedBeforeRun,
  flushBufferedRunStartEvents,
  flushBufferedRunStartEventsToPageFeedback,
  forceChatAutoScroll,
  getLatestBuild,
  getLatestChatMessages,
  getLumineModelSelection,
  getRuntimeExplorationPlan,
  isOwner,
  isRunActivityInFlight,
  markActiveBuildRunActivity,
  markCurrentPageRunActivityActive,
  onRegisterBuildRun,
  replaceChatMessages,
  resetDedupedProcessingReconcileState,
  runIdentity,
  runOrchestration,
  runtimeAutoFixEnabled,
  runtimeFollowUp,
  setBuildRuntimeExplorationPlanValue,
  setDismissedFollowUpPromptKey
}: UseRunStartActionsOptions) {
  async function startRuntimeAutoFix(
    observationState: BuildRuntimeObservationState,
    options?: {
      remainingRepairsAfterVerification?: number;
      trigger?: 'initial' | 'verification';
      sourceRequestId?: string | null;
      sourceArtifactVersionId?: number | null;
    }
  ): Promise<boolean> {
    if (!runtimeAutoFixEnabled) {
      return false;
    }
    if (!isOwner || isRunActivityInFlight()) {
      return false;
    }
    const runtimeObservationSummary =
      runtimeFollowUp.getCurrentRuntimeObservationSummary(observationState);
    if (!runtimeObservationSummary) {
      return false;
    }
    const activeBuild = getLatestBuild();
    const requestedBuildId = Number(activeBuild?.id || 0);
    if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
      return false;
    }

    resetDedupedProcessingReconcileState();
    runOrchestration.setUserRequestedStop(false);
    runtimeFollowUp.prepareRuntimeAutoFixRun(observationState, {
      remainingRepairsAfterVerification:
        options?.remainingRepairsAfterVerification
    });
    setBuildRuntimeExplorationPlanValue(null);
    const now = Math.floor(Date.now() / 1000);
    const assistantMessageId = Date.now();
    const requestId = `${requestedBuildId}-runtime-fix-${assistantMessageId}`;
    const assistantClientMessageId = createBuildChatClientMessageId({
      buildId: requestedBuildId,
      role: 'assistant'
    });
    const baseProjectFiles = normalizeProjectFilesForBuild(
      activeBuild?.projectFiles || [],
      activeBuild?.code || ''
    );
    const lumineModelSelection = getLumineModelSelection();
    setDismissedFollowUpPromptKey('');
    clearLocalFollowUpPrompt();

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      codeGenerated: null,
      streamCodePreview: null,
      clientMessageId: assistantClientMessageId,
      createdAt: now,
      persisted: false
    };

    const nextMessages = [...getLatestChatMessages(), assistantMessage];
    replaceChatMessages(nextMessages);
    runIdentity.beginRun({
      requestId,
      runMode: 'runtime-autofix',
      assistantMessageId
    });
    markCurrentPageRunActivityActive();
    clearBufferedRunStartEvents();
    markActiveBuildRunActivity();
    runOrchestration.resetStalledRunRecovery();
    onRegisterBuildRun({
      buildId: requestedBuildId,
      requestId,
      runMode: 'runtime-autofix',
      assistantMessage,
      baseProjectFiles
    });
    appendLocalRunEvent({
      kind: 'action',
      phase: 'implementing',
      message:
        options?.trigger === 'verification'
          ? 'Lumine is taking one final repair pass after re-checking the preview.'
          : `Preview explorer sent its findings to Lumine for automatic repair${
              options?.sourceArtifactVersionId
                ? ` after artifact v${options.sourceArtifactVersionId}`
                : ''
            }.`
    });
    forceChatAutoScroll();

    socket.emit('build_generate', {
      buildId: requestedBuildId,
      requestId,
      message: 'Investigate and fix the observed runtime issues.',
      runtimeObservationSummary,
      runtimeObservation: observationState,
      runtimeExplorationPlan: getRuntimeExplorationPlan(),
      autoFixRuntimeObservation: true,
      runtimeAutoFixSourceRequestId: options?.sourceRequestId || null,
      runtimeAutoFixSourceArtifactVersionId:
        options?.sourceArtifactVersionId || null,
      lumineModel: lumineModelSelection?.model || undefined,
      lumineReasoningEffort:
        lumineModelSelection?.reasoningEffort || undefined,
      assistantClientMessageId,
      expectedCurrentArtifactVersionId:
        Number(getLatestBuild()?.currentArtifactVersionId || 0) > 0
          ? Number(getLatestBuild()?.currentArtifactVersionId)
          : undefined
    });
    return true;
  }

  async function startGeneration(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ): Promise<boolean> {
    if (aiFeaturesDisabled) return false;
    if (!messageText.trim() || isRunActivityInFlight() || !isOwner) {
      return false;
    }
    runOrchestration.setStartingGeneration(true);
    let didRegisterRun = false;
    try {
      const requestedBuildId = Number(getLatestBuild()?.id || 0);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        return false;
      }
      const projectFilesReady = await ensureProjectFilesPersistedBeforeRun({
        runType: 'copilot'
      });
      if (!projectFilesReady) {
        return false;
      }
      const activeBuild = getLatestBuild();
      if (!activeBuild || Number(activeBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before run start. Please retry on the active build.'
        });
        return false;
      }
      resetDedupedProcessingReconcileState();
      runOrchestration.setUserRequestedStop(false);
      const now = Math.floor(Date.now() / 1000);
      const messageId = Date.now();
      const requestId = `${activeBuild.id}-${messageId}`;
      const runtimeObservationSummary =
        runtimeFollowUp.getCurrentRuntimeObservationSummary();
      const trimmedMessageContext = String(
        options?.messageContext || ''
      ).trim();
      const existingUserMessageId =
        Number(options?.existingUserMessageId || 0) || null;
      const assistantClientMessageId = createBuildChatClientMessageId({
        buildId: activeBuild.id,
        role: 'assistant'
      });
      const baseProjectFiles = normalizeProjectFilesForBuild(
        activeBuild.projectFiles || [],
        activeBuild.code || ''
      );
      const lumineModelSelection = getLumineModelSelection();
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      setBuildRuntimeExplorationPlanValue(null);

      const existingUserMessage =
        existingUserMessageId && existingUserMessageId > 0
          ? getLatestChatMessages().find(
              (entry) => entry.id === existingUserMessageId
            ) || null
          : null;
      const userClientMessageId = existingUserMessage
        ? normalizeBuildChatClientMessageId(
            existingUserMessage.clientMessageId
          ) || null
        : createBuildChatClientMessageId({
            buildId: activeBuild.id,
            role: 'user'
          });
      const userMessage: ChatMessage = existingUserMessage
        ? {
            ...existingUserMessage,
            persisted: true
          }
        : {
            id: messageId,
            role: 'user',
            content: messageText,
            codeGenerated: null,
            billingState: null,
            streamCodePreview: null,
            clientMessageId: userClientMessageId,
            createdAt: now,
            persisted: false
          };
      const assistantMessage: ChatMessage = {
        id: messageId + 1,
        role: 'assistant',
        content: '',
        codeGenerated: null,
        billingState: null,
        streamCodePreview: null,
        clientMessageId: assistantClientMessageId,
        createdAt: now + 1,
        persisted: false
      };
      runIdentity.beginRun({
        requestId,
        runMode: 'user',
        userMessageId:
          (existingUserMessage && existingUserMessage.id) || userMessage.id,
        assistantMessageId: assistantMessage.id,
        messageContext: trimmedMessageContext || null
      });
      markCurrentPageRunActivityActive();
      markActiveBuildRunActivity();
      runOrchestration.resetStalledRunRecovery();

      const messagesWithUser = existingUserMessage
        ? [...getLatestChatMessages(), assistantMessage]
        : [...getLatestChatMessages(), userMessage, assistantMessage];
      replaceChatMessages(messagesWithUser);
      onRegisterBuildRun({
        buildId: activeBuild.id,
        requestId,
        runMode: 'user',
        userMessage,
        assistantMessage,
        baseProjectFiles
      });
      didRegisterRun = true;
      flushBufferedRunStartEvents(requestId);
      forceChatAutoScroll();

      socket.emit('build_generate', {
        buildId: activeBuild.id,
        message: messageText,
        requestId,
        runtimeObservationSummary: runtimeObservationSummary || undefined,
        messageContext: trimmedMessageContext || undefined,
        existingUserMessageId: existingUserMessageId || undefined,
        clientMessageId: userClientMessageId || undefined,
        assistantClientMessageId,
        lumineModel: lumineModelSelection?.model || undefined,
        lumineReasoningEffort:
          lumineModelSelection?.reasoningEffort || undefined,
        planAction: options?.planAction || undefined,
        promptBinding: options?.promptBinding || undefined,
        expectedCurrentArtifactVersionId:
          Number(activeBuild.currentArtifactVersionId || 0) > 0
            ? Number(activeBuild.currentArtifactVersionId)
            : undefined
      });
      return true;
    } finally {
      runOrchestration.setStartingGeneration(false);
      if (!didRegisterRun) {
        flushBufferedRunStartEventsToPageFeedback();
      }
    }
  }

  async function startGreetingGeneration(): Promise<boolean> {
    if (aiFeaturesDisabled) return false;
    if (isRunActivityInFlight() || !isOwner) {
      return false;
    }
    runOrchestration.setStartingGeneration(true);
    let didRegisterRun = false;
    try {
      const activeBuild = getLatestBuild();
      const requestedBuildId = Number(activeBuild?.id || 0);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        return false;
      }
      if (!activeBuild || Number(activeBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before Lumine greeting could start. Please retry on the active build.'
        });
        return false;
      }
      resetDedupedProcessingReconcileState();
      runOrchestration.setUserRequestedStop(false);
      const now = Math.floor(Date.now() / 1000);
      const assistantMessageId = Date.now();
      const requestId = `${activeBuild.id}-greeting-${assistantMessageId}`;
      const assistantClientMessageId = createBuildChatClientMessageId({
        buildId: activeBuild.id,
        role: 'assistant'
      });
      const baseProjectFiles = normalizeProjectFilesForBuild(
        activeBuild.projectFiles || [],
        activeBuild.code || ''
      );
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      setBuildRuntimeExplorationPlanValue(null);

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        codeGenerated: null,
        streamCodePreview: null,
        clientMessageId: assistantClientMessageId,
        createdAt: now,
        persisted: false
      };

      const nextMessages = [...getLatestChatMessages(), assistantMessage];
      replaceChatMessages(nextMessages);
      runIdentity.beginRun({
        requestId,
        runMode: 'greeting',
        assistantMessageId
      });
      markCurrentPageRunActivityActive();
      markActiveBuildRunActivity();
      runOrchestration.resetStalledRunRecovery();
      onRegisterBuildRun({
        buildId: activeBuild.id,
        requestId,
        runMode: 'greeting',
        assistantMessage,
        baseProjectFiles
      });
      didRegisterRun = true;
      flushBufferedRunStartEvents(requestId);
      forceChatAutoScroll();

      socket.emit('build_generate_greeting', {
        buildId: activeBuild.id,
        requestId,
        assistantClientMessageId
      });
      return true;
    } finally {
      runOrchestration.setStartingGeneration(false);
      if (!didRegisterRun) {
        flushBufferedRunStartEventsToPageFeedback();
      }
    }
  }

  return {
    startGeneration,
    startGreetingGeneration,
    startRuntimeAutoFix
  };
}

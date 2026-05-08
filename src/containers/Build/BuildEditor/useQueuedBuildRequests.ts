import type {
  BuildPlanAction,
  BuildPromptBinding,
  BuildRunEvent,
  ChatMessage,
  QueuedBuildRequest
} from './types';
import type { SharedBuildRunIdentityState } from './useBuildRunIdentity';

interface QueuedBuildRequestRunIdentity {
  getMessageContext(): string | null;
}

interface QueuedBuildRequestOrchestration {
  getQueuedRequests(): QueuedBuildRequest[];
  setQueuedRequests(next: QueuedBuildRequest[]): void;
  setQueuePausedForSave(paused: boolean): void;
  isQueuePausedForSave(): boolean;
  markReplacementStop(requestId?: string | null): void;
}

interface AppendLocalRunEventOptions {
  kind: BuildRunEvent['kind'];
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface UseQueuedBuildRequestsOptions {
  appendLocalRunEvent: (event: AppendLocalRunEventOptions) => void;
  currentSharedRunIdentityState: SharedBuildRunIdentityState | null;
  getActiveBuildId: () => number;
  getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null;
  getCurrentActiveUserMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getLatestBuildRun: (buildId: number) => {
    requestId?: string | null;
    generating?: boolean | null;
    terminalState?: string | null;
  } | null;
  getLatestChatMessages: () => ChatMessage[];
  handleStopGeneration: (options?: {
    stopReason?: 'user' | 'replacement';
  }) => void;
  hasCurrentPageRunActivity: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => boolean;
  hasPendingRuntimeFollowUp: () => boolean;
  isRunActivityInFlight: (options?: {
    includeBootstrap?: boolean;
    sharedRunState?: SharedBuildRunIdentityState | null;
  }) => boolean;
  requestStopForRecoveredBuildRun: (
    requestId: string,
    stopReason?: 'user' | 'replacement'
  ) => void;
  runIdentity: QueuedBuildRequestRunIdentity;
  runOrchestration: QueuedBuildRequestOrchestration;
  startGeneration: (
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ) => Promise<boolean>;
}

function normalizeQueuedMessage(message: string) {
  return message.replace(/\s+/g, ' ').trim().toLowerCase();
}

export default function useQueuedBuildRequests({
  appendLocalRunEvent,
  currentSharedRunIdentityState,
  getActiveBuildId,
  getBuildRunIdentity,
  getCurrentActiveUserMessageId,
  getLatestBuildRun,
  getLatestChatMessages,
  handleStopGeneration,
  hasCurrentPageRunActivity,
  hasPendingRuntimeFollowUp,
  isRunActivityInFlight,
  requestStopForRecoveredBuildRun,
  runIdentity,
  runOrchestration,
  startGeneration
}: UseQueuedBuildRequestsOptions) {
  function updateQueuedRequests(next: QueuedBuildRequest[]) {
    runOrchestration.setQueuedRequests(next);
  }

  function releaseQueuedRequestsWaitingForStop(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return false;

    const existing = runOrchestration.getQueuedRequests();
    let changed = false;
    const next = existing.map((entry) => {
      if (
        String(entry.waitForStopRequestId || '').trim() !== normalizedRequestId
      ) {
        return entry;
      }
      changed = true;
      return {
        ...entry,
        waitForStopRequestId: null
      };
    });

    if (changed) {
      updateQueuedRequests(next);
    }
    return changed;
  }

  function releaseQueuedRequestsIfStopTargetAlreadySettled(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return false;
    const activeBuildId = getActiveBuildId();
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return false;
    const latestBuildRun = getLatestBuildRun(activeBuildId);
    if (
      String(latestBuildRun?.requestId || '').trim() !== normalizedRequestId ||
      latestBuildRun?.generating ||
      !latestBuildRun?.terminalState
    ) {
      return false;
    }
    return releaseQueuedRequestsWaitingForStop(normalizedRequestId);
  }

  function enqueueLatestBuildRequest(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
      stopActiveRun?: boolean;
      stopRequestId?: string | null;
    }
  ) {
    const trimmed = String(messageText || '').trim();
    const trimmedMessageContext = String(options?.messageContext || '').trim();
    const stopRequestId = String(options?.stopRequestId || '').trim() || null;
    if (!trimmed) return;
    const normalized = normalizeQueuedMessage(trimmed);
    const activeMessage = normalizeQueuedMessage(
      String(
        getLatestChatMessages().find(
          (entry) =>
            entry.id ===
            getCurrentActiveUserMessageId(
              undefined,
              currentSharedRunIdentityState
            )
        )?.content || ''
      )
    );
    const activeMessageContext = normalizeQueuedMessage(
      String(runIdentity.getMessageContext() || '')
    );
    const normalizedMessageContext = normalizeQueuedMessage(
      trimmedMessageContext
    );
    const existing = runOrchestration.getQueuedRequests();
    const shouldStopActiveRun = options?.stopActiveRun !== false;
    const duplicateIndex = existing.findIndex(
      (entry) => normalizeQueuedMessage(entry.message) === normalized
    );

    if (
      normalized === activeMessage &&
      normalizedMessageContext === activeMessageContext
    ) {
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'That request is already in progress.'
      });
      return;
    }

    if (duplicateIndex >= 0) {
      const nextQueuedRequests = [...existing];
      nextQueuedRequests[duplicateIndex] = {
        ...nextQueuedRequests[duplicateIndex],
        planAction: options?.planAction || null,
        promptBinding: options?.promptBinding || null,
        messageContext: trimmedMessageContext || null,
        existingUserMessageId:
          Number(options?.existingUserMessageId || 0) || null,
        waitForStopRequestId: shouldStopActiveRun ? stopRequestId : null
      };
      updateQueuedRequests(nextQueuedRequests);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Your latest request is already pending.'
      });
      return;
    }

    updateQueuedRequests([
      {
        id: `${Date.now()}-steer`,
        message: trimmed,
        planAction: options?.planAction || null,
        promptBinding: options?.promptBinding || null,
        messageContext: trimmedMessageContext || null,
        existingUserMessageId:
          Number(options?.existingUserMessageId || 0) || null,
        waitForStopRequestId: shouldStopActiveRun ? stopRequestId : null,
        createdAt: Date.now()
      }
    ]);
    appendLocalRunEvent({
      kind: 'action',
      phase: shouldStopActiveRun ? 'stopping' : 'queued',
      message: shouldStopActiveRun
        ? 'Switching to your latest request...'
        : 'Queued your next request.'
    });
    if (shouldStopActiveRun) {
      if (stopRequestId) {
        runOrchestration.markReplacementStop(stopRequestId);
        requestStopForRecoveredBuildRun(stopRequestId, 'replacement');
      } else if (
        hasCurrentPageRunActivity(getBuildRunIdentity(getActiveBuildId()))
      ) {
        handleStopGeneration({ stopReason: 'replacement' });
      }
    }
  }

  async function maybeStartNextQueuedRequest() {
    if (hasPendingRuntimeFollowUp()) {
      return;
    }
    const latestSharedRunIdentityState = getBuildRunIdentity(
      getActiveBuildId()
    );
    if (isRunActivityInFlight({ sharedRunState: latestSharedRunIdentityState })) {
      return;
    }
    const [nextRequest, ...rest] = runOrchestration.getQueuedRequests();
    if (!nextRequest) return;
    const waitForStopRequestId = String(
      nextRequest.waitForStopRequestId || ''
    ).trim();
    if (
      waitForStopRequestId &&
      (String(latestSharedRunIdentityState?.requestId || '').trim() !==
        waitForStopRequestId ||
        latestSharedRunIdentityState?.generating)
    ) {
      return;
    }
    updateQueuedRequests(rest);
    appendLocalRunEvent({
      kind: 'status',
      phase: 'queued',
      message: 'Starting your latest request.'
    });
    const started = await startGeneration(nextRequest.message, {
      planAction: nextRequest.planAction || null,
      promptBinding: nextRequest.promptBinding || null,
      messageContext: nextRequest.messageContext || null,
      existingUserMessageId: nextRequest.existingUserMessageId || null
    });
    if (!started) {
      runOrchestration.setQueuePausedForSave(true);
      updateQueuedRequests([nextRequest, ...runOrchestration.getQueuedRequests()]);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Waiting for file edits to save before continuing.'
      });
      return;
    }
    runOrchestration.setQueuePausedForSave(false);
  }

  function maybeResumePausedQueueAfterSave() {
    if (!runOrchestration.isQueuePausedForSave()) return;
    if (
      isRunActivityInFlight({
        sharedRunState: getBuildRunIdentity(getActiveBuildId())
      })
    ) {
      return;
    }
    runOrchestration.setQueuePausedForSave(false);
    void Promise.resolve().then(() => maybeStartNextQueuedRequest());
  }

  return {
    enqueueLatestBuildRequest,
    maybeResumePausedQueueAfterSave,
    maybeStartNextQueuedRequest,
    releaseQueuedRequestsIfStopTargetAlreadySettled,
    releaseQueuedRequestsWaitingForStop
  };
}

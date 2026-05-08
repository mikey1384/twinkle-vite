import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import type { MobilePanelTab } from './types';
import type { SharedBuildRunIdentityState } from './useBuildRunIdentity';

interface BuildRunRecoveryOrchestration {
  markRunActivity(activityAt?: number | null): void;
  claimResumeAttempt(now: number, minIntervalMs: number): boolean;
  getRunInactivityMs(now?: number): number;
  isStalledRunRecoveryInFlight(): boolean;
  beginStalledRunRecovery(now: number): void;
  finishStalledRunRecovery(): void;
  getLastStalledRunSyncAt(): number;
  isPostCompleteSyncInFlight(): boolean;
  didUserRequestStop(): boolean;
  isDedupedProcessingInFlight(requestId?: string | null): boolean;
  getDedupedProcessingRequestId(): string;
  beginDedupedProcessingRecovery(requestId?: string | null): string;
  scheduleDedupedProcessingReconcile(options: {
    requestId: string;
    delayMs: number;
    onReconcile: (requestId: string) => void;
  }): void;
  resetDedupedProcessingReconcileState(): void;
}

interface UseBuildRunRecoveryOptions {
  buildId: number;
  currentSharedRunIdentityState: SharedBuildRunIdentityState | null;
  dedupedProcessingRecoveryStatus: string;
  dedupedProcessingReconcileIntervalMs: number;
  getActiveBuildId: () => number;
  getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null;
  getCurrentPageRunActivityRequestId: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getCurrentRunRequestId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  hasCurrentPageRunActivity: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => boolean;
  onUpdateBuildRunStatus: (options: {
    buildId?: number;
    requestId: string;
    status: string;
  }) => void;
  runOrchestration: BuildRunRecoveryOrchestration;
  scrollChatToBottom: (behavior?: ScrollBehavior) => void;
  setMobilePanelTab: (tab: MobilePanelTab) => void;
  sharedBuildRun: BuildLiveRunState | null;
  stalledRunRecoverAfterMs: number;
  stalledRunResumeAfterMs: number;
}

export default function useBuildRunRecovery({
  buildId,
  currentSharedRunIdentityState,
  dedupedProcessingRecoveryStatus,
  dedupedProcessingReconcileIntervalMs,
  getActiveBuildId,
  getBuildRunIdentity,
  getCurrentPageRunActivityRequestId,
  getCurrentRunRequestId,
  hasCurrentPageRunActivity,
  onUpdateBuildRunStatus,
  runOrchestration,
  scrollChatToBottom,
  setMobilePanelTab,
  sharedBuildRun,
  stalledRunRecoverAfterMs,
  stalledRunResumeAfterMs
}: UseBuildRunRecoveryOptions) {
  function markActiveBuildRunActivity(activityAt?: number | null) {
    runOrchestration.markRunActivity(activityAt);
  }

  function maybeResumeActiveBuildRun() {
    const activeBuildId = getActiveBuildId();
    const requestId = getCurrentPageRunActivityRequestId(
      getBuildRunIdentity(activeBuildId)
    );
    if (!requestId) return;
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return;
    const now = Date.now();
    if (!runOrchestration.claimResumeAttempt(now, 1500)) return;
    socket.emit('build_resume_run', {
      buildId: activeBuildId,
      requestId
    });
  }

  function updateSharedStalledRunRecoveryStatus(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return false;
    const activeBuildId = getActiveBuildId();
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return false;
    const nextStatus = runOrchestration.didUserRequestStop()
      ? 'Stopping...'
      : runOrchestration.isDedupedProcessingInFlight(normalizedRequestId)
        ? dedupedProcessingRecoveryStatus
        : 'Still working... reconnecting to Lumine.';
    if (
      String(sharedBuildRun?.requestId || '').trim() === normalizedRequestId &&
      String(sharedBuildRun?.status || '').trim() === nextStatus
    ) {
      return false;
    }
    onUpdateBuildRunStatus({
      buildId: activeBuildId,
      requestId: normalizedRequestId,
      status: nextStatus
    });
    return true;
  }

  function requestStopForRecoveredBuildRun(
    requestId: string,
    stopReason: 'user' | 'replacement' = 'user'
  ) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    const activeBuildId = getActiveBuildId();
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return;
    socket.emit('build_stop', {
      buildId: activeBuildId,
      requestId: normalizedRequestId,
      stopReason
    });
  }

  function resetDedupedProcessingReconcileState() {
    runOrchestration.resetDedupedProcessingReconcileState();
  }

  function beginDedupedProcessingRecovery(requestId: string) {
    const normalizedRequestId = runOrchestration.beginDedupedProcessingRecovery(
      requestId
    );
    if (!normalizedRequestId) return;
    reconcileDedupedProcessingRequest(normalizedRequestId);
  }

  function maybeStartSharedDedupedProcessingRecovery(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    if (
      getCurrentRunRequestId(
        normalizedRequestId,
        getBuildRunIdentity(getActiveBuildId())
      ) !== normalizedRequestId
    ) {
      return;
    }
    if (runOrchestration.isDedupedProcessingInFlight(normalizedRequestId)) {
      return;
    }
    setMobilePanelTab('chat');
    scrollChatToBottom();
    beginDedupedProcessingRecovery(normalizedRequestId);
  }

  function scheduleDedupedProcessingReconcile(requestId: string) {
    runOrchestration.scheduleDedupedProcessingReconcile({
      requestId,
      delayMs: dedupedProcessingReconcileIntervalMs,
      onReconcile(nextRequestId) {
        reconcileDedupedProcessingRequest(nextRequestId);
      }
    });
  }

  function reconcileDedupedProcessingRequest(requestId: string) {
    let latestSharedRunIdentityState = getBuildRunIdentity(getActiveBuildId());
    if (
      getCurrentRunRequestId(requestId, latestSharedRunIdentityState) !==
        requestId ||
      runOrchestration.getDedupedProcessingRequestId() !== requestId
    ) {
      resetDedupedProcessingReconcileState();
      return;
    }
    // During deduped recovery, the page only re-requests canonical shared run
    // state. Terminal outcomes come from shared replay or terminal socket events.
    maybeResumeActiveBuildRun();
    latestSharedRunIdentityState = getBuildRunIdentity(getActiveBuildId());
    if (
      getCurrentRunRequestId(requestId, latestSharedRunIdentityState) !==
        requestId ||
      runOrchestration.getDedupedProcessingRequestId() !== requestId
    ) {
      resetDedupedProcessingReconcileState();
      return;
    }
    scheduleDedupedProcessingReconcile(requestId);
  }

  function recoverStalledActiveBuildRun(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    const latestSharedRunIdentityState = getBuildRunIdentity(getActiveBuildId());
    if (
      runOrchestration.isStalledRunRecoveryInFlight() ||
      !hasCurrentPageRunActivity(latestSharedRunIdentityState) ||
      getCurrentRunRequestId(
        normalizedRequestId,
        latestSharedRunIdentityState
      ) !== normalizedRequestId ||
      runOrchestration.isPostCompleteSyncInFlight()
    ) {
      return;
    }
    const now = Date.now();
    if (
      now - runOrchestration.getLastStalledRunSyncAt() <
      stalledRunResumeAfterMs
    ) {
      maybeResumeActiveBuildRun();
      return;
    }
    runOrchestration.beginStalledRunRecovery(now);
    try {
      const didShowRecoveryStatus = updateSharedStalledRunRecoveryStatus(
        normalizedRequestId
      );
      if (didShowRecoveryStatus) {
        setMobilePanelTab('chat');
        scrollChatToBottom();
      }
      maybeResumeActiveBuildRun();
    } finally {
      runOrchestration.finishStalledRunRecovery();
    }
  }

  useEffect(() => {
    if (!sharedBuildRun?.generating) return;

    const interval = window.setInterval(() => {
      const requestId = getCurrentPageRunActivityRequestId(
        getBuildRunIdentity(getActiveBuildId())
      );
      if (!requestId) return;
      const inactivityMs = runOrchestration.getRunInactivityMs();
      if (inactivityMs >= stalledRunResumeAfterMs) {
        maybeResumeActiveBuildRun();
      }
      if (inactivityMs >= stalledRunRecoverAfterMs) {
        recoverStalledActiveBuildRun(requestId);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buildId,
    currentSharedRunIdentityState,
    runOrchestration,
    sharedBuildRun?.generating
  ]);

  return {
    beginDedupedProcessingRecovery,
    markActiveBuildRunActivity,
    maybeStartSharedDedupedProcessingRecovery,
    requestStopForRecoveredBuildRun,
    resetDedupedProcessingReconcileState,
    scheduleDedupedProcessingReconcile
  };
}

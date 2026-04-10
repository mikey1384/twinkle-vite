import { useEffect, useRef } from 'react';

interface DedupedProcessingReconcileScheduleOptions {
  requestId: string;
  delayMs: number;
  onReconcile: (requestId: string) => void;
}

interface BuildRunOrchestrationApi<TQueuedRequest, TRunEvent> {
  reset(): void;
  markCurrentPageRunActive(): void;
  clearCurrentPageRunActive(): void;
  hasCurrentPageRunActivity(): boolean;
  setPostCompleteSyncInFlight(inFlight: boolean): void;
  isPostCompleteSyncInFlight(): boolean;
  setStartingGeneration(inFlight: boolean): void;
  isStartingGeneration(): boolean;
  clearPendingRunStartEvents(): void;
  bufferPendingRunStartEvent(event: TRunEvent, limit?: number): void;
  consumePendingRunStartEvents(): TRunEvent[];
  getQueuedRequests(): TQueuedRequest[];
  setQueuedRequests(next: TQueuedRequest[]): void;
  setQueuePausedForSave(paused: boolean): void;
  isQueuePausedForSave(): boolean;
  setRequiresProjectFilesResyncBeforeSave(required: boolean): void;
  requiresProjectFilesResyncBeforeSave(): boolean;
  setUserRequestedStop(requested: boolean): void;
  didUserRequestStop(): boolean;
  isDedupedProcessingInFlight(requestId?: string | null): boolean;
  getDedupedProcessingRequestId(): string;
  beginDedupedProcessingRecovery(requestId?: string | null): string;
  scheduleDedupedProcessingReconcile(
    options: DedupedProcessingReconcileScheduleOptions
  ): void;
  resetDedupedProcessingReconcileState(): void;
  claimResumeAttempt(now: number, minIntervalMs: number): boolean;
  markRunActivity(activityAt?: number | null): void;
  clearRunActivity(): void;
  getRunInactivityMs(now?: number): number;
  isStalledRunRecoveryInFlight(): boolean;
  beginStalledRunRecovery(now: number): void;
  finishStalledRunRecovery(): void;
  getLastStalledRunSyncAt(): number;
  resetStalledRunRecovery(): void;
}

export default function useBuildRunOrchestration<
  TQueuedRequest,
  TRunEvent
>() {
  const dedupedProcessingReconcileRequestIdRef = useRef<string | null>(null);
  const dedupedProcessingReconcileTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const queuedRequestsRef = useRef<TQueuedRequest[]>([]);
  const dedupedProcessingInFlightRef = useRef(false);
  const generatingRef = useRef(false);
  const postCompleteSyncInFlightRef = useRef(false);
  const pendingRunStartEventsRef = useRef<TRunEvent[]>([]);
  const startingGenerationRef = useRef(false);
  const queuePausedForSaveRef = useRef(false);
  const requiresProjectFilesResyncBeforeSaveRef = useRef(false);
  const userRequestedStopRef = useRef(false);
  const lastResumeAttemptAtRef = useRef(0);
  const lastRunActivityAtRef = useRef(0);
  const stalledRunRecoveryInFlightRef = useRef(false);
  const lastStalledRunSyncAtRef = useRef(0);
  const apiRef = useRef<
    BuildRunOrchestrationApi<TQueuedRequest, TRunEvent> | null
  >(null);

  if (!apiRef.current) {
    function clearDedupedProcessingReconcileTimer() {
      if (!dedupedProcessingReconcileTimerRef.current) return;
      clearTimeout(dedupedProcessingReconcileTimerRef.current);
      dedupedProcessingReconcileTimerRef.current = null;
    }

    function claimDedupedProcessingRecoveryRequest(
      requestId?: string | null
    ) {
      const normalizedRequestId = String(requestId || '').trim();
      if (!normalizedRequestId) {
        apiRef.current?.resetDedupedProcessingReconcileState();
        return '';
      }
      dedupedProcessingInFlightRef.current = true;
      dedupedProcessingReconcileRequestIdRef.current = normalizedRequestId;
      clearDedupedProcessingReconcileTimer();
      return normalizedRequestId;
    }

    apiRef.current = {
      reset() {
        clearDedupedProcessingReconcileTimer();
        pendingRunStartEventsRef.current = [];
        queuedRequestsRef.current = [];
        dedupedProcessingInFlightRef.current = false;
        generatingRef.current = false;
        postCompleteSyncInFlightRef.current = false;
        startingGenerationRef.current = false;
        queuePausedForSaveRef.current = false;
        requiresProjectFilesResyncBeforeSaveRef.current = false;
        userRequestedStopRef.current = false;
        dedupedProcessingReconcileRequestIdRef.current = null;
        lastResumeAttemptAtRef.current = 0;
        lastRunActivityAtRef.current = 0;
        stalledRunRecoveryInFlightRef.current = false;
        lastStalledRunSyncAtRef.current = 0;
      },

      markCurrentPageRunActive() {
        generatingRef.current = true;
      },

      clearCurrentPageRunActive() {
        generatingRef.current = false;
      },

      hasCurrentPageRunActivity() {
        return generatingRef.current;
      },

      setPostCompleteSyncInFlight(inFlight: boolean) {
        postCompleteSyncInFlightRef.current = inFlight;
      },

      isPostCompleteSyncInFlight() {
        return postCompleteSyncInFlightRef.current;
      },

      setStartingGeneration(inFlight: boolean) {
        startingGenerationRef.current = inFlight;
      },

      isStartingGeneration() {
        return startingGenerationRef.current;
      },

      clearPendingRunStartEvents() {
        pendingRunStartEventsRef.current = [];
      },

      bufferPendingRunStartEvent(event: TRunEvent, limit = 40) {
        const normalizedLimit = Math.max(1, Math.floor(Number(limit) || 0));
        pendingRunStartEventsRef.current = [
          ...pendingRunStartEventsRef.current,
          event
        ].slice(-normalizedLimit);
      },

      consumePendingRunStartEvents() {
        const bufferedEvents = [...pendingRunStartEventsRef.current];
        pendingRunStartEventsRef.current = [];
        return bufferedEvents;
      },

      getQueuedRequests() {
        return queuedRequestsRef.current;
      },

      setQueuedRequests(next: TQueuedRequest[]) {
        queuedRequestsRef.current = next;
      },

      setQueuePausedForSave(paused: boolean) {
        queuePausedForSaveRef.current = paused;
      },

      isQueuePausedForSave() {
        return queuePausedForSaveRef.current;
      },

      setRequiresProjectFilesResyncBeforeSave(required: boolean) {
        requiresProjectFilesResyncBeforeSaveRef.current = required;
      },

      requiresProjectFilesResyncBeforeSave() {
        return requiresProjectFilesResyncBeforeSaveRef.current;
      },

      setUserRequestedStop(requested: boolean) {
        userRequestedStopRef.current = requested;
      },

      didUserRequestStop() {
        return userRequestedStopRef.current;
      },

      isDedupedProcessingInFlight(requestId?: string | null) {
        if (!dedupedProcessingInFlightRef.current) {
          return false;
        }
        const normalizedRequestId = String(requestId || '').trim();
        if (!normalizedRequestId) {
          return true;
        }
        return (
          String(dedupedProcessingReconcileRequestIdRef.current || '').trim() ===
          normalizedRequestId
        );
      },

      getDedupedProcessingRequestId() {
        return String(dedupedProcessingReconcileRequestIdRef.current || '');
      },

      beginDedupedProcessingRecovery(requestId?: string | null) {
        return claimDedupedProcessingRecoveryRequest(requestId);
      },

      scheduleDedupedProcessingReconcile({
        requestId,
        delayMs,
        onReconcile
      }: DedupedProcessingReconcileScheduleOptions) {
        const normalizedRequestId =
          claimDedupedProcessingRecoveryRequest(requestId);
        if (!normalizedRequestId) {
          return;
        }
        dedupedProcessingReconcileTimerRef.current = setTimeout(() => {
          onReconcile(normalizedRequestId);
        }, Math.max(0, Math.floor(Number(delayMs) || 0)));
      },

      resetDedupedProcessingReconcileState() {
        clearDedupedProcessingReconcileTimer();
        dedupedProcessingInFlightRef.current = false;
        dedupedProcessingReconcileRequestIdRef.current = null;
      },

      claimResumeAttempt(now: number, minIntervalMs: number) {
        if (now - lastResumeAttemptAtRef.current < minIntervalMs) {
          return false;
        }
        lastResumeAttemptAtRef.current = now;
        return true;
      },

      markRunActivity(activityAt?: number | null) {
        const normalizedActivityAt = Number(activityAt || 0);
        lastRunActivityAtRef.current =
          normalizedActivityAt > 0 ? normalizedActivityAt : Date.now();
      },

      clearRunActivity() {
        lastRunActivityAtRef.current = 0;
      },

      getRunInactivityMs(now = Date.now()) {
        return now - Number(lastRunActivityAtRef.current || 0);
      },

      isStalledRunRecoveryInFlight() {
        return stalledRunRecoveryInFlightRef.current;
      },

      beginStalledRunRecovery(now: number) {
        stalledRunRecoveryInFlightRef.current = true;
        lastStalledRunSyncAtRef.current = now;
      },

      finishStalledRunRecovery() {
        stalledRunRecoveryInFlightRef.current = false;
      },

      getLastStalledRunSyncAt() {
        return lastStalledRunSyncAtRef.current;
      },

      resetStalledRunRecovery() {
        stalledRunRecoveryInFlightRef.current = false;
        lastStalledRunSyncAtRef.current = 0;
      }
    };
  }

  useEffect(() => {
    return () => {
      apiRef.current?.resetDedupedProcessingReconcileState();
    };
  }, []);

  return apiRef.current;
}

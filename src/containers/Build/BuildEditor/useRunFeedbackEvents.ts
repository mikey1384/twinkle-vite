import { useState } from 'react';
import type { BuildRunEvent } from './types';
import type { SharedBuildRunIdentityState } from './useBuildRunIdentity';

interface RunFeedbackOrchestrationApi {
  clearPendingRunStartEvents(): void;
  consumePendingRunStartEvents(): BuildRunEvent[];
  bufferPendingRunStartEvent(event: BuildRunEvent, limit?: number): void;
  isPostCompleteSyncInFlight(): boolean;
  isStartingGeneration(): boolean;
}

interface AppendLocalRunEventOptions {
  kind: BuildRunEvent['kind'];
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface UseRunFeedbackEventsOptions {
  getActiveBuildId: () => number;
  getCurrentActiveRunRequestId: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getCurrentSharedRunState: () => SharedBuildRunIdentityState | null;
  onAppendBuildRunEvent: (options: {
    buildId: number;
    requestId: string;
    event: BuildRunEvent;
  }) => void;
  runOrchestration: RunFeedbackOrchestrationApi;
  shouldHoldTerminalSharedBuildRun: (requestId: string) => boolean;
}

export default function useRunFeedbackEvents({
  getActiveBuildId,
  getCurrentActiveRunRequestId,
  getCurrentSharedRunState,
  onAppendBuildRunEvent,
  runOrchestration,
  shouldHoldTerminalSharedBuildRun
}: UseRunFeedbackEventsOptions) {
  const [pageFeedbackEvents, setPageFeedbackEvents] = useState<BuildRunEvent[]>(
    []
  );

  function clearBufferedRunStartEvents() {
    runOrchestration.clearPendingRunStartEvents();
  }

  function flushBufferedRunStartEvents(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    const buildId = getActiveBuildId();
    const bufferedEvents = runOrchestration.consumePendingRunStartEvents();
    if (!normalizedRequestId || !Number.isFinite(buildId) || buildId <= 0) {
      return;
    }
    for (const event of bufferedEvents) {
      onAppendBuildRunEvent({
        buildId,
        requestId: normalizedRequestId,
        event
      });
    }
  }

  function flushBufferedRunStartEventsToPageFeedback() {
    const bufferedEvents = runOrchestration.consumePendingRunStartEvents();
    if (!bufferedEvents.length) {
      return;
    }
    setPageFeedbackEvents((prev) => {
      let nextEvents = prev;
      for (const event of bufferedEvents) {
        const lastEvent = nextEvents[nextEvents.length - 1];
        if (
          lastEvent &&
          lastEvent.kind === event.kind &&
          lastEvent.phase === event.phase &&
          lastEvent.message === event.message
        ) {
          nextEvents = [...nextEvents.slice(0, -1), event];
          continue;
        }
        nextEvents = [...nextEvents, event].slice(-8);
      }
      return nextEvents;
    });
  }

  function resolveBuildRunEventTargetRequestId(
    sharedRunState = getCurrentSharedRunState()
  ) {
    const activeRequestId = getCurrentActiveRunRequestId(sharedRunState);
    if (activeRequestId) {
      return activeRequestId;
    }
    const sharedRequestId = String(sharedRunState?.requestId || '').trim();
    if (!sharedRequestId) {
      return '';
    }
    if (
      sharedRunState?.generating ||
      runOrchestration.isPostCompleteSyncInFlight() ||
      shouldHoldTerminalSharedBuildRun(sharedRequestId)
    ) {
      return sharedRequestId;
    }
    return '';
  }

  function appendPageFeedbackEvent(event: BuildRunEvent) {
    setPageFeedbackEvents((prev) => {
      const lastEvent = prev[prev.length - 1];
      if (
        lastEvent &&
        lastEvent.kind === event.kind &&
        lastEvent.phase === event.phase &&
        lastEvent.message === event.message
      ) {
        return [...prev.slice(0, -1), event];
      }
      return [...prev, event].slice(-8);
    });
  }

  function appendLocalRunEvent({
    kind,
    phase,
    message,
    targetRequestId = null,
    pageFeedbackOnMissingRequestId = false
  }: AppendLocalRunEventOptions) {
    const createdAt = Date.now();
    const explicitRequestId = String(targetRequestId || '').trim();
    const nextEvent: BuildRunEvent = {
      id: `${createdAt}-${kind}-${message}`,
      kind,
      phase,
      message,
      createdAt
    };
    if (explicitRequestId) {
      onAppendBuildRunEvent({
        buildId: getActiveBuildId(),
        requestId: explicitRequestId,
        event: nextEvent
      });
      return;
    }
    if (pageFeedbackOnMissingRequestId) {
      appendPageFeedbackEvent(nextEvent);
      return;
    }
    const requestId = resolveBuildRunEventTargetRequestId();
    if (requestId) {
      onAppendBuildRunEvent({
        buildId: getActiveBuildId(),
        requestId,
        event: nextEvent
      });
      return;
    }
    if (runOrchestration.isStartingGeneration()) {
      runOrchestration.bufferPendingRunStartEvent(nextEvent);
    }
  }

  function resetPageFeedbackEvents() {
    setPageFeedbackEvents([]);
  }

  return {
    appendLocalRunEvent,
    clearBufferedRunStartEvents,
    flushBufferedRunStartEvents,
    flushBufferedRunStartEventsToPageFeedback,
    pageFeedbackEvents,
    resetPageFeedbackEvents
  };
}

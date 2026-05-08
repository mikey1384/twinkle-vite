import type {
  BuildRunMode,
  SharedBuildRunIdentityState
} from './useBuildRunIdentity';

interface CurrentRunIdentityApi {
  getCurrentActiveRunRequestId(
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): string;
  getCurrentRunRequestId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): string;
  getCurrentRunMode(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ): BuildRunMode;
  getCurrentActiveUserMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
  getCurrentActiveAssistantMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
}

interface CurrentRunOrchestrationApi {
  markCurrentPageRunActive(): void;
  clearCurrentPageRunActive(): void;
  hasCurrentPageRunActivity(): boolean;
  isStartingGeneration(): boolean;
  isDedupedProcessingInFlight(requestId?: string | null): boolean;
  isPostCompleteSyncInFlight(): boolean;
}

interface UseCurrentRunIdentityOptions {
  currentSharedRunIdentityState: SharedBuildRunIdentityState | null;
  runIdentity: CurrentRunIdentityApi;
  runOrchestration: CurrentRunOrchestrationApi;
}

export default function useCurrentRunIdentity({
  currentSharedRunIdentityState,
  runIdentity,
  runOrchestration
}: UseCurrentRunIdentityOptions) {
  function getCurrentActiveRunRequestId(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentActiveRunRequestId(
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function getCurrentRunRequestId(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentRunRequestId(
      requestId,
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function getCurrentRunMode(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ): BuildRunMode {
    return runIdentity.getCurrentRunMode(requestId, sharedRunState);
  }

  function getCurrentActiveUserMessageId(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentActiveUserMessageId(
      requestId,
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function getCurrentActiveAssistantMessageId(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentActiveAssistantMessageId(
      requestId,
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function markCurrentPageRunActivityActive() {
    runOrchestration.markCurrentPageRunActive();
  }

  function clearCurrentPageRunActivity() {
    runOrchestration.clearCurrentPageRunActive();
  }

  function getCurrentPageRunActivityRequestId(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return getCurrentActiveRunRequestId(sharedRunState);
  }

  function hasCurrentPageRunActivity(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return Boolean(getCurrentPageRunActivityRequestId(sharedRunState));
  }

  function hasSharedGeneratingRun(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return Boolean(sharedRunState?.generating);
  }

  function isRunActivityInFlight({
    includeBootstrap = true,
    sharedRunState = currentSharedRunIdentityState
  }: {
    includeBootstrap?: boolean;
    sharedRunState?: SharedBuildRunIdentityState | null;
  } = {}) {
    return (
      (includeBootstrap && runOrchestration.isStartingGeneration()) ||
      hasSharedGeneratingRun(sharedRunState) ||
      runOrchestration.isDedupedProcessingInFlight() ||
      hasCurrentPageRunActivity(sharedRunState) ||
      runOrchestration.isPostCompleteSyncInFlight()
    );
  }

  return {
    clearCurrentPageRunActivity,
    getCurrentActiveAssistantMessageId,
    getCurrentActiveRunRequestId,
    getCurrentActiveUserMessageId,
    getCurrentPageRunActivityRequestId,
    getCurrentRunMode,
    getCurrentRunRequestId,
    hasCurrentPageRunActivity,
    isRunActivityInFlight,
    markCurrentPageRunActivityActive
  };
}

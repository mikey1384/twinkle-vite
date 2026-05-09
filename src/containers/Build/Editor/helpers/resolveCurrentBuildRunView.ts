import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import type {
  BuildRunMode,
  SharedBuildRunIdentityState
} from '../hooks/useRunIdentity';
import { resolveBuildFollowUpPromptKey } from './promptBindings';
import type {
  Build,
  CurrentBuildRunView
} from '../types';

function getActiveStreamMessageIds({
  getCurrentActiveAssistantMessageId,
  getCurrentActiveUserMessageId,
  sharedRunState
}: {
  getCurrentActiveAssistantMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentActiveUserMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  sharedRunState: SharedBuildRunIdentityState | null;
}) {
  return [
    getCurrentActiveUserMessageId(undefined, sharedRunState),
    getCurrentActiveAssistantMessageId(undefined, sharedRunState)
  ].filter((id): id is number => typeof id === 'number' && id > 0);
}

export default function resolveCurrentBuildRunView({
  build,
  currentSharedRunIdentityState,
  dismissedFollowUpPromptKey,
  getCurrentActiveAssistantMessageId,
  getCurrentActiveRunRequestId,
  getCurrentActiveUserMessageId,
  getCurrentRunMode,
  hasCurrentPageRunActivity,
  sharedBuildRun
}: {
  build: Build;
  currentSharedRunIdentityState: SharedBuildRunIdentityState | null;
  dismissedFollowUpPromptKey: string;
  getCurrentActiveAssistantMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentActiveRunRequestId: (
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => string;
  getCurrentActiveUserMessageId: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => number | null;
  getCurrentRunMode: (
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ) => BuildRunMode;
  hasCurrentPageRunActivity: boolean;
  sharedBuildRun: BuildLiveRunState | null;
}): CurrentBuildRunView {
  const sharedRunHasExecutionPlan =
    Boolean(sharedBuildRun) &&
    Object.prototype.hasOwnProperty.call(sharedBuildRun, 'executionPlan');
  const sharedRunHasFollowUpPrompt =
    Boolean(sharedBuildRun) &&
    Object.prototype.hasOwnProperty.call(sharedBuildRun, 'followUpPrompt');
  const sharedRunHasRuntimeExplorationPlan =
    Boolean(sharedBuildRun) &&
    Object.prototype.hasOwnProperty.call(sharedBuildRun, 'runtimeExplorationPlan');
  const sharedFirstExecutionPlan = sharedRunHasExecutionPlan
    ? (sharedBuildRun?.executionPlan ?? null)
    : (build.executionPlan ?? null);
  const sharedFirstFollowUpPrompt = sharedRunHasFollowUpPrompt
    ? (sharedBuildRun?.followUpPrompt ?? null)
    : (build.followUpPrompt ?? null);
  const sharedFirstRuntimeExplorationPlan =
    sharedRunHasRuntimeExplorationPlan
      ? (sharedBuildRun?.runtimeExplorationPlan ?? null)
      : (build.runtimeExplorationPlan ?? null);
  const sharedGeneratingRun = sharedBuildRun?.generating
    ? sharedBuildRun
    : null;
  const activeRequestId = getCurrentActiveRunRequestId(
    currentSharedRunIdentityState
  );
  const hasLocalGeneratingRun =
    !sharedGeneratingRun &&
    hasCurrentPageRunActivity &&
    Boolean(activeRequestId);
  const followUpPromptKey = resolveBuildFollowUpPromptKey(
    sharedFirstFollowUpPrompt
  );

  return {
    requestId: activeRequestId || String(sharedBuildRun?.requestId || '').trim() || null,
    runMode:
      sharedBuildRun?.runMode ||
      (activeRequestId
        ? getCurrentRunMode(activeRequestId, currentSharedRunIdentityState)
        : 'user'),
    generating: Boolean(sharedGeneratingRun) || hasLocalGeneratingRun,
    status: sharedBuildRun?.status ?? null,
    assistantStatusSteps: sharedBuildRun?.assistantStatusSteps || [],
    usageMetrics: sharedBuildRun?.usageMetrics || {},
    runEvents: Array.isArray(sharedBuildRun?.runEvents)
      ? sharedBuildRun.runEvents
      : [],
    streamingProjectFiles: sharedGeneratingRun?.streamingProjectFiles ?? null,
    streamingFocusFilePath:
      sharedGeneratingRun?.streamingFocusFilePath ?? null,
    error:
      typeof sharedBuildRun?.error === 'string' && sharedBuildRun.error.trim()
        ? sharedBuildRun.error
        : null,
    terminalState: sharedBuildRun?.terminalState ?? null,
    executionPlan: sharedFirstExecutionPlan,
    followUpPrompt:
      followUpPromptKey && followUpPromptKey === dismissedFollowUpPromptKey
        ? null
        : sharedFirstFollowUpPrompt,
    runtimeExplorationPlan: sharedFirstRuntimeExplorationPlan,
    activeStreamMessageIds: sharedGeneratingRun
      ? [
          getCurrentActiveUserMessageId(
            sharedGeneratingRun.requestId,
            currentSharedRunIdentityState
          ),
          getCurrentActiveAssistantMessageId(
            sharedGeneratingRun.requestId,
            currentSharedRunIdentityState
          )
        ].filter((id): id is number => typeof id === 'number' && id > 0)
      : getActiveStreamMessageIds({
          getCurrentActiveAssistantMessageId,
          getCurrentActiveUserMessageId,
          sharedRunState: currentSharedRunIdentityState
        })
  };
}

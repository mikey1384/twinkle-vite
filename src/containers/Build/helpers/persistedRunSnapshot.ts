import type {
  BuildLiveRunActionPayload,
  BuildLiveRunEvent,
  BuildLiveRunMessage,
  BuildLiveRunState
} from '~/contexts/Build/reducer';
import {
  getBuildResumeRunStateReplayKey,
  normalizeBuildResumeRunState,
  replayBuildResumeRunState,
  type BuildResumeRunStateNormalizedStreamUpdate,
  type BuildResumeRunStatePayload,
  type NormalizedBuildResumeRunState
} from '~/contexts/Build/resumeRunState';
import {
  getBuildRunEventLogicalIdentity,
  normalizeBuildRunEventCreatedAt
} from '~/contexts/Build/runEventIdentity';
import { createFallbackBuildRunMessageId } from '~/contexts/Build/messageIdentity';

function normalizeBuildRunProjectFilePathForComparison(rawPath: string) {
  const trimmedPath = String(rawPath || '').trim().replace(/\\/g, '/');
  if (!trimmedPath) return null;
  const normalized = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  return normalized.replace(/\/{2,}/g, '/');
}

function normalizeBuildRunProjectFilesForComparison(
  projectFiles?: Array<{ path: string; content?: string }> | null
) {
  const mergedFiles = new Map<string, string>();
  for (const file of projectFiles || []) {
    if (!file || typeof file !== 'object') continue;
    const normalizedPath = normalizeBuildRunProjectFilePathForComparison(
      String(file.path || '')
    );
    if (!normalizedPath) continue;
    mergedFiles.set(
      normalizedPath,
      typeof file.content === 'string' ? file.content : ''
    );
  }
  return Array.from(mergedFiles.entries())
    .map(([path, content]) => ({
      path,
      content
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function projectFilesContainSnapshot(
  currentProjectFiles?: Array<{ path: string; content?: string }> | null,
  snapshotProjectFiles?: Array<{ path: string; content?: string }> | null
) {
  const currentProjectFileMap = new Map(
    normalizeBuildRunProjectFilesForComparison(currentProjectFiles).map((file) => [
      file.path,
      file.content
    ])
  );

  for (const file of normalizeBuildRunProjectFilesForComparison(
    snapshotProjectFiles
  )) {
    if (currentProjectFileMap.get(file.path) !== file.content) {
      return false;
    }
  }

  return true;
}

function projectFilesExactlyMatchSnapshot(
  currentProjectFiles?: Array<{ path: string; content?: string }> | null,
  snapshotProjectFiles?: Array<{ path: string; content?: string }> | null
) {
  return arraysEqual(
    normalizeBuildRunProjectFilesForComparison(currentProjectFiles),
    normalizeBuildRunProjectFilesForComparison(snapshotProjectFiles),
    (currentFile, snapshotFile) =>
      currentFile.path === snapshotFile.path &&
      currentFile.content === snapshotFile.content
  );
}

function normalizeBuildRunMessageForSharedState(
  message: any
): BuildLiveRunMessage | null {
  if (!message || typeof message !== 'object') return null;
  return {
    ...message,
    persisted: true
  };
}

function findPersistedBuildRunMessage(
  chatMessages: any[],
  messageId?: number | null
) {
  const normalizedMessageId = Number(messageId || 0);
  if (normalizedMessageId <= 0) return null;
  return (
    chatMessages.find(
      (entry: any) => Number(entry?.id || 0) === normalizedMessageId
    ) || null
  );
}

function createFallbackPersistedAssistantMessage({
  assistantMessageId,
  assistantMessageCreatedAt,
  assistantClientMessageId
}: {
  assistantMessageId?: number | null;
  assistantMessageCreatedAt?: number | null;
  assistantClientMessageId?: string | null;
}) {
  const normalizedAssistantMessageId = Number(assistantMessageId || 0);
  const normalizedAssistantClientMessageId = String(
    assistantClientMessageId || ''
  ).trim();
  if (normalizedAssistantMessageId > 0) {
    return null;
  }
  if (!normalizedAssistantClientMessageId) return null;
  return {
    id: createFallbackBuildRunMessageId(),
    role: 'assistant' as const,
    content: '',
    codeGenerated: null,
    billingState: null,
    streamCodePreview: null,
    artifactVersionId: null,
    clientMessageId: normalizedAssistantClientMessageId || null,
    createdAt:
      Number(assistantMessageCreatedAt || 0) > 0
        ? Number(assistantMessageCreatedAt)
        : Math.floor(Date.now() / 1000),
    persisted: false
  };
}

function createFallbackPersistedUserMessage({
  userMessageId,
  userMessageContent,
  userClientMessageId
}: {
  userMessageId?: number | null;
  userMessageContent?: string | null;
  userClientMessageId?: string | null;
}) {
  const normalizedUserClientMessageId = String(
    userClientMessageId || ''
  ).trim();
  if (Number(userMessageId || 0) > 0) {
    return null;
  }
  if (
    typeof userMessageContent !== 'string' &&
    !normalizedUserClientMessageId
  ) {
    return null;
  }
  return {
    id: createFallbackBuildRunMessageId(),
    role: 'user' as const,
    content: typeof userMessageContent === 'string' ? userMessageContent : '',
    codeGenerated: null,
    billingState: null,
    streamCodePreview: null,
    artifactVersionId: null,
    clientMessageId: normalizedUserClientMessageId || null,
    createdAt: Math.floor(Date.now() / 1000),
    persisted: false
  };
}

function arraysEqual<T>(
  currentEntries: T[],
  snapshotEntries: T[],
  isEqual: (currentEntry: T, snapshotEntry: T) => boolean
) {
  if (currentEntries.length !== snapshotEntries.length) return false;
  return snapshotEntries.every((snapshotEntry, index) => {
    return isEqual(currentEntries[index], snapshotEntry);
  });
}

function buildRunEventsPayloadEqual(
  currentEvent: BuildLiveRunEvent,
  snapshotEvent: BuildLiveRunEvent
) {
  return (
    currentEvent.kind === snapshotEvent.kind &&
    currentEvent.phase === snapshotEvent.phase &&
    currentEvent.message === snapshotEvent.message &&
    currentEvent.createdAt === snapshotEvent.createdAt &&
    Boolean(currentEvent.deduped) === Boolean(snapshotEvent.deduped) &&
    JSON.stringify(currentEvent.details || null) ===
      JSON.stringify(snapshotEvent.details || null) &&
      JSON.stringify(currentEvent.usage || null) ===
      JSON.stringify(snapshotEvent.usage || null)
  );
}

function isBuildRunEventComparableObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildRunEventSnapshotValueMatchesCurrentValue(
  currentValue: unknown,
  snapshotValue: unknown
): boolean {
  if (Array.isArray(snapshotValue)) {
    return (
      Array.isArray(currentValue) &&
      currentValue.length === snapshotValue.length &&
      snapshotValue.every((entry, index) => {
        return buildRunEventSnapshotValueMatchesCurrentValue(
          currentValue[index],
          entry
        );
      })
    );
  }

  if (isBuildRunEventComparableObject(snapshotValue)) {
    if (!isBuildRunEventComparableObject(currentValue)) {
      return false;
    }

    return Object.entries(snapshotValue).every(([key, nestedSnapshotValue]) => {
      return buildRunEventSnapshotValueMatchesCurrentValue(
        currentValue[key],
        nestedSnapshotValue
      );
    });
  }

  return currentValue === snapshotValue;
}

function buildRunEventDetailsCoverSnapshotDetails(
  currentDetails?: Record<string, any> | null,
  snapshotDetails?: Record<string, any> | null
) {
  if (!snapshotDetails) return true;
  if (!currentDetails) return false;
  return buildRunEventSnapshotValueMatchesCurrentValue(
    currentDetails,
    snapshotDetails
  );
}

function buildRunEventUsageSnapshotValueCoveredByCurrentValue(
  currentValue: unknown,
  snapshotValue: unknown
): boolean {
  if (typeof snapshotValue === 'number') {
    return (
      typeof currentValue === 'number' &&
      Number.isFinite(currentValue) &&
      currentValue >= snapshotValue
    );
  }

  if (Array.isArray(snapshotValue)) {
    return (
      Array.isArray(currentValue) &&
      currentValue.length === snapshotValue.length &&
      snapshotValue.every((entry, index) => {
        return buildRunEventUsageSnapshotValueCoveredByCurrentValue(
          currentValue[index],
          entry
        );
      })
    );
  }

  if (isBuildRunEventComparableObject(snapshotValue)) {
    if (!isBuildRunEventComparableObject(currentValue)) {
      return false;
    }

    return Object.entries(snapshotValue).every(([key, nestedSnapshotValue]) => {
      return buildRunEventUsageSnapshotValueCoveredByCurrentValue(
        currentValue[key],
        nestedSnapshotValue
      );
    });
  }

  return currentValue === snapshotValue;
}

function buildRunEventUsageCoversSnapshotUsage(
  currentUsage?: Record<string, any> | null,
  snapshotUsage?: Record<string, any> | null
) {
  if (!snapshotUsage) return true;
  if (!currentUsage) return false;
  return buildRunEventUsageSnapshotValueCoveredByCurrentValue(
    currentUsage,
    snapshotUsage
  );
}

function isBuildRunEventCoveredByCurrentEvent(
  currentEvent: BuildLiveRunEvent,
  snapshotEvent: BuildLiveRunEvent
) {
  const snapshotEventIdentity = getBuildRunEventLogicalIdentity(snapshotEvent);
  if (snapshotEventIdentity.hasStableId) {
    const currentEventIdentity = getBuildRunEventLogicalIdentity(currentEvent);
    if (
      !currentEventIdentity.hasStableId ||
      currentEventIdentity.key !== snapshotEventIdentity.key
    ) {
      return false;
    }

    // Verified in twinkle-api/socket/build.ts: duplicate compaction rewrites the
    // stored channel snapshot entry in place, keeping the original event id while
    // refreshing createdAt/deduped/details/usage from the newer emission.
    if (
      normalizeBuildRunEventCreatedAt(currentEvent.createdAt) <
      normalizeBuildRunEventCreatedAt(snapshotEvent.createdAt)
    ) {
      return false;
    }

    if (
      currentEvent.kind !== snapshotEvent.kind ||
      currentEvent.phase !== snapshotEvent.phase ||
      currentEvent.message !== snapshotEvent.message
    ) {
      return false;
    }

    if (Boolean(currentEvent.deduped) !== Boolean(snapshotEvent.deduped)) {
      return false;
    }

    if (
      !buildRunEventDetailsCoverSnapshotDetails(
        currentEvent.details,
        snapshotEvent.details
      )
    ) {
      return false;
    }

    if (
      !buildRunEventUsageCoversSnapshotUsage(
        currentEvent.usage,
        snapshotEvent.usage
      )
    ) {
      return false;
    }

    return true;
  }

  return buildRunEventsPayloadEqual(currentEvent, snapshotEvent);
}

function hasUsageMetricsCoverage(
  currentUsageMetrics: BuildLiveRunState['usageMetrics'],
  snapshotUsageMetrics: NormalizedBuildResumeRunState['usageMetrics']
) {
  return Object.values(snapshotUsageMetrics).every((snapshotMetric) => {
    const currentMetric = currentUsageMetrics[snapshotMetric.stage];
    if (!currentMetric) return false;
    return (
      currentMetric.model === snapshotMetric.model &&
      currentMetric.inputTokens >= snapshotMetric.inputTokens &&
      currentMetric.outputTokens >= snapshotMetric.outputTokens &&
      currentMetric.totalTokens >= snapshotMetric.totalTokens
    );
  });
}

function hasRunEventsCoverage(
  currentRunEvents: BuildLiveRunEvent[],
  snapshotRunEvents: BuildLiveRunEvent[]
) {
  if (snapshotRunEvents.length === 0) return true;
  let searchStartIndex = 0;

  for (const snapshotEvent of snapshotRunEvents) {
    const currentEventIndex = currentRunEvents.findIndex((event, index) => {
      if (index < searchStartIndex) {
        return false;
      }
      return isBuildRunEventCoveredByCurrentEvent(event, snapshotEvent);
    });
    if (currentEventIndex < 0) {
      return false;
    }
    searchStartIndex = currentEventIndex + 1;
  }

  return true;
}

function textCoversSnapshot(currentText: unknown, snapshotText: string) {
  const normalizedCurrentText =
    typeof currentText === 'string' ? currentText : '';
  return (
    normalizedCurrentText === snapshotText ||
    normalizedCurrentText.startsWith(snapshotText)
  );
}

function streamUpdateCoveredByCurrentRun(
  currentRun: BuildLiveRunState,
  streamUpdate: BuildResumeRunStateNormalizedStreamUpdate | null
) {
  if (!streamUpdate) return true;

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'baseProjectFiles') &&
    !projectFilesExactlyMatchSnapshot(
      currentRun.baseProjectFiles,
      streamUpdate.baseProjectFiles ?? []
    )
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'reply') &&
    typeof streamUpdate.reply === 'string' &&
    !textCoversSnapshot(currentRun.assistantMessage?.content, streamUpdate.reply)
  ) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(streamUpdate, 'codeGenerated')) {
    const currentCodeGenerated =
      currentRun.assistantMessage?.streamCodePreview ?? null;
    const snapshotCodeGenerated = streamUpdate.codeGenerated ?? null;
    if (
      snapshotCodeGenerated !== null &&
      !textCoversSnapshot(currentCodeGenerated, snapshotCodeGenerated)
    ) {
      return false;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'userMessageId') &&
    Number(streamUpdate.userMessageId || 0) > 0 &&
    Number(currentRun.userMessage?.id || 0) !== Number(streamUpdate.userMessageId)
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'userClientMessageId') &&
    String(streamUpdate.userClientMessageId || '').trim() &&
    String(currentRun.userMessage?.clientMessageId || '').trim() !==
      String(streamUpdate.userClientMessageId || '').trim()
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'userMessageContent') &&
    typeof streamUpdate.userMessageContent === 'string' &&
    !textCoversSnapshot(currentRun.userMessage?.content, streamUpdate.userMessageContent)
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      streamUpdate,
      'assistantClientMessageId'
    ) &&
    String(streamUpdate.assistantClientMessageId || '').trim() &&
    String(currentRun.assistantMessage?.clientMessageId || '').trim() !==
      String(streamUpdate.assistantClientMessageId || '').trim()
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'assistantMessageId') &&
    Number(streamUpdate.assistantMessageId || 0) > 0 &&
    Number(currentRun.assistantMessage?.id || 0) !==
      Number(streamUpdate.assistantMessageId)
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      streamUpdate,
      'assistantMessageCreatedAt'
    ) &&
    Number(streamUpdate.assistantMessageCreatedAt || 0) > 0 &&
    Number(currentRun.assistantMessage?.createdAt || 0) !==
      Number(streamUpdate.assistantMessageCreatedAt)
  ) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(streamUpdate, 'projectFiles')) {
    const currentProjectFiles =
      streamUpdate.projectFilesPersisted === true
        ? currentRun.baseProjectFiles
        : currentRun.streamingProjectFiles;
    const projectFilesMatch =
      streamUpdate.projectFilesMode === 'snapshot'
        ? projectFilesExactlyMatchSnapshot(
            currentProjectFiles,
            streamUpdate.projectFiles ?? []
          )
        : projectFilesContainSnapshot(
            currentProjectFiles,
            streamUpdate.projectFiles
          );
    if (!projectFilesMatch) {
      return false;
    }
    if (
      streamUpdate.projectFilesPersisted !== true &&
      Object.prototype.hasOwnProperty.call(streamUpdate, 'projectFilesFocusPath') &&
      (currentRun.streamingFocusFilePath || null) !==
        (streamUpdate.projectFilesFocusPath || null)
    ) {
      return false;
    }
  }

  return true;
}

function terminalSnapshotCoveredByCurrentRun(
  currentRun: BuildLiveRunState,
  normalized: NormalizedBuildResumeRunState
) {
  const terminal = normalized.terminal;
  if (!terminal || currentRun.generating) return false;
  if (currentRun.terminalState !== terminal.type) return false;

  const terminalPayload = terminal.payload || {};
  if (terminal.type === 'complete') {
    if (
      typeof terminalPayload.assistantText === 'string' &&
      String(currentRun.assistantMessage?.content || '') !==
        terminalPayload.assistantText
    ) {
      return false;
    }

    const expectedAssistantMessageId = Number(terminalPayload?.message?.id || 0);
    if (
      expectedAssistantMessageId > 0 &&
      Number(currentRun.assistantMessage?.id || 0) !== expectedAssistantMessageId
    ) {
      return false;
    }

    const expectedUserMessageId = Number(
      terminalPayload?.message?.userMessageId || 0
    );
    if (
      expectedUserMessageId > 0 &&
      Number(currentRun.userMessage?.id || 0) !== expectedUserMessageId
    ) {
      return false;
    }

    const expectedArtifactVersionId = Number(
      terminalPayload?.message?.artifactVersionId ||
        terminalPayload?.artifact?.versionId ||
        0
    );
    if (
      expectedArtifactVersionId > 0 &&
      Number(currentRun.assistantMessage?.artifactVersionId || 0) !==
        expectedArtifactVersionId
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(terminalPayload, 'code') &&
      (currentRun.assistantMessage?.codeGenerated ?? null) !==
        (terminalPayload.code ?? null)
    ) {
      return false;
    }

    if (
      Array.isArray(terminalPayload.projectFiles) &&
      terminalPayload.projectFiles.length > 0 &&
      !projectFilesContainSnapshot(
        currentRun.baseProjectFiles,
        terminalPayload.projectFiles
      )
    ) {
      return false;
    }

    return true;
  }

  if (terminal.type === 'error') {
    const expectedError = String(terminalPayload.error || '').trim();
    return !expectedError || currentRun.error === expectedError;
  }

  if (
    typeof terminalPayload.assistantText === 'string' &&
    String(currentRun.assistantMessage?.content || '') !==
      terminalPayload.assistantText
  ) {
    return false;
  }

  return true;
}

export function isPersistedSnapshotEquivalentOrNewer({
  currentRun,
  normalized
}: {
  currentRun: BuildLiveRunState | null;
  normalized: NormalizedBuildResumeRunState;
}) {
  const normalizedRequestId = String(normalized.requestId || '').trim();
  if (!normalizedRequestId || !currentRun) return false;
  if (String(currentRun.requestId || '').trim() !== normalizedRequestId) {
    return false;
  }

  const currentUpdatedAt =
    Number(currentRun.updatedAt || 0) > 0 ? Number(currentRun.updatedAt) : 0;
  const snapshotLastActivityAt =
    Number(normalized.lastActivityAt || 0) > 0
      ? Number(normalized.lastActivityAt)
      : 0;

  if (normalized.terminal) {
    if (!terminalSnapshotCoveredByCurrentRun(currentRun, normalized)) {
      return false;
    }
    return !snapshotLastActivityAt || currentUpdatedAt >= snapshotLastActivityAt;
  }

  if (!currentRun.generating) return false;

  const hasExactAssistantStatusSteps =
    arraysEqual(
      currentRun.assistantStatusSteps,
      normalized.assistantStatusSteps,
      (currentStep, snapshotStep) => currentStep === snapshotStep
    ) ||
    (currentRun.assistantStatusSteps.length >= normalized.assistantStatusSteps.length &&
      normalized.assistantStatusSteps.every(
        (snapshotStep, index) =>
          currentRun.assistantStatusSteps[index] === snapshotStep
      ));

  if (!hasExactAssistantStatusSteps) {
    return false;
  }

  if (!hasUsageMetricsCoverage(currentRun.usageMetrics, normalized.usageMetrics)) {
    return false;
  }

  if (!hasRunEventsCoverage(currentRun.runEvents, normalized.runEvents)) {
    return false;
  }

  if (!streamUpdateCoveredByCurrentRun(currentRun, normalized.streamUpdate)) {
    return false;
  }

  if (snapshotLastActivityAt > 0 && currentUpdatedAt < snapshotLastActivityAt) {
    return false;
  }

  if (
    currentUpdatedAt <= snapshotLastActivityAt &&
    currentRun.status !== normalized.status
  ) {
    return false;
  }

  return true;
}

function getBuildRequestLimitsFromPayload(payload: any) {
  return payload?.requestLimits || payload?.billing?.snapshot || null;
}

interface PersistedBuildRunHydrationActions {
  onRegisterBuildRun: (buildRun: BuildLiveRunActionPayload) => void;
  onApplyBuildRunRunningSnapshot: (
    buildRun: BuildLiveRunActionPayload
  ) => void;
  onUpdateBuildRunStream: (buildRun: BuildLiveRunActionPayload) => void;
  onAppendBuildRunEvent: (buildRun: BuildLiveRunActionPayload) => void;
  onCompleteBuildRun: (buildRun: BuildLiveRunActionPayload) => void;
  onFailBuildRun: (buildRun: BuildLiveRunActionPayload) => void;
  onStopBuildRun: (buildRun: BuildLiveRunActionPayload) => void;
}

export function hydrateBuildRunFromPersistedSnapshot({
  activeRunSnapshot,
  build,
  chatMessages,
  projectFiles,
  currentRun,
  replayedPersistedRunStateKeys,
  actions
}: {
  activeRunSnapshot: BuildResumeRunStatePayload | null;
  build: any;
  chatMessages: any[];
  projectFiles: Array<{ path: string; content?: string }>;
  currentRun: BuildLiveRunState | null;
  replayedPersistedRunStateKeys: Record<string, string>;
  actions: PersistedBuildRunHydrationActions;
}) {
  if (!activeRunSnapshot) return false;

  const normalized = normalizeBuildResumeRunState(activeRunSnapshot);
  const requestId = String(normalized.requestId || '').trim();
  const buildId = Number(normalized.buildId || build?.id || 0);
  if (!requestId || buildId <= 0) return false;

  const replayLookupKey = `${buildId}:${requestId}`;
  const replayKey = getBuildResumeRunStateReplayKey(normalized);
  if (replayedPersistedRunStateKeys[replayLookupKey] === replayKey) {
    return false;
  }
  if (
    isPersistedSnapshotEquivalentOrNewer({
      currentRun,
      normalized
    })
  ) {
    replayedPersistedRunStateKeys[replayLookupKey] = replayKey;
    return false;
  }

  replayedPersistedRunStateKeys[replayLookupKey] = replayKey;

  const persistedUserMessage = normalizeBuildRunMessageForSharedState(
    findPersistedBuildRunMessage(
      chatMessages,
      normalized.streamUpdate?.userMessageId
    )
  ) ||
    createFallbackPersistedUserMessage({
      userMessageId: normalized.streamUpdate?.userMessageId,
      userMessageContent: normalized.streamUpdate?.userMessageContent,
      userClientMessageId: normalized.streamUpdate?.userClientMessageId
    });
  const persistedAssistantMessage =
    normalizeBuildRunMessageForSharedState(
      findPersistedBuildRunMessage(
        chatMessages,
        normalized.streamUpdate?.assistantMessageId
      )
    ) ||
    createFallbackPersistedAssistantMessage({
      assistantMessageId: normalized.streamUpdate?.assistantMessageId,
      assistantMessageCreatedAt:
        normalized.streamUpdate?.assistantMessageCreatedAt,
      assistantClientMessageId:
        normalized.streamUpdate?.assistantClientMessageId
    });

  actions.onRegisterBuildRun({
    buildId,
    requestId,
    runMode:
      normalized.runMode === 'greeting' || normalized.runMode === 'runtime-autofix'
        ? normalized.runMode
        : 'user',
    generating: normalized.terminal ? false : true,
    status: null,
    assistantStatusSteps: [],
    userMessage: persistedUserMessage,
    assistantMessage: persistedAssistantMessage,
    baseProjectFiles: projectFiles,
    updatedAt: normalized.lastActivityAt || Date.now()
  });

  replayBuildResumeRunState({
    normalized,
    onTerminalComplete: (terminalPayload) => {
      actions.onCompleteBuildRun({
        buildId,
        requestId,
        assistantText: terminalPayload.assistantText,
        artifactCode:
          terminalPayload.artifact?.content ?? terminalPayload.code ?? null,
        projectFiles:
          Array.isArray(terminalPayload.projectFiles) &&
          terminalPayload.projectFiles.length > 0
            ? terminalPayload.projectFiles
            : null,
        interruptionReason: terminalPayload.interruptionReason ?? null,
        ...(Object.prototype.hasOwnProperty.call(
          terminalPayload || {},
          'workspaceChanged'
        )
          ? {
              workspaceChanged: terminalPayload.workspaceChanged === true
            }
          : {}),
        executionPlan: terminalPayload.executionPlan,
        followUpPrompt:
          Object.prototype.hasOwnProperty.call(terminalPayload || {}, 'followUpPrompt')
            ? terminalPayload.followUpPrompt ?? null
            : undefined,
        deferredBuildRequest: Object.prototype.hasOwnProperty.call(
          terminalPayload || {},
          'deferredBuildRequest'
        )
          ? terminalPayload.deferredBuildRequest ?? null
          : undefined,
        ...(Object.prototype.hasOwnProperty.call(
          terminalPayload || {},
          'runtimeExplorationPlan'
        )
          ? {
              runtimeExplorationPlan: terminalPayload.runtimeExplorationPlan ?? null
            }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(
          terminalPayload || {},
          'runtimePlanRefined'
        )
          ? {
              runtimePlanRefined: Boolean(terminalPayload.runtimePlanRefined)
            }
          : {}),
        billingState: terminalPayload.billingState ?? null,
        requestLimits: getBuildRequestLimitsFromPayload(terminalPayload),
        artifactVersionId:
          Number(terminalPayload?.message?.artifactVersionId || 0) > 0
            ? Number(terminalPayload.message.artifactVersionId)
            : Number(terminalPayload?.artifact?.versionId || 0) > 0
              ? Number(terminalPayload.artifact.versionId)
              : null,
        persistedAssistantId:
          Number(terminalPayload?.message?.id || 0) > 0
            ? Number(terminalPayload.message.id)
            : null,
        persistedUserId:
          Number(terminalPayload?.message?.userMessageId || 0) > 0
            ? Number(terminalPayload.message.userMessageId)
            : null,
        userClientMessageId:
          typeof terminalPayload?.message?.userClientMessageId === 'string'
            ? terminalPayload.message.userClientMessageId
            : undefined,
        assistantClientMessageId:
          typeof terminalPayload?.message?.assistantClientMessageId === 'string'
            ? terminalPayload.message.assistantClientMessageId
            : undefined,
        createdAt:
          Number(terminalPayload?.message?.createdAt || 0) > 0
            ? Number(terminalPayload.message.createdAt)
            : undefined
      });
    },
    onTerminalError: (terminalPayload) => {
      actions.onFailBuildRun({
        buildId,
        requestId,
        error: terminalPayload.error || 'Failed to generate code.',
        requestLimits: getBuildRequestLimitsFromPayload(terminalPayload)
      });
    },
    onTerminalStopped: (terminalPayload) => {
      actions.onStopBuildRun({
        buildId,
        requestId,
        stopReason: terminalPayload.stopReason || null,
        ...(typeof terminalPayload.assistantText === 'string'
          ? { assistantText: terminalPayload.assistantText }
          : {})
      });
    },
    onRunningSnapshot: (runningSnapshot) => {
      actions.onApplyBuildRunRunningSnapshot({
        buildId,
        requestId,
        runningSnapshot: {
          status: runningSnapshot.status,
          assistantStatusSteps: runningSnapshot.assistantStatusSteps,
          usageMetrics: runningSnapshot.usageMetrics,
          updatedAt: runningSnapshot.lastActivityAt
        }
      });
    },
    onRunEvent: (runEvent) => {
      actions.onAppendBuildRunEvent({
        buildId,
        requestId,
        event: runEvent,
        updatedAt: normalized.lastActivityAt ?? undefined
      });
    },
    onStreamUpdate: (streamUpdate) => {
      actions.onUpdateBuildRunStream({
        buildId,
        requestId,
        ...streamUpdate,
        updatedAt: normalized.lastActivityAt ?? undefined
      });
    }
  });

  return true;
}

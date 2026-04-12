import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation
} from 'react-router-dom';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import BuildEditor from './BuildEditor';
import BuildList from './BuildList';
import Icon from '~/components/Icon';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
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
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
    maxPublishedBuildStorageBytes: number;
    maxRuntimeFileStorageBytes: number;
    maxRuntimeFileBytes: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    publishedBuildStorageBytes: number;
    publishedBuildStorageRemaining: number;
    publishedBuildCount: number;
    runtimeFileStorageBytes: number;
    runtimeFileStorageRemaining: number;
    runtimeFileCount: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    generationBaseRequestsPerDay: number;
    generationResetPurchasesToday: number;
    generationResetCost: number;
    generationRequestsPerDay: number;
    generationRequestsToday: number;
    generationRequestsRemaining: number;
  };
}

interface BuildWorkspaceAccessResult {
  kind: 'redirect-runtime' | 'unpublished';
  runtimePath?: string;
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

const BUILD_UNPUBLISHED_PUBLIC_TEXT =
  "This project hasn't been published yet, so it can't be opened publicly.";

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
  assistantMessageCreatedAt
}: {
  assistantMessageId?: number | null;
  assistantMessageCreatedAt?: number | null;
}) {
  const normalizedAssistantMessageId = Number(assistantMessageId || 0);
  if (normalizedAssistantMessageId <= 0) return null;
  return {
    id: normalizedAssistantMessageId,
    role: 'assistant' as const,
    content: '',
    codeGenerated: null,
    billingState: null,
    streamCodePreview: null,
    artifactVersionId: null,
    createdAt:
      Number(assistantMessageCreatedAt || 0) > 0
        ? Number(assistantMessageCreatedAt)
        : Math.floor(Date.now() / 1000),
    persisted: true
  };
}

function createFallbackPersistedUserMessage({
  userMessageId,
  userMessageContent
}: {
  userMessageId?: number | null;
  userMessageContent?: string | null;
}) {
  if (
    Number(userMessageId || 0) <= 0 &&
    typeof userMessageContent !== 'string'
  ) {
    return null;
  }
  return {
    id:
      Number(userMessageId || 0) > 0
        ? Number(userMessageId)
        : Math.max(1, Math.floor(Date.now() / 1000)),
    role: 'user' as const,
    content: typeof userMessageContent === 'string' ? userMessageContent : '',
    codeGenerated: null,
    billingState: null,
    streamCodePreview: null,
    artifactVersionId: null,
    createdAt: Math.floor(Date.now() / 1000),
    persisted: Number(userMessageId || 0) > 0
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
    Object.prototype.hasOwnProperty.call(streamUpdate, 'userMessageContent') &&
    typeof streamUpdate.userMessageContent === 'string' &&
    !textCoversSnapshot(currentRun.userMessage?.content, streamUpdate.userMessageContent)
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

function isPersistedSnapshotEquivalentOrNewer({
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

function hydrateBuildRunFromPersistedSnapshot({
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
      userMessageContent: normalized.streamUpdate?.userMessageContent
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
        normalized.streamUpdate?.assistantMessageCreatedAt
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
        error: terminalPayload.error || 'Failed to generate code.'
      });
    },
    onTerminalStopped: (terminalPayload) => {
      actions.onStopBuildRun({
        buildId,
        requestId,
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

export default function Build() {
  return (
    <ErrorBoundary componentPath="Build">
      <div
        className={css`
          height: 100%;
          min-height: 0;
        `}
      >
        <Routes>
          <Route path="/" element={<BuildList />} />
          <Route path="/new" element={<NewBuild />} />
          <Route path="/:buildId" element={<BuildEditorWrapper />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

function NewBuild() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  if (!userId) {
    return <InvalidPage text="Please log in to create a build" />;
  }

  async function handleCreate() {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const { build } = await createBuild({
        title: title.trim()
      });
      if (build?.id) {
        navigate(`/build/${build.id}`, {
          replace: true,
          state: { seedGreeting: true }
        });
      }
    } catch (error) {
      console.error('Failed to create build:', error);
      setCreating(false);
    }
  }

  function handleBack() {
    navigate('/build');
  }

  return (
    <div
      className={css`
        width: 100%;
        max-width: 720px;
        margin: 3rem auto;
        padding: 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
    >
      <div
        className={css`
          position: relative;
          padding: 2.2rem;
          border-radius: 22px;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.6rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              padding: 0.45rem 1rem;
              border-radius: 999px;
              background: rgba(65, 140, 235, 0.14);
              color: #1d4ed8;
              border: 1px solid rgba(65, 140, 235, 0.28);
              font-weight: 900;
              font-size: 0.95rem;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-family: ${displayFontFamily};
            `}
          >
            <Icon icon="sparkles" />
            New Build
          </span>
          <h1
            className={css`
              margin: 0;
              font-size: 2.8rem;
              font-weight: 900;
              line-height: 1.1;
              color: var(--chat-text);
              font-family: ${displayFontFamily};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2.3rem;
              }
            `}
          >
            Create a New Build
          </h1>
          <p
            className={css`
              margin: 0;
              font-size: 1.18rem;
              color: var(--chat-text);
              opacity: 0.8;
              max-width: 34rem;
              line-height: 1.6;
            `}
          >
            Give your project a name so Build Studio can start scaffolding your
            app.
          </p>
        </div>
      </div>
      <div
        className={css`
          margin-top: 1.8rem;
          background: #fff;
          border-radius: ${borderRadius};
          border: 1px solid var(--ui-border);
          padding: 1.6rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        `}
      >
        <label
          htmlFor="build-title"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 700,
            color: 'var(--chat-text)'
          }}
        >
          Title
        </label>
        <input
          id="build-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My awesome app"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
          className={css`
            width: 100%;
            padding: 0.9rem 1rem;
            font-size: 1.05rem;
            border: 1px solid rgba(65, 140, 235, 0.26);
            border-radius: ${borderRadius};
            background: #fff;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            &:focus {
              outline: none;
              border-color: #418CEB;
              box-shadow: 0 0 0 2px rgba(65, 140, 235, 0.12);
            }
          `}
        />
        <div
          className={css`
            margin-top: 1.4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          `}
        >
          <GameCTAButton
            variant="neutral"
            size="lg"
            icon="arrow-left"
            onClick={handleBack}
          >
            Build Studio
          </GameCTAButton>
          <GameCTAButton
            variant="primary"
            size="lg"
            shiny
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            loading={creating}
          >
            {creating ? 'Creating...' : 'Create Build'}
          </GameCTAButton>
        </div>
      </div>
    </div>
  );
}

function BuildEditorWrapper() {
  const { buildId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return isNaN(id) ? null : id;
  }, [buildId]);
  const cachedWorkspace = useBuildContext((v) =>
    numericBuildId ? v.state.buildWorkspaces[String(numericBuildId)] || null : null
  );
  const activeBuildRun = useBuildContext((v) =>
    numericBuildId ? v.state.buildRuns[String(numericBuildId)] || null : null
  );
  const onSetBuildWorkspace = useBuildContext(
    (v) => v.actions.onSetBuildWorkspace
  );
  const getLatestBuildRun = useBuildContext((v) => v.getLatestBuildRun);
  const onRegisterBuildRun = useBuildContext(
    (v) => v.actions.onRegisterBuildRun
  );
  const onApplyBuildRunRunningSnapshot = useBuildContext(
    (v) => v.actions.onApplyBuildRunRunningSnapshot
  );
  const onUpdateBuildRunStream = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStream
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const canUseCachedWorkspace = useMemo(() => {
    if (!cachedWorkspace?.build) return false;
    const currentUserId = Number(userId) || 0;
    const cachedBuildUserId = Number(cachedWorkspace.build.userId) || 0;
    return currentUserId > 0 && currentUserId === cachedBuildUserId;
  }, [cachedWorkspace, userId]);
  const usableCachedWorkspace = canUseCachedWorkspace ? cachedWorkspace : null;

  const [loading, setLoading] = useState(
    () => !Boolean(usableCachedWorkspace?.build)
  );
  const [build, setBuild] = useState<any>(usableCachedWorkspace?.build || null);
  const [chatMessages, setChatMessages] = useState<any[]>(
    usableCachedWorkspace?.chatMessages || []
  );
  const [copilotPolicy, setCopilotPolicy] =
    useState<BuildCopilotPolicy | null>(
      usableCachedWorkspace?.copilotPolicy || null
    );
  const [error, setError] = useState('');
  const replayedPersistedRunStateKeysRef = useRef<Record<string, string>>({});

  const locationState = (location.state as any) || null;
  const seedGreeting = Boolean(locationState?.seedGreeting);
  const initialPrompt =
    typeof locationState?.initialPrompt === 'string'
      ? locationState.initialPrompt
      : '';

  useEffect(() => {
    setError('');
    if (usableCachedWorkspace?.build) {
      setBuild(usableCachedWorkspace.build);
      setChatMessages(
        Array.isArray(usableCachedWorkspace.chatMessages)
          ? usableCachedWorkspace.chatMessages
          : []
      );
      setCopilotPolicy(usableCachedWorkspace.copilotPolicy || null);
      setLoading(false);
      return;
    }
    setBuild(null);
    setChatMessages([]);
    setCopilotPolicy(null);
    setLoading(true);
  }, [numericBuildId, usableCachedWorkspace]);

  useEffect(() => {
    let cancelled = false;
    if (numericBuildId) void handleLoad();
    return () => {
      cancelled = true;
    };

    async function handleLoad() {
      if (!usableCachedWorkspace?.build) {
        setLoading(true);
      }
      try {
        const data = await loadBuild(numericBuildId, {
          fromWriter: Boolean(
            initialPrompt ||
              seedGreeting ||
              activeBuildRun?.generating ||
              activeBuildRun?.terminalState
          )
        });
        if (cancelled) return;
        const access = data?.access as BuildWorkspaceAccessResult | undefined;
        if (access?.kind === 'redirect-runtime' && access.runtimePath) {
          navigate(access.runtimePath, { replace: true });
          return;
        }
        if (access?.kind === 'unpublished') {
          setBuild(null);
          setChatMessages([]);
          setCopilotPolicy(null);
          setError(BUILD_UNPUBLISHED_PUBLIC_TEXT);
          return;
        }
        if (data?.build) {
          const nextProjectFiles = Array.isArray(data.projectFiles)
            ? data.projectFiles
            : [];
          const nextBuild = {
            ...data.build,
            executionPlan: data.executionPlan || null,
            followUpPrompt: data.followUpPrompt || null,
            runtimeExplorationPlan: data.runtimeExplorationPlan || null,
            projectManifest: data.projectManifest || null,
            capabilitySnapshot: data.capabilitySnapshot || null,
            projectFiles: nextProjectFiles
          };
          const nextChatMessages = data.chatMessages || [];
          const nextCopilotPolicy = data.copilotPolicy || null;
          const nextActiveRun = data.activeRun || null;
          const latestActiveBuildRun = getLatestBuildRun(numericBuildId);
          setBuild(nextBuild);
          setChatMessages(nextChatMessages);
          setCopilotPolicy(nextCopilotPolicy);
          setError('');
          const didHydratePersistedActiveRun =
            hydrateBuildRunFromPersistedSnapshot({
              activeRunSnapshot: nextActiveRun,
              build: nextBuild,
              chatMessages: nextChatMessages,
              projectFiles: nextProjectFiles,
              currentRun: latestActiveBuildRun,
              replayedPersistedRunStateKeys:
                replayedPersistedRunStateKeysRef.current,
              actions: {
                onRegisterBuildRun,
                onApplyBuildRunRunningSnapshot,
                onUpdateBuildRunStream,
                onAppendBuildRunEvent,
                onCompleteBuildRun,
                onFailBuildRun,
                onStopBuildRun
              }
            });
          if (didHydratePersistedActiveRun && nextActiveRun) {
            const normalizedActiveRun = normalizeBuildResumeRunState(nextActiveRun);
            const activeRunRequestId = String(
              normalizedActiveRun.requestId || ''
            ).trim();
            const activeRunBuildId = Number(
              normalizedActiveRun.buildId || nextBuild.id || 0
            );
            if (
              socket.connected &&
              !normalizedActiveRun.terminal &&
              activeRunRequestId &&
              activeRunBuildId > 0
            ) {
              socket.emit('build_resume_run', {
                buildId: activeRunBuildId,
                requestId: activeRunRequestId
              });
            }
          }
          if (initialPrompt || seedGreeting) {
            navigate(location.pathname, { replace: true, state: null });
          }
        } else {
          if (!usableCachedWorkspace?.build) {
            setBuild(null);
            setChatMessages([]);
            setCopilotPolicy(null);
          }
          setError('Build not found');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load build:', err);
        if (!usableCachedWorkspace?.build) {
          setBuild(null);
          setChatMessages([]);
          setCopilotPolicy(null);
        }
        setError(err?.message || 'Failed to load build');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialPrompt,
    location.pathname,
    navigate,
    numericBuildId,
    seedGreeting,
    userId
  ]);

  useEffect(() => {
    const workspaceBuildId = Number(build?.id || numericBuildId || 0);
    if (!workspaceBuildId || !build) return;
    if (Number(userId) <= 0 || Number(build.userId) !== Number(userId)) return;
    if (
      cachedWorkspace &&
      cachedWorkspace.build === build &&
      cachedWorkspace.chatMessages === chatMessages &&
      cachedWorkspace.copilotPolicy === copilotPolicy
    ) {
      return;
    }
    onSetBuildWorkspace({
      buildId: workspaceBuildId,
      build,
      chatMessages,
      copilotPolicy
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, chatMessages, copilotPolicy, numericBuildId, userId]);

  if (!numericBuildId) {
    return (
      <BuildWorkspaceUnavailable
        title="Not Found"
        text="Invalid build ID"
        onBack={() => navigate('/build')}
      />
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (!build) {
    return (
      <BuildWorkspaceUnavailable
        title={
          error === BUILD_UNPUBLISHED_PUBLIC_TEXT
            ? 'Project Not Published Yet'
            : 'Workspace Unavailable'
        }
        text={error || 'Build not found'}
        onBack={() =>
          navigate(
            '/build'
          )
        }
        buttonLabel={
          error === BUILD_UNPUBLISHED_PUBLIC_TEXT
            ? 'Build Menu'
            : undefined
        }
      />
    );
  }

  const isOwner = Number(userId) > 0 && Number(userId) === Number(build.userId);

  return (
    <BuildEditor
      build={build}
      chatMessages={chatMessages}
      copilotPolicy={copilotPolicy}
      isOwner={isOwner}
      initialPrompt={initialPrompt}
      seedGreeting={seedGreeting}
      onUpdateBuild={setBuild}
      onUpdateChatMessages={setChatMessages}
      onUpdateCopilotPolicy={setCopilotPolicy}
    />
  );
}

function BuildWorkspaceUnavailable({
  title,
  text,
  onBack,
  buttonLabel
}: {
  title: string;
  text: string;
  onBack: () => void;
  buttonLabel?: string;
}) {
  return (
    <div
      className={css`
        width: 100%;
        max-width: 720px;
        margin: 3rem auto;
        padding: 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
    >
      <div
        className={css`
          padding: 2rem;
          border-radius: 22px;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        `}
      >
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            background: rgba(245, 158, 11, 0.14);
            color: #b45309;
            border: 1px solid rgba(245, 158, 11, 0.25);
            font-weight: 900;
            font-size: 0.95rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-family: ${displayFontFamily};
          `}
        >
          <Icon icon="triangle-exclamation" />
          Build Workspace
        </span>
        <div>
          <h1
            className={css`
              margin: 0;
              font-size: 2.4rem;
              line-height: 1.1;
              color: var(--chat-text);
              font-family: ${displayFontFamily};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          >
            {title}
          </h1>
          <p
            className={css`
              margin: 0.85rem 0 0;
              font-size: 1.05rem;
              line-height: 1.6;
              color: var(--chat-text);
              opacity: 0.8;
            `}
          >
            {text}
          </p>
        </div>
        <GameCTAButton
          variant="primary"
          size="lg"
          icon="arrow-left"
          onClick={onBack}
        >
          {buttonLabel || 'Back to Build Studio'}
        </GameCTAButton>
      </div>
    </div>
  );
}

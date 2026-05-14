import type {
  BuildLiveRunEvent,
  BuildLiveRunState,
  BuildLiveRunUsageMetric
} from './reducer';
import {
  buildFallbackBuildRunEventId,
  normalizeBuildRunEventCreatedAt,
  normalizeBuildRunEventId
} from './runEventIdentity';

export interface BuildResumeRunStateUsageMetricPayload {
  stage?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface BuildRunEventEnvelopePayload {
  id?: string;
  schemaVersion?: number | null;
  eventType?: string | null;
  source?: string | null;
  threadId?: string | null;
  requestId?: string | null;
  sequence?: number | null;
  buildId?: number | null;
  userId?: number | null;
  kind?: BuildLiveRunEvent['kind'];
  phase?: string | null;
  message?: string;
  createdAt?: number;
  deduped?: boolean;
  details?: BuildLiveRunEvent['details'];
  usage?: BuildLiveRunEvent['usage'];
}

export type BuildResumeRunStateRunEventPayload = BuildRunEventEnvelopePayload;

export interface BuildResumeRunStateStreamUpdatePayload {
  userMessageContent?: string | null;
  userClientMessageId?: string | null;
  reply?: string;
  codeGenerated?: string | null;
  hasCodeGeneratedField?: boolean;
  userMessageId?: number | null;
  assistantMessageId?: number | null;
  assistantClientMessageId?: string | null;
  assistantMessageCreatedAt?: number | null;
  baseProjectFiles?: Array<{ path: string; content?: string }> | null;
  projectFiles?: Array<{ path: string; content?: string }> | null;
  projectFilesMode?: 'patch' | 'snapshot' | null;
  projectFilesPersisted?: boolean;
  projectFilesFocusPath?: string | null;
}

export interface BuildResumeRunStateTerminalPayload {
  type?: 'complete' | 'error' | 'stopped';
  payload?: any;
}

export interface BuildResumeRunStatePayload {
  requestId?: string;
  buildId?: number | null;
  runMode?: BuildLiveRunState['runMode'] | null;
  status?: string | null;
  assistantStatusSteps?: string[];
  agentContext?: Record<string, any> | null;
  lifecycle?: Record<string, any> | null;
  usageMetrics?: Record<string, BuildResumeRunStateUsageMetricPayload>;
  runEvents?: BuildResumeRunStateRunEventPayload[];
  streamUpdate?: BuildResumeRunStateStreamUpdatePayload | null;
  terminal?: BuildResumeRunStateTerminalPayload | null;
  lastActivityAt?: number | null;
}

export interface BuildResumeRunStateNormalizedStreamUpdate {
  userMessageContent?: string | null;
  userClientMessageId?: string | null;
  reply?: string;
  codeGenerated?: string | null;
  userMessageId?: number | null;
  assistantMessageId?: number | null;
  assistantClientMessageId?: string | null;
  assistantMessageCreatedAt?: number | null;
  baseProjectFiles?: Array<{ path: string; content?: string }> | null;
  projectFiles?: Array<{ path: string; content?: string }> | null;
  projectFilesMode?: 'patch' | 'snapshot' | null;
  projectFilesPersisted?: boolean;
  projectFilesFocusPath?: string | null;
}

export interface BuildResumeRunStateNormalizedRunningSnapshot {
  status: string | null;
  assistantStatusSteps: string[];
  agentContext: Record<string, any> | null;
  lifecycle: Record<string, any> | null;
  usageMetrics: Record<string, BuildLiveRunUsageMetric>;
  lastActivityAt: number | null;
}

export interface NormalizedBuildResumeRunState {
  requestId?: string;
  buildId?: number | null;
  runMode?: BuildLiveRunState['runMode'] | null;
  status: string | null;
  assistantStatusSteps: string[];
  agentContext: Record<string, any> | null;
  lifecycle: Record<string, any> | null;
  usageMetrics: Record<string, BuildLiveRunUsageMetric>;
  runEvents: BuildLiveRunEvent[];
  streamUpdate: BuildResumeRunStateNormalizedStreamUpdate | null;
  terminal: BuildResumeRunStateTerminalPayload | null;
  lastActivityAt: number | null;
}

interface ReplayBuildResumeRunStateOptions {
  normalized: NormalizedBuildResumeRunState;
  onTerminalComplete?: (payload: any) => void;
  onTerminalError?: (payload: any) => void;
  onTerminalStopped?: (payload: any) => void;
  onRunningSnapshot?: (
    runningSnapshot: BuildResumeRunStateNormalizedRunningSnapshot
  ) => void;
  onRunEvent?: (event: BuildLiveRunEvent) => void;
  onStreamUpdate?: (
    streamUpdate: BuildResumeRunStateNormalizedStreamUpdate
  ) => void;
}

function normalizeBuildResumeRunStatus(status?: string | null) {
  return typeof status === 'string' ? status : null;
}

function normalizeBuildResumeRunAssistantStatusSteps({
  status,
  assistantStatusSteps
}: Pick<BuildResumeRunStatePayload, 'status' | 'assistantStatusSteps'>) {
  const normalizedStatus = normalizeBuildResumeRunStatus(status);
  const normalizedAssistantStatusSteps = Array.isArray(assistantStatusSteps)
    ? assistantStatusSteps.filter(
        (step): step is string =>
          typeof step === 'string' && step.trim().length > 0
      )
    : [];

  return {
    status: normalizedStatus,
    assistantStatusSteps: normalizedAssistantStatusSteps
  };
}

function normalizeBuildResumeRunUsageMetrics(
  usageMetrics?: Record<string, BuildResumeRunStateUsageMetricPayload>
) {
  return Object.values(usageMetrics || {}).reduce<
    Record<string, BuildLiveRunUsageMetric>
  >((result, metric) => {
    const stage = String(metric?.stage || '').trim();
    const model = String(metric?.model || '').trim();
    if (!stage || !model) return result;
    result[stage] = {
      stage,
      model,
      inputTokens: Number(metric?.inputTokens || 0),
      outputTokens: Number(metric?.outputTokens || 0),
      totalTokens: Number(metric?.totalTokens || 0)
    };
    return result;
  }, {});
}

function normalizeBuildResumeRunRecord(value?: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  try {
    const clonedValue = JSON.parse(JSON.stringify(value));
    return clonedValue &&
      typeof clonedValue === 'object' &&
      !Array.isArray(clonedValue)
      ? (clonedValue as Record<string, any>)
      : null;
  } catch {
    return null;
  }
}

function normalizeNullableEnvelopeString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizePositiveEnvelopeNumber(value: unknown) {
  const normalized = Number(value || 0);
  return Number.isFinite(normalized) && normalized > 0
    ? Math.floor(normalized)
    : null;
}

function normalizeBuildRunEventKind(
  kind?: BuildRunEventEnvelopePayload['kind']
) {
  return kind === 'lifecycle' ||
    kind === 'phase' ||
    kind === 'action' ||
    kind === 'status' ||
    kind === 'usage'
    ? kind
    : null;
}

function normalizeBuildRunEventDetails(
  details?: BuildRunEventEnvelopePayload['details']
) {
  return details && typeof details === 'object' && !Array.isArray(details)
    ? { ...details }
    : null;
}

function normalizeBuildRunEventUsage(
  usage?: BuildRunEventEnvelopePayload['usage']
) {
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
    return null;
  }
  return {
    ...usage,
    stage:
      typeof usage.stage === 'string' && usage.stage.trim().length > 0
        ? usage.stage.trim()
        : null,
    model:
      typeof usage.model === 'string' && usage.model.trim().length > 0
        ? usage.model.trim()
        : null,
    inputTokens: Number(usage.inputTokens || 0),
    outputTokens: Number(usage.outputTokens || 0),
    totalTokens: Number(usage.totalTokens || 0)
  };
}

export function normalizeBuildRunEventEnvelope({
  event,
  requestId,
  buildId,
  userId,
  index
}: {
  event?: BuildRunEventEnvelopePayload | null;
  requestId?: string | null;
  buildId?: number | null;
  userId?: number | null;
  index?: number | null;
}): BuildLiveRunEvent | null {
  const kind = normalizeBuildRunEventKind(event?.kind);
  const message = String(event?.message || '').trim();
  if (!event || !kind || !message) {
    return null;
  }
  const normalizedCreatedAt = normalizeBuildRunEventCreatedAt(event.createdAt);
  const normalizedId = normalizeBuildRunEventId(event.id);
  const normalizedRequestId =
    normalizeNullableEnvelopeString(event.requestId) ||
    normalizeNullableEnvelopeString(requestId);
  const normalizedBuildId =
    normalizePositiveEnvelopeNumber(event.buildId) ||
    normalizePositiveEnvelopeNumber(buildId);
  const normalizedUserId =
    normalizePositiveEnvelopeNumber(event.userId) ||
    normalizePositiveEnvelopeNumber(userId);

  return {
    id:
      normalizedId ||
      buildFallbackBuildRunEventId({
        requestId: normalizedRequestId,
        event: {
          kind,
          phase: event.phase || null,
          message,
          createdAt: normalizedCreatedAt
        },
        index
      }),
    schemaVersion: normalizePositiveEnvelopeNumber(event.schemaVersion),
    eventType: normalizeNullableEnvelopeString(event.eventType),
    source: normalizeNullableEnvelopeString(event.source),
    threadId: normalizeNullableEnvelopeString(event.threadId),
    requestId: normalizedRequestId,
    sequence: normalizePositiveEnvelopeNumber(event.sequence),
    buildId: normalizedBuildId,
    userId: normalizedUserId,
    kind,
    phase: event.phase || null,
    message,
    createdAt: normalizedCreatedAt,
    deduped: Boolean(event.deduped),
    details: normalizeBuildRunEventDetails(event.details),
    usage: normalizeBuildRunEventUsage(event.usage)
  };
}

function normalizeBuildResumeRunEvents({
  requestId,
  buildId,
  runEvents
}: Pick<BuildResumeRunStatePayload, 'requestId' | 'buildId' | 'runEvents'>) {
  return Array.isArray(runEvents)
    ? runEvents
        .map((event, index) =>
          normalizeBuildRunEventEnvelope({
            event,
            requestId,
            buildId,
            index
          })
        )
        .filter((event): event is BuildLiveRunEvent => Boolean(event))
        .slice(-40)
    : [];
}

function normalizeBuildResumeRunStreamUpdate(
  streamUpdate?: BuildResumeRunStateStreamUpdatePayload | null
) {
  if (!streamUpdate) return null;

  const normalizedStreamUpdate: BuildResumeRunStateNormalizedStreamUpdate = {};

  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'userMessageContent')
  ) {
    normalizedStreamUpdate.userMessageContent =
      typeof streamUpdate.userMessageContent === 'string'
        ? streamUpdate.userMessageContent
        : null;
  }
  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'userClientMessageId')
  ) {
    normalizedStreamUpdate.userClientMessageId =
      typeof streamUpdate.userClientMessageId === 'string'
        ? streamUpdate.userClientMessageId.trim() || null
        : null;
  }
  if (typeof streamUpdate.reply === 'string') {
    normalizedStreamUpdate.reply = streamUpdate.reply;
  }
  if (streamUpdate.hasCodeGeneratedField) {
    normalizedStreamUpdate.codeGenerated = streamUpdate.codeGenerated ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(streamUpdate, 'userMessageId')) {
    normalizedStreamUpdate.userMessageId =
      Number(streamUpdate.userMessageId || 0) > 0
        ? Number(streamUpdate.userMessageId)
        : null;
  }
  if (
    Object.prototype.hasOwnProperty.call(streamUpdate, 'assistantMessageId')
  ) {
    normalizedStreamUpdate.assistantMessageId =
      Number(streamUpdate.assistantMessageId || 0) > 0
        ? Number(streamUpdate.assistantMessageId)
        : null;
  }
  if (
    Object.prototype.hasOwnProperty.call(
      streamUpdate,
      'assistantClientMessageId'
    )
  ) {
    normalizedStreamUpdate.assistantClientMessageId =
      typeof streamUpdate.assistantClientMessageId === 'string'
        ? streamUpdate.assistantClientMessageId.trim() || null
        : null;
  }
  if (
    Object.prototype.hasOwnProperty.call(
      streamUpdate,
      'assistantMessageCreatedAt'
    )
  ) {
    normalizedStreamUpdate.assistantMessageCreatedAt =
      Number(streamUpdate.assistantMessageCreatedAt || 0) > 0
        ? Number(streamUpdate.assistantMessageCreatedAt)
        : null;
  }
  if (Object.prototype.hasOwnProperty.call(streamUpdate, 'baseProjectFiles')) {
    normalizedStreamUpdate.baseProjectFiles = Array.isArray(
      streamUpdate.baseProjectFiles
    )
      ? streamUpdate.baseProjectFiles
      : [];
  }
  if (Object.prototype.hasOwnProperty.call(streamUpdate, 'projectFiles')) {
    normalizedStreamUpdate.projectFiles = streamUpdate.projectFiles;
    normalizedStreamUpdate.projectFilesMode =
      streamUpdate.projectFilesMode === 'snapshot' ? 'snapshot' : 'patch';
    normalizedStreamUpdate.projectFilesPersisted =
      streamUpdate.projectFilesPersisted === true;
    normalizedStreamUpdate.projectFilesFocusPath =
      String(streamUpdate.projectFilesFocusPath || '').trim() || null;
  }

  return Object.keys(normalizedStreamUpdate).length > 0
    ? normalizedStreamUpdate
    : null;
}

function normalizeBuildResumeRunTerminal(
  terminal?: BuildResumeRunStateTerminalPayload | null
) {
  return terminal || null;
}

function normalizeBuildResumeRunLastActivityAt(lastActivityAt?: number | null) {
  const normalizedLastActivityAt = Number(lastActivityAt || 0);
  return normalizedLastActivityAt > 0 ? normalizedLastActivityAt : null;
}

export function normalizeBuildResumeRunState(
  payload: BuildResumeRunStatePayload
): NormalizedBuildResumeRunState {
  const normalizedAssistantStatusSteps =
    normalizeBuildResumeRunAssistantStatusSteps(payload);

  return {
    requestId: payload.requestId,
    buildId: payload.buildId,
    runMode: payload.runMode,
    status: normalizedAssistantStatusSteps.status,
    assistantStatusSteps: normalizedAssistantStatusSteps.assistantStatusSteps,
    agentContext: normalizeBuildResumeRunRecord(payload.agentContext),
    lifecycle: normalizeBuildResumeRunRecord(payload.lifecycle),
    usageMetrics: normalizeBuildResumeRunUsageMetrics(payload.usageMetrics),
    runEvents: normalizeBuildResumeRunEvents(payload),
    streamUpdate: normalizeBuildResumeRunStreamUpdate(payload.streamUpdate),
    terminal: normalizeBuildResumeRunTerminal(payload.terminal),
    lastActivityAt: normalizeBuildResumeRunLastActivityAt(
      payload.lastActivityAt
    )
  };
}

export function getBuildResumeRunStateReplayKey(
  normalizedResumeRunState: NormalizedBuildResumeRunState
) {
  return JSON.stringify({
    requestId: normalizedResumeRunState.requestId || null,
    buildId:
      Number(normalizedResumeRunState.buildId || 0) > 0
        ? Number(normalizedResumeRunState.buildId)
        : null,
    runMode: normalizedResumeRunState.runMode || null,
    status: normalizedResumeRunState.status,
    assistantStatusSteps: normalizedResumeRunState.assistantStatusSteps,
    agentContext: normalizedResumeRunState.agentContext,
    lifecycle: normalizedResumeRunState.lifecycle,
    usageMetrics: Object.values(normalizedResumeRunState.usageMetrics)
      .sort((a, b) => {
        if (a.stage !== b.stage) {
          return a.stage.localeCompare(b.stage);
        }
        return a.model.localeCompare(b.model);
      })
      .map((metric) => ({
        stage: metric.stage,
        model: metric.model,
        inputTokens: metric.inputTokens,
        outputTokens: metric.outputTokens,
        totalTokens: metric.totalTokens
      })),
    runEvents: normalizedResumeRunState.runEvents.map((event) => ({
      id: event.id,
      schemaVersion: event.schemaVersion ?? null,
      eventType: event.eventType ?? null,
      source: event.source ?? null,
      threadId: event.threadId ?? null,
      requestId: event.requestId ?? null,
      sequence: event.sequence ?? null,
      buildId: event.buildId ?? null,
      userId: event.userId ?? null,
      kind: event.kind,
      phase: event.phase,
      message: event.message,
      createdAt: event.createdAt,
      deduped: Boolean(event.deduped),
      details: event.details || null,
      usage: event.usage || null
    })),
    streamUpdate: normalizedResumeRunState.streamUpdate
      ? {
          reply: normalizedResumeRunState.streamUpdate.reply,
          userMessageContent:
            normalizedResumeRunState.streamUpdate.userMessageContent ?? null,
          userClientMessageId:
            normalizedResumeRunState.streamUpdate.userClientMessageId ?? null,
          codeGenerated: normalizedResumeRunState.streamUpdate.codeGenerated,
          userMessageId:
            normalizedResumeRunState.streamUpdate.userMessageId ?? null,
          assistantMessageId:
            normalizedResumeRunState.streamUpdate.assistantMessageId ?? null,
          assistantClientMessageId:
            normalizedResumeRunState.streamUpdate.assistantClientMessageId ??
            null,
          assistantMessageCreatedAt:
            normalizedResumeRunState.streamUpdate.assistantMessageCreatedAt ??
            null,
          projectFiles: Array.isArray(
            normalizedResumeRunState.streamUpdate.projectFiles
          )
            ? normalizedResumeRunState.streamUpdate.projectFiles.map(
                (file) => ({
                  path: String(file.path || ''),
                  content: typeof file.content === 'string' ? file.content : ''
                })
              )
            : null,
          baseProjectFiles: Array.isArray(
            normalizedResumeRunState.streamUpdate.baseProjectFiles
          )
            ? normalizedResumeRunState.streamUpdate.baseProjectFiles.map(
                (file) => ({
                  path: String(file.path || ''),
                  content: typeof file.content === 'string' ? file.content : ''
                })
              )
            : null,
          projectFilesMode:
            normalizedResumeRunState.streamUpdate.projectFilesMode ?? null,
          projectFilesPersisted:
            normalizedResumeRunState.streamUpdate.projectFilesPersisted ===
            true,
          projectFilesFocusPath:
            normalizedResumeRunState.streamUpdate.projectFilesFocusPath ?? null
        }
      : null,
    terminal: normalizedResumeRunState.terminal || null,
    lastActivityAt: normalizedResumeRunState.lastActivityAt
  });
}

export function replayBuildResumeRunState({
  normalized,
  onTerminalComplete,
  onTerminalError,
  onTerminalStopped,
  onRunningSnapshot,
  onRunEvent,
  onStreamUpdate
}: ReplayBuildResumeRunStateOptions) {
  if (normalized.terminal?.payload) {
    onRunningSnapshot?.({
      status: normalized.status,
      assistantStatusSteps: normalized.assistantStatusSteps,
      agentContext: normalized.agentContext,
      lifecycle: normalized.lifecycle,
      usageMetrics: normalized.usageMetrics,
      lastActivityAt: normalized.lastActivityAt
    });
    for (const runEvent of normalized.runEvents) {
      onRunEvent?.(runEvent);
    }
    if (normalized.streamUpdate) {
      onStreamUpdate?.(normalized.streamUpdate);
    }
  }

  if (normalized.terminal?.type === 'complete' && normalized.terminal.payload) {
    onTerminalComplete?.({
      ...normalized.terminal.payload,
      lifecycle: normalized.terminal.payload.lifecycle ?? normalized.lifecycle
    });
    return true;
  }
  if (normalized.terminal?.type === 'error' && normalized.terminal.payload) {
    onTerminalError?.({
      ...normalized.terminal.payload,
      lifecycle: normalized.terminal.payload.lifecycle ?? normalized.lifecycle
    });
    return true;
  }
  if (normalized.terminal?.type === 'stopped' && normalized.terminal.payload) {
    onTerminalStopped?.({
      ...normalized.terminal.payload,
      lifecycle: normalized.terminal.payload.lifecycle ?? normalized.lifecycle
    });
    return true;
  }

  onRunningSnapshot?.({
    status: normalized.status,
    assistantStatusSteps: normalized.assistantStatusSteps,
    agentContext: normalized.agentContext,
    lifecycle: normalized.lifecycle,
    usageMetrics: normalized.usageMetrics,
    lastActivityAt: normalized.lastActivityAt
  });
  if (normalized.streamUpdate) {
    onStreamUpdate?.(normalized.streamUpdate);
  }
  for (const runEvent of normalized.runEvents) {
    onRunEvent?.(runEvent);
  }

  return false;
}

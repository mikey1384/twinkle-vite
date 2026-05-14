import type { BuildRunEvent } from '../types';

export interface BuildRuntimeDebugSnapshot {
  requestId: string | null;
  threadId: string | null;
  lifecycle: Record<string, any> | null;
  providerChainControl: Record<string, any> | null;
  conflictState: Record<string, any> | null;
  responsesCompaction: Record<string, any> | null;
  eventEnvelope: Record<string, any> | null;
  compactJson: string;
}

function cloneRecord(value: unknown): Record<string, any> | null {
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

function normalizeDebugString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function buildLifecycleDebugProjection(lifecycle?: Record<string, any> | null) {
  const normalizedLifecycle = cloneRecord(lifecycle);
  if (!normalizedLifecycle) return null;
  return {
    schemaVersion: normalizedLifecycle.schemaVersion ?? null,
    state: normalizedLifecycle.state ?? null,
    terminalType: normalizedLifecycle.terminalType ?? null,
    requestId: normalizedLifecycle.requestId ?? null,
    threadId: normalizedLifecycle.threadId ?? null,
    buildId: normalizedLifecycle.buildId ?? null,
    userId: normalizedLifecycle.userId ?? null,
    interruptionReason: normalizedLifecycle.interruptionReason ?? null,
    stopReason: normalizedLifecycle.stopReason ?? null,
    canContinue: normalizedLifecycle.canContinue ?? null,
    providerChainControl: normalizedLifecycle.providerChainControl ?? null,
    conflictState: normalizedLifecycle.conflictState ?? null,
    updatedAt: normalizedLifecycle.updatedAt ?? null,
    completedAt: normalizedLifecycle.completedAt ?? null
  };
}

function getLatestRunEvent(runEvents?: BuildRunEvent[] | null) {
  if (!Array.isArray(runEvents)) return null;
  for (let index = runEvents.length - 1; index >= 0; index -= 1) {
    const event = runEvents[index];
    if (event) return event;
  }
  return null;
}

function getLatestRunEventRecord(
  runEvents: BuildRunEvent[] | null | undefined,
  selector: (event: BuildRunEvent) => unknown
) {
  if (!Array.isArray(runEvents)) return null;
  for (let index = runEvents.length - 1; index >= 0; index -= 1) {
    const record = cloneRecord(selector(runEvents[index]));
    if (record) return record;
  }
  return null;
}

function buildRunEventEnvelopeDebugProjection(event?: BuildRunEvent | null) {
  if (!event) return null;
  return {
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
    createdAt: event.createdAt
  };
}

export function buildLumineRuntimeDebugSnapshot({
  requestId,
  agentContext,
  lifecycle,
  runEvents
}: {
  requestId?: string | null;
  agentContext?: Record<string, any> | null;
  lifecycle?: Record<string, any> | null;
  runEvents?: BuildRunEvent[] | null;
}): BuildRuntimeDebugSnapshot | null {
  const latestRunEvent = getLatestRunEvent(runEvents);
  const normalizedAgentContext = cloneRecord(agentContext);
  const normalizedLifecycle = cloneRecord(lifecycle);
  const lifecycleDebugProjection =
    buildLifecycleDebugProjection(normalizedLifecycle);
  const providerChainControl =
    cloneRecord(
      normalizedAgentContext?.providerLineage?.providerChainControl
    ) ||
    cloneRecord(normalizedLifecycle?.providerChainControl) ||
    getLatestRunEventRecord(
      runEvents,
      (event) =>
        event.details?.continuation?.providerChainControl ||
        event.details?.providerChainControl
    );
  const conflictState =
    cloneRecord(normalizedAgentContext?.conflictState) ||
    cloneRecord(normalizedLifecycle?.conflictState) ||
    getLatestRunEventRecord(runEvents, (event) => event.details?.conflictState);
  const responsesCompaction =
    cloneRecord(normalizedAgentContext?.responsesCompaction) ||
    getLatestRunEventRecord(
      runEvents,
      (event) => event.details?.responsesCompaction
    );
  const eventEnvelope = buildRunEventEnvelopeDebugProjection(latestRunEvent);
  const normalizedRequestId =
    normalizeDebugString(requestId) ||
    normalizeDebugString(latestRunEvent?.requestId) ||
    normalizeDebugString(normalizedLifecycle?.requestId) ||
    null;
  const threadId =
    normalizeDebugString(normalizedAgentContext?.threadId) ||
    normalizeDebugString(normalizedLifecycle?.threadId) ||
    normalizeDebugString(latestRunEvent?.threadId) ||
    null;

  if (
    !normalizedRequestId &&
    !threadId &&
    !lifecycleDebugProjection &&
    !providerChainControl &&
    !conflictState &&
    !responsesCompaction &&
    !eventEnvelope
  ) {
    return null;
  }

  const projection = {
    requestId: normalizedRequestId,
    threadId,
    lifecycle: lifecycleDebugProjection,
    providerChainControl,
    conflictState,
    responsesCompaction,
    eventEnvelope
  };

  return {
    ...projection,
    compactJson: JSON.stringify(projection, null, 2)
  };
}

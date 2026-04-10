const LEGACY_BUILD_RUN_EVENT_ID_PREFIX = 'legacy:';

export interface BuildRunEventIdentityLike {
  id?: string | null;
  kind?: string | null;
  phase?: string | null;
  message?: string | null;
  createdAt?: number | null;
}

export function normalizeBuildRunEventId(id?: string | null) {
  return typeof id === 'string' ? id.trim() : '';
}

export function normalizeBuildRunEventCreatedAt(createdAt?: number | null) {
  const normalizedCreatedAt = Number(createdAt || 0);
  return Number.isFinite(normalizedCreatedAt) && normalizedCreatedAt > 0
    ? normalizedCreatedAt
    : 0;
}

export function hasStableBuildRunEventId(event: BuildRunEventIdentityLike) {
  const normalizedId = normalizeBuildRunEventId(event.id);
  return Boolean(
    normalizedId &&
      !normalizedId.startsWith(LEGACY_BUILD_RUN_EVENT_ID_PREFIX)
  );
}

export function buildFallbackBuildRunEventId({
  requestId,
  event,
  index
}: {
  requestId?: string | null;
  event: BuildRunEventIdentityLike;
  index?: number | null;
}) {
  const normalizedRequestId = String(requestId || '').trim() || 'unknown-request';
  const normalizedCreatedAt = normalizeBuildRunEventCreatedAt(event.createdAt);
  const normalizedIndex = Number(index || 0);

  return `${LEGACY_BUILD_RUN_EVENT_ID_PREFIX}${JSON.stringify([
    normalizedRequestId,
    String(event.kind || ''),
    event.phase == null ? null : String(event.phase),
    String(event.message || ''),
    normalizedCreatedAt,
    normalizedCreatedAt > 0
      ? null
      : Number.isFinite(normalizedIndex) && normalizedIndex >= 0
        ? normalizedIndex
        : 0
  ])}`;
}

export function getBuildRunEventLogicalIdentity(
  event: BuildRunEventIdentityLike
) {
  const normalizedId = normalizeBuildRunEventId(event.id);
  if (
    normalizedId &&
    !normalizedId.startsWith(LEGACY_BUILD_RUN_EVENT_ID_PREFIX)
  ) {
    return {
      key: normalizedId,
      hasStableId: true
    };
  }

  return {
    key: JSON.stringify([
      String(event.kind || ''),
      event.phase == null ? null : String(event.phase),
      String(event.message || ''),
      normalizeBuildRunEventCreatedAt(event.createdAt)
    ]),
    hasStableId: false
  };
}

import type {
  BuildCollaborationMode,
  BuildReleaseStatus
} from '~/helpers/buildProjectHelpers';

export type BuildViewerCollaborationStatus =
  | 'pending'
  | 'invited'
  | 'accepted'
  | 'rejected'
  | 'canceled';

export interface BuildViewerCollaborationRequest {
  id: number;
  inviteId?: number;
  status: BuildViewerCollaborationStatus;
  message?: string;
  ownerHidden?: number;
}

export interface BuildSummaryOwner {
  id: number;
  username: string;
  profilePicUrl: string;
  profileTheme?: string | null;
}

export interface BuildSummary {
  id: number;
  contentId: number;
  contentType: 'build';
  userId: number;
  username: string;
  profilePicUrl: string;
  owner: BuildSummaryOwner;
  title: string;
  description: string;
  // undefined = visibility unknown (payload and cache both lack the field);
  // consumers that render visibility must treat unknown as "don't show"
  isPublic?: boolean;
  hasCode?: boolean;
  viewCount: number;
  updatedAt: number;
  lastActivityAt: number | null;
  createdAt: number;
  publishedAt: number | null;
  sourceBuildId: number | null;
  collaborationMode: BuildCollaborationMode | 'contribution';
  contributionAccess?: 'anyone' | 'invite_only';
  contributionRootBuildId: number | null;
  contributionBranchNumber: number | null;
  contributionStatus: string | null;
  rootBuildUsername: string | null;
  rootBuildSourceBuildId: number | null;
  rootBuildTitle: string | null;
  collaboratorCount: number;
  forkCount: number;
  thumbnailUrl: string;
  thumbUrl: string;
  pendingCollaborationRequestCount: number;
  latestPendingCollaborationRequestAt: number | null;
  releaseStatus: BuildReleaseStatus | null;
  isFavorited: boolean;
  favoritedAt: number | null;
  favoriteActivityAt: number | null;
  lastUsedAt: number | null;
  hasActiveContributionInvite: boolean;
  viewerCollaborationRequest: BuildViewerCollaborationRequest | null;
  viewerCollaborationRequestLoaded: boolean;
  viewerCollaborationRequestLoading: boolean;
  viewerCollaborationEventTimeMs?: number;
  viewerStateUserId: number | null;
  deleted: boolean;
  [key: string]: unknown;
}

export function getBuildSummaryId(value: unknown) {
  if (!value || typeof value !== 'object') return 0;
  const build = value as Record<string, any>;
  const id = Number(build.id || build.contentId || build.buildId || 0);
  return Number.isFinite(id) && id > 0 ? Math.floor(id) : 0;
}

export function normalizeBuildSummary(
  value: unknown,
  current?: BuildSummary | null
): BuildSummary | null {
  const id = getBuildSummaryId(value);
  if (!id || !value || typeof value !== 'object') return null;
  const build = value as Record<string, any>;
  const uploader =
    build.uploader && typeof build.uploader === 'object' ? build.uploader : {};
  const ownerId = normalizePositiveInteger(
    build.userId ?? build.ownerId ?? uploader.id ?? current?.userId ?? 0
  );
  const username = normalizeText(
    build.username ?? build.ownerUsername ?? uploader.username ?? current?.username
  );
  const profilePicUrl = normalizeText(
    build.profilePicUrl ?? uploader.profilePicUrl ?? current?.profilePicUrl
  );
  const thumbnailUrl = normalizeText(
    build.thumbnailUrl ?? build.thumbUrl ?? current?.thumbnailUrl
  );
  const ownerProfileTheme = normalizeText(
    build.owner?.profileTheme ??
      build.profileTheme ??
      build.ownerProfileTheme ??
      uploader.profileTheme ??
      current?.owner?.profileTheme
  );
  const viewerRequest =
    Object.prototype.hasOwnProperty.call(build, 'viewerCollaborationRequest') ||
    Object.prototype.hasOwnProperty.call(build, 'collaborationRequest') ||
    Object.prototype.hasOwnProperty.call(build, 'request')
      ? normalizeBuildViewerCollaborationRequest(
          build.viewerCollaborationRequest ??
            build.collaborationRequest ??
            build.request
        )
      : current?.viewerCollaborationRequest ?? null;
  const viewerRequestLoaded =
    Object.prototype.hasOwnProperty.call(build, 'viewerCollaborationRequestLoaded')
      ? Boolean(build.viewerCollaborationRequestLoaded)
      : Object.prototype.hasOwnProperty.call(build, 'viewerCollaborationRequest') ||
          Object.prototype.hasOwnProperty.call(build, 'collaborationRequest') ||
          Object.prototype.hasOwnProperty.call(build, 'request')
        ? true
        : Boolean(current?.viewerCollaborationRequestLoaded);
  // Server payloads that carry tag state always pair `tags` with
  // `tagsUpdatedAt` (annotateBuildTags). A tags array WITHOUT it is not tag
  // state — notably Content-context state, where defaultContentState merges
  // `tags: []` (a video playlist-tags default) into every content object.
  // Treating that as "loaded and untagged" put a false "Add tags" action on
  // tagged builds, so fall back to the cached tag state instead.
  const hasTagState =
    Object.prototype.hasOwnProperty.call(build, 'tagsUpdatedAt') &&
    build.tagsUpdatedAt !== undefined;

  return {
    ...(current || {}),
    ...build,
    ...(hasTagState
      ? {}
      : { tags: current?.tags, tagsUpdatedAt: current?.tagsUpdatedAt }),
    id,
    contentId: id,
    contentType: 'build',
    userId: ownerId,
    username,
    profilePicUrl,
    owner: {
      id: ownerId,
      username,
      profilePicUrl,
      profileTheme: ownerProfileTheme || null
    },
    title: normalizeText(build.title ?? current?.title),
    description: normalizeText(build.description ?? current?.description),
    isPublic:
      (build.isPublic ?? current?.isPublic) == null
        ? undefined
        : normalizeBoolean(build.isPublic ?? current?.isPublic),
    hasCode:
      Object.prototype.hasOwnProperty.call(build, 'hasCode') ||
      current?.hasCode !== undefined
        ? Boolean(build.hasCode ?? current?.hasCode)
        : undefined,
    viewCount: normalizeNonNegativeInteger(
      build.viewCount ?? build.visits ?? current?.viewCount
    ),
    updatedAt: normalizeNonNegativeInteger(build.updatedAt ?? current?.updatedAt),
    lastActivityAt: normalizeNullablePositiveInteger(
      build.lastActivityAt ?? current?.lastActivityAt
    ),
    createdAt: normalizeNonNegativeInteger(build.createdAt ?? current?.createdAt),
    publishedAt: normalizeNullablePositiveInteger(
      build.publishedAt ?? current?.publishedAt
    ),
    sourceBuildId: normalizeNullablePositiveInteger(
      build.sourceBuildId ?? current?.sourceBuildId
    ),
    collaborationMode: normalizeBuildSummaryCollaborationMode(
      build.collaborationMode ?? current?.collaborationMode
    ),
    contributionAccess:
      build.contributionAccess === 'anyone' ||
      build.contributionAccess === 'invite_only'
        ? build.contributionAccess
        : current?.contributionAccess,
    contributionRootBuildId: normalizeNullablePositiveInteger(
      build.contributionRootBuildId ?? current?.contributionRootBuildId
    ),
    contributionBranchNumber: normalizeNullablePositiveInteger(
      build.contributionBranchNumber ?? current?.contributionBranchNumber
    ),
    contributionStatus:
      build.contributionStatus === null ||
      typeof build.contributionStatus === 'string'
        ? build.contributionStatus
        : current?.contributionStatus ?? null,
    rootBuildUsername:
      build.rootBuildUsername === null ||
      typeof build.rootBuildUsername === 'string'
        ? build.rootBuildUsername
        : current?.rootBuildUsername ?? null,
    rootBuildSourceBuildId: normalizeNullablePositiveInteger(
      build.rootBuildSourceBuildId ?? current?.rootBuildSourceBuildId
    ),
    rootBuildTitle:
      build.rootBuildTitle === null || typeof build.rootBuildTitle === 'string'
        ? build.rootBuildTitle
        : current?.rootBuildTitle ?? null,
    collaboratorCount: normalizeNonNegativeInteger(
      build.collaboratorCount ?? current?.collaboratorCount
    ),
    forkCount: normalizeNonNegativeInteger(build.forkCount ?? current?.forkCount),
    thumbnailUrl,
    thumbUrl: thumbnailUrl,
    pendingCollaborationRequestCount: normalizeNonNegativeInteger(
      build.pendingCollaborationRequestCount ??
        current?.pendingCollaborationRequestCount
    ),
    latestPendingCollaborationRequestAt: normalizeNullablePositiveInteger(
      build.latestPendingCollaborationRequestAt ??
        current?.latestPendingCollaborationRequestAt
    ),
    releaseStatus:
      build.releaseStatus && typeof build.releaseStatus === 'object'
        ? (build.releaseStatus as BuildReleaseStatus)
        : current?.releaseStatus ?? null,
    isFavorited: normalizeBoolean(build.isFavorited ?? current?.isFavorited),
    favoritedAt: normalizeNullablePositiveInteger(
      getBuildFieldWithCurrentFallback(build, current, 'favoritedAt')
    ),
    favoriteActivityAt: normalizeNullablePositiveInteger(
      getBuildFieldWithCurrentFallback(build, current, 'favoriteActivityAt')
    ),
    lastUsedAt: normalizeNullablePositiveInteger(
      build.lastUsedAt ?? current?.lastUsedAt
    ),
    hasActiveContributionInvite: normalizeBoolean(
      build.hasActiveContributionInvite ?? current?.hasActiveContributionInvite
    ),
    viewerCollaborationRequest: viewerRequest,
    viewerCollaborationRequestLoaded: viewerRequestLoaded,
    viewerCollaborationRequestLoading: normalizeBoolean(
      build.viewerCollaborationRequestLoading ??
        current?.viewerCollaborationRequestLoading
    ),
    viewerStateUserId: normalizeNullablePositiveInteger(
      build.viewerStateUserId ?? current?.viewerStateUserId
    ),
    deleted: normalizeBoolean(build.deleted ?? current?.deleted)
  };
}

export function normalizeBuildSummaries(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeBuildSummary(value))
    .filter((build): build is BuildSummary => Boolean(build));
}

export function mergeBuildSummaryMap(
  currentMap: Record<string, BuildSummary>,
  values: unknown
) {
  const list = Array.isArray(values) ? values : [values];
  let changed = false;
  const nextMap = { ...currentMap };
  for (const value of list) {
    const id = getBuildSummaryId(value);
    if (!id) continue;
    const key = String(id);
    const nextBuild = normalizeBuildSummary(value, nextMap[key]);
    if (!nextBuild) continue;
    nextMap[key] = nextBuild;
    changed = true;
  }
  return changed ? nextMap : currentMap;
}

export type BuildCardUpdatedAtSource = 'workspace' | 'publicVersion';

export function getBuildCardUpdatedAt(
  build:
    | {
        publishedAt?: unknown;
        updatedAt?: unknown;
        lastActivityAt?: unknown;
      }
    | null
    | undefined,
  source: BuildCardUpdatedAtSource
) {
  if (!build) return 0;
  if (source === 'publicVersion') {
    return normalizeNonNegativeInteger(build.publishedAt);
  }
  // lastActivityAt includes contribution-branch saves; lists are ordered by
  // it, so display the same timestamp to keep the order legible. updatedAt
  // can be fresher when the cached build was just saved in this session.
  return Math.max(
    normalizeNonNegativeInteger(build.lastActivityAt),
    normalizeNonNegativeInteger(build.updatedAt)
  );
}

// Derives the BuildContext summary patch a `build_collaboration_updated`
// socket event implies for the CURRENT viewer's join status. Every build card
// (RichText-embedded, list, mini) renders that status from the summary cache,
// so the canonical event has to land there — the chat-context update only
// reaches the chat request/invite cards. Returns null when the event is about
// another user's request/invite (e.g. the owner receiving someone's
// ask-to-join), which must not touch the viewer's own state.
export function getViewerCollaborationBuildSummaryPatch({
  viewerId,
  buildId,
  invite,
  inviteStatus,
  request,
  eventTimeMs,
  timeStamp
}: {
  viewerId: number;
  buildId?: number;
  invite?: Record<string, any> | null;
  inviteStatus?: string;
  request?: Record<string, any> | null;
  eventTimeMs?: number;
  timeStamp?: number;
}): { buildId: number; patch: Record<string, unknown> } | null {
  const normalizedViewerId = Math.floor(Number(viewerId || 0));
  const summaryBuildId = Math.floor(
    Number(buildId || request?.buildId || invite?.buildId || 0)
  );
  if (!normalizedViewerId || !summaryBuildId) return null;
  const requestIsMine =
    Math.floor(Number(request?.requesterUserId || 0)) === normalizedViewerId;
  const inviteIsMine =
    Math.floor(Number(invite?.userId || 0)) === normalizedViewerId;
  if (!requestIsMine && !inviteIsMine) return null;
  const requestBuildId = Math.floor(Number(request?.buildId || 0));
  const inviteBuildId = Math.floor(Number(invite?.buildId || 0));
  if (
    (requestIsMine && requestBuildId && requestBuildId !== summaryBuildId) ||
    (inviteIsMine && inviteBuildId && inviteBuildId !== summaryBuildId)
  ) {
    return null;
  }
  const resolvedInviteStatus = String(invite?.status || inviteStatus || '');
  const patch: Record<string, unknown> = {
    viewerCollaborationRequestLoading: false,
    viewerCollaborationEventTimeMs: getBuildCollaborationEventTimeMs({
      eventTimeMs,
      invite,
      request,
      timeStamp
    }),
    viewerStateUserId: normalizedViewerId
  };
  if (requestIsMine) {
    const requestStatus = String(request?.status || '');
    patch.viewerCollaborationRequest = request;
    patch.viewerCollaborationRequestLoaded = true;
    if (requestStatus === 'accepted') {
      patch.hasActiveContributionInvite = true;
    } else if (
      requestStatus === 'rejected' ||
      requestStatus === 'canceled'
    ) {
      patch.hasActiveContributionInvite = false;
    }
  } else if (
    resolvedInviteStatus === 'declined' ||
    resolvedInviteStatus === 'revoked' ||
    resolvedInviteStatus === 'left'
  ) {
    patch.viewerCollaborationRequest = null;
    patch.viewerCollaborationRequestLoaded = true;
    patch.hasActiveContributionInvite = false;
  } else {
    // The API contract supplies a canonical request projection for pending
    // and accepted invites. If an older/malformed event lacks it, force the
    // normal writer-backed loader instead of inventing shared state locally.
    patch.viewerCollaborationRequestLoaded = false;
    if (resolvedInviteStatus === 'accepted') {
      patch.hasActiveContributionInvite = true;
    }
  }
  return { buildId: summaryBuildId, patch };
}

function getBuildCollaborationEventTimeMs({
  eventTimeMs,
  invite,
  request,
  timeStamp
}: {
  eventTimeMs?: number;
  invite?: Record<string, any> | null;
  request?: Record<string, any> | null;
  timeStamp?: number;
}) {
  return Math.max(
    normalizeBuildEventTimeMs(eventTimeMs),
    normalizeBuildEventTimeMs(timeStamp),
    normalizeBuildEventTimeMs(invite?.createdAt),
    normalizeBuildEventTimeMs(invite?.acceptedAt),
    normalizeBuildEventTimeMs(invite?.declinedAt),
    normalizeBuildEventTimeMs(invite?.revokedAt),
    normalizeBuildEventTimeMs(invite?.leftAt),
    normalizeBuildEventTimeMs(request?.createdAt),
    normalizeBuildEventTimeMs(request?.updatedAt),
    normalizeBuildEventTimeMs(request?.respondedAt),
    normalizeBuildEventTimeMs(request?.canceledAt)
  );
}

function normalizeBuildEventTimeMs(value: unknown) {
  const normalized = Number(value || 0);
  if (!Number.isFinite(normalized) || normalized <= 0) return 0;
  return normalized > 1000000000000 ? normalized : normalized * 1000;
}

export function patchBuildSummaryMap(
  currentMap: Record<string, BuildSummary>,
  buildId: number,
  patch: Record<string, unknown>
) {
  const id = Math.floor(Number(buildId || 0));
  if (!id) return currentMap;
  const key = String(id);
  const current = currentMap[key] || null;
  const nextViewerEventTime = Number(
    patch?.viewerCollaborationEventTimeMs || 0
  );
  const currentViewerEventTime = Number(
    current?.viewerCollaborationEventTimeMs || 0
  );
  if (
    nextViewerEventTime > 0 &&
    currentViewerEventTime > nextViewerEventTime
  ) {
    return currentMap;
  }
  const nextBuild = normalizeBuildSummary({ ...(patch || {}), id }, current);
  if (!nextBuild) return currentMap;
  return {
    ...currentMap,
    [key]: nextBuild
  };
}

export function removeBuildSummaryFromMap(
  currentMap: Record<string, BuildSummary>,
  buildId: number
) {
  const id = Math.floor(Number(buildId || 0));
  if (!id || !currentMap[String(id)]) return currentMap;
  const nextMap = { ...currentMap };
  delete nextMap[String(id)];
  return nextMap;
}

export function normalizeBuildViewerCollaborationRequest(
  value: unknown
): BuildViewerCollaborationRequest | null {
  if (!value || typeof value !== 'object') return null;
  const request = value as Record<string, any>;
  const id = normalizePositiveInteger(request.id);
  const status = normalizeBuildViewerCollaborationStatus(request.status);
  const inviteId = normalizePositiveInteger(request.inviteId);
  const hasInviteBackedRelationship =
    inviteId > 0 && (status === 'invited' || status === 'accepted');
  if ((!id && !hasInviteBackedRelationship) || !status) return null;
  return {
    id,
    ...(inviteId ? { inviteId } : {}),
    status,
    message: normalizeText(request.message),
    ownerHidden: normalizeNonNegativeInteger(request.ownerHidden)
  };
}

function normalizeBuildViewerCollaborationStatus(
  value: unknown
): BuildViewerCollaborationStatus | null {
  return value === 'pending' ||
    value === 'invited' ||
    value === 'accepted' ||
    value === 'rejected' ||
    value === 'canceled'
    ? value
    : null;
}

function normalizeBuildSummaryCollaborationMode(
  value: unknown
): BuildSummary['collaborationMode'] {
  if (value === 'open_source' || value === 'contribution') return value;
  return 'private';
}

function getBuildFieldWithCurrentFallback(
  build: Record<string, any>,
  current: BuildSummary | null | undefined,
  field: keyof BuildSummary
) {
  return Object.prototype.hasOwnProperty.call(build, field)
    ? build[field]
    : current?.[field];
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeBoolean(value: unknown) {
  return value === true || Number(value || 0) === 1;
}

function normalizePositiveInteger(value: unknown) {
  const normalized = Math.floor(Number(value || 0));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

function normalizeNonNegativeInteger(value: unknown) {
  const normalized = Math.floor(Number(value || 0));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

function normalizeNullablePositiveInteger(value: unknown) {
  const normalized = normalizePositiveInteger(value);
  return normalized || null;
}

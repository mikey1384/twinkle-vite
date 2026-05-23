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
  isPublic: boolean;
  hasCode?: boolean;
  viewCount: number;
  updatedAt: number;
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

  return {
    ...(current || {}),
    ...build,
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
      profileTheme:
        typeof build.profileTheme === 'string'
          ? build.profileTheme
          : typeof uploader.profileTheme === 'string'
            ? uploader.profileTheme
            : current?.owner?.profileTheme || null
    },
    title: normalizeText(build.title ?? current?.title),
    description: normalizeText(build.description ?? current?.description),
    isPublic: normalizeBoolean(build.isPublic ?? current?.isPublic),
    hasCode:
      Object.prototype.hasOwnProperty.call(build, 'hasCode') ||
      current?.hasCode !== undefined
        ? Boolean(build.hasCode ?? current?.hasCode)
        : undefined,
    viewCount: normalizeNonNegativeInteger(
      build.viewCount ?? build.visits ?? current?.viewCount
    ),
    updatedAt: normalizeNonNegativeInteger(build.updatedAt ?? current?.updatedAt),
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

export function patchBuildSummaryMap(
  currentMap: Record<string, BuildSummary>,
  buildId: number,
  patch: Record<string, unknown>
) {
  const id = Math.floor(Number(buildId || 0));
  if (!id) return currentMap;
  const key = String(id);
  const current = currentMap[key] || null;
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

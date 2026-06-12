import { useEffect, useMemo, useRef } from 'react';
import { useBuildContext, useKeyContext } from '~/contexts';
import {
  getBuildSummaryId,
  normalizeBuildSummary,
  type BuildSummary
} from '~/helpers/buildSummaryHelpers';

const SERVER_COUNT_FIELD_ALIASES = {
  viewCount: ['viewCount', 'visits'],
  collaboratorCount: ['collaboratorCount'],
  forkCount: ['forkCount'],
  pendingCollaborationRequestCount: ['pendingCollaborationRequestCount'],
  latestPendingCollaborationRequestAt: ['latestPendingCollaborationRequestAt']
} as const;

type ServerCountField = keyof typeof SERVER_COUNT_FIELD_ALIASES;

export function useBuildCardData(
  buildInput: unknown,
  { cacheInput = true }: { cacheInput?: boolean } = {}
): BuildSummary | null {
  const buildId = getBuildSummaryId(buildInput);
  const buildKey = buildId ? String(buildId) : '';
  const buildSummary = useBuildContext((v) =>
    buildKey ? v.state.buildsById?.[buildKey] || null : null
  ) as BuildSummary | null;
  const onUpsertBuildSummary = useBuildContext(
    (v) => v.actions.onUpsertBuildSummary
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const viewerId = normalizeBuildCardPositiveInteger(userId);
  const inputFingerprint = useMemo(
    () => getBuildCardInputFingerprint(buildInput),
    [buildInput]
  );
  const lastInputFingerprintRef = useRef('');
  const inputChanged = inputFingerprint !== lastInputFingerprintRef.current;
  const build = useMemo(
    () =>
      mergeBuildCardSummary(buildInput, buildSummary, {
        inputChanged,
        viewerId
      }),
    [buildInput, buildSummary, inputChanged, viewerId]
  );

  useEffect(() => {
    lastInputFingerprintRef.current = inputFingerprint;
    if (!cacheInput || !buildId || !build) return;
    onUpsertBuildSummary(build);
    // build is intentionally excluded so context-only changes do not
    // re-dispatch the cached summary back into BuildContext.
    // onUpsertBuildSummary is a stable BuildContext action helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, cacheInput, inputFingerprint, viewerId]);

  return build;
}

function mergeBuildCardSummary(
  buildInput: unknown,
  cachedBuild: BuildSummary | null,
  options: {
    inputChanged: boolean;
    viewerId: number;
  }
) {
  const inputBuild = normalizeBuildSummary(buildInput);
  if (!cachedBuild) {
    return inputBuild
      ? addInitialBuildCardStateKeys(inputBuild, buildInput, options.viewerId)
      : inputBuild;
  }
  if (!inputBuild) return cachedBuild;

  const cachedUpdatedAt = Number(cachedBuild.updatedAt || 0);
  const inputUpdatedAt = Number(inputBuild.updatedAt || 0);
  const inputHasChangedMetadata =
    options.inputChanged &&
    hasAnyBuildInputField(buildInput, [
      'title',
      'description',
      'thumbnailUrl',
      'thumbUrl'
    ]);
  const inputHasNewerMetadata =
    inputUpdatedAt > 0 && inputUpdatedAt > cachedUpdatedAt;
  const inputHasSameTimestampMetadata =
    inputUpdatedAt > 0 &&
    inputUpdatedAt === cachedUpdatedAt &&
    inputHasChangedMetadata;
  const inputCanReplaceMetadata =
    inputHasNewerMetadata || inputHasSameTimestampMetadata;
  const baseBuild =
    inputCanReplaceMetadata
      ? normalizeBuildSummary(buildInput, cachedBuild) || cachedBuild
      : cachedBuild;
  const mergedBuild = mergeMissingBuildCardMetadata(baseBuild, inputBuild, {
    allowDescriptionFallback: inputCanReplaceMetadata || cachedUpdatedAt <= 0,
    inputCanReplaceMetadata,
    inputHasDescription: hasBuildInputField(buildInput, 'description'),
    inputHasThumbnailUrl: hasAnyBuildInputField(buildInput, [
      'thumbnailUrl',
      'thumbUrl'
    ]),
    inputHasTitle: hasBuildInputField(buildInput, 'title')
  });

  return mergeBuildCardState(mergedBuild, cachedBuild, inputBuild, buildInput, {
    ...options,
    inputHasNewerMetadata
  });
}

function addInitialBuildCardStateKeys(
  build: BuildSummary,
  buildInput: unknown,
  viewerId: number
): BuildSummary {
  const inputHasFavoriteState = hasAnyBuildInputField(buildInput, [
    'isFavorited',
    'favoritedAt',
    'favoriteActivityAt'
  ]);
  const inputHasViewerState = hasAnyBuildInputField(buildInput, [
    'hasActiveContributionInvite',
    'viewerCollaborationRequest',
    'collaborationRequest',
    'request',
    'viewerCollaborationRequestLoaded',
    'viewerCollaborationRequestLoading',
    'viewerStateUserId'
  ]);

  return {
    ...build,
    serverCountFields: getBuildInputServerCountFields(buildInput),
    ...(inputHasFavoriteState ? { favoriteStateUserId: viewerId || null } : {}),
    ...(inputHasViewerState && !build.viewerStateUserId && viewerId
      ? { viewerStateUserId: viewerId }
      : {})
  };
}

function mergeMissingBuildCardMetadata(
  cachedBuild: BuildSummary,
  inputBuild: BuildSummary,
  {
    allowDescriptionFallback,
    inputCanReplaceMetadata,
    inputHasDescription,
    inputHasThumbnailUrl,
    inputHasTitle
  }: {
    allowDescriptionFallback: boolean;
    inputCanReplaceMetadata: boolean;
    inputHasDescription: boolean;
    inputHasThumbnailUrl: boolean;
    inputHasTitle: boolean;
  }
): BuildSummary {
  const title =
    inputCanReplaceMetadata && inputHasTitle
      ? inputBuild.title || cachedBuild.title
      : cachedBuild.title || inputBuild.title;
  const description =
    inputCanReplaceMetadata && inputHasDescription
      ? inputBuild.description
      : cachedBuild.description ||
        (allowDescriptionFallback || inputHasDescription
          ? inputBuild.description
          : '');
  const thumbnailUrl =
    inputCanReplaceMetadata && inputHasThumbnailUrl
      ? inputBuild.thumbnailUrl
      : cachedBuild.thumbnailUrl || inputBuild.thumbnailUrl;
  const owner = {
    ...cachedBuild.owner,
    id: cachedBuild.owner?.id || inputBuild.owner?.id || 0,
    username: cachedBuild.owner?.username || inputBuild.owner?.username || '',
    profilePicUrl:
      cachedBuild.owner?.profilePicUrl || inputBuild.owner?.profilePicUrl || '',
    profileTheme:
      cachedBuild.owner?.profileTheme || inputBuild.owner?.profileTheme || null
  };

  return {
    ...cachedBuild,
    userId: cachedBuild.userId || inputBuild.userId,
    username: cachedBuild.username || inputBuild.username,
    profilePicUrl: cachedBuild.profilePicUrl || inputBuild.profilePicUrl,
    owner,
    title,
    description,
    updatedAt: cachedBuild.updatedAt || inputBuild.updatedAt,
    lastActivityAt: cachedBuild.lastActivityAt || inputBuild.lastActivityAt,
    createdAt: cachedBuild.createdAt || inputBuild.createdAt,
    publishedAt: cachedBuild.publishedAt || inputBuild.publishedAt,
    sourceBuildId: cachedBuild.sourceBuildId || inputBuild.sourceBuildId,
    contributionRootBuildId:
      cachedBuild.contributionRootBuildId || inputBuild.contributionRootBuildId,
    contributionBranchNumber:
      cachedBuild.contributionBranchNumber ||
      inputBuild.contributionBranchNumber,
    contributionStatus:
      cachedBuild.contributionStatus || inputBuild.contributionStatus,
    rootBuildUsername:
      cachedBuild.rootBuildUsername || inputBuild.rootBuildUsername,
    rootBuildSourceBuildId:
      cachedBuild.rootBuildSourceBuildId || inputBuild.rootBuildSourceBuildId,
    rootBuildTitle: cachedBuild.rootBuildTitle || inputBuild.rootBuildTitle,
    thumbnailUrl,
    thumbUrl: thumbnailUrl,
    viewCount: cachedBuild.viewCount || inputBuild.viewCount,
    lastUsedAt: cachedBuild.lastUsedAt || inputBuild.lastUsedAt
  };
}

function mergeBuildCardState(
  build: BuildSummary,
  cachedBuild: BuildSummary,
  inputBuild: BuildSummary,
  buildInput: unknown,
  {
    inputChanged,
    inputHasNewerMetadata,
    viewerId
  }: {
    inputChanged: boolean;
    inputHasNewerMetadata: boolean;
    viewerId: number;
  }
): BuildSummary {
  const serverCountFields = getNextServerCountFields({
    buildInput,
    cachedBuild
  });
  const inputCanRefreshServerCountField = (field: ServerCountField) =>
    serverCountFields.acceptedInputFields.has(field);
  const inputHasFavoriteState = hasAnyBuildInputField(buildInput, [
    'isFavorited',
    'favoritedAt',
    'favoriteActivityAt'
  ]);
  const cachedFavoriteStateUserId = normalizeBuildCardPositiveInteger(
    cachedBuild.favoriteStateUserId
  );
  const cachedFavoriteMatchesViewer = viewerId
    ? cachedFavoriteStateUserId === viewerId
    : !cachedFavoriteStateUserId;
  const useInputFavoriteState =
    inputHasFavoriteState &&
    (inputChanged || inputHasNewerMetadata || !cachedFavoriteMatchesViewer);
  const inputHasViewerState = hasAnyBuildInputField(buildInput, [
    'hasActiveContributionInvite',
    'viewerCollaborationRequest',
    'collaborationRequest',
    'request',
    'viewerCollaborationRequestLoaded',
    'viewerCollaborationRequestLoading',
    'viewerStateUserId'
  ]);
  const cachedViewerStateUserId = normalizeBuildCardPositiveInteger(
    cachedBuild.viewerStateUserId
  );
  const cachedViewerStateMatchesViewer = viewerId
    ? cachedViewerStateUserId === viewerId
    : !cachedViewerStateUserId;
  const useInputViewerState =
    (inputChanged && inputHasViewerState) || !cachedViewerStateMatchesViewer;
  const inputViewerStateUserId =
    inputBuild.viewerStateUserId ||
    (inputHasViewerState && viewerId ? viewerId : null);
  const inputTags = Array.isArray(inputBuild.tags)
    ? (inputBuild.tags as unknown[])
    : undefined;
  const cachedTags = Array.isArray(cachedBuild.tags)
    ? (cachedBuild.tags as unknown[])
    : undefined;
  const inputTagsUpdatedAt = Number(inputBuild.tagsUpdatedAt || 0);
  const cachedTagsUpdatedAt = Number(cachedBuild.tagsUpdatedAt || 0);
  // tagsUpdatedAt is the server-side generation time, so recency decides
  // stale-row vs fresh-cache conflicts: list/profile rows that lag behind a
  // confirmed (re)tag can neither clear nor revert the cached tags.
  const useInputTags =
    inputTags != null &&
    (cachedTags == null || inputTagsUpdatedAt > cachedTagsUpdatedAt);

  return {
    ...build,
    serverCountFields: serverCountFields.nextFields,
    tags: useInputTags ? inputTags : cachedTags,
    tagsUpdatedAt: useInputTags ? inputTagsUpdatedAt : cachedTagsUpdatedAt,
    viewCount: inputCanRefreshServerCountField('viewCount')
      ? inputBuild.viewCount
      : cachedBuild.viewCount,
    collaboratorCount: inputCanRefreshServerCountField('collaboratorCount')
      ? inputBuild.collaboratorCount
      : cachedBuild.collaboratorCount,
    forkCount: inputCanRefreshServerCountField('forkCount')
      ? inputBuild.forkCount
      : cachedBuild.forkCount,
    pendingCollaborationRequestCount: inputCanRefreshServerCountField(
      'pendingCollaborationRequestCount'
    )
      ? inputBuild.pendingCollaborationRequestCount
      : cachedBuild.pendingCollaborationRequestCount,
    latestPendingCollaborationRequestAt: inputCanRefreshServerCountField(
      'latestPendingCollaborationRequestAt'
    )
      ? inputBuild.latestPendingCollaborationRequestAt
      : cachedBuild.latestPendingCollaborationRequestAt,
    isFavorited: useInputFavoriteState
      ? inputBuild.isFavorited
      : cachedBuild.isFavorited,
    favoritedAt: useInputFavoriteState
      ? inputBuild.favoritedAt
      : cachedBuild.favoritedAt,
    favoriteActivityAt: useInputFavoriteState
      ? inputBuild.favoriteActivityAt
      : cachedBuild.favoriteActivityAt,
    favoriteStateUserId: useInputFavoriteState
      ? viewerId || null
      : cachedBuild.favoriteStateUserId,
    hasActiveContributionInvite: useInputViewerState
      ? inputBuild.hasActiveContributionInvite
      : cachedBuild.hasActiveContributionInvite,
    viewerCollaborationRequest: useInputViewerState
      ? inputBuild.viewerCollaborationRequest
      : cachedBuild.viewerCollaborationRequest,
    viewerCollaborationRequestLoaded: useInputViewerState
      ? inputBuild.viewerCollaborationRequestLoaded
      : cachedBuild.viewerCollaborationRequestLoaded,
    viewerCollaborationRequestLoading: useInputViewerState
      ? inputBuild.viewerCollaborationRequestLoading
      : cachedBuild.viewerCollaborationRequestLoading,
    viewerStateUserId: useInputViewerState
      ? inputViewerStateUserId
      : cachedBuild.viewerStateUserId
  };
}

function getNextServerCountFields({
  buildInput,
  cachedBuild
}: {
  buildInput: unknown;
  cachedBuild: BuildSummary;
}) {
  const cachedFields = new Set(getCachedServerCountFields(cachedBuild));
  const explicitInputFields = new Set(getExplicitServerCountFields(buildInput));
  const acceptedInputFields = new Set<ServerCountField>();
  const serverCountFields = Object.keys(
    SERVER_COUNT_FIELD_ALIASES
  ) as ServerCountField[];
  for (const field of serverCountFields) {
    if (!hasAnyBuildInputField(buildInput, SERVER_COUNT_FIELD_ALIASES[field])) {
      continue;
    }
    if (!cachedFields.has(field) || explicitInputFields.has(field)) {
      acceptedInputFields.add(field);
      cachedFields.add(field);
    }
  }
  return {
    acceptedInputFields,
    nextFields: Array.from(cachedFields).sort()
  };
}

function getBuildInputServerCountFields(buildInput: unknown) {
  return (Object.keys(SERVER_COUNT_FIELD_ALIASES) as ServerCountField[]).filter(
    (field) => hasAnyBuildInputField(buildInput, SERVER_COUNT_FIELD_ALIASES[field])
  );
}

function getCachedServerCountFields(build: BuildSummary) {
  return Array.isArray(build.serverCountFields)
    ? (build.serverCountFields as unknown[])
        .map((field) => String(field))
        .filter((field): field is ServerCountField =>
          Object.prototype.hasOwnProperty.call(SERVER_COUNT_FIELD_ALIASES, field)
        )
    : [];
}

function getExplicitServerCountFields(buildInput: unknown) {
  if (!buildInput || typeof buildInput !== 'object') return [];
  const fields = (buildInput as Record<string, unknown>).serverCountFields;
  return Array.isArray(fields)
    ? fields
        .map((field) => String(field))
        .filter((field): field is ServerCountField =>
          Object.prototype.hasOwnProperty.call(SERVER_COUNT_FIELD_ALIASES, field)
        )
    : [];
}

function hasAnyBuildInputField(
  buildInput: unknown,
  fields: ReadonlyArray<string>
) {
  if (!buildInput || typeof buildInput !== 'object') return false;
  return fields.some((field) => hasBuildInputField(buildInput, field));
}

function hasBuildInputField(buildInput: unknown, field: string) {
  if (!buildInput || typeof buildInput !== 'object') return false;
  if (!Object.prototype.hasOwnProperty.call(buildInput, field)) return false;
  return (buildInput as Record<string, unknown>)[field] !== undefined;
}

function normalizeBuildCardPositiveInteger(value: unknown) {
  const normalized = Math.floor(Number(value || 0));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

function getBuildCardInputFingerprint(buildInput: unknown) {
  if (!buildInput || typeof buildInput !== 'object') return '';
  const build = buildInput as Record<string, any>;
  return [
    getBuildSummaryId(build),
    build.userId,
    build.ownerId,
    build.username,
    build.ownerUsername,
    build.profilePicUrl,
    build.profileTheme,
    build.uploader?.id,
    build.uploader?.username,
    build.uploader?.profilePicUrl,
    build.uploader?.profileTheme,
    build.title,
    build.description,
    build.thumbnailUrl || build.thumbUrl,
    build.isPublic,
    build.isFavorited,
    build.favoritedAt,
    build.favoriteActivityAt,
    build.favoriteStateUserId,
    build.collaborationMode,
    build.contributionStatus,
    build.sourceBuildId,
    build.rootBuildSourceBuildId,
    build.forkCount,
    build.collaboratorCount,
    build.pendingCollaborationRequestCount,
    build.viewCount,
    build.visits,
    build.createdAt,
    build.updatedAt,
    build.lastActivityAt,
    build.publishedAt,
    build.contributionRootBuildId,
    build.contributionBranchNumber,
    build.rootBuildUsername,
    build.rootBuildSourceBuildId,
    build.rootBuildTitle,
    build.hasActiveContributionInvite,
    build.latestPendingCollaborationRequestAt,
    build.viewerCollaborationRequest?.id,
    build.viewerCollaborationRequest?.inviteId,
    build.viewerCollaborationRequest?.status,
    build.viewerCollaborationRequestLoaded,
    build.viewerCollaborationRequestLoading,
    build.viewerStateUserId,
    build.releaseStatus?.state,
    build.releaseStatus?.hasUnpublishedChanges,
    Array.isArray(build.tags)
      ? build.tags.map((tag: any) => tag?.slug).join(',')
      : '',
    build.tagsUpdatedAt
  ]
    .map((value) => String(value ?? ''))
    .join('|');
}

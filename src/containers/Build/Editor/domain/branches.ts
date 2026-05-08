import type { BuildLumineChatVisibility } from '../ChatPanel/types';
import type { BuildWorkspaceCommunicationMode } from '~/contexts/Build/reducer';
import {
  getBuildBranchDisplayTitle,
  isBuildContributionFork
} from '~/domains/Build/shared/domain/relationshipLabels';
import type {
  Build,
  BuildCopilotPolicy,
  BuildReleaseStatus,
  BuildRuntimeUploadUsage,
  BuildVersionSummary
} from '../types';

export function getBuildVersionSortRank(version: BuildVersionSummary) {
  switch (String(version.contributionStatus || '').trim()) {
    case 'merging':
      return 1;
    case 'draft':
      return 2;
    case 'merged':
      return 3;
    default:
      return 4;
  }
}

export function sortBuildVersionSummaries(versions: BuildVersionSummary[]) {
  return [...versions].sort(
    (a, b) =>
      getBuildVersionSortRank(a) - getBuildVersionSortRank(b) ||
      Number(b.updatedAt || 0) - Number(a.updatedAt || 0) ||
      Number(b.id || 0) - Number(a.id || 0)
  );
}

export function normalizeBuildVersionSummary(
  value: Record<string, any> | null | undefined
): BuildVersionSummary | null {
  const id = Number(value?.id || 0);
  if (!id) return null;
  return {
    ...value,
    id,
    userId: Number(value?.userId || 0) || null,
    username: value?.username || null,
    profilePicUrl: value?.profilePicUrl || null,
    title: value?.title || '',
    contributionRootBuildId: Number(value?.contributionRootBuildId || 0) || null,
    contributionContributorId:
      Number(value?.contributionContributorId || 0) || null,
    contributionBranchNumber:
      Number(value?.contributionBranchNumber || 0) || null,
    contributionStatus: value?.contributionStatus || null,
    updatedAt: Number(value?.updatedAt || 0) || null,
    thumbnailUrl: value?.thumbnailUrl || null
  };
}

export function markBuildReleaseStatusUnpublished(
  build: Build,
  options: { force?: boolean } = {}
): Build {
  if (!build.isPublic || !build.releaseStatus) return build;
  if (build.releaseStatus.hasUnpublishedChanges) return build;
  if (
    !options.force &&
    Number(build.currentArtifactVersionId || 0) > 0 &&
    Number(build.currentArtifactVersionId || 0) ===
      Number(build.publishedArtifactVersionId || 0)
  ) {
    return build;
  }
  return {
    ...build,
    releaseStatus: {
      ...build.releaseStatus,
      state: 'unpublished_changes',
      hasUnpublishedChanges: true,
      diff: {
        total: Math.max(Number(build.releaseStatus.diff?.total || 0), 1),
        added: Number(build.releaseStatus.diff?.added || 0),
        updated: Math.max(Number(build.releaseStatus.diff?.updated || 0), 1),
        deleted: Number(build.releaseStatus.diff?.deleted || 0)
      }
    }
  };
}

export function canStartProjectScopedContribution(build: Build) {
  return Boolean(build.hasActiveContributionInvite);
}

export function canStartStandaloneFork(build: Build) {
  if (isBuildContributionFork(build)) {
    return (
      build.rootBuildCollaborationMode === 'open_source' &&
      Number(build.rootBuildIsPublic || 0) === 1
    );
  }
  return (
    build.collaborationMode === 'open_source' &&
    Number(build.isPublic || 0) === 1
  );
}

export function canEditBuildProject(build: Build) {
  const status = build.contributionStatus || 'none';
  return (
    status === 'none' ||
    status === 'draft' ||
    status === 'merging' ||
    status === 'merged'
  );
}

export function markBuildContributionWorkspaceEdited(build: Build): Build {
  if (build.contributionStatus !== 'merged') return build;
  return {
    ...build,
    contributionStatus: 'draft',
    contributionClosedAt: 0
  };
}

export function canMergeBuildBranch(build: Build, userId?: number | null) {
  const status = build.contributionStatus || 'none';
  return (
    isBuildContributionFork(build) &&
    Number(build.rootBuildUserId || 0) === Number(userId || 0) &&
    status === 'draft'
  );
}

export function getBuildContributionContributorUserId(build?: {
  contributionContributorId?: number | null;
  userId?: number | null;
}) {
  return Number(build?.contributionContributorId || build?.userId || 0) || 0;
}

export function canReceiveBranchMergeStatus(status?: string | null) {
  const normalizedStatus = String(status || '').trim();
  return normalizedStatus === 'draft' || normalizedStatus === 'merged';
}

export function canUseBranchAsMergeSourceStatus(status?: string | null) {
  const normalizedStatus = String(status || '').trim();
  return normalizedStatus === 'draft' || normalizedStatus === 'merged';
}

export function canMergeBuildBranchIntoOwnBranch({
  build,
  userId,
  ownBranch
}: {
  build: Build;
  userId?: number | null;
  ownBranch?: BuildVersionSummary | null;
}) {
  const normalizedUserId = Number(userId || 0);
  const ownBranchId = Number(ownBranch?.id || 0);
  return (
    normalizedUserId > 0 &&
    isBuildContributionFork(build) &&
    Number(build.contributionRootBuildId || 0) > 0 &&
    ownBranchId > 0 &&
    ownBranchId !== Number(build.id || 0) &&
    getBuildContributionContributorUserId(build) !== normalizedUserId &&
    canUseBranchAsMergeSourceStatus(build.contributionStatus) &&
    canReceiveBranchMergeStatus(ownBranch?.contributionStatus)
  );
}

export function canUseBuildBranchAsMergeTarget({
  version,
  activeBuildId,
  userId
}: {
  version: BuildVersionSummary;
  activeBuildId?: number | null;
  userId?: number | null;
}) {
  return (
    Number(version.id || 0) > 0 &&
    Number(version.id || 0) !== Number(activeBuildId || 0) &&
    getBuildContributionContributorUserId(version) === Number(userId || 0) &&
    canReceiveBranchMergeStatus(version.contributionStatus)
  );
}

export function getBuildBranchMergeTargetLabel({
  version,
  rootProjectTitle
}: {
  version: BuildVersionSummary;
  rootProjectTitle?: string | null;
}) {
  return getBuildBranchDisplayTitle({
    ...version,
    rootBuildTitle: rootProjectTitle
  });
}

export function canDeleteBuildBranchStatus(status?: string | null) {
  const normalizedStatus = String(status || 'draft').trim() || 'draft';
  return normalizedStatus === 'draft' || normalizedStatus === 'none';
}

export function canReviewBuildBranchStatus(status?: string | null) {
  const normalizedStatus = String(status || 'draft').trim() || 'draft';
  return normalizedStatus !== 'merged';
}

export function formatOwnerAttentionCount(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  const normalizedCount = Math.max(0, Math.floor(Number(count) || 0));
  return `${normalizedCount} ${normalizedCount === 1 ? singular : plural}`;
}

export function getReleaseDiffTotal(releaseStatus?: BuildReleaseStatus | null) {
  return Math.max(0, Math.floor(Number(releaseStatus?.diff?.total) || 0));
}

export function stripBranchTitleSuffixes(value: string) {
  let nextTitle = value.trim();
  let previousTitle = '';
  while (nextTitle && nextTitle !== previousTitle) {
    previousTitle = nextTitle;
    nextTitle = nextTitle
      .replace(/\s+\((Fork|Contribution)\)\s*$/i, '')
      .trim();
  }
  return nextTitle || value;
}

export function normalizeWorkspacePanelScrollTop(value: unknown) {
  const scrollTop = Number(value || 0);
  if (!Number.isFinite(scrollTop)) return 0;
  return Math.max(0, Math.floor(scrollTop));
}

export function normalizeBuildWorkspaceCommunicationMode(
  value: unknown
): BuildWorkspaceCommunicationMode {
  return value === 'people' || value === 'versions' ? value : 'lumine';
}

export function formatBranchFullDisplayTitle({
  projectTitle,
  branchTitle
}: {
  projectTitle?: string | null;
  branchTitle: string;
}) {
  const normalizedProjectTitle = stripBranchTitleSuffixes(
    String(projectTitle || '').trim()
  );
  const normalizedBranchTitle = String(branchTitle || '').trim();
  if (
    normalizedProjectTitle &&
    normalizedBranchTitle &&
    normalizedProjectTitle.toLowerCase() !==
      normalizedBranchTitle.toLowerCase()
  ) {
    return `${normalizedProjectTitle} / ${normalizedBranchTitle}`;
  }
  return normalizedBranchTitle || normalizedProjectTitle || 'Untitled Build';
}

export function normalizeLumineChatVisibility(
  value: unknown
): BuildLumineChatVisibility {
  return value === 'collaborators' ? value : 'private';
}

export function applyRuntimeUploadUsageToCopilotPolicy(
  policy: BuildCopilotPolicy | null,
  usage: BuildRuntimeUploadUsage | null | undefined
) {
  if (!policy || !usage) {
    return policy;
  }
  return {
    ...policy,
    limits: {
      ...policy.limits,
      maxRuntimeFileStorageBytes: Math.max(
        0,
        Math.floor(Number(usage.maxRuntimeFileStorageBytes) || 0)
      )
    },
    usage: {
      ...policy.usage,
      runtimeFileStorageBytes: Math.max(
        0,
        Math.floor(Number(usage.totalBytes) || 0)
      ),
      runtimeFileStorageRemaining: Math.max(
        0,
        Math.floor(Number(usage.remainingBytes) || 0)
      ),
      runtimeFileCount: Math.max(0, Math.floor(Number(usage.fileCount) || 0))
    }
  };
}

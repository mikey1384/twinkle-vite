import type { User } from '~/types';

export type BuildCollaborationMode = 'private' | 'open_source';

export interface BuildReleaseStatus {
  state?: string;
  hasPublishedVersion?: boolean;
  hasUnpublishedChanges?: boolean;
  diff?: {
    total?: number;
    added?: number;
    updated?: number;
    deleted?: number;
  } | null;
}

export interface NormalizedBuildReleaseStatus {
  state: 'up_to_date' | 'unpublished_changes' | 'missing_snapshot';
  hasPublishedVersion: boolean;
  hasUnpublishedChanges: boolean;
  diff: {
    total: number;
    added: number;
    updated: number;
    deleted: number;
  };
}

export function normalizeBuildCollaborationMode(
  value: unknown
): BuildCollaborationMode {
  return value === 'open_source' ? value : 'private';
}

// Favorites target the canonical project. A branch is a working copy and is
// not favoritable on its own, so its favorite state and toggles belong to the
// parent. The server sends favoriteBuildId; contributionRootBuildId is the
// fallback for payloads serialized without it.
export function getBuildFavoriteTargetId(build: {
  id?: number | string;
  favoriteBuildId?: number | null;
  contributionRootBuildId?: number | null;
}) {
  const favoriteBuildId = Math.floor(Number(build?.favoriteBuildId) || 0);
  if (favoriteBuildId > 0) return favoriteBuildId;
  const rootBuildId = Math.floor(Number(build?.contributionRootBuildId) || 0);
  if (rootBuildId > 0) return rootBuildId;
  return Math.floor(Number(build?.id) || 0);
}

export function formatBuildCollaboratorCount(count: number) {
  return count === 1
    ? '1 team member'
    : `${count.toLocaleString()} team members`;
}

export function formatBuildForkCount(count: number) {
  return count === 1 ? '1 fork' : `${count.toLocaleString()} forks`;
}

export function getBuildUsernameUser(build: {
  profilePicUrl?: string | null;
  userId?: number | string | null;
  username?: string | null;
}): User {
  return {
    id: Number(build.userId || 0),
    profilePicUrl: build.profilePicUrl || '',
    username: build.username || ''
  };
}

export function normalizeBuildReleaseStatus(
  value: unknown
): NormalizedBuildReleaseStatus | null {
  if (!value || typeof value !== 'object') return null;
  const status = value as BuildReleaseStatus;
  const state =
    status.state === 'missing_snapshot'
      ? 'missing_snapshot'
      : status.state === 'unpublished_changes'
        ? 'unpublished_changes'
        : 'up_to_date';

  return {
    state,
    hasPublishedVersion: Boolean(status.hasPublishedVersion),
    hasUnpublishedChanges: Boolean(status.hasUnpublishedChanges),
    diff: {
      total: Number(status.diff?.total || 0),
      added: Number(status.diff?.added || 0),
      updated: Number(status.diff?.updated || 0),
      deleted: Number(status.diff?.deleted || 0)
    }
  };
}

export function formatBuildReleaseStatusTitle(
  releaseStatus: NormalizedBuildReleaseStatus | null
) {
  const changedFiles = Math.max(
    0,
    Math.floor(Number(releaseStatus?.diff?.total) || 0)
  );
  if (changedFiles <= 0) {
    return 'This public app has unpublished workspace changes.';
  }
  return changedFiles === 1
    ? '1 file has not been released yet.'
    : `${changedFiles.toLocaleString()} files have not been released yet.`;
}

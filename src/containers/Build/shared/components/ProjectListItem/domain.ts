import type { CSSProperties } from 'react';
import { timeSince } from '~/helpers/timeStampHelpers';
import type { User } from '~/types';
import type {
  BuildProjectListItemData,
  BuildProjectListItemReleaseStatus,
  BuildTone
} from './types';

export function formatRelativeTime(timestamp?: number | null) {
  if (!timestamp || Number.isNaN(Number(timestamp))) return 'just now';
  return timeSince(Number(timestamp));
}

export function formatVisitLabel(viewCount?: number | null) {
  const visits = Number.isFinite(Number(viewCount)) ? Number(viewCount) : 0;
  if (visits <= 0) return 'No visits yet';
  if (visits === 1) return '1 visit';
  return `${visits} visits`;
}

export function getBuildUsernameUser(
  build: Pick<BuildProjectListItemData, 'profilePicUrl' | 'userId' | 'username'>
): User {
  return {
    id: Number(build.userId || 0),
    profilePicUrl: build.profilePicUrl || '',
    username: build.username || ''
  };
}

export function formatForkCount(count: number) {
  return count === 1 ? '1 fork' : `${count.toLocaleString()} forks`;
}

export function formatCollaboratorCount(count: number) {
  return count === 1
    ? '1 team member'
    : `${count.toLocaleString()} team members`;
}

export function normalizeReleaseStatus(
  value?: BuildProjectListItemReleaseStatus | null
): BuildProjectListItemReleaseStatus | null {
  if (!value || typeof value !== 'object') return null;
  return {
    state: typeof value.state === 'string' ? value.state : '',
    hasUnpublishedChanges: Boolean(value.hasUnpublishedChanges),
    diff: value.diff || null
  };
}

export function formatReleaseStatusTitle(
  releaseStatus: BuildProjectListItemReleaseStatus | null
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

export function getVisibilityTone(isPublic: boolean): BuildTone {
  if (isPublic) {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      border: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  return {
    background: 'rgba(100, 116, 139, 0.14)',
    border: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}

export function normalizeCollaborationMode(
  value?: string | null
): 'private' | 'open_source' {
  return value === 'open_source' ? value : 'private';
}

export function toTagStyle(tone: BuildTone): CSSProperties {
  return {
    background: tone.background,
    borderColor: tone.border,
    color: tone.color
  };
}

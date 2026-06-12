import type { BuildReleaseStatus } from '~/helpers/buildProjectHelpers';

export interface BuildTone {
  background: string;
  border: string;
  color: string;
}

export type BuildProjectListItemReleaseStatus = BuildReleaseStatus;

export interface BuildTag {
  id: number;
  slug: string;
  label: string;
  category: string;
}

export interface BuildCollaborationRequest {
  id: number;
  inviteId?: number;
  status: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  message?: string;
  ownerHidden?: number;
}

export interface BuildProjectListItemData {
  id: number;
  userId?: number;
  username?: string;
  profilePicUrl?: string | null;
  profileTheme?: string | null;
  owner?: {
    profileTheme?: string | null;
  } | null;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: number;
  lastActivityAt?: number;
  createdAt: number;
  hasCode?: boolean;
  viewCount?: number;
  publishedAt?: number | null;
  sourceBuildId?: number | null;
  collaborationMode?: 'private' | 'contribution' | 'open_source';
  contributionAccess?: 'anyone' | 'invite_only';
  contributionRootBuildId?: number | null;
  contributionBranchNumber?: number | null;
  contributionStatus?: string | null;
  rootBuildUsername?: string | null;
  rootBuildSourceBuildId?: number | null;
  rootBuildTitle?: string | null;
  collaboratorCount?: number;
  forkCount?: number;
  thumbnailUrl?: string | null;
  pendingCollaborationRequestCount?: number;
  latestPendingCollaborationRequestAt?: number | null;
  releaseStatus?: BuildProjectListItemReleaseStatus | null;
  isFavorited?: boolean;
  favoritedAt?: number | null;
  tags?: BuildTag[];
  tagsUpdatedAt?: number;
}

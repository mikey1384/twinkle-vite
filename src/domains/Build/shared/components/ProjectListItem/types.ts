export interface BuildTone {
  background: string;
  border: string;
  color: string;
}

export interface BuildProjectListItemReleaseStatus {
  state?: string;
  hasUnpublishedChanges?: boolean;
  diff?: {
    total?: number;
    added?: number;
    updated?: number;
    deleted?: number;
  } | null;
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
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: number;
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
}

import type { BuildCapabilitySnapshot } from '../types/capabilityTypes';

export interface RuntimeBuild {
  id: number;
  userId: number;
  username: string;
  profilePicUrl?: string | null;
  title: string;
  description: string | null;
  code: string | null;
  viewCount?: number;
  numComments?: number;
  pinnedCommentId?: number | null;
  primaryArtifactId?: number | null;
  currentArtifactVersionId?: number | null;
  publishedArtifactVersionId?: number | null;
  isPublic: boolean;
  thumbnailUrl?: string | null;
  updatedAt?: number | null;
  releaseStatus?: RuntimeBuildReleaseStatus | null;
  collaborationMode?: 'private' | 'contribution' | 'open_source';
  contributionAccess?: 'anyone' | 'invite_only';
  hasActiveContributionInvite?: boolean;
  isFavorited?: boolean;
  favoritedAt?: number | null;
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  projectFiles?: Array<{
    id?: number;
    path: string;
    content?: string;
    sizeBytes?: number;
    contentHash?: string;
    createdAt?: number;
    updatedAt?: number;
  }>;
}

export interface RuntimeBuildReleaseStatus {
  state?: string;
  hasUnpublishedChanges?: boolean;
  diff?: {
    total?: number;
    added?: number;
    updated?: number;
    deleted?: number;
  };
}

export interface BuildCollaborationRequest {
  id: number;
  inviteId?: number;
  status: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  message?: string;
  ownerHidden?: number;
}

export interface AiUsagePolicy {
  energyPercent?: number;
  energyRemaining?: number;
  energySegments?: number;
  currentMode?: 'full_quality' | 'low_energy';
  lastUsageOverflowed?: boolean;
  resetCost?: number;
  resetPurchasesToday?: number;
  dayIndex?: number | string;
  communityFundRechargeCoinsRemaining?: number | null;
  communityFundResetEligibility?: {
    eligible?: boolean | null;
  } | null;
}

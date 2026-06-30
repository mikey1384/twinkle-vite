export type BuildCollaborationMode = 'private' | 'open_source';
export type BuildContributionAccess = 'anyone' | 'invite_only';
export type BuildContributionStatus = 'none' | 'draft' | 'merging' | 'merged';

export interface BuildContributionFileDiff {
  path: string;
  status: 'added' | 'updated' | 'deleted';
  baseContent?: string;
  currentContent?: string;
  contributionContent?: string;
  mergeStatus?: 'clean' | 'conflict' | 'unchanged';
  conflictType?: string;
  autoMergedContent?: string;
}

export interface BuildProjectFile {
  path: string;
  content?: string;
}

export interface BuildLike {
  id: number;
  userId: number;
  title: string;
  collaborationMode?: BuildCollaborationMode | 'contribution';
  contributionAccess?: BuildContributionAccess;
  contributionRootBuildId?: number | null;
  contributionBranchNumber?: number | null;
  contributionStatus?: BuildContributionStatus;
  contributionContributorId?: number | null;
  username?: string;
  profilePicUrl?: string | null;
  rootBuildUserId?: number | null;
  code?: string | null;
  projectFiles?: BuildProjectFile[] | null;
  pendingCollaborationRequestCount?: number | null;
}

export interface BuildForumThread {
  id: number;
  buildId: number;
  contributionBuildId?: number | null;
  branchId?: number | null;
  branchTitle?: string | null;
  branchContributorId?: number | null;
  branchContributionBranchNumber?: number | null;
  branchContributionStatus?: BuildContributionStatus | null;
  branchContributorUsername?: string | null;
  branchContributorProfilePicUrl?: string | null;
  userId: number;
  title: string;
  body: string;
  replyCount?: number | null;
  lastReplyAt?: number | null;
  lastReplyUserId?: number | null;
  username?: string | null;
  profilePicUrl?: string | null;
  lastReplyUsername?: string | null;
  lastReplyProfilePicUrl?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface BuildForumReply {
  id: number;
  threadId: number;
  buildId: number;
  contributionBuildId?: number | null;
  userId: number;
  replyToReplyId?: number | null;
  replyToUserId?: number | null;
  replyToUsername?: string | null;
  replyToProfilePicUrl?: string | null;
  replyToBody?: string | null;
  body: string;
  username?: string | null;
  profilePicUrl?: string | null;
  createdAt?: number | null;
}

export interface BuildContributorInvite {
  userId: number;
  username?: string | null;
  profilePicUrl?: string | null;
  acceptedAt?: number | null;
  declinedAt?: number | null;
}

export interface BuildCollaborationRequest {
  id: number;
  inviteId?: number;
  buildId: number;
  requesterUserId: number;
  ownerUserId: number;
  message: string;
  status: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  ownerHidden?: number;
  username?: string | null;
  profilePicUrl?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface CollaborationPanelProps {
  build: BuildLike;
  embedded?: boolean;
  isOwner: boolean;
  onBuildPatch: (patch: Record<string, any>) => void;
  onBuildReload?: () => Promise<void> | void;
  onContributionBranchCreated?: (branch: BuildLike) => void;
  onCanonicalMerge: (payload: {
    build?: Record<string, any> | null;
    projectFiles?: BuildProjectFile[] | null;
  }) => void;
  onVersionProjectFilesUpdate?: (payload: {
    build?: Record<string, any> | null;
    projectFiles?: BuildProjectFile[] | null;
  }) => void;
  onAcceptedContributorCountChange?: (count: number) => void;
  onBeforeContributionAction?: (
    action: 'merge' | 'replace' | 'update-from-main' | 'complete-merge'
  ) => Promise<{
    ready: boolean;
  }>;
  onAskLumineToResolveConflicts?: (
    paths: string[]
  ) => Promise<boolean> | boolean;
  onOpenCollaborationSettings?: () => void;
  initialScrollTop?: number;
  onScrollTopChange?: (scrollTop: number) => void;
  initialSelectedForumThreadId?: number;
  onSelectedForumThreadChange?: (threadId: number) => void;
}

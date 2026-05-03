import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import Textarea from '~/components/Texts/Textarea';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import type { User } from '~/types';
import BuildContributorInvitePicker from './BuildContributorInvitePicker';
import { getBuildWorkspacePath } from '../buildNavigation';

type BuildCollaborationMode = 'private' | 'open_source';
type BuildContributionAccess = 'anyone' | 'invite_only';
type BuildContributionStatus =
  | 'none'
  | 'draft'
  | 'merging'
  | 'merged';

interface BuildContributionFileDiff {
  path: string;
  status: 'added' | 'updated' | 'deleted';
  baseContent?: string;
  currentContent?: string;
  contributionContent?: string;
  mergeStatus?: 'clean' | 'conflict' | 'unchanged';
  conflictType?: string;
  autoMergedContent?: string;
}

interface BuildLike {
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
  pendingCollaborationRequestCount?: number | null;
}

interface BuildForumThread {
  id: number;
  buildId: number;
  contributionBuildId?: number | null;
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

interface BuildForumReply {
  id: number;
  threadId: number;
  buildId: number;
  contributionBuildId?: number | null;
  userId: number;
  body: string;
  username?: string | null;
  profilePicUrl?: string | null;
  createdAt?: number | null;
}

interface BuildContributorInvite {
  userId: number;
  username?: string | null;
  profilePicUrl?: string | null;
  acceptedAt?: number | null;
  declinedAt?: number | null;
}

interface BuildCollaborationRequest {
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

interface CollaborationPanelProps {
  build: BuildLike;
  embedded?: boolean;
  isOwner: boolean;
  onBuildPatch: (patch: Record<string, any>) => void;
  onCanonicalMerge: (payload: {
    build?: Record<string, any> | null;
    projectFiles?: Array<{ path: string; content?: string }> | null;
  }) => void;
  onVersionProjectFilesUpdate?: (payload: {
    build?: Record<string, any> | null;
    projectFiles?: Array<{ path: string; content?: string }> | null;
  }) => void;
  onAcceptedContributorCountChange?: (count: number) => void;
  onBeforeContributionAction?: (
    action: 'merge' | 'update-from-main'
  ) => Promise<boolean>;
  onAskLumineToResolveConflicts?: (
    paths: string[]
  ) => Promise<boolean> | boolean;
  onOpenCollaborationSettings?: () => void;
  initialScrollTop?: number;
  onScrollTopChange?: (scrollTop: number) => void;
  initialSelectedForumThreadId?: number;
  onSelectedForumThreadChange?: (threadId: number) => void;
}

const panelClass = css`
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  padding: 0.65rem 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.8rem 1rem;
  }
`;

const embeddedPanelClass = css`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-bottom: 0;
  padding: 0.85rem;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
`;

const toolbarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const toolbarPrimaryClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-left: auto;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const labelClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 0.88rem;
`;

const selectClass = css`
  height: 2.25rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  color: var(--chat-text);
  padding: 0 0.65rem;
  font-weight: 800;
  max-width: 100%;
`;

const statusPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.1);
  color: #1d4ed8;
  padding: 0.35rem 0.7rem;
  font-weight: 900;
  font-size: 0.82rem;
`;

const summaryPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--chat-text);
  padding: 0.35rem 0.7rem;
  font-weight: 900;
  font-size: 0.82rem;
  white-space: nowrap;
`;

const mutedTextClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 0.88rem;
  font-weight: 700;
`;

const expandedBodyClass = css`
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  overflow: auto;
`;

const embeddedBodyStackClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const splitClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const contributionButtonClass = css`
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  border-radius: 8px;
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  cursor: pointer;
  text-align: left;
  &:hover,
  &.selected {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.08);
  }
`;

const contributionTitleClass = css`
  font-weight: 900;
  font-size: 0.95rem;
`;

const detailClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const collaborationPromptClass = css`
  border: 1px solid rgba(65, 140, 235, 0.3);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const collaborationPromptTitleClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--chat-text);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.25;
`;

const collaborationPromptTextClass = css`
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.35;
`;

const collaborationPromptActionClass = css`
  display: flex;
  justify-content: center;
`;

const fileListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 16rem;
  overflow: auto;
`;

const fileRowClass = css`
  display: grid;
  grid-template-columns: auto 5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  font-size: 0.85rem;
`;

const filePathClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

const diffPreviewClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
`;

const codePreviewClass = css`
  min-height: 6rem;
  max-height: 14rem;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.7rem;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const conflictBadgeClass = css`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  background: rgba(244, 63, 94, 0.12);
  color: #be123c;
  font-size: 0.72rem;
  font-weight: 900;
`;

const forumComposerClass = css`
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: 8px;
  background: rgba(65, 140, 235, 0.04);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const forumComposerTitleClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--chat-text);
  font-weight: 900;
`;

const forumActionsClass = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const forumPostListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const forumPostClass = css`
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0.75rem;
  background: #fff;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: flex-start;
`;

const forumAvatarClass = css`
  width: 2.65rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 2.35rem;
  }
`;

const forumPostMainClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const forumPostHeaderClass = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.7rem;
`;

const forumAuthorMetaClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
`;

const forumUsernameClass = css`
  font-weight: 900;
  font-size: 0.95rem;
  max-width: 100%;
`;

const forumTimestampClass = css`
  color: var(--chat-text);
  opacity: 0.58;
  font-size: 0.78rem;
  font-weight: 800;
`;

const forumPostActionsClass = css`
  flex: 0 0 auto;
`;

const forumPostBodyClass = css`
  color: #111827;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
`;

const forumTitleInputClass = css`
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.65rem;
  font: inherit;
  font-weight: 900;
  &:focus {
    outline: 2px solid rgba(65, 140, 235, 0.24);
    border-color: rgba(65, 140, 235, 0.55);
  }
`;

const forumThreadButtonClass = css`
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #fff;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  text-align: left;
  color: var(--chat-text);
  cursor: pointer;
  &:hover {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.06);
  }
`;

const forumThreadMainClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const forumThreadTitleClass = css`
  font-size: 1rem;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const forumThreadPreviewClass = css`
  color: var(--chat-text);
  opacity: 0.72;
  font-weight: 700;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const forumThreadMetaClass = css`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  color: var(--chat-text);
  opacity: 0.62;
  font-size: 0.8rem;
  font-weight: 800;
`;

const forumThreadCountClass = css`
  align-self: start;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--chat-text);
  padding: 0.3rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 900;
  white-space: nowrap;
`;

const forumDetailHeaderClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const forumBackButtonClass = css`
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  padding: 0.4rem 0.7rem;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  align-self: flex-start;
  &:hover {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.08);
  }
`;

const textareaClass = css`
  width: 100%;
  min-height: 3.8rem;
  resize: vertical;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.65rem;
  font: inherit;
  &:focus {
    outline: 2px solid rgba(65, 140, 235, 0.24);
    border-color: rgba(65, 140, 235, 0.55);
  }
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 0.86rem;
`;

const requestCardClass = css`
  border: 1px solid rgba(236, 72, 153, 0.28);
  border-radius: 8px;
  background: rgba(253, 242, 248, 0.52);
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const requestMessageClass = css`
  color: var(--chat-text);
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

function normalizePanelScrollTop(value: unknown) {
  const scrollTop = Number(value || 0);
  if (!Number.isFinite(scrollTop)) return 0;
  return Math.max(0, Math.floor(scrollTop));
}

function normalizePanelForumThreadId(value: unknown) {
  const threadId = Number(value || 0);
  if (!Number.isFinite(threadId)) return 0;
  return Math.max(0, Math.floor(threadId));
}

export default function CollaborationPanel({
  build,
  embedded = false,
  isOwner,
  onBuildPatch,
  onCanonicalMerge,
  onVersionProjectFilesUpdate,
  onAcceptedContributorCountChange,
  onBeforeContributionAction,
  onAskLumineToResolveConflicts,
  onOpenCollaborationSettings,
  initialScrollTop = 0,
  onScrollTopChange,
  initialSelectedForumThreadId = 0,
  onSelectedForumThreadChange
}: CollaborationPanelProps) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const updateBuildCollaboration = useAppContext(
    (v) => v.requestHelpers.updateBuildCollaboration
  );
  const loadBuildContributions = useAppContext(
    (v) => v.requestHelpers.loadBuildContributions
  );
  const loadBuildContributors = useAppContext(
    (v) => v.requestHelpers.loadBuildContributors
  );
  const loadBuildCollaborationRequests = useAppContext(
    (v) => v.requestHelpers.loadBuildCollaborationRequests
  );
  const acceptBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.acceptBuildCollaborationRequest
  );
  const rejectBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.rejectBuildCollaborationRequest
  );
  const hideBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.hideBuildCollaborationRequest
  );
  const revokeBuildContributor = useAppContext(
    (v) => v.requestHelpers.revokeBuildContributor
  );
  const loadBuildContribution = useAppContext(
    (v) => v.requestHelpers.loadBuildContribution
  );
  const mergeBuildContribution = useAppContext(
    (v) => v.requestHelpers.mergeBuildContribution
  );
  const updateBuildContributionFromMain = useAppContext(
    (v) => v.requestHelpers.updateBuildContributionFromMain
  );
  const completeBuildContributionMerge = useAppContext(
    (v) => v.requestHelpers.completeBuildContributionMerge
  );
  const loadBuildContributionForumThreads = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionForumThreads
  );
  const createBuildContributionForumThread = useAppContext(
    (v) => v.requestHelpers.createBuildContributionForumThread
  );
  const loadBuildContributionForumThread = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionForumThread
  );
  const createBuildContributionForumReply = useAppContext(
    (v) => v.requestHelpers.createBuildContributionForumReply
  );
  const deleteBuildContributionForumThread = useAppContext(
    (v) => v.requestHelpers.deleteBuildContributionForumThread
  );
  const deleteBuildContributionForumReply = useAppContext(
    (v) => v.requestHelpers.deleteBuildContributionForumReply
  );

  const isContributionFork =
    normalizeContributionStatus(build.contributionStatus) !== 'none';
  const canModerateForum = isOwner && !isContributionFork;
  const rootBuildId = isContributionFork
    ? Number(build.contributionRootBuildId || 0)
    : Number(build.id || 0);
  const contributionBuildId = isContributionFork ? Number(build.id || 0) : 0;
  const canShowPanel = isOwner || isContributionFork || embedded;
  const [collaborationMode, setCollaborationMode] =
    useState<BuildCollaborationMode>(
      normalizeCollaborationMode(build.collaborationMode)
    );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [contributors, setContributors] = useState<BuildContributorInvite[]>(
    []
  );
  const [collaborationRequests, setCollaborationRequests] = useState<
    BuildCollaborationRequest[]
  >([]);
  const [showHiddenCollaborationRequests, setShowHiddenCollaborationRequests] =
    useState(false);
  const [loadingCollaborationRequests, setLoadingCollaborationRequests] =
    useState(false);
  const [contributions, setContributions] = useState<BuildLike[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [selectedContributionId, setSelectedContributionId] = useState(0);
  const [selectedContribution, setSelectedContribution] =
    useState<BuildLike | null>(null);
  const [changedFiles, setChangedFiles] = useState<BuildContributionFileDiff[]>(
    []
  );
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [previewPath, setPreviewPath] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [conflictMarkerPaths, setConflictMarkerPaths] = useState<string[]>([]);
  const [requestActionError, setRequestActionError] = useState('');
  const [forumThreads, setForumThreads] = useState<BuildForumThread[]>([]);
  const [selectedThread, setSelectedThread] =
    useState<BuildForumThread | null>(null);
  const [threadReplies, setThreadReplies] = useState<BuildForumReply[]>([]);
  const [threadTitleInput, setThreadTitleInput] = useState('');
  const [threadBodyInput, setThreadBodyInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const embeddedScrollRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollKeyRef = useRef('');
  const initialScrollTopRef = useRef(initialScrollTop);
  const onScrollTopChangeRef = useRef(onScrollTopChange);
  const initialSelectedForumThreadIdRef = useRef(
    normalizePanelForumThreadId(initialSelectedForumThreadId)
  );
  const onSelectedForumThreadChangeRef = useRef(onSelectedForumThreadChange);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const lastSavedScrollTopRef = useRef(
    normalizePanelScrollTop(initialScrollTop)
  );
  initialScrollTopRef.current = initialScrollTop;
  onScrollTopChangeRef.current = onScrollTopChange;
  initialSelectedForumThreadIdRef.current = normalizePanelForumThreadId(
    initialSelectedForumThreadId
  );
  onSelectedForumThreadChangeRef.current = onSelectedForumThreadChange;
  const [forumLoading, setForumLoading] = useState(false);
  const [forumActionLoading, setForumActionLoading] = useState('');
  const [forumError, setForumError] = useState('');
  const [panelExpanded, setPanelExpanded] = useState(false);
  const contentExpanded = embedded || panelExpanded;
  const selectedPreviewFile = useMemo(
    () => changedFiles.find((file) => file.path === previewPath) || null,
    [changedFiles, previewPath]
  );
  const changedFileConflictPaths = useMemo(
    () =>
      changedFiles
        .filter((file) => file.mergeStatus === 'conflict')
        .map((file) => file.path),
    [changedFiles]
  );
  const activeConflictMarkerPaths =
    conflictMarkerPaths.length > 0
      ? conflictMarkerPaths
      : changedFileConflictPaths;
  const reviewContributions = useMemo(
    () =>
      contributions.filter((contribution) => {
        const status = normalizeContributionStatus(
          contribution.contributionStatus
        );
        return status !== 'none';
      }),
    [contributions]
  );
  const acceptedContributorCount = useMemo(
    () =>
      contributors.filter(
        (contributor) => Number(contributor.acceptedAt || 0) > 0
      ).length,
    [contributors]
  );
  const canInviteContributors = true;
  const contributorsCardShown = true;

  useEffect(() => {
    setCollaborationMode(normalizeCollaborationMode(build.collaborationMode));
  }, [build.collaborationMode]);

  useEffect(() => {
    if (!canShowPanel) return;
    if (isOwner && !isContributionFork) {
      if (!embedded) {
        void reloadContributions();
      }
      void reloadCollaborationRequests(showHiddenCollaborationRequests);
      void reloadContributors();
    }
    if (isContributionFork && rootBuildId && contributionBuildId) {
      setSelectedContributionId(contributionBuildId);
      void reloadContributionDetail(contributionBuildId);
      void reloadForumThreads(contributionBuildId);
    } else if (!isContributionFork) {
      void reloadForumThreads(0);
    }
    // request helpers are stable context helpers; do not include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    canShowPanel,
    contributionBuildId,
    embedded,
    isContributionFork,
    isOwner,
    rootBuildId,
    showHiddenCollaborationRequests,
    userId
  ]);

  useEffect(() => {
    if (!embedded) return;
    const scrollTop = normalizePanelScrollTop(initialScrollTopRef.current);
    const restoreKey = [
      build.id,
      forumThreads.length,
      selectedThread?.id || 0,
      threadReplies.length,
      collaborationRequests.length,
      contributors.length
    ].join(':');
    if (restoreScrollKeyRef.current === restoreKey) return;
    restoreScrollKeyRef.current = restoreKey;
    const frame = window.requestAnimationFrame(() => {
      const container = embeddedScrollRef.current;
      if (!container) return;
      container.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    build.id,
    collaborationRequests.length,
    contributors.length,
    embedded,
    forumThreads.length,
    selectedThread?.id,
    threadReplies.length
  ]);

  useEffect(() => {
    return () => {
      if (scrollSaveTimeoutRef.current !== null) {
        window.clearTimeout(scrollSaveTimeoutRef.current);
        scrollSaveTimeoutRef.current = null;
      }
      const pendingScrollTop = pendingScrollTopRef.current;
      pendingScrollTopRef.current = null;
      if (pendingScrollTop !== null) {
        commitScrollTop(pendingScrollTop);
      }
    };
  }, []);

  function handleEmbeddedScroll(event: React.UIEvent<HTMLDivElement>) {
    scheduleScrollTopSave(event.currentTarget.scrollTop || 0);
  }

  function scheduleScrollTopSave(scrollTop: number) {
    pendingScrollTopRef.current = scrollTop;
    if (scrollSaveTimeoutRef.current !== null) {
      window.clearTimeout(scrollSaveTimeoutRef.current);
    }
    scrollSaveTimeoutRef.current = window.setTimeout(() => {
      scrollSaveTimeoutRef.current = null;
      const pendingScrollTop = pendingScrollTopRef.current;
      pendingScrollTopRef.current = null;
      if (pendingScrollTop !== null) {
        commitScrollTop(pendingScrollTop);
      }
    }, 160);
  }

  function commitScrollTop(scrollTop: number) {
    const normalizedScrollTop = normalizePanelScrollTop(scrollTop);
    if (lastSavedScrollTopRef.current === normalizedScrollTop) return;
    lastSavedScrollTopRef.current = normalizedScrollTop;
    onScrollTopChangeRef.current?.(normalizedScrollTop);
  }

  function commitSelectedForumThreadId(threadId: number) {
    onSelectedForumThreadChangeRef.current?.(
      normalizePanelForumThreadId(threadId)
    );
  }

  if (!canShowPanel) return null;

  return (
    <section
      className={
        embedded ? `${panelClass} ${embeddedPanelClass}` : panelClass
      }
    >
      <div className={toolbarClass}>
        <div className={toolbarPrimaryClass}>
          {embedded ? (
            <>
              <span className={statusPillClass}>
                <Icon icon="comments" />
                Team
              </span>
            </>
          ) : isOwner && !isContributionFork ? (
            <>
              <span className={statusPillClass}>
                <Icon icon="code-branch" />
                Collaboration
              </span>
              <label className={labelClass}>
                Mode
                <select
                  className={selectClass}
                  value={collaborationMode}
                  onChange={(event) =>
                    setCollaborationMode(
                      normalizeCollaborationMode(event.target.value)
                    )
                  }
                >
                  <option value="private">Private Project</option>
                  <option value="open_source">Open source</option>
                </select>
              </label>
              <GameCTAButton
                variant="logoBlue"
                size="sm"
                icon="save"
                loading={savingSettings}
                disabled={savingSettings}
                onClick={handleSaveSettings}
              >
                Save
              </GameCTAButton>
              {settingsError ? (
                <span className={errorClass}>{settingsError}</span>
              ) : null}
            </>
          ) : (
            <>
              <span className={statusPillClass}>
                <Icon icon="code-branch" />
                {normalizeContributionStatus(build.contributionStatus) ===
                'draft'
                  ? 'Branch'
                  : `Branch ${normalizeContributionStatus(
                      build.contributionStatus
                    )}`}
              </span>
            </>
          )}
          <span className={summaryPillClass}>
            <Icon icon="comment" />
            {forumThreads.length}
          </span>
          {!embedded && isOwner && !isContributionFork ? (
            <span className={summaryPillClass}>
              <Icon icon="code-branch" />
              {reviewContributions.length}
            </span>
          ) : null}
        </div>
        {!embedded ? (
          <div className={toolbarActionsClass}>
            <GameCTAButton
              variant="neutral"
              size="sm"
              icon={panelExpanded ? 'chevron-up' : 'comment'}
              onClick={() => setPanelExpanded((current) => !current)}
            >
              {panelExpanded ? 'Hide' : 'Discuss'}
            </GameCTAButton>
          </div>
        ) : null}
      </div>

      {contentExpanded ? (
        <div
          ref={embedded ? embeddedScrollRef : undefined}
          className={expandedBodyClass}
          onScroll={embedded ? handleEmbeddedScroll : undefined}
        >
          {embedded ? (
            renderEmbeddedBody()
          ) : (
            <>
              {isOwner && !isContributionFork ? (
                <>
                  {renderCollaborationRequests()}
                  {contributorsCardShown ? renderInviteCard() : null}
                  {renderOwnerContributions(true)}
                </>
              ) : (
                <div className={splitClass}>
                  {renderForum()}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );

  function renderEmbeddedBody() {
    if (isOwner && !isContributionFork) {
      return (
        <div className={embeddedBodyStackClass}>
          {renderForum()}
          {renderCollaborationRequests()}
          {renderCollaborationPromptCard()}
          {contributorsCardShown ? renderInviteCard() : null}
        </div>
      );
    }
    if (!isContributionFork) {
      return (
        <div className={embeddedBodyStackClass}>
          {renderForum()}
        </div>
      );
    }
    const canCompleteConflictMerge =
      Number(build.rootBuildUserId || 0) === Number(userId || 0) &&
      normalizeContributionStatus(build.contributionStatus) === 'merging';
    return (
      <div className={embeddedBodyStackClass}>
        {renderContributionDetail(canCompleteConflictMerge)}
        {renderForum()}
      </div>
    );
  }

  function renderCollaborationPromptCard() {
    if (acceptedContributorCount > 0) {
      return null;
    }
    const mode = normalizeCollaborationMode(build.collaborationMode);
    const isPrivate = mode === 'private';
    const isOpenSource = mode === 'open_source';
    const title = isPrivate
      ? 'This project is private.'
      : isOpenSource
        ? 'This project is open source.'
        : 'This project uses invite-only collaboration.';
    const description = isPrivate
      ? 'Invite collaborators to discuss and contribute in the team workspace.'
      : isOpenSource
        ? 'People can fork published copies, and invited collaborators can still contribute to this original project.'
        : 'Invited collaborators can create project-scoped forks, discuss changes, and send them back for review.';
    return (
      <div className={collaborationPromptClass}>
        <div className={collaborationPromptTitleClass}>
          <Icon icon={isPrivate ? 'users' : 'code-branch'} />
          <span>{title}</span>
        </div>
        {description ? (
          <div className={collaborationPromptTextClass}>{description}</div>
        ) : null}
        {onOpenCollaborationSettings ? (
          <div className={collaborationPromptActionClass}>
            <GameCTAButton
              variant={isPrivate ? 'pink' : 'logoBlue'}
              size="sm"
              icon={isPrivate ? 'users' : 'gear'}
              shiny={isPrivate}
              onClick={onOpenCollaborationSettings}
            >
              {isPrivate ? 'Set Up Collaboration' : 'Manage Settings'}
            </GameCTAButton>
          </div>
        ) : null}
      </div>
    );
  }

  function renderInviteCard() {
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>Collaborators</strong>
        </div>
        <BuildContributorInvitePicker
          buildId={rootBuildId}
          canInvite={canInviteContributors}
          contributors={contributors}
          onInvited={reloadContributors}
          onRemoveContributor={handleRevokeContributor}
        />
      </div>
    );
  }

  function renderCollaborationRequests() {
    if (!isOwner || isContributionFork) return null;
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>
            {showHiddenCollaborationRequests
              ? 'Hidden collaboration requests'
              : 'Collaboration requests'}
          </strong>
          <span className={mutedTextClass}>{collaborationRequests.length}</span>
          {loadingCollaborationRequests ? (
            <span className={mutedTextClass}>Loading...</span>
          ) : null}
          <GameCTAButton
            variant="neutral"
            size="sm"
            icon={showHiddenCollaborationRequests ? 'inbox' : 'eye-slash'}
            disabled={loadingCollaborationRequests}
            onClick={() =>
              setShowHiddenCollaborationRequests((current) => !current)
            }
          >
            {showHiddenCollaborationRequests ? 'Visible' : 'Hidden'}
          </GameCTAButton>
        </div>
        {collaborationRequests.length === 0 ? (
          <span className={mutedTextClass}>
            {showHiddenCollaborationRequests
              ? 'No hidden requests.'
              : 'No pending requests.'}
          </span>
        ) : (
          <div className={listClass}>
            {collaborationRequests.map((request) => (
              <div key={request.id} className={requestCardClass}>
                <div className={rowClass}>
                  <strong>{request.username || 'User'}</strong>
                  <span className={statusPillClass}>{request.status}</span>
                  {request.ownerHidden ? (
                    <span className={mutedTextClass}>Hidden</span>
                  ) : null}
                </div>
                {request.message ? (
                  <div className={requestMessageClass}>{request.message}</div>
                ) : (
                  <span className={mutedTextClass}>No message.</span>
                )}
                {request.status === 'pending' ? (
                  <div className={rowClass}>
                    <GameCTAButton
                      variant="success"
                      size="sm"
                      icon="check"
                      loading={actionLoading === `accept-request-${request.id}`}
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleAcceptCollaborationRequest(request.id)}
                    >
                      Accept
                    </GameCTAButton>
                    <GameCTAButton
                      variant="neutral"
                      size="sm"
                      icon="ban"
                      loading={actionLoading === `reject-request-${request.id}`}
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleRejectCollaborationRequest(request.id)}
                    >
                      Reject
                    </GameCTAButton>
                    {!request.ownerHidden ? (
                      <GameCTAButton
                        variant="neutral"
                        size="sm"
                        icon="eye-slash"
                        loading={actionLoading === `hide-request-${request.id}`}
                        disabled={Boolean(actionLoading)}
                        onClick={() => handleHideCollaborationRequest(request.id)}
                      >
                        Hide
                      </GameCTAButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {requestActionError ? (
          <span className={errorClass}>{requestActionError}</span>
        ) : null}
      </div>
    );
  }

  function renderOwnerContributions(showCommentsFallback = false) {
    if (
      !loadingContributions &&
      reviewContributions.length === 0 &&
      !selectedContribution
    ) {
      return showCommentsFallback ? renderForum() : null;
    }
    return (
      <div className={splitClass}>
        <div className={listClass}>
          <div className={rowClass}>
            <strong>Branches</strong>
            {loadingContributions ? (
              <span className={mutedTextClass}>Loading...</span>
            ) : null}
          </div>
          {reviewContributions.length === 0 ? (
            <span className={mutedTextClass}>No branches yet.</span>
          ) : (
            reviewContributions.map((contribution) => (
              <button
                key={contribution.id}
                type="button"
                className={`${contributionButtonClass}${
                  selectedContributionId === contribution.id ? ' selected' : ''
                }`}
                onClick={() => handleSelectContribution(contribution.id)}
              >
                <span className={contributionTitleClass}>
                  {contribution.username || 'Contributor'}
                </span>
                {normalizeContributionStatus(contribution.contributionStatus) !==
                'draft' ? (
                  <span className={mutedTextClass}>
                    {normalizeContributionStatus(
                      contribution.contributionStatus
                    )}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
        {selectedContribution ? (
          renderContributionDetail(true)
        ) : showCommentsFallback ? (
          renderForum()
        ) : null}
      </div>
    );
  }

  async function handleSaveSettings() {
    if (savingSettings) return;
    setSavingSettings(true);
    setSettingsError('');
    try {
      const result = await updateBuildCollaboration({
        buildId: build.id,
        collaborationMode,
        contributionAccess: getContributionAccessForCollaborationMode(
          collaborationMode
        )
      });
      if (result?.build) {
        onBuildPatch(result.build);
      }
    } catch (error: any) {
      setSettingsError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save collaboration settings'
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function reloadContributions() {
    if (!rootBuildId) return;
    setLoadingContributions(true);
    try {
      const result = await loadBuildContributions(rootBuildId);
      setContributions(
        Array.isArray(result?.contributions) ? result.contributions : []
      );
    } catch (error) {
      console.error('Failed to load build contributions:', error);
    } finally {
      setLoadingContributions(false);
    }
  }

  async function reloadContributors() {
    if (!rootBuildId) return;
    try {
      const result = await loadBuildContributors(rootBuildId);
      const nextContributors = Array.isArray(result?.contributors)
        ? result.contributors
        : [];
      setContributors(nextContributors);
      onAcceptedContributorCountChange?.(
        nextContributors.filter(
          (contributor: BuildContributorInvite) =>
            Number(contributor.acceptedAt || 0) > 0
        ).length
      );
    } catch (error) {
      console.error('Failed to load build contributors:', error);
    }
  }

  async function reloadCollaborationRequests(hidden: boolean) {
    if (!rootBuildId || !isOwner || isContributionFork) return;
    setLoadingCollaborationRequests(true);
    try {
      const result = await loadBuildCollaborationRequests({
        buildId: rootBuildId,
        hidden
      });
      const nextRequests = Array.isArray(result?.requests)
        ? result.requests
        : [];
      setCollaborationRequests(nextRequests);
      if (!hidden) {
        patchPendingCollaborationRequestCount(
          getVisiblePendingCollaborationRequestCount(nextRequests)
        );
      }
    } catch (error) {
      console.error('Failed to load build collaboration requests:', error);
    } finally {
      setLoadingCollaborationRequests(false);
    }
  }

  function getVisiblePendingCollaborationRequestCount(
    requests = collaborationRequests
  ) {
    return requests.filter(
      (request) =>
        request.status === 'pending' && Number(request.ownerHidden || 0) === 0
    ).length;
  }

  function patchPendingCollaborationRequestCount(count: number) {
    onBuildPatch({
      pendingCollaborationRequestCount: Math.max(
        0,
        Math.floor(Number(count) || 0)
      )
    });
  }

  function getPendingRequestCountAfterResolving(
    request?: BuildCollaborationRequest | null
  ) {
    if (
      !request ||
      request.status !== 'pending' ||
      Number(request.ownerHidden || 0) !== 0
    ) {
      return null;
    }
    const currentCount = Math.max(
      Math.floor(Number(build.pendingCollaborationRequestCount) || 0),
      getVisiblePendingCollaborationRequestCount()
    );
    return Math.max(0, currentCount - 1);
  }

  async function handleAcceptCollaborationRequest(requestId: number) {
    if (!rootBuildId || !requestId || actionLoading) return;
    setActionLoading(`accept-request-${requestId}`);
    setRequestActionError('');
    try {
      const request = collaborationRequests.find(
        (entry) => Number(entry.id) === Number(requestId)
      );
      const nextPendingCount = getPendingRequestCountAfterResolving(request);
      const result = await acceptBuildCollaborationRequest({
        buildId: rootBuildId,
        requestId
      });
      if (result?.build) {
        onBuildPatch({
          ...result.build,
          ...(nextPendingCount !== null
            ? { pendingCollaborationRequestCount: nextPendingCount }
            : {})
        });
      } else if (nextPendingCount !== null) {
        patchPendingCollaborationRequestCount(nextPendingCount);
      }
      setCollaborationRequests((current) =>
        current.filter((request) => Number(request.id) !== Number(requestId))
      );
      void reloadContributors();
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleRejectCollaborationRequest(requestId: number) {
    if (!rootBuildId || !requestId || actionLoading) return;
    setActionLoading(`reject-request-${requestId}`);
    setRequestActionError('');
    try {
      const request = collaborationRequests.find(
        (entry) => Number(entry.id) === Number(requestId)
      );
      const nextPendingCount = getPendingRequestCountAfterResolving(request);
      const result = await rejectBuildCollaborationRequest({
        buildId: rootBuildId,
        requestId
      });
      if (result?.request && showHiddenCollaborationRequests) {
        setCollaborationRequests((current) =>
          current.map((request) =>
            Number(request.id) === Number(requestId)
              ? result.request
              : request
          )
        );
      } else if (result?.success) {
        setCollaborationRequests((current) =>
          current.filter((request) => Number(request.id) !== Number(requestId))
        );
      }
      if (nextPendingCount !== null) {
        patchPendingCollaborationRequestCount(nextPendingCount);
      }
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to reject collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleHideCollaborationRequest(requestId: number) {
    if (!rootBuildId || !requestId || actionLoading) return;
    setActionLoading(`hide-request-${requestId}`);
    setRequestActionError('');
    try {
      const request = collaborationRequests.find(
        (entry) => Number(entry.id) === Number(requestId)
      );
      const nextPendingCount = getPendingRequestCountAfterResolving(request);
      const result = await hideBuildCollaborationRequest({
        buildId: rootBuildId,
        requestId
      });
      if (result?.success) {
        setCollaborationRequests((current) =>
          current.filter((request) => Number(request.id) !== Number(requestId))
        );
        if (nextPendingCount !== null) {
          patchPendingCollaborationRequestCount(nextPendingCount);
        }
      }
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to hide collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleRevokeContributor(contributorUserId: number) {
    if (!rootBuildId || contributorUserId <= 0) return;
    try {
      const result = await revokeBuildContributor({
        buildId: rootBuildId,
        userId: contributorUserId
      });
      if (result?.success) {
        setContributors((current) =>
          current.filter(
            (contributor) =>
              Number(contributor.userId) !== Number(contributorUserId)
          )
        );
      }
    } catch (error) {
      console.error('Failed to revoke build contributor:', error);
    }
  }

  async function handleSelectContribution(nextContributionBuildId: number) {
    setSelectedContributionId(nextContributionBuildId);
    await reloadContributionDetail(nextContributionBuildId);
    await reloadForumThreads(nextContributionBuildId);
  }

  function handlePreviewContribution(nextContributionBuildId: number) {
    if (!nextContributionBuildId) return;
    const contribution = contributions.find(
      (entry) => Number(entry.id) === Number(nextContributionBuildId)
    );
    navigate(
      getBuildWorkspacePath(
        contribution || {
          id: nextContributionBuildId,
          contributionRootBuildId: rootBuildId
        }
      ),
      {
        state: {
          openVersionsPanel: true
        }
      }
    );
  }

  async function reloadContributionDetail(nextContributionBuildId: number) {
    if (!rootBuildId || !nextContributionBuildId) return;
    setActionError('');
    try {
      const result = await loadBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: nextContributionBuildId
      });
      const nextFiles = Array.isArray(result?.diff?.changedFiles)
        ? result.diff.changedFiles
        : [];
      setSelectedContribution(result?.contribution || null);
      setChangedFiles(nextFiles);
      setConflictMarkerPaths(
        nextFiles
          .filter(
            (file: BuildContributionFileDiff) =>
              file.mergeStatus === 'conflict'
          )
          .map((file: BuildContributionFileDiff) => file.path)
      );
      setSelectedPaths(
        nextFiles.map((file: BuildContributionFileDiff) => file.path)
      );
      setPreviewPath(nextFiles[0]?.path || '');
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to load branch'
      );
    }
  }

  async function handleMergeContribution() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('merge');
    setActionError('');
    try {
      const filesReady = onBeforeContributionAction
        ? await onBeforeContributionAction('merge')
        : true;
      if (!filesReady) return;
      const result = await mergeBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId,
        filePaths: selectedPaths
      });
      if (result?.success) {
        const conflictPaths = Array.isArray(result.conflicts)
          ? result.conflicts
              .map((conflict: any) => String(conflict?.path || '').trim())
              .filter(Boolean)
          : [];
        setConflictMarkerPaths(conflictPaths);
        onCanonicalMerge({
          build: result.build || null,
          projectFiles: Array.isArray(result.projectFiles)
            ? result.projectFiles
            : null
        });
        if (result.contribution) {
          setSelectedContribution(result.contribution);
          setContributions((current) =>
            current.map((entry) =>
              entry.id === selectedContributionId
                ? { ...entry, ...result.contribution }
                : entry
            )
          );
        }
        if (result.mergeInProgress) {
          setActionError(
            'Conflict markers were written into the project files. Resolve them with Lumine or edit the files, then complete the merge.'
          );
        }
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to merge branch'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleUpdateVersionFromMain() {
    if (!rootBuildId || !contributionBuildId || actionLoading) return;
    setActionLoading('update-from-main');
    setActionError('');
    try {
      const filesReady = onBeforeContributionAction
        ? await onBeforeContributionAction('update-from-main')
        : true;
      if (!filesReady) return;
      const result = await updateBuildContributionFromMain({
        buildId: rootBuildId,
        contributionBuildId
      });
      if (result?.code === 'build_contribution_conflict_markers_remaining') {
        const markerPaths = Array.isArray(result.conflictMarkerPaths)
          ? result.conflictMarkerPaths
          : [];
        setConflictMarkerPaths(markerPaths);
        setActionError(
          markerPaths.length > 0
            ? `Resolve conflict markers in ${markerPaths.join(', ')} first.`
            : 'Resolve all conflict markers before updating from main.'
        );
        return;
      }
      if (result?.success) {
        if (result.contribution) {
          onBuildPatch(result.contribution);
          setSelectedContribution(result.contribution);
        }
        onVersionProjectFilesUpdate?.({
          build: result.contribution || null,
          projectFiles: Array.isArray(result.projectFiles)
            ? result.projectFiles
            : null
        });
        setChangedFiles([]);
        setSelectedPaths([]);
        setPreviewPath('');
        if (Array.isArray(result.conflicts) && result.conflicts.length > 0) {
          setConflictMarkerPaths(
            result.conflicts
              .map((conflict: any) => String(conflict?.path || '').trim())
              .filter(Boolean)
          );
          setActionError(
            'Main was merged into this branch with conflict markers. Ask Lumine to resolve them before merging.'
          );
        } else {
          setConflictMarkerPaths([]);
        }
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to update from main'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleCompleteContributionMerge() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('complete-merge');
    setActionError('');
    try {
      const filesReady = onBeforeContributionAction
        ? await onBeforeContributionAction('merge')
        : true;
      if (!filesReady) return;
      const result = await completeBuildContributionMerge({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId
      });
      if (result?.code === 'build_contribution_conflict_markers_remaining') {
        const markerPaths = Array.isArray(result.conflictMarkerPaths)
          ? result.conflictMarkerPaths
          : [];
        setConflictMarkerPaths(markerPaths);
        setActionError(
          markerPaths.length > 0
            ? `Resolve conflict markers in ${markerPaths.join(', ')} first.`
            : 'Resolve all conflict markers before completing this merge.'
        );
        return;
      }
      if (result?.success) {
        setConflictMarkerPaths([]);
        onCanonicalMerge({
          build: result.build || null,
          projectFiles: Array.isArray(result.projectFiles)
            ? result.projectFiles
            : null
        });
        if (result.contribution) {
          setSelectedContribution(result.contribution);
          setContributions((current) =>
            current.map((entry) =>
              entry.id === selectedContributionId
                ? { ...entry, ...result.contribution }
                : entry
            )
          );
        }
      }
    } catch (error: any) {
      const markerPaths = error?.response?.data?.conflictMarkerPaths;
      if (Array.isArray(markerPaths)) {
        setConflictMarkerPaths(markerPaths);
      }
      setActionError(
        Array.isArray(markerPaths) && markerPaths.length > 0
          ? `Resolve conflict markers in ${markerPaths.join(', ')} first.`
          : error?.response?.data?.error ||
              error?.message ||
              'Failed to complete branch merge'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleAskLumineToResolveConflicts() {
    if (!onAskLumineToResolveConflicts || actionLoading) return;
    setActionLoading('ask-lumine-conflicts');
    setActionError('');
    try {
      const started = await onAskLumineToResolveConflicts(
        activeConflictMarkerPaths
      );
      if (!started) {
        setActionError('Lumine could not start right now. Try again soon.');
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to ask Lumine for help'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function reloadForumThreads(nextContributionBuildId: number) {
    if (!rootBuildId) return;
    setForumLoading(true);
    setForumError('');
    try {
      const result = await loadBuildContributionForumThreads({
        buildId: rootBuildId,
        contributionBuildId: nextContributionBuildId || null
      });
      const nextThreads = Array.isArray(result?.threads)
        ? result.threads
        : [];
      const selectedThreadId = Number(selectedThread?.id || 0);
      const persistedThreadId = selectedThreadId
        ? 0
        : initialSelectedForumThreadIdRef.current;
      const selectedThreadStillExists =
        selectedThreadId > 0 &&
        nextThreads.some(
          (thread: BuildForumThread) => Number(thread.id) === selectedThreadId
        );
      const persistedThreadStillExists =
        persistedThreadId > 0 &&
        nextThreads.some(
          (thread: BuildForumThread) => Number(thread.id) === persistedThreadId
        );
      setForumThreads(nextThreads);
      setSelectedThread((current) => {
        if (!current) return current;
        return selectedThreadStillExists ? current : null;
      });
      if (!selectedThreadStillExists) {
        setThreadReplies([]);
      }
      if (selectedThreadId > 0 && !selectedThreadStillExists) {
        commitSelectedForumThreadId(0);
      }
      if (persistedThreadStillExists) {
        await handleOpenForumThread(persistedThreadId, {
          persistSelection: false,
          showLoading: false
        });
      } else if (persistedThreadId > 0) {
        commitSelectedForumThreadId(0);
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to load team forum'
      );
    } finally {
      setForumLoading(false);
    }
  }

  async function handleCreateForumThread() {
    if (
      !rootBuildId ||
      !threadTitleInput.trim() ||
      !threadBodyInput.trim() ||
      forumActionLoading
    ) {
      return;
    }
    setForumActionLoading('create-thread');
    setForumError('');
    try {
      const result = await createBuildContributionForumThread({
        buildId: rootBuildId,
        contributionBuildId:
          selectedContributionId || contributionBuildId || null,
        title: threadTitleInput.trim(),
        body: threadBodyInput.trim()
      });
      if (result?.thread) {
        setForumThreads((current) => [result.thread, ...current]);
        setSelectedThread(result.thread);
        setThreadReplies([]);
        commitSelectedForumThreadId(result.thread.id);
        setThreadTitleInput('');
        setThreadBodyInput('');
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to create topic'
      );
    } finally {
      setForumActionLoading('');
    }
  }

  async function handleOpenForumThread(
    threadId: number,
    options?: {
      persistSelection?: boolean;
      showLoading?: boolean;
    }
  ) {
    if (!rootBuildId || !threadId) return;
    const showLoading = options?.showLoading !== false;
    if (showLoading) {
      setForumActionLoading(`load-thread-${threadId}`);
    }
    setForumError('');
    try {
      const result = await loadBuildContributionForumThread({
        buildId: rootBuildId,
        threadId
      });
      setSelectedThread(result?.thread || null);
      setThreadReplies(Array.isArray(result?.replies) ? result.replies : []);
      if (options?.persistSelection !== false) {
        commitSelectedForumThreadId(result?.thread?.id || threadId);
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to open topic'
      );
    } finally {
      if (showLoading) {
        setForumActionLoading('');
      }
    }
  }

  async function handleCreateForumReply() {
    if (
      !rootBuildId ||
      !selectedThread?.id ||
      !replyInput.trim() ||
      forumActionLoading
    ) {
      return;
    }
    setForumActionLoading('create-reply');
    setForumError('');
    try {
      const result = await createBuildContributionForumReply({
        buildId: rootBuildId,
        threadId: selectedThread.id,
        body: replyInput.trim()
      });
      if (result?.reply) {
        setThreadReplies((current) => [...current, result.reply]);
        setReplyInput('');
      }
      if (result?.thread) {
        setSelectedThread(result.thread);
        setForumThreads((current) =>
          current.map((thread) =>
            Number(thread.id) === Number(result.thread.id)
              ? result.thread
              : thread
          )
        );
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to reply'
      );
    } finally {
      setForumActionLoading('');
    }
  }

  async function handleDeleteForumThread(threadId: number) {
    if (!rootBuildId || !threadId || forumActionLoading) return;
    setForumActionLoading(`delete-thread-${threadId}`);
    setForumError('');
    try {
      const result = await deleteBuildContributionForumThread({
        buildId: rootBuildId,
        threadId
      });
      if (result?.success) {
        setForumThreads((current) =>
          current.filter((thread) => Number(thread.id) !== Number(threadId))
        );
        if (Number(selectedThread?.id || 0) === Number(threadId)) {
          setSelectedThread(null);
          setThreadReplies([]);
          commitSelectedForumThreadId(0);
        } else if (
          Number(initialSelectedForumThreadIdRef.current || 0) ===
          Number(threadId)
        ) {
          commitSelectedForumThreadId(0);
        }
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to delete topic'
      );
    } finally {
      setForumActionLoading('');
    }
  }

  async function handleDeleteForumReply(replyId: number) {
    if (!rootBuildId || !selectedThread?.id || !replyId || forumActionLoading) {
      return;
    }
    setForumActionLoading(`delete-reply-${replyId}`);
    setForumError('');
    try {
      const result = await deleteBuildContributionForumReply({
        buildId: rootBuildId,
        threadId: selectedThread.id,
        replyId
      });
      if (result?.success) {
        await handleOpenForumThread(selectedThread.id);
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to delete reply'
      );
    } finally {
      setForumActionLoading('');
    }
  }

  function toggleSelectedPath(path: string) {
    setSelectedPaths((current) =>
      current.includes(path)
        ? current.filter((entry) => entry !== path)
        : [...current, path]
    );
  }

  function renderContributionDetail(ownerReview: boolean) {
    const activeContribution = selectedContribution || build;
    const contributionStatus = normalizeContributionStatus(
      activeContribution.contributionStatus
    );
    const contributionCanMerge = contributionStatus === 'draft';
    const canUpdateFromMain =
      contributionStatus === 'draft' &&
      Number(activeContribution.contributionContributorId || 0) ===
        Number(userId || 0);
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>
            {ownerReview ? 'Review branch' : 'Changed files'}
          </strong>
          <span className={mutedTextClass}>{changedFiles.length} changed</span>
          {contributionStatus !== 'draft' ? (
            <span className={statusPillClass}>{contributionStatus}</span>
          ) : null}
          {ownerReview ? (
            <GameCTAButton
              variant="neutral"
              size="sm"
              icon="eye"
              onClick={() => handlePreviewContribution(activeContribution.id)}
            >
              Preview
            </GameCTAButton>
          ) : null}
        </div>
        {changedFiles.length === 0 ? (
          <span className={mutedTextClass}>No file changes loaded.</span>
        ) : (
          <>
            <div className={fileListClass}>
              {changedFiles.map((file) => (
                <label key={file.path} className={fileRowClass}>
                  <input
                    type="checkbox"
                    checked={selectedPaths.includes(file.path)}
                    disabled={!ownerReview || !contributionCanMerge}
                    onChange={() => toggleSelectedPath(file.path)}
                  />
                  <strong>{file.status}</strong>
                  <button
                    type="button"
                    className={css`
                      border: 0;
                      background: transparent;
                      color: inherit;
                      padding: 0;
                      text-align: left;
                      min-width: 0;
                      cursor: pointer;
                    `}
                    onClick={() => setPreviewPath(file.path)}
                  >
                    <span className={filePathClass}>{file.path}</span>
                  </button>
                  {file.mergeStatus === 'conflict' ? (
                    <span className={conflictBadgeClass}>conflict</span>
                  ) : null}
                </label>
              ))}
            </div>
            {selectedPreviewFile ? (
              <div className={diffPreviewClass}>
                <pre className={codePreviewClass}>
                  {selectedPreviewFile.currentContent ?? ''}
                </pre>
                <pre className={codePreviewClass}>
                  {selectedPreviewFile.contributionContent ?? ''}
                </pre>
              </div>
            ) : null}
          </>
        )}
        {canUpdateFromMain ? (
          <div className={rowClass}>
            <GameCTAButton
              variant="neutral"
              size="sm"
              icon="redo"
              loading={actionLoading === 'update-from-main'}
              disabled={Boolean(actionLoading)}
              onClick={handleUpdateVersionFromMain}
            >
              Update from Main
            </GameCTAButton>
          </div>
        ) : null}
        {!ownerReview &&
        contributionStatus === 'draft' &&
        onAskLumineToResolveConflicts &&
        activeConflictMarkerPaths.length > 0 ? (
          <div className={rowClass}>
            <GameCTAButton
              variant="purple"
              size="sm"
              icon="wand-magic-sparkles"
              loading={actionLoading === 'ask-lumine-conflicts'}
              disabled={Boolean(actionLoading)}
              onClick={handleAskLumineToResolveConflicts}
            >
              Ask Lumine to Fix
            </GameCTAButton>
          </div>
        ) : null}
        {ownerReview && contributionCanMerge ? (
          <div className={rowClass}>
            <GameCTAButton
              variant="success"
              size="sm"
              icon="check"
              loading={actionLoading === 'merge'}
              disabled={Boolean(actionLoading) || selectedPaths.length === 0}
              onClick={handleMergeContribution}
            >
              Merge Branch
            </GameCTAButton>
          </div>
        ) : null}
        {ownerReview && contributionStatus === 'merging' ? (
          <div className={rowClass}>
            <span className={mutedTextClass}>
              Conflict markers are in the project files. Resolve them with
              Lumine or edit the files, then complete the merge.
            </span>
            {onAskLumineToResolveConflicts ? (
              <GameCTAButton
                variant="purple"
                size="sm"
                icon="wand-magic-sparkles"
                loading={actionLoading === 'ask-lumine-conflicts'}
                disabled={Boolean(actionLoading)}
                onClick={handleAskLumineToResolveConflicts}
              >
                Ask Lumine to Fix
              </GameCTAButton>
            ) : null}
            <GameCTAButton
              variant="success"
              size="sm"
              icon="check"
              loading={actionLoading === 'complete-merge'}
              disabled={Boolean(actionLoading)}
              onClick={handleCompleteContributionMerge}
            >
              Complete Merge
            </GameCTAButton>
          </div>
        ) : null}
        {actionError ? <span className={errorClass}>{actionError}</span> : null}
      </div>
    );
  }

  function renderForum() {
    if (selectedThread) {
      const threadUser = getForumUser(selectedThread);
      return (
        <div className={detailClass}>
          <div className={forumDetailHeaderClass}>
            <button
              type="button"
              className={forumBackButtonClass}
              onClick={() => {
                setSelectedThread(null);
                setThreadReplies([]);
                setReplyInput('');
                commitSelectedForumThreadId(0);
              }}
            >
              <Icon icon="arrow-left" />
              Topics
            </button>
            <div className={forumPostClass}>
              <ProfilePic
                className={forumAvatarClass}
                userId={threadUser.id}
                profilePicUrl={threadUser.profilePicUrl}
              />
              <div className={forumPostMainClass}>
                <div className={forumPostHeaderClass}>
                  <div className={forumAuthorMetaClass}>
                    <strong className={forumThreadTitleClass}>
                      {selectedThread.title}
                    </strong>
                    <div className={forumThreadMetaClass}>
                      <span
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <UsernameText
                          className={forumUsernameClass}
                          user={threadUser}
                        />
                      </span>
                      {selectedThread.createdAt ? (
                        <>
                          <span>·</span>
                          <span>{timeSince(selectedThread.createdAt)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {userCanDeleteForumItem(selectedThread) ? (
                    <div className={forumPostActionsClass}>
                      <GameCTAButton
                        variant="neutral"
                        size="sm"
                        icon="trash-alt"
                        loading={
                          forumActionLoading ===
                          `delete-thread-${selectedThread.id}`
                        }
                        disabled={Boolean(forumActionLoading)}
                        onClick={() =>
                          handleDeleteForumThread(selectedThread.id)
                        }
                      />
                    </div>
                  ) : null}
                </div>
                <div className={forumPostBodyClass}>{selectedThread.body}</div>
              </div>
            </div>
          </div>
          <div className={rowClass}>
            <strong>Replies</strong>
            <span className={mutedTextClass}>
              {threadReplies.length}{' '}
              {threadReplies.length === 1 ? 'reply' : 'replies'}
            </span>
          </div>
          <div className={forumPostListClass}>
            {threadReplies.length === 0 ? (
              <span className={mutedTextClass}>No replies yet.</span>
            ) : (
              threadReplies.map((reply) => renderForumReply(reply))
            )}
          </div>
          <div className={forumComposerClass}>
            <div className={forumComposerTitleClass}>
              <Icon icon="reply" />
              Reply
            </div>
            <Textarea
              className={textareaClass}
              value={replyInput}
              onChange={(event) => setReplyInput(event.target.value)}
              placeholder="Add a reply..."
              minRows={2}
              maxRows={8}
            />
            <div className={forumActionsClass}>
              {forumError ? (
                <span className={errorClass}>{forumError}</span>
              ) : null}
              <GameCTAButton
                variant="logoBlue"
                size="sm"
                icon="reply"
                loading={forumActionLoading === 'create-reply'}
                disabled={!replyInput.trim() || Boolean(forumActionLoading)}
                onClick={handleCreateForumReply}
              >
                Reply
              </GameCTAButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>Team Forum</strong>
          <span className={mutedTextClass}>
            {forumThreads.length}{' '}
            {forumThreads.length === 1 ? 'topic' : 'topics'}
          </span>
          {forumLoading ? (
            <span className={mutedTextClass}>Loading...</span>
          ) : null}
        </div>
        <div className={forumComposerClass}>
          <div className={forumComposerTitleClass}>
            <Icon icon="comments" />
            New topic
          </div>
          <input
            className={forumTitleInputClass}
            value={threadTitleInput}
            onChange={(event) => setThreadTitleInput(event.target.value)}
            placeholder="Topic title"
          />
          <Textarea
            className={textareaClass}
            value={threadBodyInput}
            onChange={(event) => setThreadBodyInput(event.target.value)}
            placeholder="Share an update or ask the team..."
            minRows={3}
            maxRows={10}
          />
          <div className={forumActionsClass}>
            {forumError ? (
              <span className={errorClass}>{forumError}</span>
            ) : null}
            <GameCTAButton
              variant="logoBlue"
              size="sm"
              icon="comment"
              loading={forumActionLoading === 'create-thread'}
              disabled={
                !threadTitleInput.trim() ||
                !threadBodyInput.trim() ||
                Boolean(forumActionLoading)
              }
              onClick={handleCreateForumThread}
            >
              Post Topic
            </GameCTAButton>
          </div>
        </div>
        <div className={listClass}>
          {forumThreads.length === 0 ? (
            <span className={mutedTextClass}>No topics yet.</span>
          ) : (
            forumThreads.map((thread) => renderForumThread(thread))
          )}
        </div>
      </div>
    );
  }

  function renderForumThread(thread: BuildForumThread) {
    const threadUser = getForumUser(thread);
    const canDeleteThread = userCanDeleteForumItem(thread);
    return (
      <div
        key={thread.id}
        className={forumThreadButtonClass}
        role="button"
        tabIndex={0}
        onClick={() => handleOpenForumThread(thread.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void handleOpenForumThread(thread.id);
          }
        }}
      >
        <div className={forumThreadMainClass}>
          <span className={forumThreadTitleClass}>{thread.title}</span>
          <span className={forumThreadPreviewClass}>{thread.body}</span>
          <div className={forumThreadMetaClass}>
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <UsernameText
                className={forumUsernameClass}
                user={threadUser}
              />
            </span>
            {thread.createdAt ? (
              <>
                <span>·</span>
                <span>{timeSince(thread.createdAt)}</span>
              </>
            ) : null}
            {thread.lastReplyAt &&
            Number(thread.lastReplyAt) !== Number(thread.createdAt || 0) ? (
              <>
                <span>·</span>
                <span>active {timeSince(thread.lastReplyAt)}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className={rowClass}>
          <span className={forumThreadCountClass}>
            {Number(thread.replyCount || 0)}{' '}
            {Number(thread.replyCount || 0) === 1 ? 'reply' : 'replies'}
          </span>
          {canDeleteThread ? (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <GameCTAButton
                variant="neutral"
                size="sm"
                icon="trash-alt"
                loading={forumActionLoading === `delete-thread-${thread.id}`}
                disabled={Boolean(forumActionLoading)}
                onClick={() => handleDeleteForumThread(thread.id)}
              />
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  function renderForumReply(reply: BuildForumReply) {
    const replyUser = getForumUser(reply);
    return (
      <article key={reply.id} className={forumPostClass}>
        <ProfilePic
          className={forumAvatarClass}
          userId={replyUser.id}
          profilePicUrl={replyUser.profilePicUrl}
        />
        <div className={forumPostMainClass}>
          <div className={forumPostHeaderClass}>
            <div className={forumAuthorMetaClass}>
              <UsernameText className={forumUsernameClass} user={replyUser} />
              {reply.createdAt ? (
                <span className={forumTimestampClass}>
                  {timeSince(reply.createdAt)}
                </span>
              ) : null}
            </div>
            {userCanDeleteForumItem(reply) ? (
              <div className={forumPostActionsClass}>
                <GameCTAButton
                  variant="neutral"
                  size="sm"
                  icon="trash-alt"
                  loading={forumActionLoading === `delete-reply-${reply.id}`}
                  disabled={Boolean(forumActionLoading)}
                  onClick={() => handleDeleteForumReply(reply.id)}
                />
              </div>
            ) : null}
          </div>
          <div className={forumPostBodyClass}>{reply.body}</div>
        </div>
      </article>
    );
  }

  function userCanDeleteForumItem(item: { userId: number }) {
    return Number(item.userId) === Number(userId) || canModerateForum;
  }

  function getForumUser(
    item: Pick<BuildForumThread | BuildForumReply, 'userId' | 'username' | 'profilePicUrl'>
  ): User {
    return {
      id: Number(item.userId || 0),
      username: item.username || 'User',
      profilePicUrl: item.profilePicUrl || ''
    };
  }
}

function normalizeCollaborationMode(value: unknown): BuildCollaborationMode {
  return value === 'open_source' ? value : 'private';
}

function getContributionAccessForCollaborationMode(
  _mode: BuildCollaborationMode
): BuildContributionAccess {
  return 'invite_only';
}

function normalizeContributionStatus(value: unknown): BuildContributionStatus {
  const normalized = String(value || '').trim();
  if (
    normalized === 'draft' ||
    normalized === 'merging' ||
    normalized === 'merged'
  ) {
    return normalized;
  }
  return 'none';
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { mobileMaxWidth } from '~/constants/css';
import { getBuildWorkspacePath } from '~/helpers/buildNavigationHelpers';
import { normalizeBuildCollaborationMode } from '~/helpers/buildProjectHelpers';
import ContributionDetail from './ContributionDetail';
import Forum from './Forum';
import OwnerContributionsPanel from './OwnerContributionsPanel';
import OwnerTeamPanel from './OwnerTeamPanel';
import Toolbar from './Toolbar';
import {
  MERGE_CONFLICT_MARKERS_MESSAGE,
  UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE,
  canClearConflictMarkerActionError,
  getContributionConflictMarkerPaths,
  stringArraysEqual
} from './helpers/collaborationConflicts';
import {
  normalizePanelForumThreadId,
  normalizePanelScrollTop
} from './helpers/panelState';
import {
  createRuntimeAssetTransferOperationId,
  normalizeRuntimeAssetTransferProgressPayload,
  type RuntimeAssetTransferProgressPayload
} from '../helpers/runtimeAssetTransferProgress';
import type {
  BuildCollaborationMode,
  BuildCollaborationRequest,
  BuildContributionAccess,
  BuildContributionFileDiff,
  BuildContributionStatus,
  BuildContributorInvite,
  BuildForumReply,
  BuildForumThread,
  BuildLike,
  CollaborationPanelProps
} from './types';

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

export default function CollaborationPanel({
  build,
  embedded = false,
  isOwner,
  onBuildPatch,
  onContributionBranchCreated,
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
  const replaceMainWithBuildContribution = useAppContext(
    (v) => v.requestHelpers.replaceMainWithBuildContribution
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
  const forumViewerKey = getBuildForumViewerKey(userId);
  const buildWorkspaceForumCache = useBuildContext(
    (v) => {
      const forumCache =
        v.state.buildWorkspaceUi[String(build.id)]?.forumCache || null;
      return isBuildForumCacheForViewer(forumCache, forumViewerKey)
        ? forumCache
        : null;
    }
  );
  const cacheBuildWorkspaceForumThreads = useBuildContext(
    (v) => v.actions.onSetBuildWorkspaceForumThreads
  );
  const cacheBuildWorkspaceForumThreadDetail = useBuildContext(
    (v) => v.actions.onSetBuildWorkspaceForumThreadDetail
  );
  const removeCachedBuildWorkspaceForumThread = useBuildContext(
    (v) => v.actions.onRemoveBuildWorkspaceForumThread
  );
  const clearCachedBuildWorkspaceForumCache = useBuildContext(
    (v) => v.actions.onClearBuildWorkspaceForumCache
  );

  const isContributionFork =
    normalizeContributionStatus(build.contributionStatus) !== 'none';
  const canModerateForum = isOwner && !isContributionFork;
  const rootBuildId = isContributionFork
    ? Number(build.contributionRootBuildId || 0)
    : Number(build.id || 0);
  const contributionBuildId = isContributionFork ? Number(build.id || 0) : 0;
  const forumScopeKey = getBuildForumScopeKey({
    contributionBuildId,
    scope: !isContributionFork ? 'all' : 'branch'
  });
  const forumScopeIdentity = getBuildForumScopeIdentity({
    buildId: build.id,
    viewerKey: forumViewerKey,
    scopeKey: forumScopeKey
  });
  const initialForumThreadId = normalizePanelForumThreadId(
    initialSelectedForumThreadId
  );
  const cachedForumThreads = getCachedForumThreads(
    buildWorkspaceForumCache,
    forumScopeKey
  );
  const forumScopeCached = hasCachedForumScope(
    buildWorkspaceForumCache,
    forumScopeKey
  );
  const canShowPanel = isOwner || isContributionFork || embedded;
  const [collaborationMode, setCollaborationMode] =
    useState<BuildCollaborationMode>(
      normalizeBuildCollaborationMode(build.collaborationMode)
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
  const [branchRootDrifted, setBranchRootDrifted] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [previewPath, setPreviewPath] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [runtimeAssetTransferProgress, setRuntimeAssetTransferProgress] =
    useState<RuntimeAssetTransferProgressPayload | null>(null);
  const runtimeAssetTransferOperationIdRef = useRef('');
  const [replaceMainConfirmShown, setReplaceMainConfirmShown] = useState(false);
  const [conflictMarkerPaths, setConflictMarkerPaths] = useState<string[]>([]);
  const [requestActionError, setRequestActionError] = useState('');
  const [forumThreads, setForumThreads] = useState<BuildForumThread[]>([]);
  const [selectedThread, setSelectedThread] =
    useState<BuildForumThread | null>(null);
  const [threadReplies, setThreadReplies] = useState<BuildForumReply[]>([]);
  const forumThreadsRef = useRef<BuildForumThread[]>([]);
  const selectedThreadRef = useRef<BuildForumThread | null>(null);
  const threadRepliesRef = useRef<BuildForumReply[]>([]);
  const [threadTitleInput, setThreadTitleInput] = useState('');
  const [threadBodyInput, setThreadBodyInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<BuildForumReply | null>(null);
  const [recentlyCreatedForumThreadId, setRecentlyCreatedForumThreadId] =
    useState(0);
  const embeddedScrollRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollKeyRef = useRef('');
  const initialScrollTopRef = useRef(initialScrollTop);
  const onScrollTopChangeRef = useRef(onScrollTopChange);
  const initialSelectedForumThreadIdRef = useRef(
    normalizePanelForumThreadId(initialSelectedForumThreadId)
  );
  const onSelectedForumThreadChangeRef = useRef(onSelectedForumThreadChange);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const recentlyCreatedForumThreadTimeoutRef = useRef<number | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const pendingForumThreadLoadRef = useRef(0);
  const activeForumScopeIdentityRef = useRef(forumScopeIdentity);
  const lastHydratedForumScopeIdentityRef = useRef(forumScopeIdentity);
  const confirmedForumScopeIdentityRef = useRef('');
  const lastRefreshedForumScopeIdentityRef = useRef('');
  const lastRefreshedForumThreadIdentityRef = useRef('');
  const forumScopeMutationVersionsRef = useRef<Record<string, number>>({});
  const forumThreadMutationVersionsRef = useRef<Record<string, number>>({});
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
  const projectFileConflictMarkerPaths = useMemo(
    () => getContributionConflictMarkerPaths(build.projectFiles),
    [build.projectFiles]
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
  const rootConflictMarkerPaths =
    projectFileConflictMarkerPaths.length > 0
      ? projectFileConflictMarkerPaths
      : isOwner && !isContributionFork
        ? conflictMarkerPaths
        : [];
  const conflictMarkerPathsForLumine =
    isOwner && !isContributionFork
      ? rootConflictMarkerPaths
      : activeConflictMarkerPaths;
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
  activeForumScopeIdentityRef.current = forumScopeIdentity;
  const canInviteContributors = true;
  const contributorsCardShown = true;

  useEffect(() => {
    setCollaborationMode(
      normalizeBuildCollaborationMode(build.collaborationMode)
    );
  }, [build.collaborationMode]);

  useEffect(() => {
    function handleRuntimeAssetTransferProgress(payload: any) {
      const progress = normalizeRuntimeAssetTransferProgressPayload(payload);
      if (
        !progress ||
        progress.operationId !== runtimeAssetTransferOperationIdRef.current
      ) {
        return;
      }
      setRuntimeAssetTransferProgress(progress);
    }

    socket.on(
      'build_runtime_asset_transfer_progress',
      handleRuntimeAssetTransferProgress
    );
    return () => {
      socket.off(
        'build_runtime_asset_transfer_progress',
        handleRuntimeAssetTransferProgress
      );
    };
  }, []);

  useEffect(() => {
    if (!Array.isArray(build.projectFiles)) return;
    setConflictMarkerPaths((currentPaths) =>
      stringArraysEqual(currentPaths, projectFileConflictMarkerPaths)
        ? currentPaths
        : projectFileConflictMarkerPaths
    );
    if (projectFileConflictMarkerPaths.length > 0) return;
    setActionError((currentError) =>
      canClearConflictMarkerActionError(currentError) ? '' : currentError
    );
  }, [build.projectFiles, projectFileConflictMarkerPaths]);

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
    if (!canShowPanel) return;
    const forumScopeChanged =
      lastHydratedForumScopeIdentityRef.current !== forumScopeIdentity;
    lastHydratedForumScopeIdentityRef.current = forumScopeIdentity;
    if (forumScopeChanged) {
      setForumLoading(false);
      setForumActionLoading('');
      setForumError('');
    }
    if (isContributionFork && (!rootBuildId || !contributionBuildId)) {
      if (forumScopeChanged) {
        replaceForumThreadsFromCache([]);
        clearSelectedForumThread();
        setReplyTarget(null);
      }
      return;
    }
    if (!forumScopeCached) {
      if (
        forumScopeChanged ||
        forumThreadsRef.current.length > 0 ||
        selectedThreadRef.current
      ) {
        replaceForumThreadsFromCache([]);
        clearSelectedForumThread();
        setReplyTarget(null);
      }
      refreshForumScopeFromServer();
      return;
    }
    const forumScopeAccessConfirmed =
      confirmedForumScopeIdentityRef.current === forumScopeIdentity;
    if (!forumScopeAccessConfirmed) {
      if (
        forumScopeChanged ||
        forumThreadsRef.current.length > 0 ||
        selectedThreadRef.current
      ) {
        replaceForumThreadsFromCache([]);
        clearSelectedForumThread();
        setReplyTarget(null);
      }
      refreshForumScopeFromServer();
      return;
    }
    replaceForumThreadsFromCache(cachedForumThreads);
    if (initialForumThreadId > 0) {
      const cachedThreadDetail = getCachedForumThreadDetail(
        buildWorkspaceForumCache,
        initialForumThreadId
      );
      if (cachedThreadDetail) {
        replaceSelectedThreadFromCache(
          cachedThreadDetail.thread,
          cachedThreadDetail.replies
        );
        setReplyTarget(null);
        refreshForumThreadFromServer(initialForumThreadId);
        refreshForumScopeFromServer();
        return;
      }
      if (
        forumScopeChanged ||
        (pendingForumThreadLoadRef.current !== initialForumThreadId &&
          Number(selectedThreadRef.current?.id || 0) !== initialForumThreadId)
      ) {
        void handleOpenForumThread(initialForumThreadId, {
          persistSelection: false
        });
      }
      refreshForumScopeFromServer();
      return;
    }
    if (forumScopeChanged || selectedThreadRef.current) {
      clearSelectedForumThread();
      setReplyTarget(null);
    }
    refreshForumScopeFromServer();
    // request helpers are stable context helpers; do not include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    canShowPanel,
    contributionBuildId,
    forumScopeCached,
    forumScopeIdentity,
    initialForumThreadId,
    isContributionFork,
    rootBuildId
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
      if (recentlyCreatedForumThreadTimeoutRef.current !== null) {
        window.clearTimeout(recentlyCreatedForumThreadTimeoutRef.current);
        recentlyCreatedForumThreadTimeoutRef.current = null;
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

  function refreshForumScopeFromServer(
    options: { force?: boolean } = {}
  ) {
    if (
      !options.force &&
      lastRefreshedForumScopeIdentityRef.current === forumScopeIdentity
    ) {
      return;
    }
    lastRefreshedForumScopeIdentityRef.current = forumScopeIdentity;
    void reloadForumThreads(isContributionFork ? contributionBuildId : 0);
  }

  function refreshForumThreadFromServer(threadId: number) {
    const threadRefreshIdentity = getBuildForumThreadRefreshIdentity({
      scopeIdentity: forumScopeIdentity,
      threadId
    });
    if (
      lastRefreshedForumThreadIdentityRef.current === threadRefreshIdentity
    ) {
      return;
    }
    lastRefreshedForumThreadIdentityRef.current = threadRefreshIdentity;
    void handleOpenForumThread(threadId, {
      onlyIfSelected: true,
      persistSelection: false,
      showLoading: false
    });
  }

  function getForumScopeMutationVersion(scopeIdentity = forumScopeIdentity) {
    return Number(forumScopeMutationVersionsRef.current[scopeIdentity] || 0);
  }

  function markForumScopeMutated(scopeIdentity = forumScopeIdentity) {
    forumScopeMutationVersionsRef.current[scopeIdentity] =
      getForumScopeMutationVersion(scopeIdentity) + 1;
  }

  function getForumThreadMutationVersion(threadId: number) {
    const threadKey = getBuildForumThreadMutationKey(threadId);
    return Number(forumThreadMutationVersionsRef.current[threadKey] || 0);
  }

  function markForumThreadMutated(threadId: number) {
    const threadKey = getBuildForumThreadMutationKey(threadId);
    forumThreadMutationVersionsRef.current[threadKey] =
      getForumThreadMutationVersion(threadId) + 1;
  }

  function replaceForumThreadsFromServer(
    nextThreads: BuildForumThread[],
    nextScopeKey = forumScopeKey
  ) {
    replaceForumThreadsFromCache(nextThreads);
    cacheBuildWorkspaceForumThreads({
      buildId: build.id,
      viewerKey: forumViewerKey,
      scopeKey: nextScopeKey,
      threads: nextThreads
    });
  }

  function replaceForumThreadsFromMutation(nextThreads: BuildForumThread[]) {
    replaceForumThreadsFromCache(nextThreads);
    refreshForumScopeFromServer({ force: true });
  }

  function replaceForumThreadsFromCache(nextThreads: BuildForumThread[]) {
    forumThreadsRef.current = nextThreads;
    setForumThreads(nextThreads);
  }

  function replaceSelectedThreadFromServer(
    nextThread: BuildForumThread | null,
    nextReplies: BuildForumReply[]
  ) {
    replaceSelectedThreadFromCache(nextThread, nextReplies);
    if (!nextThread) return;
    cacheBuildWorkspaceForumThreadDetail({
      buildId: build.id,
      viewerKey: forumViewerKey,
      thread: nextThread,
      replies: nextReplies
    });
  }

  function replaceSelectedThreadFromCache(
    nextThread: BuildForumThread | null,
    nextReplies: BuildForumReply[]
  ) {
    selectedThreadRef.current = nextThread;
    threadRepliesRef.current = nextReplies;
    setSelectedThread(nextThread);
    setThreadReplies(nextReplies);
  }

  function clearSelectedForumThread() {
    replaceSelectedThreadFromCache(null, []);
  }

  function clearForumStateAfterDeniedAccess() {
    if (confirmedForumScopeIdentityRef.current === forumScopeIdentity) {
      confirmedForumScopeIdentityRef.current = '';
    }
    replaceForumThreadsFromCache([]);
    clearSelectedForumThread();
    setReplyTarget(null);
    commitSelectedForumThreadId(0);
    clearCachedBuildWorkspaceForumCache({
      buildId: build.id,
      viewerKey: forumViewerKey
    });
  }

  function appendForumReplyFromServer(nextReply: BuildForumReply) {
    const replyId = Number(nextReply?.id || 0);
    if (!replyId) {
      const nextReplies = [...threadRepliesRef.current, nextReply];
      threadRepliesRef.current = nextReplies;
      setThreadReplies(nextReplies);
      return;
    }
    let replyExists = false;
    const nextReplies = threadRepliesRef.current.map((reply) => {
      if (Number(reply?.id || 0) !== replyId) return reply;
      replyExists = true;
      return nextReply;
    });
    if (!replyExists) {
      nextReplies.push(nextReply);
    }
    threadRepliesRef.current = nextReplies;
    setThreadReplies(nextReplies);
  }

  function patchForumThreadInCurrentList(nextThread: BuildForumThread) {
    const nextThreadId = Number(nextThread.id || 0);
    if (!nextThreadId) return;
    const nextThreads = forumThreadsRef.current.map((thread) =>
      Number(thread.id || 0) === nextThreadId ? nextThread : thread
    );
    replaceForumThreadsFromCache(nextThreads);
  }

  if (!canShowPanel) return null;

  return (
    <>
      <section
        className={
          embedded ? `${panelClass} ${embeddedPanelClass}` : panelClass
        }
      >
        <Toolbar
          collaborationMode={collaborationMode}
          contributionStatus={build.contributionStatus}
          embedded={embedded}
          forumThreadCount={forumThreads.length}
          isContributionFork={isContributionFork}
          isOwner={isOwner}
          panelExpanded={panelExpanded}
          reviewContributionCount={reviewContributions.length}
          savingSettings={savingSettings}
          settingsError={settingsError}
          onCollaborationModeChange={setCollaborationMode}
          onSaveSettings={handleSaveSettings}
          onToggleExpanded={() => setPanelExpanded((current) => !current)}
        />

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
                    {renderOwnerTeamPanel({ showPrompt: false })}
                    {renderOwnerContributions(true)}
                  </>
                ) : (
                  <div className={splitClass}>{renderForum()}</div>
                )}
              </>
            )}
          </div>
        ) : null}
      </section>
      {replaceMainConfirmShown ? (
        <ConfirmModal
          title="Replace Main?"
          descriptionFontSize="1.1rem"
          confirmButtonColor="orange"
          confirmButtonLabel="Replace Main"
          onHide={() =>
            actionLoading ? null : setReplaceMainConfirmShown(false)
          }
          onConfirm={handleReplaceMainWithContribution}
          description={
            <div
              style={{
                width: '100%',
                textAlign: 'left',
                lineHeight: 1.5
              }}
            >
              <p>
                This will make Main identical to{' '}
                <b>{selectedContribution?.title || 'this branch'}</b>.
              </p>
              <p>
                Any Main changes that are not in this branch will be
                overwritten. No merge conflict resolution will run.
              </p>
              <p>The branch will be marked as merged after Main is replaced.</p>
            </div>
          }
        />
      ) : null}
    </>
  );

  function renderEmbeddedBody() {
    if (isOwner && !isContributionFork) {
      return (
        <div className={embeddedBodyStackClass}>
          {renderForum()}
          {renderOwnerTeamPanel()}
        </div>
      );
    }
    if (!isContributionFork) {
      return <div className={embeddedBodyStackClass}>{renderForum()}</div>;
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

  function renderOwnerTeamPanel({ showPrompt = true } = {}) {
    return (
      <OwnerTeamPanel
        acceptedContributorCount={acceptedContributorCount}
        actionLoading={actionLoading}
        build={build}
        canInviteContributors={canInviteContributors}
        collaborationRequests={collaborationRequests}
        contributors={contributors}
        contributorsCardShown={contributorsCardShown}
        loadingCollaborationRequests={loadingCollaborationRequests}
        requestActionError={requestActionError}
        rootBuildId={rootBuildId}
        showHiddenCollaborationRequests={showHiddenCollaborationRequests}
        showPrompt={showPrompt}
        onAcceptRequest={handleAcceptCollaborationRequest}
        onHideRequest={handleHideCollaborationRequest}
        onInvited={reloadContributors}
        onOpenCollaborationSettings={onOpenCollaborationSettings}
        onRejectRequest={handleRejectCollaborationRequest}
        onRemoveContributor={handleRevokeContributor}
        onToggleHiddenRequests={() =>
          setShowHiddenCollaborationRequests((current) => !current)
        }
      />
    );
  }

  function renderOwnerContributions(showCommentsFallback = false) {
    const emptyFallback = showCommentsFallback ? renderForum() : null;
    return (
      <OwnerContributionsPanel
        emptyFallback={emptyFallback}
        loading={loadingContributions}
        reviewContributions={reviewContributions}
        selectedContribution={selectedContribution}
        selectedContributionId={selectedContributionId}
        selectedContributionDetail={renderContributionDetail(true)}
        onSelectContribution={handleSelectContribution}
      />
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
        contributionAccess:
          getContributionAccessForCollaborationMode(collaborationMode)
      });
      if (result?.build) {
        onBuildPatch(result.build);
      }
    } catch (error: any) {
      setSettingsError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save team settings'
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
      if (result?.defaultBranch) {
        onContributionBranchCreated?.(result.defaultBranch);
        void reloadContributions();
      }
      void reloadContributors();
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept join request'
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
            Number(request.id) === Number(requestId) ? result.request : request
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
          'Failed to reject join request'
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
          'Failed to hide join request'
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
      setBranchRootDrifted(Boolean(result?.rootDrifted));
      if (projectFileConflictMarkerPaths.length === 0) {
        setConflictMarkerPaths([]);
      }
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

  function beginRuntimeAssetTransferProgress() {
    const operationId = createRuntimeAssetTransferOperationId();
    runtimeAssetTransferOperationIdRef.current = operationId;
    setRuntimeAssetTransferProgress({
      operationId,
      sourceBuildId: 0,
      sourceUserId: 0,
      targetBuildId: 0,
      targetUserId: 0,
      status: 'running',
      phase: 'preparing',
      copiedAssets: 0,
      totalAssets: 0,
      copiedBytes: 0,
      totalBytes: 0,
      progressPercent: 2,
      message: 'Preparing runtime assets'
    });
    return operationId;
  }

  function clearRuntimeAssetTransferProgress() {
    runtimeAssetTransferOperationIdRef.current = '';
    setRuntimeAssetTransferProgress(null);
  }

  async function handleMergeContribution() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('merge');
    setActionError('');
    const assetTransferOperationId = beginRuntimeAssetTransferProgress();
    try {
      const preparedFiles = onBeforeContributionAction
        ? await onBeforeContributionAction('merge')
        : { ready: true };
      if (!preparedFiles.ready) return;
      const result = await mergeBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId,
        assetTransferOperationId,
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
        if (result.mergeConflictsWritten || conflictPaths.length > 0) {
          setActionError(MERGE_CONFLICT_MARKERS_MESSAGE);
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
      clearRuntimeAssetTransferProgress();
    }
  }

  async function handleReplaceMainWithContribution() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('replace-main');
    setActionError('');
    const assetTransferOperationId = beginRuntimeAssetTransferProgress();
    try {
      const preparedFiles = onBeforeContributionAction
        ? await onBeforeContributionAction('replace')
        : { ready: true };
      if (!preparedFiles.ready) return;
      const result = await replaceMainWithBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId,
        assetTransferOperationId
      });
      if (result?.success) {
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
        setChangedFiles([]);
        setSelectedPaths([]);
        setConflictMarkerPaths([]);
      } else {
        setActionError(result?.error || 'Failed to replace main');
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to replace main'
      );
    } finally {
      setActionLoading('');
      clearRuntimeAssetTransferProgress();
      setReplaceMainConfirmShown(false);
    }
  }

  async function handleUpdateVersionFromMain() {
    if (!rootBuildId || !contributionBuildId || actionLoading) return;
    setActionLoading('update-from-main');
    setActionError('');
    const assetTransferOperationId = beginRuntimeAssetTransferProgress();
    try {
      const preparedFiles = onBeforeContributionAction
        ? await onBeforeContributionAction('update-from-main')
        : { ready: true };
      if (!preparedFiles.ready) return;
      const result = await updateBuildContributionFromMain({
        buildId: rootBuildId,
        contributionBuildId,
        assetTransferOperationId
      });
      if (result?.code === 'build_contribution_conflict_markers_remaining') {
        const markerPaths = Array.isArray(result.conflictMarkerPaths)
          ? result.conflictMarkerPaths
          : [];
        setConflictMarkerPaths(markerPaths);
        setActionError(
          markerPaths.length > 0
            ? `Fix overlapping branch changes in ${markerPaths.join(', ')} first.`
            : 'Fix overlapping branch changes before updating from main.'
        );
        return;
      }
      if (result?.success) {
        setBranchRootDrifted(false);
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
          setActionError(UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE);
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
      clearRuntimeAssetTransferProgress();
    }
  }

  async function handleCompleteContributionMerge() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('complete-merge');
    setActionError('');
    try {
      const preparedFiles = onBeforeContributionAction
        ? await onBeforeContributionAction('complete-merge')
        : { ready: true };
      if (!preparedFiles.ready) return;
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
            ? `Fix overlapping branch changes in ${markerPaths.join(', ')} first.`
            : 'Fix overlapping branch changes before completing this merge.'
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
          ? `Fix overlapping branch changes in ${markerPaths.join(', ')} first.`
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
        conflictMarkerPathsForLumine
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
    const nextScopeKey = getBuildForumScopeKey({
      contributionBuildId: nextContributionBuildId || 0,
      scope:
        !isContributionFork && !nextContributionBuildId ? 'all' : 'branch'
    });
    const requestForumScopeIdentity = getBuildForumScopeIdentity({
      buildId: build.id,
      viewerKey: forumViewerKey,
      scopeKey: nextScopeKey
    });
    const requestScopeMutationVersion = getForumScopeMutationVersion(
      requestForumScopeIdentity
    );
    setForumLoading(true);
    setForumError('');
    try {
      const result = await loadBuildContributionForumThreads({
        buildId: rootBuildId,
        contributionBuildId: nextContributionBuildId || null,
        scope:
          !isContributionFork && !nextContributionBuildId ? 'all' : undefined
      });
      const nextThreads = Array.isArray(result?.threads) ? result.threads : [];
      if (
        activeForumScopeIdentityRef.current !== requestForumScopeIdentity ||
        getForumScopeMutationVersion(requestForumScopeIdentity) !==
          requestScopeMutationVersion
      ) {
        return;
      }
      confirmedForumScopeIdentityRef.current = requestForumScopeIdentity;
      const selectedThreadId = Number(selectedThreadRef.current?.id || 0);
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
      replaceForumThreadsFromServer(nextThreads, nextScopeKey);
      if (selectedThreadId > 0 && !selectedThreadStillExists) {
        clearSelectedForumThread();
        setReplyTarget(null);
        commitSelectedForumThreadId(0);
      }
      if (persistedThreadStillExists) {
        lastRefreshedForumThreadIdentityRef.current =
          getBuildForumThreadRefreshIdentity({
            scopeIdentity: forumScopeIdentity,
            threadId: persistedThreadId
          });
        await handleOpenForumThread(persistedThreadId, {
          persistSelection: false,
          showLoading: false
        });
      } else if (persistedThreadId > 0) {
        commitSelectedForumThreadId(0);
      }
    } catch (error: any) {
      if (
        activeForumScopeIdentityRef.current !== requestForumScopeIdentity ||
        getForumScopeMutationVersion(requestForumScopeIdentity) !==
          requestScopeMutationVersion
      ) {
        return;
      }
      if (isForumAccessDeniedError(error)) {
        clearForumStateAfterDeniedAccess();
      }
      setForumError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to load team forum'
      );
    } finally {
      if (
        activeForumScopeIdentityRef.current === requestForumScopeIdentity
      ) {
        setForumLoading(false);
      }
    }
  }

  async function handleCreateForumThread() {
    if (!rootBuildId || !threadTitleInput.trim() || forumActionLoading) {
      return;
    }
    setForumActionLoading('create-thread');
    setForumError('');
    try {
      const result = await createBuildContributionForumThread({
        buildId: rootBuildId,
        contributionBuildId: isContributionFork ? contributionBuildId : null,
        title: threadTitleInput.trim(),
        body: threadBodyInput.trim()
      });
      if (result?.thread) {
        markForumScopeMutated();
        replaceForumThreadsFromMutation([
          result.thread,
          ...forumThreadsRef.current.filter(
            (thread) => Number(thread.id) !== Number(result.thread.id)
          )
        ]);
        clearSelectedForumThread();
        commitSelectedForumThreadId(0);
        markForumThreadPosted(result.thread.id);
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

  function markForumThreadPosted(threadId: number) {
    setRecentlyCreatedForumThreadId(threadId);
    if (recentlyCreatedForumThreadTimeoutRef.current !== null) {
      window.clearTimeout(recentlyCreatedForumThreadTimeoutRef.current);
    }
    recentlyCreatedForumThreadTimeoutRef.current = window.setTimeout(() => {
      recentlyCreatedForumThreadTimeoutRef.current = null;
      setRecentlyCreatedForumThreadId((currentThreadId) =>
        Number(currentThreadId) === Number(threadId) ? 0 : currentThreadId
      );
    }, 3200);
  }

  async function handleOpenForumThread(
    threadId: number,
    options?: {
      onlyIfSelected?: boolean;
      persistSelection?: boolean;
      showLoading?: boolean;
    }
  ) {
    if (!rootBuildId || !threadId) return;
    const requestForumScopeIdentity = forumScopeIdentity;
    const requestMutationVersion = getForumThreadMutationVersion(threadId);
    pendingForumThreadLoadRef.current = threadId;
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
      if (
        activeForumScopeIdentityRef.current !== requestForumScopeIdentity ||
        getForumThreadMutationVersion(threadId) !== requestMutationVersion ||
        (options?.onlyIfSelected &&
          (Number(selectedThreadRef.current?.id || 0) !== Number(threadId) ||
            (pendingForumThreadLoadRef.current > 0 &&
              pendingForumThreadLoadRef.current !== Number(threadId))))
      ) {
        return;
      }
      replaceSelectedThreadFromServer(
        result?.thread || null,
        Array.isArray(result?.replies) ? result.replies : []
      );
      if (result?.thread) {
        lastRefreshedForumThreadIdentityRef.current =
          getBuildForumThreadRefreshIdentity({
            scopeIdentity: requestForumScopeIdentity,
            threadId: result.thread.id || threadId
          });
      }
      setReplyTarget(null);
      if (options?.persistSelection !== false) {
        commitSelectedForumThreadId(result?.thread?.id || threadId);
      }
    } catch (error: any) {
      if (
        activeForumScopeIdentityRef.current !== requestForumScopeIdentity ||
        getForumThreadMutationVersion(threadId) !== requestMutationVersion ||
        (options?.onlyIfSelected &&
          (Number(selectedThreadRef.current?.id || 0) !== Number(threadId) ||
            (pendingForumThreadLoadRef.current > 0 &&
              pendingForumThreadLoadRef.current !== Number(threadId))))
      ) {
        return;
      }
      setForumError(
        error?.response?.data?.error || error?.message || 'Failed to open topic'
      );
    } finally {
      if (pendingForumThreadLoadRef.current === threadId) {
        pendingForumThreadLoadRef.current = 0;
      }
      if (
        showLoading &&
        activeForumScopeIdentityRef.current === requestForumScopeIdentity
      ) {
        setForumActionLoading('');
      }
    }
  }

  function handleOpenForumThreadBranch(thread: BuildForumThread) {
    const branchId =
      Number(thread.branchId || 0) || Number(thread.contributionBuildId || 0);
    const branchNumber = Number(thread.branchContributionBranchNumber || 0);
    if (!rootBuildId || !branchId || !branchNumber) return;
    navigate(
      getBuildWorkspacePath({
        id: branchId,
        contributionRootBuildId: rootBuildId,
        contributionBranchNumber: branchNumber
      }),
      {
        state: {
          openPeoplePanel: true,
          forumThreadId: Number(thread.id || 0)
        }
      }
    );
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
        body: replyInput.trim(),
        replyToReplyId: replyTarget?.id || null
      });
      if (result?.reply || result?.thread) {
        markForumScopeMutated();
        markForumThreadMutated(selectedThread.id);
      }
      if (result?.reply) {
        appendForumReplyFromServer(result.reply);
        setReplyInput('');
        setReplyTarget(null);
      }
      if (result?.thread) {
        replaceSelectedThreadFromServer(
          result.thread,
          threadRepliesRef.current
        );
        patchForumThreadInCurrentList(result.thread);
      }
      if (result?.reply || result?.thread) {
        refreshForumScopeFromServer({ force: true });
      }
    } catch (error: any) {
      setForumError(
        error?.response?.data?.error || error?.message || 'Failed to reply'
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
        markForumScopeMutated();
        markForumThreadMutated(threadId);
        const nextThreads = forumThreadsRef.current.filter(
          (thread) => Number(thread.id) !== Number(threadId)
        );
        replaceForumThreadsFromMutation(nextThreads);
        removeCachedBuildWorkspaceForumThread({
          buildId: build.id,
          viewerKey: forumViewerKey,
          threadId
        });
        if (Number(selectedThreadRef.current?.id || 0) === Number(threadId)) {
          clearSelectedForumThread();
          setReplyTarget(null);
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
        if (Number(replyTarget?.id || 0) === Number(replyId)) {
          setReplyTarget(null);
        }
        markForumScopeMutated();
        markForumThreadMutated(selectedThread.id);
        refreshForumScopeFromServer({ force: true });
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
    const contributionCanReplaceMain =
      contributionStatus === 'draft' || contributionStatus === 'merged';
    const canUpdateFromMain =
      !ownerReview &&
      branchRootDrifted &&
      (contributionStatus === 'draft' || contributionStatus === 'merged') &&
      Number(activeContribution.contributionContributorId || 0) ===
        Number(userId || 0);
    const branchOwnerNeedsAttention =
      !ownerReview &&
      (canUpdateFromMain ||
        activeConflictMarkerPaths.length > 0 ||
        actionError);
    const detailConflictMarkerPaths = ownerReview
      ? rootConflictMarkerPaths
      : activeConflictMarkerPaths;
    if (!ownerReview && !branchOwnerNeedsAttention) {
      return null;
    }
    return (
      <ContributionDetail
        activeConflictMarkerPaths={detailConflictMarkerPaths}
        activeContributionId={activeContribution.id}
        actionError={actionError}
        actionLoading={actionLoading}
        canAskLumineToResolveConflicts={Boolean(onAskLumineToResolveConflicts)}
        canCompleteConflictMerge={
          ownerReview && contributionStatus === 'merging'
        }
        canUpdateFromMain={canUpdateFromMain}
        changedFiles={changedFiles}
        contributionCanMerge={contributionCanMerge}
        contributionCanReplaceMain={contributionCanReplaceMain}
        contributionStatus={contributionStatus}
        ownerReview={ownerReview}
        runtimeAssetTransferProgress={runtimeAssetTransferProgress}
        selectedPaths={selectedPaths}
        selectedPreviewFile={selectedPreviewFile}
        onAskLumineToResolveConflicts={handleAskLumineToResolveConflicts}
        onCompleteContributionMerge={handleCompleteContributionMerge}
        onMergeContribution={handleMergeContribution}
        onPreviewContribution={handlePreviewContribution}
        onPreviewPathChange={setPreviewPath}
        onReplaceMain={() => setReplaceMainConfirmShown(true)}
        onToggleSelectedPath={toggleSelectedPath}
        onUpdateVersionFromMain={handleUpdateVersionFromMain}
      />
    );
  }

  function renderForum() {
    return (
      <Forum
        actionLoading={forumActionLoading}
        bodyInput={threadBodyInput}
        canModerate={canModerateForum}
        error={forumError}
        loading={forumLoading}
        recentlyCreatedThreadId={recentlyCreatedForumThreadId}
        replyInput={replyInput}
        replyTarget={replyTarget}
        replies={threadReplies}
        selectedThread={selectedThread}
        showScopeTags={!isContributionFork}
        threads={forumThreads}
        titleInput={threadTitleInput}
        userId={userId}
        onBackToThreads={() => {
          clearSelectedForumThread();
          setReplyInput('');
          setReplyTarget(null);
          commitSelectedForumThreadId(0);
        }}
        onBodyInputChange={setThreadBodyInput}
        onCreateReply={handleCreateForumReply}
        onCreateThread={handleCreateForumThread}
        onDeleteReply={handleDeleteForumReply}
        onDeleteThread={handleDeleteForumThread}
        onOpenThreadBranch={handleOpenForumThreadBranch}
        onOpenThread={(threadId) => {
          void handleOpenForumThread(threadId);
        }}
        onReplyInputChange={setReplyInput}
        onReplyTargetChange={setReplyTarget}
        onTitleInputChange={setThreadTitleInput}
      />
    );
  }
}

function getContributionAccessForCollaborationMode(
  _mode: BuildCollaborationMode
): BuildContributionAccess {
  return 'invite_only';
}

function getBuildForumScopeKey({
  contributionBuildId,
  scope
}: {
  contributionBuildId: number;
  scope: 'all' | 'branch';
}) {
  if (scope === 'all') return 'scope:all';
  return `branch:${Math.max(0, Math.floor(Number(contributionBuildId || 0)))}`;
}

function getBuildForumViewerKey(userId: number | null) {
  const normalizedUserId = Math.max(0, Math.floor(Number(userId || 0)));
  return normalizedUserId > 0 ? `user:${normalizedUserId}` : 'anonymous';
}

function isBuildForumCacheForViewer(cache: any, viewerKey: string) {
  return Boolean(cache && String(cache.viewerKey || '') === viewerKey);
}

function getBuildForumScopeIdentity({
  buildId,
  viewerKey,
  scopeKey
}: {
  buildId: number;
  viewerKey: string;
  scopeKey: string;
}) {
  return `${Math.max(0, Math.floor(Number(buildId || 0)))}:${viewerKey}:${scopeKey}`;
}

function getBuildForumThreadRefreshIdentity({
  scopeIdentity,
  threadId
}: {
  scopeIdentity: string;
  threadId: number;
}) {
  return `${scopeIdentity}:thread:${normalizePanelForumThreadId(threadId)}`;
}

function getBuildForumThreadMutationKey(threadId: number) {
  return String(normalizePanelForumThreadId(threadId));
}

function getCachedForumThreads(
  cache: any,
  scopeKey: string
): BuildForumThread[] {
  const threads = cache?.scopes?.[scopeKey]?.threads;
  return Array.isArray(threads) ? threads : [];
}

function hasCachedForumScope(cache: any, scopeKey: string) {
  return Boolean(cache?.scopes?.[scopeKey]);
}

function getCachedForumThreadDetail(
  cache: any,
  threadId: number
): { thread: BuildForumThread; replies: BuildForumReply[] } | null {
  const normalizedThreadId = Math.max(0, Math.floor(Number(threadId || 0)));
  if (!normalizedThreadId) return null;
  const detail = cache?.threadsById?.[String(normalizedThreadId)] || null;
  if (!detail?.thread) return null;
  return {
    thread: detail.thread,
    replies: Array.isArray(detail.replies) ? detail.replies : []
  };
}

function isForumAccessDeniedError(error: any) {
  const status = Number(error?.status || error?.response?.status || 0);
  return status === 403 || status === 404;
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

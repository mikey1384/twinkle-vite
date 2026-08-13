import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Loading from '~/components/Loading';
import BuildEditor from './Editor';
import { getBuildWorkspacePath } from '~/helpers/buildNavigationHelpers';
import Unavailable from './Unavailable';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
import { normalizeBuildResumeRunState } from '~/contexts/Build/resumeRunState';
import { hydrateBuildRunFromPersistedSnapshot } from './helpers/persistedRunSnapshot';
import type { BuildCopilotPolicy } from './Editor/types';
import { socket } from '~/constants/sockets/api';
import {
  applyBuildProjectFilesSocketUpdate,
  resolveBuildProjectFilesSocketUpdate
} from '~/helpers/buildProjectFilesSocketUpdate';
import { mergeBuildPolicyPreservingNewerProjectLimits } from '~/helpers/buildProjectLimitApproval';

interface BuildWorkspaceAccessResult {
  kind: 'redirect-runtime' | 'unpublished' | 'branch-private';
  runtimePath?: string;
}

const BUILD_UNPUBLISHED_PUBLIC_TEXT =
  "This project hasn't been published yet, so it can't be opened publicly.";
const BUILD_PRIVATE_BRANCH_TEXT =
  'Branches are only available to project team members. Log in with a team account or ask the project owner for access.';

// The default-contribution-branch redirect is a one-time convenience per
// session. Once the user has been in their branch workspace (or has already
// been redirected once), explicit navigations to the main project — tab strip
// clicks, back button, pasted URLs — must stay on main instead of bouncing
// back to the branch.
const CONTRIBUTION_BRANCH_AWARE_STORAGE_PREFIX =
  'build-contribution-branch-aware:';

function contributionBranchAwareStorageKey({
  userId,
  rootBuildId
}: {
  userId: number;
  rootBuildId: number;
}) {
  return `${CONTRIBUTION_BRANCH_AWARE_STORAGE_PREFIX}${userId}:${rootBuildId}`;
}

function isSessionAwareOfContributionBranch(params: {
  userId: number;
  rootBuildId: number;
}) {
  try {
    if (typeof window.sessionStorage === 'undefined') return false;
    return Boolean(
      window.sessionStorage.getItem(contributionBranchAwareStorageKey(params))
    );
  } catch {
    return false;
  }
}

function markSessionAwareOfContributionBranch(params: {
  userId: number;
  rootBuildId: number;
}) {
  if (!params.userId || !params.rootBuildId) return;
  try {
    if (typeof window.sessionStorage === 'undefined') return;
    window.sessionStorage.setItem(
      contributionBranchAwareStorageKey(params),
      '1'
    );
  } catch {
    // ignore storage failures (private mode, quota)
  }
}

export default function BuildEditorRoute() {
  const { buildId, branchNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const loadBuildBranch = useAppContext(
    (v) => v.requestHelpers.loadBuildBranch
  );
  const ensureDefaultBuildContributionBranch = useAppContext(
    (v) => v.requestHelpers.ensureDefaultBuildContributionBranch
  );
  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return isNaN(id) ? null : id;
  }, [buildId]);
  const numericBranchNumber = useMemo(() => {
    const id = parseInt(branchNumber || '', 10);
    return isNaN(id) ? null : id;
  }, [branchNumber]);
  const cachedWorkspace = useBuildContext((v) =>
    numericBuildId && !numericBranchNumber
      ? v.state.buildWorkspaces[String(numericBuildId)] || null
      : null
  );
  const onSetBuildWorkspace = useBuildContext(
    (v) => v.actions.onSetBuildWorkspace
  );
  const getLatestBuildRun = useBuildContext((v) => v.getLatestBuildRun);
  const onRegisterBuildRun = useBuildContext(
    (v) => v.actions.onRegisterBuildRun
  );
  const onApplyBuildRunRunningSnapshot = useBuildContext(
    (v) => v.actions.onApplyBuildRunRunningSnapshot
  );
  const onUpdateBuildRunStream = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStream
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const canUseCachedWorkspace = useMemo(() => {
    if (!cachedWorkspace?.build) return false;
    const currentUserId = Number(userId) || 0;
    const cachedBuildUserId = Number(cachedWorkspace.build.userId) || 0;
    return currentUserId > 0 && currentUserId === cachedBuildUserId;
  }, [cachedWorkspace, userId]);
  const usableCachedWorkspace = canUseCachedWorkspace ? cachedWorkspace : null;

  const [loading, setLoading] = useState(
    () => !Boolean(usableCachedWorkspace?.build)
  );
  const [build, setBuild] = useState<any>(usableCachedWorkspace?.build || null);
  const [chatMessages, setChatMessages] = useState<any[]>(
    usableCachedWorkspace?.chatMessages || []
  );
  const [copilotPolicy, setCopilotPolicy] = useState<BuildCopilotPolicy | null>(
    usableCachedWorkspace?.copilotPolicy || null
  );
  const [error, setError] = useState('');
  const replayedPersistedRunStateKeysRef = useRef<Record<string, string>>({});
  const lastCanonicalProjectFilesEventTimeMsRef = useRef(0);
  const applyCanonicalCopilotPolicy = useCallback(
    (nextPolicy: BuildCopilotPolicy | null) => {
      setCopilotPolicy((currentPolicy) => {
        return nextPolicy && currentPolicy
          ? mergeBuildPolicyPreservingNewerProjectLimits(
              nextPolicy,
              currentPolicy
            )
          : nextPolicy;
      });
    },
    []
  );

  const locationState = (location.state as any) || null;
  const seedGreeting = Boolean(locationState?.seedGreeting);
  const routeForumThreadId = Math.max(
    0,
    Math.floor(Number(locationState?.forumThreadId || 0))
  );
  const skipDefaultContributionBranchRedirect = Boolean(
    locationState?.skipDefaultContributionBranchRedirect ||
    routeForumThreadId > 0
  );
  const initialPrompt =
    typeof locationState?.initialPrompt === 'string'
      ? locationState.initialPrompt
      : '';
  const initialPromptContext =
    typeof locationState?.initialPromptContext === 'string'
      ? locationState.initialPromptContext
      : '';
  const forceInitialPrompt = Boolean(locationState?.forceInitialPrompt);

  useEffect(() => {
    setError('');
    if (usableCachedWorkspace?.build) {
      setBuild(usableCachedWorkspace.build);
      setChatMessages(
        Array.isArray(usableCachedWorkspace.chatMessages)
          ? usableCachedWorkspace.chatMessages
          : []
      );
      applyCanonicalCopilotPolicy(usableCachedWorkspace.copilotPolicy || null);
      setLoading(false);
      return;
    }
    setBuild(null);
    setChatMessages([]);
    applyCanonicalCopilotPolicy(null);
    setLoading(true);
  }, [
    applyCanonicalCopilotPolicy,
    numericBuildId,
    numericBranchNumber,
    usableCachedWorkspace
  ]);

  useEffect(() => {
    let cancelled = false;
    if (numericBuildId) void handleLoad();
    return () => {
      cancelled = true;
    };

    async function handleLoad() {
      const canonicalReadStartedAtMs = Date.now();
      if (!usableCachedWorkspace?.build) {
        setLoading(true);
      }
      try {
        const data = numericBranchNumber
          ? await loadBuildBranch({
              buildId: numericBuildId,
              branchNumber: numericBranchNumber,
              options: { fromWriter: true }
            })
          : await loadBuild(numericBuildId, {
              fromWriter: true
            });
        if (cancelled) return;
        const access = data?.access as BuildWorkspaceAccessResult | undefined;
        if (access?.kind === 'redirect-runtime' && access.runtimePath) {
          navigate(access.runtimePath, { replace: true });
          return;
        }
        if (access?.kind === 'unpublished') {
          setBuild(null);
          setChatMessages([]);
          applyCanonicalCopilotPolicy(null);
          setError(BUILD_UNPUBLISHED_PUBLIC_TEXT);
          return;
        }
        if (access?.kind === 'branch-private') {
          setBuild(null);
          setChatMessages([]);
          applyCanonicalCopilotPolicy(null);
          setError(BUILD_PRIVATE_BRANCH_TEXT);
          return;
        }
        if (data?.build) {
          const loadedContributionRootBuildId = Number(
            data.build.contributionRootBuildId || 0
          );
          if (
            !numericBranchNumber &&
            loadedContributionRootBuildId > 0 &&
            Number(data.build.contributionBranchNumber || 0) > 0
          ) {
            navigate(getBuildWorkspacePath(data.build), {
              replace: true,
              state: location.state
            });
            return;
          }
          const currentUserId = Number(userId) || 0;
          if (
            numericBranchNumber &&
            loadedContributionRootBuildId > 0 &&
            currentUserId > 0
          ) {
            markSessionAwareOfContributionBranch({
              userId: currentUserId,
              rootBuildId: loadedContributionRootBuildId
            });
          }
          const mainBuildId = Number(data.build.id || numericBuildId);
          const shouldOpenDefaultContributionBranch =
            !numericBranchNumber &&
            !skipDefaultContributionBranchRedirect &&
            currentUserId > 0 &&
            Number(data.build.userId || 0) !== currentUserId &&
            loadedContributionRootBuildId === 0 &&
            Number(data.build.contributionBranchNumber || 0) === 0 &&
            Boolean(data.build.canOpenContributionWorkspace) &&
            Boolean(data.build.hasActiveContributionInvite) &&
            !isSessionAwareOfContributionBranch({
              userId: currentUserId,
              rootBuildId: mainBuildId
            });
          if (shouldOpenDefaultContributionBranch) {
            const defaultBranchResult =
              await ensureDefaultBuildContributionBranch(mainBuildId);
            if (cancelled) return;
            if (defaultBranchResult?.build) {
              markSessionAwareOfContributionBranch({
                userId: currentUserId,
                rootBuildId: mainBuildId
              });
              navigate(getBuildWorkspacePath(defaultBranchResult.build), {
                replace: true,
                state: location.state
              });
              return;
            }
          }
          const nextProjectFiles = Array.isArray(data.projectFiles)
            ? data.projectFiles
            : [];
          const nextBuild = {
            ...data.build,
            executionPlan: data.executionPlan || null,
            followUpPrompt: data.followUpPrompt || null,
            runtimeExplorationPlan: data.runtimeExplorationPlan || null,
            projectManifest: data.projectManifest || null,
            capabilitySnapshot: data.capabilitySnapshot || null,
            projectFiles: nextProjectFiles,
            projectFilesHash:
              typeof data.projectFilesHash === 'string'
                ? data.projectFilesHash
                : null
          };
          const nextChatMessages = data.chatMessages || [];
          const nextCopilotPolicy = data.copilotPolicy || null;
          const nextActiveRun = data.activeRun || null;
          const latestActiveBuildRun = getLatestBuildRun(
            Number(nextBuild.id || numericBuildId)
          );
          const canonicalProjectFilesUpdate =
            resolveBuildProjectFilesSocketUpdate({
              buildId: Number(nextBuild.id || 0),
              build: nextBuild,
              projectFiles: nextProjectFiles,
              filesHash: nextBuild.projectFilesHash,
              source: 'canonical_refresh',
              eventTimeMs: canonicalReadStartedAtMs
            });
          setBuild((currentBuild: any) => {
            if (
              !currentBuild ||
              Number(currentBuild.id || 0) !== Number(nextBuild.id || 0) ||
              !canonicalProjectFilesUpdate
            ) {
              lastCanonicalProjectFilesEventTimeMsRef.current = Math.max(
                lastCanonicalProjectFilesEventTimeMsRef.current,
                canonicalReadStartedAtMs
              );
              return nextBuild;
            }
            const applied = applyBuildProjectFilesSocketUpdate({
              currentBuild,
              currentEventTimeMs:
                lastCanonicalProjectFilesEventTimeMsRef.current,
              update: canonicalProjectFilesUpdate
            });
            lastCanonicalProjectFilesEventTimeMsRef.current =
              applied.eventTimeMs;
            return applied.build;
          });
          setChatMessages(nextChatMessages);
          applyCanonicalCopilotPolicy(nextCopilotPolicy);
          setError('');
          const didHydratePersistedActiveRun =
            hydrateBuildRunFromPersistedSnapshot({
              activeRunSnapshot: nextActiveRun,
              build: nextBuild,
              chatMessages: nextChatMessages,
              projectFiles: nextProjectFiles,
              currentRun: latestActiveBuildRun,
              replayedPersistedRunStateKeys:
                replayedPersistedRunStateKeysRef.current,
              actions: {
                onRegisterBuildRun,
                onApplyBuildRunRunningSnapshot,
                onUpdateBuildRunStream,
                onAppendBuildRunEvent,
                onCompleteBuildRun,
                onFailBuildRun,
                onStopBuildRun
              }
            });
          if (didHydratePersistedActiveRun && nextActiveRun) {
            const normalizedActiveRun =
              normalizeBuildResumeRunState(nextActiveRun);
            const activeRunRequestId = String(
              normalizedActiveRun.requestId || ''
            ).trim();
            const activeRunBuildId = Number(
              normalizedActiveRun.buildId || nextBuild.id || 0
            );
            if (
              socket.connected &&
              !normalizedActiveRun.terminal &&
              activeRunRequestId &&
              activeRunBuildId > 0
            ) {
              socket.emit('build_resume_run', {
                buildId: activeRunBuildId,
                requestId: activeRunRequestId
              });
            }
          }
          if (initialPrompt || seedGreeting) {
            navigate(location.pathname, { replace: true, state: null });
          }
        } else {
          if (!usableCachedWorkspace?.build) {
            setBuild(null);
            setChatMessages([]);
            applyCanonicalCopilotPolicy(null);
          }
          setError('Build not found');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load build:', err);
        if (!usableCachedWorkspace?.build) {
          setBuild(null);
          setChatMessages([]);
          applyCanonicalCopilotPolicy(null);
        }
        setError(err?.message || 'Failed to load build');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialPrompt,
    location.pathname,
    navigate,
    numericBranchNumber,
    numericBuildId,
    seedGreeting,
    skipDefaultContributionBranchRedirect,
    userId
  ]);

  useEffect(() => {
    let cancelled = false;
    const currentBuildId = Number(numericBuildId || 0);
    if (!currentBuildId || numericBranchNumber || Number(userId || 0) <= 0) {
      return;
    }

    function applyCanonicalProjectFiles(payload: unknown) {
      const update = resolveBuildProjectFilesSocketUpdate(payload);
      if (!update || update.buildId !== currentBuildId || cancelled) return;
      setBuild((currentBuild: any) => {
        if (
          !currentBuild ||
          Number(currentBuild.userId || 0) !== Number(userId || 0) ||
          Number(currentBuild.contributionRootBuildId || 0) > 0
        ) {
          return currentBuild;
        }
        const applied = applyBuildProjectFilesSocketUpdate({
          currentBuild,
          currentEventTimeMs: lastCanonicalProjectFilesEventTimeMsRef.current,
          update
        });
        lastCanonicalProjectFilesEventTimeMsRef.current = applied.eventTimeMs;
        return applied.build;
      });
    }

    async function refreshCanonicalProjectFiles() {
      const canonicalReadStartedAtMs = Date.now();
      try {
        const data = await loadBuild(currentBuildId, { fromWriter: true });
        if (
          cancelled ||
          !data?.build ||
          Number(data.build.userId || 0) !== Number(userId || 0) ||
          Number(data.build.contributionRootBuildId || 0) > 0
        ) {
          return;
        }
        applyCanonicalProjectFiles({
          buildId: currentBuildId,
          build: data.build,
          projectFiles: Array.isArray(data.projectFiles)
            ? data.projectFiles
            : [],
          filesHash: data.projectFilesHash,
          source: 'canonical_refresh',
          eventTimeMs: canonicalReadStartedAtMs
        });
      } catch (error) {
        console.error('Failed to refresh canonical project files:', error);
      }
    }

    function recoverCanonicalProjectFiles() {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }
      void refreshCanonicalProjectFiles();
    }

    socket.on('build_project_files_updated', applyCanonicalProjectFiles);
    socket.on('connect', recoverCanonicalProjectFiles);
    window.addEventListener('pageshow', recoverCanonicalProjectFiles);
    window.addEventListener('online', recoverCanonicalProjectFiles);
    document.addEventListener('visibilitychange', recoverCanonicalProjectFiles);
    return () => {
      cancelled = true;
      socket.off('build_project_files_updated', applyCanonicalProjectFiles);
      socket.off('connect', recoverCanonicalProjectFiles);
      window.removeEventListener('pageshow', recoverCanonicalProjectFiles);
      window.removeEventListener('online', recoverCanonicalProjectFiles);
      document.removeEventListener(
        'visibilitychange',
        recoverCanonicalProjectFiles
      );
    };
    // loadBuild is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericBranchNumber, numericBuildId, userId]);

  useEffect(() => {
    let cancelled = false;
    const workspaceBuildId = Number(build?.id || 0);
    const canonicalBuildId =
      Number(build?.contributionRootBuildId || 0) || workspaceBuildId;
    if (!workspaceBuildId || !canonicalBuildId || Number(userId || 0) <= 0) {
      return;
    }

    async function refreshProjectLimits(payload: any) {
      if (cancelled || Number(payload?.buildId || 0) !== canonicalBuildId) {
        return;
      }
      try {
        const data = numericBranchNumber
          ? await loadBuildBranch({
              buildId: canonicalBuildId,
              branchNumber: numericBranchNumber,
              options: { fromWriter: true }
            })
          : await loadBuild(workspaceBuildId, { fromWriter: true });
        if (cancelled || !data?.build) return;
        const nextPolicy = data.copilotPolicy || null;
        applyCanonicalCopilotPolicy(nextPolicy);
      } catch (error) {
        console.error('Failed to refresh approved project limits:', error);
      }
    }

    function recoverProjectLimits() {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }
      void refreshProjectLimits({ buildId: canonicalBuildId });
    }

    socket.on('build_project_limits_updated', refreshProjectLimits);
    socket.on('connect', recoverProjectLimits);
    window.addEventListener('pageshow', recoverProjectLimits);
    window.addEventListener('online', recoverProjectLimits);
    document.addEventListener('visibilitychange', recoverProjectLimits);
    return () => {
      cancelled = true;
      socket.off('build_project_limits_updated', refreshProjectLimits);
      socket.off('connect', recoverProjectLimits);
      window.removeEventListener('pageshow', recoverProjectLimits);
      window.removeEventListener('online', recoverProjectLimits);
      document.removeEventListener('visibilitychange', recoverProjectLimits);
    };
    // loadBuild and loadBuildBranch are stable context request helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build?.contributionRootBuildId, build?.id, numericBranchNumber, userId]);

  useEffect(() => {
    const workspaceBuildId = Number(build?.id || numericBuildId || 0);
    if (!workspaceBuildId || !build) return;
    if (Number(userId) <= 0 || Number(build.userId) !== Number(userId)) return;
    if (
      cachedWorkspace &&
      cachedWorkspace.build === build &&
      cachedWorkspace.chatMessages === chatMessages &&
      cachedWorkspace.copilotPolicy === copilotPolicy
    ) {
      return;
    }
    onSetBuildWorkspace({
      buildId: workspaceBuildId,
      build,
      chatMessages,
      copilotPolicy
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, chatMessages, copilotPolicy, numericBuildId, userId]);

  if (!numericBuildId) {
    return (
      <Unavailable
        title="Not Found"
        text="Invalid build ID"
        onBack={() => navigate('/build')}
      />
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (!build) {
    const showLoginForPrivateBranch =
      error === BUILD_PRIVATE_BRANCH_TEXT && !userId;
    return (
      <Unavailable
        title={
          error === BUILD_UNPUBLISHED_PUBLIC_TEXT
            ? 'Project Not Published Yet'
            : error === BUILD_PRIVATE_BRANCH_TEXT
              ? 'For Team Members Only'
              : 'Workspace Unavailable'
        }
        text={error || 'Build not found'}
        onBack={() =>
          showLoginForPrivateBranch ? onOpenSigninModal() : navigate('/build')
        }
        buttonLabel={
          showLoginForPrivateBranch
            ? 'Log In'
            : error === BUILD_UNPUBLISHED_PUBLIC_TEXT ||
                error === BUILD_PRIVATE_BRANCH_TEXT
              ? 'Build Menu'
              : undefined
        }
        buttonIcon={showLoginForPrivateBranch ? 'sign-in-alt' : undefined}
      />
    );
  }

  const isOwner = Number(userId) > 0 && Number(userId) === Number(build.userId);

  return (
    <BuildEditor
      build={build}
      chatMessages={chatMessages}
      copilotPolicy={copilotPolicy}
      isOwner={isOwner}
      initialPrompt={initialPrompt}
      initialPromptContext={initialPromptContext}
      forceInitialPrompt={forceInitialPrompt}
      seedGreeting={seedGreeting}
      onUpdateBuild={setBuild}
      onUpdateChatMessages={setChatMessages}
      onUpdateCopilotPolicy={applyCanonicalCopilotPolicy}
    />
  );
}

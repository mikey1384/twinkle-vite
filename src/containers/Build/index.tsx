import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation
} from 'react-router-dom';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import BuildEditor from './Editor';
import BuildList from './List';
import New from './New';
import { getBuildWorkspacePath } from '~/domains/Build/navigation';
import Unavailable from './Unavailable';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
import { normalizeBuildResumeRunState } from '~/contexts/Build/resumeRunState';
import { hydrateBuildRunFromPersistedSnapshot } from './domain/persistedRunSnapshot';
import type { BuildCopilotPolicy } from './Editor/types';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';

interface BuildWorkspaceAccessResult {
  kind: 'redirect-runtime' | 'unpublished' | 'branch-private';
  runtimePath?: string;
}

const BUILD_UNPUBLISHED_PUBLIC_TEXT =
  "This project hasn't been published yet, so it can't be opened publicly.";
const BUILD_PRIVATE_BRANCH_TEXT =
  'Branches are only available to project team members. Log in with a team account or ask the project owner for access.';

export default function Build() {
  return (
    <ErrorBoundary componentPath="Build">
      <div
        className={css`
          height: 100%;
          min-height: 0;
        `}
      >
        <Routes>
          <Route path="/" element={<BuildList />} />
          <Route path="/new" element={<New />} />
          <Route path="/:buildId/:branchNumber" element={<BuildEditorWrapper />} />
          <Route path="/:buildId" element={<BuildEditorWrapper />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

function BuildEditorWrapper() {
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
  const activeBuildRun = useBuildContext((v) =>
    numericBuildId && !numericBranchNumber
      ? v.state.buildRuns[String(numericBuildId)] || null
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
  const [copilotPolicy, setCopilotPolicy] =
    useState<BuildCopilotPolicy | null>(
      usableCachedWorkspace?.copilotPolicy || null
    );
  const [error, setError] = useState('');
  const replayedPersistedRunStateKeysRef = useRef<Record<string, string>>({});

  const locationState = (location.state as any) || null;
  const seedGreeting = Boolean(locationState?.seedGreeting);
  const skipDefaultContributionBranchRedirect = Boolean(
    locationState?.skipDefaultContributionBranchRedirect
  );
  const initialPrompt =
    typeof locationState?.initialPrompt === 'string'
      ? locationState.initialPrompt
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
      setCopilotPolicy(usableCachedWorkspace.copilotPolicy || null);
      setLoading(false);
      return;
    }
    setBuild(null);
    setChatMessages([]);
    setCopilotPolicy(null);
    setLoading(true);
  }, [numericBuildId, numericBranchNumber, usableCachedWorkspace]);

  useEffect(() => {
    let cancelled = false;
    if (numericBuildId) void handleLoad();
    return () => {
      cancelled = true;
    };

    async function handleLoad() {
      if (!usableCachedWorkspace?.build) {
        setLoading(true);
      }
      try {
        const shouldReadFromWriter = Boolean(
          numericBranchNumber ||
            initialPrompt ||
            seedGreeting ||
            activeBuildRun?.generating ||
            activeBuildRun?.terminalState
        );
        const data = numericBranchNumber
          ? await loadBuildBranch({
              buildId: numericBuildId,
              branchNumber: numericBranchNumber,
              options: { fromWriter: shouldReadFromWriter }
            })
          : await loadBuild(numericBuildId, {
              fromWriter: shouldReadFromWriter
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
          setCopilotPolicy(null);
          setError(BUILD_UNPUBLISHED_PUBLIC_TEXT);
          return;
        }
        if (access?.kind === 'branch-private') {
          setBuild(null);
          setChatMessages([]);
          setCopilotPolicy(null);
          setError(BUILD_PRIVATE_BRANCH_TEXT);
          return;
        }
        if (data?.build) {
          if (
            !numericBranchNumber &&
            Number(data.build.contributionRootBuildId || 0) > 0 &&
            Number(data.build.contributionBranchNumber || 0) > 0
          ) {
            navigate(getBuildWorkspacePath(data.build), {
              replace: true,
              state: location.state
            });
            return;
          }
          const currentUserId = Number(userId) || 0;
          const shouldOpenDefaultContributionBranch =
            !numericBranchNumber &&
            !skipDefaultContributionBranchRedirect &&
            currentUserId > 0 &&
            Number(data.build.userId || 0) !== currentUserId &&
            Number(data.build.contributionRootBuildId || 0) === 0 &&
            Number(data.build.contributionBranchNumber || 0) === 0 &&
            Boolean(data.build.canOpenContributionWorkspace) &&
            Boolean(data.build.hasActiveContributionInvite);
          if (shouldOpenDefaultContributionBranch) {
            const defaultBranchResult =
              await ensureDefaultBuildContributionBranch(
                Number(data.build.id || numericBuildId)
              );
            if (cancelled) return;
            if (defaultBranchResult?.build) {
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
            projectFiles: nextProjectFiles
          };
          const nextChatMessages = data.chatMessages || [];
          const nextCopilotPolicy = data.copilotPolicy || null;
          const nextActiveRun = data.activeRun || null;
          const latestActiveBuildRun = getLatestBuildRun(
            Number(nextBuild.id || numericBuildId)
          );
          setBuild(nextBuild);
          setChatMessages(nextChatMessages);
          setCopilotPolicy(nextCopilotPolicy);
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
            const normalizedActiveRun = normalizeBuildResumeRunState(nextActiveRun);
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
            setCopilotPolicy(null);
          }
          setError('Build not found');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load build:', err);
        if (!usableCachedWorkspace?.build) {
          setBuild(null);
          setChatMessages([]);
          setCopilotPolicy(null);
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
      forceInitialPrompt={forceInitialPrompt}
      seedGreeting={seedGreeting}
      onUpdateBuild={setBuild}
      onUpdateChatMessages={setChatMessages}
      onUpdateCopilotPolicy={setCopilotPolicy}
    />
  );
}

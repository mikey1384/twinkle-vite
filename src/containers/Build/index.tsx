import React, { useEffect, useMemo, useState } from 'react';
import {
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation
} from 'react-router-dom';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import BuildEditor from './BuildEditor';
import BuildList from './BuildList';
import Icon from '~/components/Icon';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
    maxPublishedBuildStorageBytes: number;
    maxRuntimeFileStorageBytes: number;
    maxRuntimeFileBytes: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    publishedBuildStorageBytes: number;
    publishedBuildStorageRemaining: number;
    publishedBuildCount: number;
    runtimeFileStorageBytes: number;
    runtimeFileStorageRemaining: number;
    runtimeFileCount: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    generationBaseRequestsPerDay: number;
    generationResetPurchasesToday: number;
    generationResetCost: number;
    generationRequestsPerDay: number;
    generationRequestsToday: number;
    generationRequestsRemaining: number;
  };
}

interface BuildWorkspaceAccessResult {
  kind: 'redirect-runtime' | 'unpublished';
  runtimePath?: string;
}

const BUILD_UNPUBLISHED_PUBLIC_TEXT =
  "This project hasn't been published yet, so it can't be opened publicly.";

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
          <Route path="/new" element={<NewBuild />} />
          <Route path="/:buildId" element={<BuildEditorWrapper />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

function NewBuild() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  if (!userId) {
    return <InvalidPage text="Please log in to create a build" />;
  }

  async function handleCreate() {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const { build } = await createBuild({
        title: title.trim()
      });
      if (build?.id) {
        navigate(`/build/${build.id}`, {
          replace: true,
          state: { seedGreeting: true }
        });
      }
    } catch (error) {
      console.error('Failed to create build:', error);
      setCreating(false);
    }
  }

  function handleBack() {
    navigate('/build');
  }

  return (
    <div
      className={css`
        width: 100%;
        max-width: 720px;
        margin: 3rem auto;
        padding: 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
    >
      <div
        className={css`
          position: relative;
          padding: 2.2rem;
          border-radius: 22px;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.6rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              padding: 0.45rem 1rem;
              border-radius: 999px;
              background: rgba(65, 140, 235, 0.14);
              color: #1d4ed8;
              border: 1px solid rgba(65, 140, 235, 0.28);
              font-weight: 900;
              font-size: 0.95rem;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-family: ${displayFontFamily};
            `}
          >
            <Icon icon="sparkles" />
            New Build
          </span>
          <h1
            className={css`
              margin: 0;
              font-size: 2.8rem;
              font-weight: 900;
              line-height: 1.1;
              color: var(--chat-text);
              font-family: ${displayFontFamily};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2.3rem;
              }
            `}
          >
            Create a New Build
          </h1>
          <p
            className={css`
              margin: 0;
              font-size: 1.18rem;
              color: var(--chat-text);
              opacity: 0.8;
              max-width: 34rem;
              line-height: 1.6;
            `}
          >
            Give your project a name so Build Studio can start scaffolding your
            app.
          </p>
        </div>
      </div>
      <div
        className={css`
          margin-top: 1.8rem;
          background: #fff;
          border-radius: ${borderRadius};
          border: 1px solid var(--ui-border);
          padding: 1.6rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        `}
      >
        <label
          htmlFor="build-title"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 700,
            color: 'var(--chat-text)'
          }}
        >
          Title
        </label>
        <input
          id="build-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My awesome app"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
          className={css`
            width: 100%;
            padding: 0.9rem 1rem;
            font-size: 1.05rem;
            border: 1px solid rgba(65, 140, 235, 0.26);
            border-radius: ${borderRadius};
            background: #fff;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            &:focus {
              outline: none;
              border-color: #418CEB;
              box-shadow: 0 0 0 2px rgba(65, 140, 235, 0.12);
            }
          `}
        />
        <div
          className={css`
            margin-top: 1.4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          `}
        >
          <GameCTAButton
            variant="neutral"
            size="lg"
            icon="arrow-left"
            onClick={handleBack}
          >
            Build Studio
          </GameCTAButton>
          <GameCTAButton
            variant="primary"
            size="lg"
            shiny
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            loading={creating}
          >
            {creating ? 'Creating...' : 'Create Build'}
          </GameCTAButton>
        </div>
      </div>
    </div>
  );
}

function BuildEditorWrapper() {
  const { buildId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return isNaN(id) ? null : id;
  }, [buildId]);
  const cachedWorkspace = useBuildContext((v) =>
    numericBuildId ? v.state.buildWorkspaces[String(numericBuildId)] || null : null
  );
  const activeBuildRun = useBuildContext((v) =>
    numericBuildId ? v.state.buildRuns[String(numericBuildId)] || null : null
  );
  const onSetBuildWorkspace = useBuildContext(
    (v) => v.actions.onSetBuildWorkspace
  );
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

  const locationState = (location.state as any) || null;
  const seedGreeting = Boolean(locationState?.seedGreeting);
  const initialPrompt =
    typeof locationState?.initialPrompt === 'string'
      ? locationState.initialPrompt
      : '';

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
  }, [numericBuildId, usableCachedWorkspace]);

  useEffect(() => {
    let cancelled = false;
    if (numericBuildId) void handleLoad();
    return () => {
      cancelled = true;
    };

    async function handleLoad() {
      if (activeBuildRun?.generating && usableCachedWorkspace?.build) {
        setLoading(false);
        return;
      }
      if (!usableCachedWorkspace?.build) {
        setLoading(true);
      }
      try {
        const data = await loadBuild(numericBuildId, {
          fromWriter: Boolean(initialPrompt || seedGreeting)
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
        if (data?.build) {
          const nextBuild = {
            ...data.build,
            executionPlan: data.executionPlan || null,
            followUpPrompt: data.followUpPrompt || null,
            projectManifest: data.projectManifest || null,
            capabilitySnapshot: data.capabilitySnapshot || null,
            projectFiles: Array.isArray(data.projectFiles)
              ? data.projectFiles
              : []
          };
          const nextChatMessages = data.chatMessages || [];
          const nextCopilotPolicy = data.copilotPolicy || null;
          setBuild(nextBuild);
          setChatMessages(nextChatMessages);
          setCopilotPolicy(nextCopilotPolicy);
          setError('');
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
    activeBuildRun?.generating,
    initialPrompt,
    location.pathname,
    navigate,
    numericBuildId,
    seedGreeting,
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
      <BuildWorkspaceUnavailable
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
    return (
      <BuildWorkspaceUnavailable
        title={
          error === BUILD_UNPUBLISHED_PUBLIC_TEXT
            ? 'Project Not Published Yet'
            : 'Workspace Unavailable'
        }
        text={error || 'Build not found'}
        onBack={() =>
          navigate(
            '/build'
          )
        }
        buttonLabel={
          error === BUILD_UNPUBLISHED_PUBLIC_TEXT
            ? 'Build Menu'
            : undefined
        }
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
      seedGreeting={seedGreeting}
      onUpdateBuild={setBuild}
      onUpdateChatMessages={setChatMessages}
      onUpdateCopilotPolicy={setCopilotPolicy}
    />
  );
}

function BuildWorkspaceUnavailable({
  title,
  text,
  onBack,
  buttonLabel
}: {
  title: string;
  text: string;
  onBack: () => void;
  buttonLabel?: string;
}) {
  return (
    <div
      className={css`
        width: 100%;
        max-width: 720px;
        margin: 3rem auto;
        padding: 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
    >
      <div
        className={css`
          padding: 2rem;
          border-radius: 22px;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        `}
      >
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            background: rgba(245, 158, 11, 0.14);
            color: #b45309;
            border: 1px solid rgba(245, 158, 11, 0.25);
            font-weight: 900;
            font-size: 0.95rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-family: ${displayFontFamily};
          `}
        >
          <Icon icon="triangle-exclamation" />
          Build Workspace
        </span>
        <div>
          <h1
            className={css`
              margin: 0;
              font-size: 2.4rem;
              line-height: 1.1;
              color: var(--chat-text);
              font-family: ${displayFontFamily};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          >
            {title}
          </h1>
          <p
            className={css`
              margin: 0.85rem 0 0;
              font-size: 1.05rem;
              line-height: 1.6;
              color: var(--chat-text);
              opacity: 0.8;
            `}
          >
            {text}
          </p>
        </div>
        <GameCTAButton
          variant="primary"
          size="lg"
          icon="arrow-left"
          onClick={onBack}
        >
          {buttonLabel || 'Back to Build Studio'}
        </GameCTAButton>
      </div>
    </div>
  );
}

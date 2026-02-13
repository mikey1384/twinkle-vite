import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import BuildEditor from './BuildEditor';
import BuildList from './BuildList';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

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

const primaryButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg);
  color: var(--theme-text);
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  &:hover:not(:disabled) {
    background: var(--theme-hover-bg);
    transform: translateY(-1px);
  }
  &:disabled {
    background: var(--theme-disabled-bg);
    border-color: var(--theme-disabled-border);
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

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
      const { build } = await createBuild({ title: title.trim() });
      if (build?.id) {
        navigate(`/build/${build.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to create build:', error);
      setCreating(false);
    }
  }

  return (
    <div
      className={css`
        width: 100%;
        max-width: 680px;
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
              padding: 0.4rem 0.9rem;
              border-radius: 999px;
              background: var(--chat-bg);
              color: var(--theme-bg);
              border: 1px solid var(--ui-border);
              font-weight: 800;
              font-size: 1rem;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            `}
          >
            <Icon icon="sparkles" />
            New Build
          </span>
          <h1
            className={css`
              margin: 0;
              font-size: 2.4rem;
              font-weight: 800;
              color: var(--chat-text);
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          >
            Create a new build
          </h1>
          <p
            className={css`
              margin: 0;
              font-size: 1.2rem;
              color: var(--chat-text);
              opacity: 0.75;
              max-width: 34rem;
              line-height: 1.6;
            `}
          >
            Give your project a name so the Build Studio can start scaffolding
            your app.
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
            padding: 0.85rem 1rem;
            font-size: 1.05rem;
            border: 1px solid var(--ui-border);
            border-radius: ${borderRadius};
            background: #fff;
            transition: border-color 0.2s ease;
            &:focus {
              outline: none;
              border-color: var(--theme-border);
            }
          `}
        />
        <div
          className={css`
            margin-top: 1.4rem;
            display: flex;
            justify-content: flex-end;
          `}
        >
          <button
            className={primaryButtonClass}
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            type="button"
          >
            {creating ? 'Creating...' : 'Create Build'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BuildEditorWrapper() {
  const { buildId } = useParams();
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);

  const [loading, setLoading] = useState(true);
  const [build, setBuild] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [error, setError] = useState('');

  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return isNaN(id) ? null : id;
  }, [buildId]);

  useEffect(() => {
    if (numericBuildId) {
      handleLoad();
    }

    async function handleLoad() {
      setLoading(true);
      try {
        const data = await loadBuild(numericBuildId);
        if (data?.build) {
          setBuild(data.build);
          setChatMessages(data.chatMessages || []);
        } else {
          setError('Build not found');
        }
      } catch (err) {
        console.error('Failed to load build:', err);
        setError('Failed to load build');
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericBuildId]);

  if (!numericBuildId) {
    return <InvalidPage text="Invalid build ID" />;
  }

  if (loading) {
    return <Loading />;
  }

  if (error || !build) {
    return <InvalidPage text={error || 'Build not found'} />;
  }

  const isOwner = userId === build.userId;
  const initialPrompt =
    typeof (location.state as any)?.initialPrompt === 'string'
      ? (location.state as any).initialPrompt
      : '';

  return (
    <BuildEditor
      build={build}
      chatMessages={chatMessages}
      isOwner={isOwner}
      initialPrompt={initialPrompt}
      onUpdateBuild={setBuild}
      onUpdateChatMessages={setChatMessages}
    />
  );
}

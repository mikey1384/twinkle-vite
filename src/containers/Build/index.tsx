import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import BuildEditor from './BuildEditor';
import BuildList from './BuildList';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Build() {
  return (
    <ErrorBoundary componentPath="Build">
      <Routes>
        <Route path="/" element={<BuildList />} />
        <Route path="/new" element={<NewBuild />} />
        <Route path="/:buildId" element={<BuildEditorWrapper />} />
      </Routes>
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
        max-width: 600px;
        margin: 3rem auto;
        padding: 2rem;
      `}
    >
      <h1 style={{ marginBottom: '2rem' }}>Create a New Build</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="build-title"
          style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
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
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={!title.trim() || creating}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: title.trim() && !creating ? '#5BA1F8' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: title.trim() && !creating ? 'pointer' : 'not-allowed'
        }}
      >
        {creating ? 'Creating...' : 'Create Build'}
      </button>
    </div>
  );
}

function BuildEditorWrapper() {
  const { buildId } = useParams();
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

  return (
    <BuildEditor
      build={build}
      chatMessages={chatMessages}
      isOwner={isOwner}
      onUpdateBuild={setBuild}
      onUpdateChatMessages={setChatMessages}
    />
  );
}

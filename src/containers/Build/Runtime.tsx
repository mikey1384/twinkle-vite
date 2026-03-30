import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import PreviewPanel from './PreviewPanel';
import type { BuildCapabilitySnapshot } from './capabilityTypes';

interface RuntimeBuild {
  id: number;
  userId: number;
  username: string;
  title: string;
  description: string | null;
  code: string | null;
  primaryArtifactId?: number | null;
  isPublic: boolean;
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

const shellClass = css`
  width: 100%;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  background: var(--page-bg);
`;

const headerClass = css`
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  padding: 1.1rem 1.3rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.95rem 1rem 0.9rem;
  }
`;

const titleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  color: var(--chat-text);
`;

const titleClass = css`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const metaClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--chat-text);
  opacity: 0.72;
  flex-wrap: wrap;
`;

const panelWrapClass = css`
  min-height: 0;
  overflow: hidden;
  padding: 0;
`;

const previewShellClass = css`
  height: 100%;
  min-height: 0;
  display: grid;
  overflow: hidden;
  background: #fff;
`;

export default function BuildRuntime() {
  const { buildId } = useParams();
  const loadRuntimeBuild = useAppContext((v) => v.requestHelpers.loadRuntimeBuild);
  const userId = useKeyContext((v) => v.myState.userId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [build, setBuild] = useState<RuntimeBuild | null>(null);

  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return Number.isNaN(id) ? null : id;
  }, [buildId]);

  useEffect(() => {
    if (!numericBuildId) return;
    void handleLoad();

    async function handleLoad() {
      setLoading(true);
      setError('');
      try {
        const data = await loadRuntimeBuild(numericBuildId);
        if (data?.build) {
          setBuild({
            ...data.build,
            capabilitySnapshot: data.capabilitySnapshot || null,
            projectFiles: Array.isArray(data.projectFiles) ? data.projectFiles : []
          });
        } else {
          setError('Build not found');
        }
      } catch (error: any) {
        console.error('Failed to load runtime build:', error);
        setError(error?.message || 'Failed to load app');
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericBuildId, userId]);

  if (!numericBuildId) {
    return <InvalidPage text="Invalid build ID" />;
  }

  if (loading) {
    return <Loading />;
  }

  if (!build || error) {
    return <InvalidPage text={error || 'Build not found'} />;
  }

  return (
    <ErrorBoundary componentPath="Build/Runtime">
      <div className={shellClass}>
        <div className={headerClass}>
          <div className={titleRowClass}>
            <Icon icon="laptop-code" />
            <h1 className={titleClass}>{build.title}</h1>
          </div>
          <div className={metaClass}>
            <span>by {build.username}</span>
            {build.description?.trim() ? <span>{build.description.trim()}</span> : null}
          </div>
        </div>
        <div className={panelWrapClass}>
          <div className={previewShellClass}>
            <PreviewPanel
              build={build}
              code={build.code}
              projectFiles={build.projectFiles || []}
              isOwner={false}
              runtimeOnly
              capabilitySnapshot={build.capabilitySnapshot || null}
              onReplaceCode={() => {}}
              onApplyRestoredProjectFiles={() => {}}
              onSaveProjectFiles={async () => ({ success: false })}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

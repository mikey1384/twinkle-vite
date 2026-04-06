import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  background: #fff;
  @supports (height: 100dvh) {
    height: 100dvh;
    min-height: 100dvh;
  }
`;

const headerClass = css`
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  padding: 1.1rem 1.3rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: calc(env(safe-area-inset-top, 0px) + 0.8rem) 0.95rem 0.75rem;
    gap: 0.3rem;
  }
`;

const headerTopRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const titleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
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
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.05rem;
  }
`;

const metaClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--chat-text);
  opacity: 0.72;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.82rem;
    gap: 0.35rem;
  }
`;

const metaDescriptionClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const backButtonClass = css`
  border: 1px solid var(--ui-border);
  background: rgba(65, 140, 235, 0.08);
  color: var(--chat-text);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: rgba(65, 140, 235, 0.14);
    border-color: rgba(65, 140, 235, 0.24);
    transform: translateY(-1px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.48rem 0.72rem;
    font-size: 0.8rem;
    max-width: 46vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }
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
  const navigate = useNavigate();
  const location = useLocation();
  const loadRuntimeBuild = useAppContext((v) => v.requestHelpers.loadRuntimeBuild);
  const userId = useKeyContext((v) => v.myState.userId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [build, setBuild] = useState<RuntimeBuild | null>(null);

  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return Number.isNaN(id) ? null : id;
  }, [buildId]);
  const canUseHistoryBack =
    typeof window !== 'undefined' &&
    Number.isFinite(Number(window.history.state?.idx)) &&
    Number(window.history.state?.idx) > 0;
  const isEmbedded = useMemo(() => {
    return new URLSearchParams(location.search).get('embedded') === '1';
  }, [location.search]);
  const backTo = useMemo(() => {
    return typeof location.state?.runtimeBackTo === 'string'
      ? location.state.runtimeBackTo
      : '/';
  }, [location.state]);
  const backLabel = useMemo(() => {
    return typeof location.state?.runtimeBackLabel === 'string'
      ? location.state.runtimeBackLabel
      : canUseHistoryBack
        ? 'Go back'
        : 'Back to Twinkle';
  }, [canUseHistoryBack, location.state]);

  function handleBack() {
    if (canUseHistoryBack) {
      navigate(-1);
      return;
    }
    navigate(backTo, { replace: true });
  }

  function handleGoToBuildMenu() {
    navigate('/build');
  }

  function renderRuntimeUnavailable({
    title,
    text
  }: {
    title?: string;
    text: string;
  }) {
    return (
      <ErrorBoundary componentPath="Build/Runtime">
        <div
          className={shellClass}
          style={{ gridTemplateRows: isEmbedded ? '1fr' : undefined }}
        >
          {!isEmbedded && (
            <div className={headerClass}>
              <div className={headerTopRowClass}>
                <button
                  type="button"
                  className={backButtonClass}
                  onClick={handleBack}
                >
                  <Icon icon="arrow-left" />
                  <span>{backLabel}</span>
                </button>
                <button
                  type="button"
                  className={backButtonClass}
                  onClick={handleGoToBuildMenu}
                  title="Go to build main menu"
                >
                  <Icon icon="rocket-launch" />
                  <span>Build Menu</span>
                </button>
              </div>
              <div className={titleRowClass}>
                <Icon icon="laptop-code" />
                <h1 className={titleClass}>Build App</h1>
              </div>
            </div>
          )}
          <div className={panelWrapClass}>
            <InvalidPage
              title={title}
              text={text}
              style={{ paddingTop: isEmbedded ? '6rem' : '12rem' }}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

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
    return renderRuntimeUnavailable({
      text: 'Invalid build ID'
    });
  }

  if (loading) {
    return <Loading />;
  }

  if (!build || error) {
    return renderRuntimeUnavailable({
      text: error || 'Build not found'
    });
  }

  return (
    <ErrorBoundary componentPath="Build/Runtime">
      <div
        className={shellClass}
        style={{ gridTemplateRows: isEmbedded ? '1fr' : undefined }}
      >
        {!isEmbedded && (
          <div className={headerClass}>
            <div className={headerTopRowClass}>
              <button
                type="button"
                className={backButtonClass}
                onClick={handleBack}
              >
                <Icon icon="arrow-left" />
                <span>{backLabel}</span>
              </button>
              <button
                type="button"
                className={backButtonClass}
                onClick={handleGoToBuildMenu}
                title="Go to build main menu"
              >
                <Icon icon="rocket-launch" />
                <span>Build Menu</span>
              </button>
            </div>
            <div className={titleRowClass}>
              <Icon icon="laptop-code" />
              <h1 className={titleClass}>{build.title}</h1>
            </div>
            <div className={metaClass}>
              <span>by {build.username}</span>
              {build.description?.trim() ? (
                <span className={metaDescriptionClass}>
                  {build.description.trim()}
                </span>
              ) : null}
            </div>
          </div>
        )}
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

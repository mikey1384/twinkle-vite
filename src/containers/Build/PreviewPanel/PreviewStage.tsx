import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import {
  BUILD_APP_IFRAME_ALLOW,
  BUILD_APP_PREVIEW_IFRAME_SANDBOX
} from '~/helpers/buildIframePermissions';
import { buildPreviewFrameWindowName } from '~/helpers/buildPreviewOriginHelpers';
import type { BuildRuntimeObservationIssue } from '../types/runtimeObservationTypes';
import type { PreviewFrameMeta } from './types';
import {
  getRuntimeIssueLocationText,
  getRuntimePreviewIframeSandbox
} from './helpers/previewHelpers';

type PreviewFrameKey = 'primary' | 'secondary';

const previewStageClass = css`
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
`;

const previewPreloadSurfaceClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  background: #fafbff;
  color: var(--chat-text);
  z-index: 1;
`;

const previewPreloadIconWrapClass = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const previewPreloadLabelClass = css`
  font-size: 1.1rem;
  font-weight: 700;
  opacity: 0.82;
`;

const previewIframeClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  transition: opacity 0.18s ease;
`;

const previewLoadingOverlayClass = css`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 700;
  z-index: 4;
  backdrop-filter: blur(1px);
`;

const previewRuntimeIssuePanelClass = css`
  position: absolute;
  left: 0.9rem;
  right: 0.9rem;
  bottom: 0.9rem;
  max-width: 44rem;
  max-height: min(48%, 22rem);
  overflow: auto;
  border: 1px solid rgba(248, 113, 113, 0.42);
  border-radius: 10px;
  background: rgba(127, 29, 29, 0.92);
  color: #fee2e2;
  z-index: 5;
  padding: 0.7rem 0.78rem;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.28);
  font-size: 1.1rem;
  line-height: 1.42;
  backdrop-filter: blur(2px);
`;

const previewRuntimeIssueHeaderClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 900;
  margin-bottom: 0.35rem;
`;

const previewRuntimeIssueMetaClass = css`
  margin-top: 0.42rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  color: #fecaca;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 1.1rem;
`;

const previewRuntimeIssueOpenButtonClass = css`
  border: 1px solid rgba(254, 226, 226, 0.42);
  border-radius: 999px;
  background: rgba(254, 226, 226, 0.14);
  color: #fff7ed;
  padding: 0.24rem 0.55rem;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  &:hover {
    background: rgba(254, 226, 226, 0.22);
  }
`;

const previewRuntimeIssueStackClass = css`
  margin: 0.5rem 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #fecaca;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 1.1rem;
`;

const previewSpinnerClass = css`
  animation: previewSpin 0.9s linear infinite;
  @keyframes previewSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const emptyPreviewClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text);
  text-align: center;
  padding: 2rem;
  background: #fff;
`;

const emptyPreviewIconStyle: React.CSSProperties = {
  marginBottom: '1rem',
  opacity: 0.6
};

const emptyPreviewTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.1rem'
};

const emptyPreviewBodyStyle: React.CSSProperties = {
  margin: '0.5rem 0 0 0',
  fontSize: '1.1rem',
  color: 'var(--chat-text)',
  opacity: 0.6
};

export default function PreviewStage({
  activePreviewFrame,
  codeWorkspaceAvailable,
  isOwner,
  latestRuntimeObservationIssue,
  latestRuntimeObservationProjectFilePath,
  latestRuntimeObservationStackPreview,
  previewFrameMetaRef,
  previewFrameReady,
  previewFrameSources,
  previewTransitioning,
  primaryIframeRef,
  runtimePreviewFrameNonce,
  runtimePreviewFrameSrc,
  secondaryIframeRef,
  shouldMountRuntimePreviewFrame,
  shouldShowRuntimePreviewStage,
  shouldShowWorkspacePreviewStage,
  variant,
  onOpenRuntimeIssueProjectFile,
  onPreviewFrameLoad
}: {
  activePreviewFrame: PreviewFrameKey;
  codeWorkspaceAvailable: boolean;
  isOwner: boolean;
  latestRuntimeObservationIssue: BuildRuntimeObservationIssue | null;
  latestRuntimeObservationProjectFilePath: string | null;
  latestRuntimeObservationStackPreview: string;
  previewFrameMetaRef: React.MutableRefObject<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>;
  previewFrameReady: Record<PreviewFrameKey, boolean>;
  previewFrameSources: Record<PreviewFrameKey, string | null>;
  previewTransitioning: boolean;
  primaryIframeRef: React.RefObject<HTMLIFrameElement | null>;
  runtimePreviewFrameNonce: string | null;
  runtimePreviewFrameSrc: string | null;
  secondaryIframeRef: React.RefObject<HTMLIFrameElement | null>;
  shouldMountRuntimePreviewFrame: boolean;
  shouldShowRuntimePreviewStage: boolean;
  shouldShowWorkspacePreviewStage: boolean;
  variant: 'runtime' | 'workspace';
  onOpenRuntimeIssueProjectFile: (path: string) => void;
  onPreviewFrameLoad: (frame: PreviewFrameKey, src: string) => void;
}) {
  if (variant === 'runtime') {
    if (!shouldShowRuntimePreviewStage) {
      return <EmptyPreviewState body="This build has no code yet" />;
    }
    return (
      <div className={previewStageClass}>
        {(!shouldMountRuntimePreviewFrame || !previewFrameReady.primary) && (
          <PreviewLoadingSurface />
        )}
        {shouldMountRuntimePreviewFrame && runtimePreviewFrameSrc ? (
          <iframe
            key={runtimePreviewFrameNonce || 'primary'}
            ref={primaryIframeRef}
            src={runtimePreviewFrameSrc}
            title="App preview"
            name={buildPreviewFrameWindowName(runtimePreviewFrameNonce)}
            allow={BUILD_APP_IFRAME_ALLOW}
            allowFullScreen
            sandbox={getRuntimePreviewIframeSandbox(runtimePreviewFrameSrc)}
            onLoad={() =>
              onPreviewFrameLoad('primary', runtimePreviewFrameSrc)
            }
            className={previewIframeClass}
            style={{
              opacity: previewFrameReady.primary ? 1 : 0,
              pointerEvents: previewFrameReady.primary ? 'auto' : 'none'
            }}
          />
        ) : null}
      </div>
    );
  }

  if (!shouldShowWorkspacePreviewStage) {
    return (
      <EmptyPreviewState
        body={
          isOwner
            ? 'Use the chat to describe what you want to build'
            : 'This build has no code yet'
        }
      />
    );
  }
  return (
    <div className={previewStageClass}>
      {!previewFrameReady[activePreviewFrame] && <PreviewLoadingSurface />}
      {previewFrameSources.primary && (
        <iframe
          key={
            previewFrameMetaRef.current.primary.messageNonce ||
            previewFrameSources.primary ||
            'primary'
          }
          ref={primaryIframeRef}
          src={previewFrameSources.primary}
          title="Preview (primary)"
          name={buildPreviewFrameWindowName(
            previewFrameMetaRef.current.primary.messageNonce
          )}
          allow={BUILD_APP_IFRAME_ALLOW}
          allowFullScreen
          sandbox={BUILD_APP_PREVIEW_IFRAME_SANDBOX}
          onLoad={() =>
            onPreviewFrameLoad('primary', previewFrameSources.primary || '')
          }
          className={previewIframeClass}
          style={{
            opacity:
              activePreviewFrame === 'primary' && previewFrameReady.primary
                ? 1
                : 0,
            pointerEvents:
              activePreviewFrame === 'primary' && previewFrameReady.primary
                ? 'auto'
                : 'none'
          }}
        />
      )}
      {previewFrameSources.secondary && (
        <iframe
          key={
            previewFrameMetaRef.current.secondary.messageNonce ||
            previewFrameSources.secondary ||
            'secondary'
          }
          ref={secondaryIframeRef}
          src={previewFrameSources.secondary}
          title="Preview (secondary)"
          name={buildPreviewFrameWindowName(
            previewFrameMetaRef.current.secondary.messageNonce
          )}
          allow={BUILD_APP_IFRAME_ALLOW}
          allowFullScreen
          sandbox={BUILD_APP_PREVIEW_IFRAME_SANDBOX}
          onLoad={() =>
            onPreviewFrameLoad(
              'secondary',
              previewFrameSources.secondary || ''
            )
          }
          className={previewIframeClass}
          style={{
            opacity:
              activePreviewFrame === 'secondary' && previewFrameReady.secondary
                ? 1
                : 0,
            pointerEvents:
              activePreviewFrame === 'secondary' && previewFrameReady.secondary
                ? 'auto'
                : 'none'
          }}
        />
      )}
      {isOwner && latestRuntimeObservationIssue && (
        <RuntimeIssuePanel
          codeWorkspaceAvailable={codeWorkspaceAvailable}
          issue={latestRuntimeObservationIssue}
          projectFilePath={latestRuntimeObservationProjectFilePath}
          stackPreview={latestRuntimeObservationStackPreview}
          onOpenProjectFile={onOpenRuntimeIssueProjectFile}
        />
      )}
      {previewTransitioning && (
        <div className={previewLoadingOverlayClass}>
          <Icon icon="spinner" className={previewSpinnerClass} />
          Updating preview
        </div>
      )}
    </div>
  );
}

function PreviewLoadingSurface() {
  return (
    <div className={previewPreloadSurfaceClass}>
      <div className={previewPreloadIconWrapClass}>
        <Icon icon="spinner" className={previewSpinnerClass} />
      </div>
      <div className={previewPreloadLabelClass}>Loading...</div>
    </div>
  );
}

function EmptyPreviewState({ body }: { body: string }) {
  return (
    <div className={emptyPreviewClass}>
      <Icon icon="laptop-code" size="3x" style={emptyPreviewIconStyle} />
      <p style={emptyPreviewTitleStyle}>No preview available yet</p>
      <p style={emptyPreviewBodyStyle}>{body}</p>
    </div>
  );
}

function RuntimeIssuePanel({
  codeWorkspaceAvailable,
  issue,
  projectFilePath,
  stackPreview,
  onOpenProjectFile
}: {
  codeWorkspaceAvailable: boolean;
  issue: BuildRuntimeObservationIssue;
  projectFilePath: string | null;
  stackPreview: string;
  onOpenProjectFile: (path: string) => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="build-preview-runtime-error"
      data-agent-status="preview-error"
      className={previewRuntimeIssuePanelClass}
    >
      <div className={previewRuntimeIssueHeaderClass}>
        <Icon icon="exclamation-triangle" />
        <span>Preview error</span>
      </div>
      <div>{issue.message}</div>
      <div className={previewRuntimeIssueMetaClass}>
        <span>
          {getRuntimeIssueLocationText({
            issue,
            projectFilePath
          })}
        </span>
        {projectFilePath && codeWorkspaceAvailable ? (
          <button
            type="button"
            onClick={() => onOpenProjectFile(projectFilePath)}
            className={previewRuntimeIssueOpenButtonClass}
          >
            <Icon icon="code" />
            <span>Open source</span>
          </button>
        ) : null}
      </div>
      {stackPreview ? (
        <pre className={previewRuntimeIssueStackClass}>{stackPreview}</pre>
      ) : null}
    </div>
  );
}

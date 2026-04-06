import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import PreviewPanel from './PreviewPanel';
import { useAppContext } from '~/contexts';

const shellClass = css`
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: #fff;
  @supports (height: 100dvh) {
    min-height: 100dvh;
    height: 100dvh;
  }
`;

const panelClass = css`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  overflow: hidden;
  background: #fff;
`;

function parseOptionalViewerId(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function BuildThumbnailCaptureHost() {
  const { buildId } = useParams();
  const location = useLocation();
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [captureReady, setCaptureReady] = useState(false);
  const [captureMeaningfulRender, setCaptureMeaningfulRender] = useState(false);
  const [payload, setPayload] = useState<{
    build: any;
    capabilitySnapshot: any;
    projectFiles: Array<{ path: string; content?: string }>;
  } | null>(null);

  const numericBuildId = useMemo(() => {
    const parsed = Number(buildId);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  }, [buildId]);
  const [captureBootstrap] = useState(() => {
    const hashParams = new URLSearchParams(
      String(window.location.hash || '').replace(/^#/, '')
    );
    return {
      authToken: String(hashParams.get('authToken') || '').trim() || null,
      viewerOverride: {
        id: parseOptionalViewerId(hashParams.get('viewerId')),
        username:
          String(hashParams.get('viewerUsername') || '').trim() || null,
        profilePicUrl:
          String(hashParams.get('viewerProfilePicUrl') || '').trim() || null
      }
    };
  });

  const previewPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const path = String(params.get('previewPath') || '').trim();
    return path.startsWith('/build/preview/') ? path : '';
  }, [location.search]);

  useEffect(() => {
    const root = document.documentElement;
    const win = window as any;
    win.__TWINKLE_CAPTURE_READY__ = Boolean(captureReady);
    root.setAttribute(
      'data-twinkle-capture-ready',
      captureReady ? '1' : '0'
    );
    return () => {
      win.__TWINKLE_CAPTURE_READY__ = false;
      root.setAttribute('data-twinkle-capture-ready', '0');
    };
  }, [captureReady]);

  useEffect(() => {
    const root = document.documentElement;
    const win = window as any;
    win.__TWINKLE_CAPTURE_MEANINGFUL_RENDER__ = Boolean(captureMeaningfulRender);
    root.setAttribute(
      'data-twinkle-capture-meaningful-render',
      captureMeaningfulRender ? '1' : '0'
    );
    return () => {
      win.__TWINKLE_CAPTURE_MEANINGFUL_RENDER__ = false;
      root.setAttribute('data-twinkle-capture-meaningful-render', '0');
    };
  }, [captureMeaningfulRender]);

  useEffect(() => {
    const root = document.documentElement;
    const win = window as any;
    const normalizedError = String(error || '').trim();
    if (normalizedError) {
      win.__TWINKLE_CAPTURE_ERROR__ = normalizedError;
      root.setAttribute('data-twinkle-capture-error', normalizedError);
      return () => {
        win.__TWINKLE_CAPTURE_ERROR__ = '';
        root.removeAttribute('data-twinkle-capture-error');
      };
    }
    win.__TWINKLE_CAPTURE_ERROR__ = '';
    root.removeAttribute('data-twinkle-capture-error');
    return () => {
      win.__TWINKLE_CAPTURE_ERROR__ = '';
      root.removeAttribute('data-twinkle-capture-error');
    };
  }, [error]);

  useEffect(() => {
    const rawAuthToken = captureBootstrap.authToken;
    if (rawAuthToken) {
      try {
        window.localStorage.setItem('token', rawAuthToken);
      } catch (error) {
        console.error('Failed to persist capture auth token:', error);
      }
      if (location.hash) {
        window.history.replaceState(
          window.history.state,
          document.title,
          `${location.pathname}${location.search}`
        );
      }
    }
    setAuthReady(true);
  }, [
    captureBootstrap.authToken,
    location.hash,
    location.pathname,
    location.search
  ]);

  useEffect(() => {
    let cancelled = false;

    if (!authReady) {
      return;
    }
    if (!numericBuildId) {
      setError('Invalid build ID');
      setLoading(false);
      return;
    }
    if (!previewPath) {
      setError('Invalid preview path');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setCaptureReady(false);
    setCaptureMeaningfulRender(false);
    setPayload(null);
    void handleLoad();

    return () => {
      cancelled = true;
    };

    async function handleLoad() {
      try {
        const data = await loadBuild(numericBuildId, { fromWriter: true });
        if (cancelled) return;
        if (!data?.build) {
          setError(data?.error || 'Failed to load build');
          setLoading(false);
          return;
        }
        if (data?.access?.kind) {
          setError('Thumbnail capture host requires workspace access.');
          setLoading(false);
          return;
        }
        setPayload({
          build: {
            ...data.build,
            projectManifest: data.projectManifest || null,
            capabilitySnapshot: data.capabilitySnapshot || null,
            projectFiles: Array.isArray(data.projectFiles) ? data.projectFiles : []
          },
          capabilitySnapshot: data.capabilitySnapshot || null,
          projectFiles: Array.isArray(data.projectFiles) ? data.projectFiles : []
        });
      } catch (error: any) {
        if (cancelled) return;
        setError(error?.message || 'Failed to load build');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
  }, [authReady, loadBuild, numericBuildId, previewPath]);

  if (loading || !authReady) {
    return (
      <div className={shellClass}>
        <Loading text="Loading preview..." />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className={shellClass}>
        <InvalidPage text={error || 'Thumbnail capture preview is unavailable'} />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={panelClass}>
        <PreviewPanel
          build={payload.build}
          code={payload.build.code}
          projectFiles={payload.projectFiles}
          isOwner
          runtimeOnly
          capabilitySnapshot={payload.capabilitySnapshot}
          previewSrcOverride={previewPath}
          viewerOverride={captureBootstrap.viewerOverride}
          onCaptureReadyChange={setCaptureReady}
          onRuntimeObservationChange={(state) =>
            setCaptureMeaningfulRender(Boolean(state.health?.meaningfulRender))
          }
          onReplaceCode={() => {}}
          onApplyRestoredProjectFiles={() => {}}
          onSaveProjectFiles={async () => ({ success: false })}
        />
      </div>
    </div>
  );
}

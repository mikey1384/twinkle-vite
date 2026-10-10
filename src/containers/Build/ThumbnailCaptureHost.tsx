import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import PreviewPanel from './PreviewPanel';
import { useAppContext } from '~/contexts';
import { normalizeAllowedBuildPreviewFrameSrc } from '~/helpers/buildPreviewOriginHelpers';
import { persistAuthToken } from '~/helpers/userDataHelpers';
import type { BuildRuntimeObservationState } from './types/runtimeObservationTypes';

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

// Lumine view_preview captures: the API crops a phone capture to this frame,
// which sits at the top-left corner of the capture browser's 1600x900 window.
const LUMINE_CAPTURE_PHONE_VIEWPORT = { width: 390, height: 844 };
const LUMINE_CAPTURE_EVIDENCE_DEBOUNCE_MS = 400;
const LUMINE_CAPTURE_EVIDENCE_MAX_REPORTS = 12;

const phoneShellClass = css`
  position: fixed;
  inset: 0;
  background: #8a8f98;
`;

const phoneFrameClass = css`
  position: absolute;
  top: 0;
  left: 0;
  width: ${LUMINE_CAPTURE_PHONE_VIEWPORT.width}px;
  height: ${LUMINE_CAPTURE_PHONE_VIEWPORT.height}px;
  display: grid;
  overflow: hidden;
  background: #fff;
`;

// A Lumine capture renders the run's working files from the capture route,
// not the saved draft. A brand-new build has an empty saved draft, and
// PreviewPanel only mounts the frame when it has something to show, so a
// capture passes this stand-in; the frame still loads previewPath.
const LUMINE_CAPTURE_PLACEHOLDER_CODE = '<!-- lumine view_preview capture -->';

function parseLumineCaptureId(value: string | null) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return /^[0-9a-f]{32}$/.test(normalized) ? normalized : null;
}

function parseOptionalViewerId(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function ThumbnailCaptureHost({
  onInitializeSession
}: {
  onInitializeSession: () => Promise<boolean>;
}) {
  const { buildId } = useParams();
  const location = useLocation();
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const reportLuminePreviewCaptureEvidence = useAppContext(
    (v) => v.requestHelpers.reportLuminePreviewCaptureEvidence
  );
  const initializeSessionRef = useRef(onInitializeSession);
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
    return normalizeAllowedBuildPreviewFrameSrc(path);
  }, [location.search]);
  const lumineCapture = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const captureId = parseLumineCaptureId(params.get('lumineCaptureId'));
    if (!captureId) return null;
    const viewport: 'phone' | 'desktop' =
      params.get('captureViewport') === 'desktop' ? 'desktop' : 'phone';
    return {
      captureId,
      viewport,
      width:
        viewport === 'phone'
          ? LUMINE_CAPTURE_PHONE_VIEWPORT.width
          : Math.round(window.innerWidth || 0),
      height:
        viewport === 'phone'
          ? LUMINE_CAPTURE_PHONE_VIEWPORT.height
          : Math.round(window.innerHeight || 0)
    };
  }, [location.search]);
  const reportEvidenceRef = useRef(reportLuminePreviewCaptureEvidence);
  const evidenceStateRef = useRef<{
    observation: Pick<BuildRuntimeObservationState, 'issues' | 'health'> | null;
    timer: ReturnType<typeof setTimeout> | null;
    reports: number;
  }>({ observation: null, timer: null, reports: 0 });

  useEffect(() => {
    initializeSessionRef.current = onInitializeSession;
  }, [onInitializeSession]);

  useEffect(() => {
    reportEvidenceRef.current = reportLuminePreviewCaptureEvidence;
  }, [reportLuminePreviewCaptureEvidence]);

  // Unsaved, model- or member-written code runs in this frame and Lumine
  // reads the screenshot. Frames on this page may only load the preview
  // origin or HTTPS, so the app cannot open plain-HTTP internal targets
  // (localhost services, instance metadata) by navigating itself there.
  useEffect(() => {
    if (!lumineCapture || !previewPath) return;
    let previewOrigin = '';
    try {
      previewOrigin = new URL(previewPath, window.location.href).origin;
    } catch {
      return;
    }
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `frame-src 'self' ${previewOrigin} https: data: blob:`;
    document.head.appendChild(meta);
    // A delivered policy stays in force for the page's life even if the tag
    // is removed, which is what a capture page wants.
  }, [lumineCapture, previewPath]);

  useEffect(() => {
    const evidenceState = evidenceStateRef.current;
    return () => {
      if (evidenceState.timer) clearTimeout(evidenceState.timer);
    };
  }, []);

  // The first report confirms the viewport as soon as the host is ready;
  // later ones carry the preview SDK's observation as it arrives.
  useEffect(() => {
    if (captureReady && lumineCapture) scheduleLumineEvidenceReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureReady, lumineCapture]);

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
      if (!persistAuthToken(rawAuthToken)) {
        setError('Failed to start the secure capture session.');
        return;
      }
      if (location.hash) {
        window.history.replaceState(
          window.history.state,
          document.title,
          `${location.pathname}${location.search}`
        );
      }
      // This lazy route can mount after App and the guest socket have already
      // initialized. Saving a same-tab token does not restart that pipeline;
      // a later App render would hide us behind its canonical-session gate.
      // Start App's existing single-flight explicitly. App owns confirmation
      // and recovery, including if its gate unmounts this capture component.
      void initializeSessionRef.current();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, numericBuildId, previewPath]);

  if (error) {
    return (
      <div className={shellClass}>
        <InvalidPage text={error} />
      </div>
    );
  }

  if (loading || !authReady) {
    return (
      <div className={shellClass}>
        <Loading text="Loading preview..." />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className={shellClass}>
        <InvalidPage text="Thumbnail capture preview is unavailable" />
      </div>
    );
  }

  const previewPanel = (
    <PreviewPanel
      build={payload.build}
      code={
        lumineCapture &&
        !String(payload.build.code || '').trim() &&
        payload.projectFiles.length === 0
          ? LUMINE_CAPTURE_PLACEHOLDER_CODE
          : payload.build.code
      }
      projectFiles={payload.projectFiles}
      isOwner
      runtimeOnly
      capabilitySnapshot={payload.capabilitySnapshot}
      previewSrcOverride={previewPath}
      viewerOverride={captureBootstrap.viewerOverride}
      onCaptureReadyChange={setCaptureReady}
      onRuntimeObservationChange={handleRuntimeObservationChange}
      onReplaceCode={() => {}}
      onApplyRestoredProjectFiles={() => {}}
      onSaveProjectFiles={async () => ({ success: false })}
    />
  );

  if (lumineCapture?.viewport === 'phone') {
    return (
      <div className={phoneShellClass}>
        <div className={phoneFrameClass}>{previewPanel}</div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={panelClass}>{previewPanel}</div>
    </div>
  );

  function handleRuntimeObservationChange(state: BuildRuntimeObservationState) {
    setCaptureMeaningfulRender(Boolean(state.health?.meaningfulRender));
    if (!lumineCapture) return;
    evidenceStateRef.current.observation = {
      issues: Array.isArray(state.issues) ? state.issues.slice(-8) : [],
      health: state.health || null
    };
    scheduleLumineEvidenceReport();
  }

  function scheduleLumineEvidenceReport() {
    const evidenceState = evidenceStateRef.current;
    if (
      !lumineCapture ||
      !numericBuildId ||
      evidenceState.reports >= LUMINE_CAPTURE_EVIDENCE_MAX_REPORTS
    ) {
      return;
    }
    if (evidenceState.timer) clearTimeout(evidenceState.timer);
    evidenceState.timer = setTimeout(() => {
      evidenceState.timer = null;
      if (evidenceState.reports >= LUMINE_CAPTURE_EVIDENCE_MAX_REPORTS) return;
      evidenceState.reports += 1;
      void Promise.resolve(
        reportEvidenceRef.current?.({
          buildId: numericBuildId,
          captureId: lumineCapture.captureId,
          evidence: {
            viewport: {
              mode: lumineCapture.viewport,
              width: lumineCapture.width,
              height: lumineCapture.height
            },
            observation: evidenceState.observation
          }
        })
      ).catch(() => {
        // Best effort: the screenshot still reaches Lumine without it.
      });
    }, LUMINE_CAPTURE_EVIDENCE_DEBOUNCE_MS);
  }
}

import { useEffect, useState } from 'react';
import {
  ensureBuildApiToken,
  type PreviewHostBridgeAuth
} from '../helpers/previewBridgeAuth';
import type { Build } from '../types';
import type { WorkspaceViewMode } from '../constants/workspaceView';
import {
  buildPreviewFrameSrc,
  canUseSameOriginBuildPreviewSandbox
} from '~/helpers/buildPreviewOriginHelpers';

interface PreviewSrcState {
  key: string;
  src: string;
  expiresAt?: number;
}

const ACTIVE_FRAME_REFRESH_RETRY_MS = 60 * 1000;
const ACCESS_RETRY_DELAYS_MS = [1000, 3000, 10_000];

function appendPreviewQueryParam(
  src: string,
  key: string,
  value?: string | null
) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return src;
  return `${src}${src.includes('?') ? '&' : '?'}${encodeURIComponent(key)}=${encodeURIComponent(normalizedValue)}`;
}

export function buildPreviewBaseSrc(build: Build) {
  return buildPreviewFrameSrc(
    Number(build.currentArtifactVersionId) > 0
      ? `/build/preview/build/${build.id}/version/${build.currentArtifactVersionId}`
      : `/build/preview/build/${build.id}/current?rev=${Number(build.updatedAt) || 0}`
  );
}

function usePreviewAccess({
  baseSrc,
  signed,
  userId,
  previewAuth,
  resolveEnabled = true,
  retryNonce = 0,
  onAccessError
}: {
  baseSrc: string | null;
  signed: boolean;
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
  resolveEnabled?: boolean;
  retryNonce?: number;
  onAccessError?: (message: string | null) => void;
}) {
  const key = baseSrc
    ? `${baseSrc}|user:${Number(userId || 0)}|signed:${signed ? 1 : 0}`
    : null;
  const [state, setState] = useState<PreviewSrcState | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer = 0;
    let retryIndex = 0;
    let inFlight = false;
    let failed = false;
    onAccessError?.(null);

    async function resolve() {
      if (!resolveEnabled || !key || !baseSrc || cancelled || inFlight) return;
      if (!signed) {
        setState({ key, src: baseSrc });
        return;
      }
      if (!userId) {
        onAccessError?.('Sign in to open this preview.');
        return;
      }
      inFlight = true;
      try {
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        if (cancelled) return;
        const tokenState = previewAuth.buildApiTokenRef.current;
        const expiresAt =
          tokenState && tokenState.token === token
            ? Number(tokenState.expiresAt || 0)
            : 0;
        setState({
          key,
          src: appendPreviewQueryParam(baseSrc, 'buildApiToken', token),
          expiresAt: expiresAt || undefined
        });
        failed = false;
        onAccessError?.(null);
      } catch (error: any) {
        if (cancelled) return;
        failed = true;
        const status = Number(error?.response?.status || error?.status || 0);
        const transient =
          !status || status === 408 || status === 429 || status >= 500;
        if (transient && retryIndex < ACCESS_RETRY_DELAYS_MS.length) {
          retryTimer = window.setTimeout(() => {
            void resolve();
          }, ACCESS_RETRY_DELAYS_MS[retryIndex++]);
        } else {
          onAccessError?.(
            status === 401
              ? 'Sign in again to open this preview.'
              : status === 403
                ? 'You no longer have access to this preview.'
                : 'Couldn’t open the preview. Please try again.'
          );
        }
        // Keep the same viewer's running frame. Never replace a protected
        // document with an unsigned URL because its token request failed.
      } finally {
        inFlight = false;
      }
    }

    function retryFailedAccess() {
      if (!failed || inFlight) return;
      window.clearTimeout(retryTimer);
      retryIndex = 0;
      onAccessError?.(null);
      void resolve();
    }

    function retryWhenVisible() {
      if (document.visibilityState === 'visible') retryFailedAccess();
    }

    void resolve();
    window.addEventListener('online', retryFailedAccess);
    window.addEventListener('focus', retryWhenVisible);
    document.addEventListener('visibilitychange', retryWhenVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      window.removeEventListener('online', retryFailedAccess);
      window.removeEventListener('focus', retryWhenVisible);
      document.removeEventListener('visibilitychange', retryWhenVisible);
    };
  }, [
    baseSrc,
    key,
    onAccessError,
    previewAuth,
    refreshNonce,
    resolveEnabled,
    retryNonce,
    signed,
    userId
  ]);

  useEffect(() => {
    if (!signed || !key || state?.key !== key || !state.expiresAt) return;
    const refreshWouldRemount = !canUseSameOriginBuildPreviewSandbox(state.src);
    let timer = 0;
    function schedule(delay: number) {
      timer = window.setTimeout(() => {
        // Preserve the existing no-reload behavior while a cross-origin game
        // is focused. Same-origin token refresh travels over the bridge.
        if (
          refreshWouldRemount &&
          document.activeElement instanceof HTMLIFrameElement
        ) {
          schedule(ACTIVE_FRAME_REFRESH_RETRY_MS);
          return;
        }
        setRefreshNonce((nonce) => nonce + 1);
      }, delay);
    }
    schedule(Math.max(0, state.expiresAt * 1000 - Date.now() - 25_000));
    return () => window.clearTimeout(timer);
  }, [key, signed, state?.expiresAt, state?.key, state?.src]);

  return state?.key === key ? state.src : null;
}

interface AccessFeedback {
  retryNonce?: number;
  onAccessError?: (message: string | null) => void;
}

export function useRuntimePreviewSrc({
  build,
  enabled,
  previewSrcOverride,
  appMcpSessionId,
  requireSignedAccess,
  userId,
  previewAuth,
  ...feedback
}: {
  build: Build;
  enabled: boolean;
  previewSrcOverride: string | null;
  appMcpSessionId?: string | null;
  requireSignedAccess: boolean;
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
} & AccessFeedback) {
  // Public iframe requests carry no website login. Preserve the canonical
  // owner's/team member's access even if publication advances after loading
  // the host payload; the server still rechecks membership on every request.
  const hasWorkspaceAccess =
    Number(userId) > 0 &&
    (Number(build.userId) === Number(userId) ||
      build.canOpenContributionWorkspace === true);
  const signed = !build.isPublic || requireSignedAccess || hasWorkspaceAccess;
  const src = usePreviewAccess({
    baseSrc:
      enabled && !previewSrcOverride
        ? appendPreviewQueryParam(
            buildPreviewBaseSrc(build),
            'appMcpSession',
            appMcpSessionId
          )
        : null,
    signed,
    userId,
    previewAuth,
    ...feedback
  });
  return previewSrcOverride || src;
}

export function useWorkspacePreviewSrc({
  build,
  runtimeOnly,
  previewRevision,
  viewMode,
  userId,
  previewAuth,
  ...feedback
}: {
  build: Build;
  runtimeOnly: boolean;
  previewRevision?: string | null;
  viewMode: WorkspaceViewMode;
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
} & AccessFeedback) {
  return usePreviewAccess({
    baseSrc: !runtimeOnly
      ? appendPreviewQueryParam(
          buildPreviewBaseSrc(build),
          'previewRev',
          previewRevision
        )
      : null,
    resolveEnabled: viewMode === 'preview',
    signed: true,
    userId,
    previewAuth,
    ...feedback
  });
}

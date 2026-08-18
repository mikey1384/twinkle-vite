import { useEffect, useState } from 'react';
import {
  ensureBuildApiToken,
  type PreviewHostBridgeAuth
} from './useHostBridge';
import type { Build } from '../types';
import type { WorkspaceViewMode } from '../constants/workspaceView';
import {
  buildPreviewFrameSrc,
  canUseSameOriginBuildPreviewSandbox
} from '~/helpers/buildPreviewOriginHelpers';

interface RuntimePreviewSrcState {
  key: string;
  src: string;
  expiresAt?: number;
}

// While the player is focused inside the preview frame, deferred token
// refreshes re-check on this cadence instead of reloading the running app.
const ACTIVE_FRAME_REFRESH_RETRY_MS = 60 * 1000;

function toPreviewBaseSrc(build: Build) {
  return Number(build.currentArtifactVersionId) > 0
    ? `/build/preview/build/${build.id}/version/${build.currentArtifactVersionId}`
    : `/build/preview/build/${build.id}/current?rev=${Number(build.updatedAt) || 0}`;
}

function appendPreviewQueryParam(
  previewSrc: string,
  key: string,
  value: string | null | undefined
) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return previewSrc;
  const separator = previewSrc.includes('?') ? '&' : '?';
  return `${previewSrc}${separator}${encodeURIComponent(key)}=${encodeURIComponent(
    normalizedValue
  )}`;
}

export function buildPreviewBaseSrc(build: Build) {
  return buildPreviewFrameSrc(toPreviewBaseSrc(build));
}

export function useRuntimePreviewSrc({
  build,
  enabled,
  previewSrcOverride,
  appMcpSessionId,
  requireSignedAccess,
  userId,
  previewAuth
}: {
  build: Build;
  enabled: boolean;
  previewSrcOverride: string | null;
  appMcpSessionId?: string | null;
  requireSignedAccess: boolean;
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
}) {
  const [runtimePreviewSrcState, setRuntimePreviewSrcState] =
    useState<RuntimePreviewSrcState | null>(null);

  const rawBasePreviewSrc = enabled ? buildPreviewBaseSrc(build) : null;
  const basePreviewSrc = rawBasePreviewSrc
    ? appendPreviewQueryParam(rawBasePreviewSrc, 'appMcpSession', appMcpSessionId)
    : null;
  const runtimePreviewSrcKey = basePreviewSrc
    ? `${basePreviewSrc}|user:${Number(userId || 0)}|public:${
        build.isPublic ? 1 : 0
      }|signed:${requireSignedAccess ? 1 : 0}`
    : null;
  const canUseBasePreviewSrc = Boolean(
    enabled && basePreviewSrc && build.isPublic && !requireSignedAccess
  );
  const needsSignedPreviewSrc = Boolean(
    enabled &&
    basePreviewSrc &&
    (!build.isPublic || requireSignedAccess) &&
    userId
  );
  const runtimePreviewRefreshLeadMs = 25 * 1000;
  const [runtimePreviewRefreshNonce, setRuntimePreviewRefreshNonce] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function resolveRuntimePreviewSrc() {
      if (previewSrcOverride) {
        setRuntimePreviewSrcState(null);
        return;
      }
      if (!enabled || !basePreviewSrc || !runtimePreviewSrcKey) {
        setRuntimePreviewSrcState(null);
        return;
      }
      if (canUseBasePreviewSrc) {
        setRuntimePreviewSrcState({
          key: runtimePreviewSrcKey,
          src: basePreviewSrc
        });
        return;
      }
      if (!needsSignedPreviewSrc) {
        setRuntimePreviewSrcState(null);
        return;
      }

      try {
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        if (cancelled) return;
        const tokenState = previewAuth.buildApiTokenRef.current;
        const tokenExpiresAt =
          tokenState && tokenState.token === token
            ? Number(tokenState.expiresAt || 0)
            : 0;
        setRuntimePreviewSrcState({
          key: runtimePreviewSrcKey,
          src: appendPreviewQueryParam(basePreviewSrc, 'buildApiToken', token),
          expiresAt: tokenExpiresAt || undefined
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to resolve runtime preview access token:', error);
        setRuntimePreviewSrcState(null);
      }
    }

    void resolveRuntimePreviewSrc();

    return () => {
      cancelled = true;
    };
  }, [
    basePreviewSrc,
    canUseBasePreviewSrc,
    enabled,
    needsSignedPreviewSrc,
    previewAuth,
    appMcpSessionId,
    previewSrcOverride,
    runtimePreviewRefreshNonce,
    runtimePreviewSrcKey
  ]);

  useEffect(() => {
    if (
      !needsSignedPreviewSrc ||
      !runtimePreviewSrcKey ||
      runtimePreviewSrcState?.key !== runtimePreviewSrcKey ||
      !runtimePreviewSrcState.expiresAt
    ) {
      return;
    }

    const refreshDelayMs = Math.max(
      0,
      runtimePreviewSrcState.expiresAt * 1000 -
        Date.now() -
        runtimePreviewRefreshLeadMs
    );
    // Same-origin frames take token-only refreshes in place over the preview
    // bridge (preview:token-refresh) with no reload, so deferring there would
    // only strand the running app with an expired token. Cross-origin signed
    // frames cannot be bridged — a refresh remounts them and resets a running
    // app mid-session — so those defer while the player is focused inside the
    // frame, accepting stale-token risk on late lazy fetches as the lesser harm.
    const refreshWouldRemount = !canUseSameOriginBuildPreviewSandbox(
      runtimePreviewSrcState.src
    );
    let refreshTimeout = 0;
    const scheduleRefresh = (delayMs: number) => {
      refreshTimeout = window.setTimeout(() => {
        if (
          refreshWouldRemount &&
          document.activeElement instanceof HTMLIFrameElement
        ) {
          scheduleRefresh(ACTIVE_FRAME_REFRESH_RETRY_MS);
          return;
        }
        setRuntimePreviewRefreshNonce((currentNonce) => currentNonce + 1);
      }, delayMs);
    };
    scheduleRefresh(refreshDelayMs);

    return () => {
      window.clearTimeout(refreshTimeout);
    };
  }, [
    needsSignedPreviewSrc,
    runtimePreviewRefreshLeadMs,
    runtimePreviewSrcKey,
    runtimePreviewSrcState?.expiresAt,
    runtimePreviewSrcState?.key,
    runtimePreviewSrcState?.src
  ]);

  if (previewSrcOverride) return previewSrcOverride;
  if (canUseBasePreviewSrc) return basePreviewSrc;
  return runtimePreviewSrcState?.key === runtimePreviewSrcKey
    ? runtimePreviewSrcState.src
    : null;
}

export function useWorkspacePreviewSrc({
  build,
  runtimeOnly,
  previewRevision,
  viewMode,
  userId,
  previewAuth
}: {
  build: Build;
  runtimeOnly: boolean;
  previewRevision?: string | null;
  viewMode: WorkspaceViewMode;
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
}) {
  const [workspacePreviewSrcState, setWorkspacePreviewSrcState] = useState<{
    src: string;
    expiresAt?: number;
  } | null>(null);
  const workspacePreviewRefreshLeadMs = 25 * 1000;
  const [workspacePreviewRefreshNonce, setWorkspacePreviewRefreshNonce] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    function applyWorkspacePreviewSrcState(nextState: {
      src: string;
      expiresAt?: number;
    }) {
      setWorkspacePreviewSrcState((currentState) =>
        currentState &&
        currentState.src === nextState.src &&
        currentState.expiresAt === nextState.expiresAt
          ? currentState
          : nextState
      );
    }

    async function resolveWorkspacePreviewSrc() {
      if (runtimeOnly) {
        setWorkspacePreviewSrcState(null);
        return;
      }
      if (viewMode !== 'preview') {
        return;
      }

      const basePreviewSrc = buildPreviewBaseSrc(build);
      const versionedPreviewSrc = appendPreviewQueryParam(
        basePreviewSrc,
        'previewRev',
        previewRevision
      );

      if (!userId) {
        applyWorkspacePreviewSrcState({ src: versionedPreviewSrc });
        return;
      }

      try {
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        if (cancelled) return;
        const tokenState = previewAuth.buildApiTokenRef.current;
        const tokenExpiresAt =
          tokenState && tokenState.token === token
            ? Number(tokenState.expiresAt || 0)
            : 0;
        applyWorkspacePreviewSrcState({
          src: appendPreviewQueryParam(
            versionedPreviewSrc,
            'buildApiToken',
            token
          ),
          expiresAt: tokenExpiresAt || undefined
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to resolve preview access token:', error);
        applyWorkspacePreviewSrcState({ src: versionedPreviewSrc });
      }
    }

    void resolveWorkspacePreviewSrc();

    return () => {
      cancelled = true;
    };
  }, [
    build,
    build.currentArtifactVersionId,
    build.id,
    build.isPublic,
    build.updatedAt,
    previewAuth,
    previewRevision,
    runtimeOnly,
    userId,
    viewMode,
    workspacePreviewRefreshNonce
  ]);

  useEffect(() => {
    if (!workspacePreviewSrcState?.expiresAt) {
      return;
    }

    const refreshDelayMs = Math.max(
      0,
      workspacePreviewSrcState.expiresAt * 1000 -
        Date.now() -
        workspacePreviewRefreshLeadMs
    );
    // Same-origin frames take token-only refreshes in place over the preview
    // bridge (preview:token-refresh) with no reload; cross-origin signed
    // frames cannot be bridged — a refresh remounts them and resets a running
    // app mid-session — so those defer while the player is focused inside the
    // frame, accepting stale-token risk on late lazy fetches as the lesser harm.
    const refreshWouldRemount = !canUseSameOriginBuildPreviewSandbox(
      workspacePreviewSrcState.src
    );
    let refreshTimeout = 0;
    const scheduleRefresh = (delayMs: number) => {
      refreshTimeout = window.setTimeout(() => {
        if (
          refreshWouldRemount &&
          document.activeElement instanceof HTMLIFrameElement
        ) {
          scheduleRefresh(ACTIVE_FRAME_REFRESH_RETRY_MS);
          return;
        }
        setWorkspacePreviewRefreshNonce((currentNonce) => currentNonce + 1);
      }, delayMs);
    };
    scheduleRefresh(refreshDelayMs);

    return () => {
      window.clearTimeout(refreshTimeout);
    };
  }, [
    workspacePreviewRefreshLeadMs,
    workspacePreviewSrcState?.expiresAt,
    workspacePreviewSrcState?.src
  ]);

  return workspacePreviewSrcState?.src ?? null;
}

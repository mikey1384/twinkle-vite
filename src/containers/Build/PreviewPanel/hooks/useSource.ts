import { useEffect, useState } from 'react';
import {
  ensureBuildApiToken,
  type PreviewHostBridgeAuth
} from './useHostBridge';
import type { Build } from '../types';
import { buildPreviewFrameSrc } from '~/helpers/buildPreviewOriginHelpers';

interface RuntimePreviewSrcState {
  key: string;
  src: string;
  expiresAt?: number;
}

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
  userId,
  previewAuth
}: {
  build: Build;
  enabled: boolean;
  previewSrcOverride: string | null;
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
}) {
  const [runtimePreviewSrcState, setRuntimePreviewSrcState] =
    useState<RuntimePreviewSrcState | null>(null);

  const basePreviewSrc = enabled ? buildPreviewBaseSrc(build) : null;
  const runtimePreviewSrcKey = basePreviewSrc
    ? `${basePreviewSrc}|user:${Number(userId || 0)}|public:${
        build.isPublic ? 1 : 0
      }`
    : null;
  const canUseBasePreviewSrc = Boolean(
    enabled && basePreviewSrc && build.isPublic
  );
  const needsSignedPreviewSrc = Boolean(
    enabled && basePreviewSrc && !build.isPublic && userId
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
    const refreshTimeout = window.setTimeout(() => {
      setRuntimePreviewRefreshNonce((currentNonce) => currentNonce + 1);
    }, refreshDelayMs);

    return () => {
      window.clearTimeout(refreshTimeout);
    };
  }, [
    needsSignedPreviewSrc,
    runtimePreviewRefreshLeadMs,
    runtimePreviewSrcKey,
    runtimePreviewSrcState?.expiresAt,
    runtimePreviewSrcState?.key
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
  viewMode: 'preview' | 'code' | 'manual';
  userId: number | null;
  previewAuth: PreviewHostBridgeAuth;
}) {
  const [workspacePreviewSrc, setWorkspacePreviewSrc] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function resolveWorkspacePreviewSrc() {
      if (runtimeOnly) {
        setWorkspacePreviewSrc(null);
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
        setWorkspacePreviewSrc(versionedPreviewSrc);
        return;
      }

      try {
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        if (cancelled) return;
        const separator = versionedPreviewSrc.includes('?') ? '&' : '?';
        setWorkspacePreviewSrc(
          `${versionedPreviewSrc}${separator}buildApiToken=${encodeURIComponent(token)}`
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to resolve preview access token:', error);
        setWorkspacePreviewSrc(versionedPreviewSrc);
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
    viewMode
  ]);

  return workspacePreviewSrc;
}

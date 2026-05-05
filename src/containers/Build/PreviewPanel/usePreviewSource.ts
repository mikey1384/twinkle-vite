import { useEffect, useState } from 'react';
import {
  ensureBuildApiToken,
  type PreviewHostBridgeAuth
} from './usePreviewHostBridge';
import type { Build } from './types';
import { buildPreviewFrameSrc } from '../previewOrigin';

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

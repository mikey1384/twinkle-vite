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

export function buildPreviewBaseSrc(build: Build) {
  return buildPreviewFrameSrc(toPreviewBaseSrc(build));
}

export function useWorkspacePreviewSrc({
  build,
  runtimeOnly,
  viewMode,
  userId,
  previewAuth
}: {
  build: Build;
  runtimeOnly: boolean;
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

      if (Boolean(build.isPublic) || !previewAuth.isOwnerRef.current) {
        setWorkspacePreviewSrc(basePreviewSrc);
        return;
      }

      try {
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        if (cancelled) return;
        const separator = basePreviewSrc.includes('?') ? '&' : '?';
        setWorkspacePreviewSrc(
          `${basePreviewSrc}${separator}buildApiToken=${encodeURIComponent(token)}`
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to resolve preview access token:', error);
        setWorkspacePreviewSrc(basePreviewSrc);
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
    runtimeOnly,
    userId,
    viewMode
  ]);

  return workspacePreviewSrc;
}

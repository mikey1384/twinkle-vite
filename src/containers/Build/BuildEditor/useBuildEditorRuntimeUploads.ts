import {
  useEffect,
  useState
} from 'react';
import {
  createAgentAssetFile,
  isSupportedBuildAssetUploadFile,
  type BuildAgentAssetCreateOptions,
  type BuildAgentAssetCreateResult
} from '../PreviewPanel/agentWorkspaceAssets';
import type {
  PreviewRuntimeUploadAsset,
  PreviewRuntimeUploadsSyncPayload
} from '../PreviewPanel/types';
import {
  applyRuntimeUploadUsageToCopilotPolicy
} from './domain/buildBranches';
import type {
  Build,
  BuildCopilotPolicy,
  BuildRuntimeUploadAsset,
  BuildRuntimeUploadUsage
} from './types';

export default function useBuildEditorRuntimeUploads({
  build,
  canEditCurrentBuildProject,
  deleteBuildRuntimeUpload,
  getBuildApiToken,
  getLatestBuild,
  getLatestCopilotPolicy,
  isOwner,
  listBuildRuntimeFiles,
  loadBuildRuntimeUploads,
  replaceCopilotPolicy,
  uploadBuildRuntimeFiles
}: {
  build: Build;
  canEditCurrentBuildProject: boolean;
  deleteBuildRuntimeUpload: (assetId: number) => Promise<any>;
  getBuildApiToken: (options: {
    buildId: number;
    scopes: string[];
  }) => Promise<any>;
  getLatestBuild: () => Build;
  getLatestCopilotPolicy: () => BuildCopilotPolicy | null;
  isOwner: boolean;
  listBuildRuntimeFiles: (options: {
    buildId: number;
    limit: number;
    token: string;
  }) => Promise<any>;
  loadBuildRuntimeUploads: (options: {
    cursor?: number | null;
    limit: number;
  }) => Promise<any>;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  uploadBuildRuntimeFiles: (options: {
    buildId: number;
    files: File[];
    token: string;
  }) => Promise<any>;
}) {
  const [runtimeUploadsModalShown, setRuntimeUploadsModalShown] =
    useState(false);
  const [runtimeUploadAssets, setRuntimeUploadAssets] = useState<
    BuildRuntimeUploadAsset[]
  >([]);
  const [currentBuildRuntimeAssets, setCurrentBuildRuntimeAssets] = useState<
    BuildRuntimeUploadAsset[]
  >([]);
  const [runtimeUploadsNextCursor, setRuntimeUploadsNextCursor] = useState<
    number | null
  >(null);
  const [runtimeUploadsLoading, setRuntimeUploadsLoading] = useState(false);
  const [runtimeUploadsLoadingMore, setRuntimeUploadsLoadingMore] =
    useState(false);
  const [runtimeUploadsError, setRuntimeUploadsError] = useState('');
  const [runtimeUploadDeletingId, setRuntimeUploadDeletingId] = useState<
    number | null
  >(null);

  useEffect(() => {
    setRuntimeUploadsModalShown(false);
    setRuntimeUploadAssets([]);
    setCurrentBuildRuntimeAssets([]);
    setRuntimeUploadsNextCursor(null);
    setRuntimeUploadsLoading(false);
    setRuntimeUploadsLoadingMore(false);
    setRuntimeUploadsError('');
    setRuntimeUploadDeletingId(null);
  }, [build.id]);

  function updateRuntimeUploadQuotaUsage(
    usage: BuildRuntimeUploadUsage | null | undefined
  ) {
    const nextPolicy = applyRuntimeUploadUsageToCopilotPolicy(
      getLatestCopilotPolicy(),
      usage
    );
    if (!nextPolicy) {
      return;
    }
    replaceCopilotPolicy(nextPolicy);
  }

  function formatBuildRuntimeUploadAssetForBuild(
    asset: PreviewRuntimeUploadAsset,
    targetBuild: Build
  ): BuildRuntimeUploadAsset {
    return {
      ...asset,
      buildTitle: String(targetBuild.title || '').trim() || null,
      buildSlug: null,
      buildIsPublic: Boolean(targetBuild.isPublic)
    };
  }

  function handleRuntimeUploadsSyncFromPreview(
    payload: PreviewRuntimeUploadsSyncPayload | null
  ) {
    if (!payload) {
      return;
    }
    setRuntimeUploadsError('');
    updateRuntimeUploadQuotaUsage(payload.usage || null);
    const activeBuild = getLatestBuild() || build;
    const currentBuildAssets = Array.isArray(payload.assets)
      ? payload.assets.map((asset) =>
          formatBuildRuntimeUploadAssetForBuild(asset, activeBuild)
        )
      : [];
    setCurrentBuildRuntimeAssets(currentBuildAssets);
    if (runtimeUploadsModalShown) {
      void loadRuntimeUploadsPage();
    }
  }

  async function loadRuntimeUploadsPage(options?: { append?: boolean }) {
    if (!isOwner) return;
    const append = Boolean(options?.append);
    const cursor = append ? runtimeUploadsNextCursor : null;
    if (append) {
      if (runtimeUploadsLoadingMore || !cursor) return;
      setRuntimeUploadsLoadingMore(true);
    } else {
      if (runtimeUploadsLoading) return;
      setRuntimeUploadsLoading(true);
    }
    setRuntimeUploadsError('');
    try {
      const payload = await loadBuildRuntimeUploads({
        cursor,
        limit: 30
      });
      const nextAssets = Array.isArray(payload?.assets) ? payload.assets : [];
      const nextCursor = Number(payload?.nextCursor);
      setRuntimeUploadAssets((prev) => {
        if (!append) {
          return nextAssets;
        }
        const merged = [...prev];
        const seenIds = new Set(prev.map((asset) => asset.id));
        for (const asset of nextAssets) {
          if (seenIds.has(asset.id)) continue;
          seenIds.add(asset.id);
          merged.push(asset);
        }
        return merged;
      });
      setRuntimeUploadsNextCursor(
        Number.isFinite(nextCursor) && nextCursor > 0 ? nextCursor : null
      );
      updateRuntimeUploadQuotaUsage(payload?.usage || null);
    } catch (error: any) {
      console.error('Failed to load runtime uploads:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load uploaded files';
      setRuntimeUploadsError(message);
    } finally {
      setRuntimeUploadsLoading(false);
      setRuntimeUploadsLoadingMore(false);
    }
  }

  function handleOpenRuntimeUploadsManager() {
    if (!isOwner) return;
    setRuntimeUploadsModalShown(true);
    void loadRuntimeUploadsPage();
  }

  function handleCloseRuntimeUploadsManager() {
    setRuntimeUploadsModalShown(false);
  }

  function handleLoadMoreRuntimeUploads() {
    void loadRuntimeUploadsPage({ append: true });
  }

  async function handleCreateGeneratedRuntimeAsset(
    options: BuildAgentAssetCreateOptions
  ): Promise<BuildAgentAssetCreateResult> {
    if (!canEditCurrentBuildProject) {
      throw new Error(
        'Project asset upload is available only in an editable build workspace.'
      );
    }
    setRuntimeUploadsError('');
    const targetBuild = getLatestBuild() || build;
    const targetBuildId = Number(targetBuild?.id || 0);
    if (!targetBuildId) {
      throw new Error('Build not found.');
    }
    function assertUploadTargetStillActive() {
      if (Number(getLatestBuild()?.id || 0) === targetBuildId) {
        return;
      }
      throw new Error(
        'Asset upload target changed because you switched builds before it completed.'
      );
    }

    const file = await createAgentAssetFile(options);
    assertUploadTargetStillActive();
    if (!isSupportedBuildAssetUploadFile(file)) {
      throw new Error('Project assets support image and audio files.');
    }

    const tokenPayload = await getBuildApiToken({
      buildId: targetBuildId,
      scopes: ['files:read', 'files:write']
    });
    const token = tokenPayload?.token;
    if (!token) {
      throw new Error('Failed to obtain API token.');
    }
    assertUploadTargetStillActive();

    const uploadPayload = await uploadBuildRuntimeFiles({
      buildId: targetBuildId,
      files: [file],
      token
    });
    const asset = Array.isArray(uploadPayload?.assets)
      ? uploadPayload.assets[0]
      : null;
    if (!asset) {
      const failedUpload = Array.isArray(uploadPayload?.failed)
        ? uploadPayload.failed[0]
        : null;
      throw new Error(
        failedUpload?.message || 'Asset upload did not return an uploaded asset.'
      );
    }
    assertUploadTargetStillActive();

    const activeBuild = getLatestBuild() || targetBuild;
    const uploadedAsset = formatBuildRuntimeUploadAssetForBuild(
      asset,
      activeBuild
    );
    let listPayload: any = null;
    try {
      listPayload = await listBuildRuntimeFiles({
        buildId: targetBuildId,
        limit: 30,
        token
      });
      assertUploadTargetStillActive();
    } catch (refreshError) {
      console.error(
        'Failed to refresh build assets after generated asset upload:',
        refreshError
      );
      assertUploadTargetStillActive();
      setRuntimeUploadsError(
        'Asset uploaded, but the asset list could not refresh. Reopen uploads to refresh the list.'
      );
    }
    const currentBuildAssets = Array.isArray(listPayload?.assets)
      ? listPayload.assets.map((nextAsset: PreviewRuntimeUploadAsset) =>
          formatBuildRuntimeUploadAssetForBuild(nextAsset, activeBuild)
        )
      : [uploadedAsset];
    updateRuntimeUploadQuotaUsage(listPayload?.usage || null);
    setCurrentBuildRuntimeAssets(currentBuildAssets);
    setRuntimeUploadAssets((prev) => [
      uploadedAsset,
      ...prev.filter((asset) => asset.id !== uploadedAsset.id)
    ]);
    return {
      success: true,
      asset,
      url: asset.url,
      stableUrl: asset.url,
      reference: asset.url
    };
  }

  async function handleDeleteRuntimeUploadManagerAsset(
    asset: BuildRuntimeUploadAsset
  ) {
    if (!asset?.id || runtimeUploadDeletingId) return;
    const fileLabel = asset.originalFileName || asset.fileName || 'this file';
    const confirmed = window.confirm(
      `Delete "${fileLabel}" from your Twinkle uploads?`
    );
    if (!confirmed) return;
    setRuntimeUploadDeletingId(asset.id);
    setRuntimeUploadsError('');
    try {
      const payload = await deleteBuildRuntimeUpload(asset.id);
      setRuntimeUploadAssets((prev) =>
        prev.filter((item) => item.id !== asset.id)
      );
      setCurrentBuildRuntimeAssets((prev) =>
        prev.filter((item) => item.id !== asset.id)
      );
      updateRuntimeUploadQuotaUsage(payload?.usage || null);
    } catch (error: any) {
      console.error('Failed to delete runtime upload:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete uploaded file';
      setRuntimeUploadsError(message);
    } finally {
      setRuntimeUploadDeletingId(null);
    }
  }

  return {
    currentBuildRuntimeAssets,
    handleCloseRuntimeUploadsManager,
    handleCreateGeneratedRuntimeAsset,
    handleDeleteRuntimeUploadManagerAsset,
    handleLoadMoreRuntimeUploads,
    handleOpenRuntimeUploadsManager,
    handleRuntimeUploadsSyncFromPreview,
    runtimeUploadAssets,
    runtimeUploadDeletingId,
    runtimeUploadsError,
    runtimeUploadsLoading,
    runtimeUploadsLoadingMore,
    runtimeUploadsModalShown,
    runtimeUploadsNextCursor
  };
}

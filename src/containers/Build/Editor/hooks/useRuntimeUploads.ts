import {
  useEffect,
  useState
} from 'react';
import {
  createAgentAssetFile,
  getBuildAssetUploadValidationError,
  type BuildAgentAssetCreateOptions,
  type BuildAgentAssetCreateResult
} from '~/containers/Build/helpers/agentWorkspaceAssets';
import type { ConfirmModalOptions } from '~/components/Modals/hooks/useConfirmModal';
import type {
  PreviewRuntimeUploadAsset,
  PreviewRuntimeUploadsSyncPayload
} from '../../PreviewPanel/types';
import {
  applyRuntimeUploadUsageToCopilotPolicy
} from '../helpers/branches';
import type {
  Build,
  BuildCopilotPolicy,
  BuildRuntimeUploadAsset,
  BuildRuntimeUploadGroup,
  BuildRuntimeUploadUsage
} from '../types';
import { SITE_NAME } from '~/constants/siteBrand';

const RUNTIME_UPLOAD_BUILDS_PER_PAGE = 10;
const RUNTIME_UPLOAD_FILES_PER_SECTION = 5;
const RUNTIME_UPLOAD_FILES_PER_PAGE = 20;

export default function useRuntimeUploads({
  build,
  canEditCurrentBuildProject,
  deleteBuildRuntimeUpload,
  getBuildApiToken,
  getLatestBuild,
  getLatestCopilotPolicy,
  isOwner,
  listBuildRuntimeFiles,
  loadBuildRuntimeUploads,
  requestConfirm,
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
    groupBy?: 'build';
    perBuild?: number;
    buildId?: number;
  }) => Promise<any>;
  requestConfirm: (options: ConfirmModalOptions) => Promise<boolean>;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  uploadBuildRuntimeFiles: (options: {
    buildId: number;
    files: File[];
    token: string;
  }) => Promise<any>;
}) {
  const [runtimeUploadsModalShown, setRuntimeUploadsModalShown] =
    useState(false);
  const [runtimeUploadGroups, setRuntimeUploadGroups] = useState<
    BuildRuntimeUploadGroup[]
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
  const [runtimeUploadsLoadingBuildId, setRuntimeUploadsLoadingBuildId] =
    useState<number | null>(null);
  const [runtimeUploadsError, setRuntimeUploadsError] = useState('');
  const [runtimeUploadDeletingId, setRuntimeUploadDeletingId] = useState<
    number | null
  >(null);

  useEffect(() => {
    setRuntimeUploadsModalShown(false);
    setRuntimeUploadGroups([]);
    setCurrentBuildRuntimeAssets([]);
    setRuntimeUploadsNextCursor(null);
    setRuntimeUploadsLoading(false);
    setRuntimeUploadsLoadingMore(false);
    setRuntimeUploadsLoadingBuildId(null);
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

  // The manager shows one section per build, newest activity first. More
  // builds come in below the last section; each section loads its own older
  // files, so a page never drops files into a section above.
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
        groupBy: 'build',
        cursor,
        limit: RUNTIME_UPLOAD_BUILDS_PER_PAGE,
        perBuild: RUNTIME_UPLOAD_FILES_PER_SECTION
      });
      const nextGroups: BuildRuntimeUploadGroup[] = Array.isArray(
        payload?.groups
      )
        ? payload.groups
        : [];
      const nextCursor = Number(payload?.nextCursor);
      setRuntimeUploadGroups((prev) => {
        if (!append) {
          return nextGroups;
        }
        const seenBuildIds = new Set(prev.map((group) => group.buildId));
        return [
          ...prev,
          ...nextGroups.filter((group) => !seenBuildIds.has(group.buildId))
        ];
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

  async function refreshRuntimeUploadSection(buildId: number) {
    try {
      const payload = await loadBuildRuntimeUploads({
        buildId,
        limit: RUNTIME_UPLOAD_FILES_PER_SECTION
      });
      const assets: BuildRuntimeUploadAsset[] = Array.isArray(payload?.assets)
        ? payload.assets
        : [];
      const nextCursor = Number(payload?.nextCursor);
      const fileCount = Number(payload?.fileCount);
      setRuntimeUploadGroups((prev) =>
        prev.map((group) =>
          group.buildId === buildId && assets.length > 0
            ? {
                ...group,
                assets,
                fileCount: Number.isFinite(fileCount)
                  ? fileCount
                  : group.fileCount,
                nextCursor:
                  Number.isFinite(nextCursor) && nextCursor > 0
                    ? nextCursor
                    : null
              }
            : group
        )
      );
    } catch (error) {
      console.error('Failed to refresh uploads for build:', error);
    }
  }

  async function handleLoadMoreRuntimeUploadsForBuild(buildId: number) {
    if (!isOwner || runtimeUploadsLoadingBuildId) return;
    const group = runtimeUploadGroups.find((item) => item.buildId === buildId);
    if (!group?.nextCursor) return;
    setRuntimeUploadsLoadingBuildId(buildId);
    setRuntimeUploadsError('');
    try {
      const payload = await loadBuildRuntimeUploads({
        buildId,
        cursor: group.nextCursor,
        limit: RUNTIME_UPLOAD_FILES_PER_PAGE
      });
      const nextAssets: BuildRuntimeUploadAsset[] = Array.isArray(
        payload?.assets
      )
        ? payload.assets
        : [];
      const nextCursor = Number(payload?.nextCursor);
      setRuntimeUploadGroups((prev) =>
        prev.map((item) => {
          if (item.buildId !== buildId) return item;
          const seenIds = new Set(item.assets.map((asset) => asset.id));
          return {
            ...item,
            assets: [
              ...item.assets,
              ...nextAssets.filter((asset) => !seenIds.has(asset.id))
            ],
            nextCursor:
              Number.isFinite(nextCursor) && nextCursor > 0 ? nextCursor : null
          };
        })
      );
      updateRuntimeUploadQuotaUsage(payload?.usage || null);
    } catch (error: any) {
      console.error('Failed to load more runtime uploads:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load uploaded files';
      setRuntimeUploadsError(message);
    } finally {
      setRuntimeUploadsLoadingBuildId(null);
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
    const validationError = await getBuildAssetUploadValidationError(file);
    if (validationError) {
      throw new Error(validationError);
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
    const sectionLoaded = runtimeUploadGroups.some(
      (group) => group.buildId === uploadedAsset.buildId
    );
    setRuntimeUploadGroups((prev) => {
      const existing = prev.find(
        (group) => group.buildId === uploadedAsset.buildId
      );
      const alreadyListed = Boolean(
        existing?.assets.some((asset) => asset.id === uploadedAsset.id)
      );
      const group: BuildRuntimeUploadGroup = existing
        ? {
            ...existing,
            fileCount: existing.fileCount + (alreadyListed ? 0 : 1),
            assets: [
              uploadedAsset,
              ...existing.assets.filter(
                (asset) => asset.id !== uploadedAsset.id
              )
            ]
          }
        : {
            buildId: uploadedAsset.buildId,
            buildTitle: uploadedAsset.buildTitle,
            buildSlug: uploadedAsset.buildSlug,
            buildIsPublic: uploadedAsset.buildIsPublic,
            fileCount: 1,
            assets: [uploadedAsset],
            nextCursor: null
          };
      return [
        group,
        ...prev.filter((item) => item.buildId !== uploadedAsset.buildId)
      ];
    });
    if (!sectionLoaded && isOwner) {
      // The build had no section yet: the placeholder holds just this file,
      // so fetch the build's first page for its older files and real total.
      void refreshRuntimeUploadSection(uploadedAsset.buildId);
    }
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
    const assetId = asset.id;
    const fileLabel = asset.originalFileName || asset.fileName || 'this file';
    const confirmed = await requestConfirm({
      title: 'Delete uploaded file',
      description: `Delete "${fileLabel}" from your ${SITE_NAME} uploads?`,
      descriptionFontSize: '1.35rem',
      confirmButtonColor: 'red',
      confirmButtonLabel: 'Delete',
      modalOverModal: true
    });
    if (!confirmed) return;
    setRuntimeUploadDeletingId(assetId);
    setRuntimeUploadsError('');
    try {
      const payload = await deleteBuildRuntimeUpload(assetId);
      setRuntimeUploadGroups((prev) =>
        prev.flatMap((group) => {
          if (!group.assets.some((item) => item.id === assetId)) {
            return [group];
          }
          const assets = group.assets.filter((item) => item.id !== assetId);
          const fileCount = Math.max(0, group.fileCount - 1);
          return fileCount > 0 ? [{ ...group, assets, fileCount }] : [];
        })
      );
      setCurrentBuildRuntimeAssets((prev) =>
        prev.filter((item) => item.id !== assetId)
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
    handleLoadMoreRuntimeUploadsForBuild,
    handleOpenRuntimeUploadsManager,
    handleRuntimeUploadsSyncFromPreview,
    runtimeUploadGroups,
    runtimeUploadDeletingId,
    runtimeUploadsError,
    runtimeUploadsLoading,
    runtimeUploadsLoadingBuildId,
    runtimeUploadsLoadingMore,
    runtimeUploadsModalShown,
    runtimeUploadsNextCursor
  };
}

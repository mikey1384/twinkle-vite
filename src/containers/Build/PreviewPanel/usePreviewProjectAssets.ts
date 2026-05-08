import {
  useEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import {
  createAgentAssetFile,
  isSupportedBuildAssetUploadFile,
  normalizeBuildAgentAssetLimit,
  type BuildAgentAssetCreateManyResult,
  type BuildAgentAssetCreateOptions,
  type BuildAgentAssetCreateResult,
  type BuildAgentAssetListOptions,
  type BuildAgentWorkspaceAssetsApi
} from './agentWorkspaceAssets';
import type {
  PreviewRuntimeUploadAsset,
  PreviewRuntimeUploadsSyncPayload
} from './types';
import {
  normalizeUploadInputFiles,
  summarizeUploadedFileNames
} from './previewHelpers';

declare global {
  interface Window {
    TwinkleBuildAgent?: {
      assets?: BuildAgentWorkspaceAssetsApi;
    };
  }
}

export default function usePreviewProjectAssets({
  areProjectFileMutationsLocked,
  buildId,
  codeWorkspaceAvailable,
  currentBuildRuntimeAssets,
  deleteBuildRuntimeFileRef,
  ensureBuildApiTokenForBuild,
  isActiveBuildId,
  isOwner,
  listBuildRuntimeFilesRef,
  onOpenRuntimeUploadsManager,
  onRuntimeUploadsSyncRef,
  runtimeOnly,
  setProjectFileError,
  uploadBuildRuntimeFilesRef
}: {
  areProjectFileMutationsLocked: () => boolean;
  buildId: number;
  codeWorkspaceAvailable: boolean;
  currentBuildRuntimeAssets: PreviewRuntimeUploadAsset[];
  deleteBuildRuntimeFileRef: RefObject<(...args: any[]) => Promise<any>>;
  ensureBuildApiTokenForBuild: (
    requiredScopes: string[],
    targetBuildId: number
  ) => Promise<string>;
  isActiveBuildId: (targetBuildId: number) => boolean;
  isOwner: boolean;
  listBuildRuntimeFilesRef: RefObject<(...args: any[]) => Promise<any>>;
  onOpenRuntimeUploadsManager?: (() => void) | null;
  onRuntimeUploadsSyncRef: RefObject<
    ((payload: PreviewRuntimeUploadsSyncPayload | null) => void) | null
  >;
  runtimeOnly: boolean;
  setProjectFileError: (message: string) => void;
  uploadBuildRuntimeFilesRef: RefObject<(...args: any[]) => Promise<any>>;
}) {
  const [workspaceRuntimeAssets, setWorkspaceRuntimeAssets] = useState<
    PreviewRuntimeUploadAsset[]
  >(currentBuildRuntimeAssets);
  const agentAssetApiRef = useRef<BuildAgentWorkspaceAssetsApi | null>(null);

  useEffect(() => {
    setWorkspaceRuntimeAssets(currentBuildRuntimeAssets);
  }, [currentBuildRuntimeAssets]);

  async function syncCurrentBuildRuntimeUploads(
    token: string,
    targetBuildId = Number(buildId || 0)
  ) {
    try {
      const payload = await listBuildRuntimeFilesRef.current({
        buildId: targetBuildId,
        limit: 30,
        token
      });
      if (!isActiveBuildId(targetBuildId)) {
        return payload;
      }
      setWorkspaceRuntimeAssets(
        Array.isArray(payload?.assets) ? payload.assets : []
      );
      onRuntimeUploadsSyncRef.current?.({
        assets: Array.isArray(payload?.assets) ? payload.assets : [],
        nextCursor:
          Number.isFinite(Number(payload?.nextCursor)) &&
          Number(payload?.nextCursor) > 0
            ? Math.floor(Number(payload.nextCursor))
            : null,
        usage: payload?.usage || null
      });
      return payload;
    } catch (error) {
      console.error(
        'Failed to sync current build assets after upload',
        error
      );
    }
    return null;
  }

  async function cleanupRestoredRuntimeAssets(
    assets: PreviewRuntimeUploadAsset[],
    token: string | null,
    targetBuildId = Number(buildId || 0)
  ) {
    if (!token || assets.length === 0) {
      return;
    }
    for (const asset of assets) {
      await deleteBuildRuntimeFileRef.current({
        buildId: targetBuildId,
        assetId: asset.id,
        token
      }).catch(() => {});
    }
    await syncCurrentBuildRuntimeUploads(token, targetBuildId).catch((error) => {
      console.error(
        'Failed to sync runtime uploads after cleanup of imported assets',
        error
      );
    });
  }

  useEffect(() => {
    if (!isOwner || runtimeOnly) return;
    let cancelled = false;

    async function loadWorkspaceRuntimeAssets() {
      try {
        const token = await ensureBuildApiTokenForBuild(
          ['files:read'],
          buildId
        );
        const payload = await listBuildRuntimeFilesRef.current({
          buildId,
          limit: 30,
          token
        });
        if (cancelled) return;
        const nextAssets = Array.isArray(payload?.assets)
          ? payload.assets
          : [];
        setWorkspaceRuntimeAssets(nextAssets);
        onRuntimeUploadsSyncRef.current?.({
          assets: nextAssets,
          nextCursor:
            Number.isFinite(Number(payload?.nextCursor)) &&
            Number(payload?.nextCursor) > 0
              ? Math.floor(Number(payload.nextCursor))
              : null,
          usage: payload?.usage || null
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load current build assets', error);
      }
    }

    void loadWorkspaceRuntimeAssets();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner, runtimeOnly]);

  function ensureAgentAssetAccess(options?: { requireWritable?: boolean }) {
    if (!isOwner || runtimeOnly || !codeWorkspaceAvailable) {
      throw new Error(
        'Project asset authoring is available only in an editable build workspace.'
      );
    }
    if (options?.requireWritable && areProjectFileMutationsLocked()) {
      throw new Error('Project files are temporarily locked.');
    }
  }

  async function createManyAgentProjectAssets(
    items: BuildAgentAssetCreateOptions[]
  ): Promise<BuildAgentAssetCreateManyResult> {
    ensureAgentAssetAccess({ requireWritable: true });
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Provide at least one asset to upload.');
    }

    const files = await Promise.all(
      items.map((item) => createAgentAssetFile(item))
    );
    const unsupportedFileNames = files
      .filter((file) => !isSupportedBuildAssetUploadFile(file))
      .map((file) => file.name);
    if (unsupportedFileNames.length > 0) {
      throw new Error(
        `Project assets support image and audio files. Unsupported: ${summarizeUploadedFileNames(
          unsupportedFileNames
        )}`
      );
    }

    const uploadTargetBuildId = Number(buildId || 0);
    const token = await ensureBuildApiTokenForBuild(
      ['files:read', 'files:write'],
      uploadTargetBuildId
    );
    const payload = await uploadBuildRuntimeFilesRef.current({
      buildId: uploadTargetBuildId,
      files,
      token
    });
    const assets = Array.isArray(payload?.assets) ? payload.assets : [];
    await syncCurrentBuildRuntimeUploads(token, uploadTargetBuildId);
    const failed = Array.isArray(payload?.failed) ? payload.failed : [];
    if (assets.length === 0 && failed.length > 0) {
      const firstMessage =
        failed
          .map((entry: any) => String(entry?.message || '').trim())
          .find(Boolean) || 'Asset upload failed.';
      throw new Error(firstMessage);
    }
    return {
      success: failed.length === 0,
      assets,
      failed: failed.map((entry: any) => ({
        fileName: String(entry?.fileName || ''),
        message: entry?.message ? String(entry.message) : undefined
      }))
    };
  }

  async function createAgentProjectAsset(
    options: BuildAgentAssetCreateOptions
  ): Promise<BuildAgentAssetCreateResult> {
    const result = await createManyAgentProjectAssets([options]);
    const asset = result.assets[0] || null;
    if (!asset) {
      throw new Error('Asset upload did not return an uploaded asset.');
    }
    return {
      success: true,
      asset,
      url: asset.url,
      stableUrl: asset.url,
      reference: asset.url
    };
  }

  async function listAgentProjectAssets(
    options: BuildAgentAssetListOptions = {}
  ) {
    ensureAgentAssetAccess();
    const targetBuildId = Number(buildId || 0);
    const token = await ensureBuildApiTokenForBuild(
      ['files:read'],
      targetBuildId
    );
    const payload = await listBuildRuntimeFilesRef.current({
      buildId: targetBuildId,
      cursor:
        Number.isFinite(Number(options.cursor)) && Number(options.cursor) > 0
          ? Math.floor(Number(options.cursor))
          : undefined,
      limit: normalizeBuildAgentAssetLimit(options.limit),
      token
    });
    return {
      assets: Array.isArray(payload?.assets) ? payload.assets : [],
      nextCursor:
        Number.isFinite(Number(payload?.nextCursor)) &&
        Number(payload?.nextCursor) > 0
          ? Math.floor(Number(payload.nextCursor))
          : null,
      usage: payload?.usage || null
    };
  }

  async function deleteAgentProjectAsset(assetId: number) {
    ensureAgentAssetAccess({ requireWritable: true });
    const normalizedAssetId = Math.floor(Number(assetId));
    if (!Number.isFinite(normalizedAssetId) || normalizedAssetId <= 0) {
      throw new Error('assetId is required.');
    }
    const targetBuildId = Number(buildId || 0);
    const token = await ensureBuildApiTokenForBuild(
      ['files:read', 'files:write'],
      targetBuildId
    );
    const payload = await deleteBuildRuntimeFileRef.current({
      buildId: targetBuildId,
      assetId: normalizedAssetId,
      token
    });
    await syncCurrentBuildRuntimeUploads(token, targetBuildId);
    return {
      success: Boolean(payload?.success)
    };
  }

  agentAssetApiRef.current = {
    create: createAgentProjectAsset,
    createMany: createManyAgentProjectAssets,
    list: listAgentProjectAssets,
    delete: deleteAgentProjectAsset,
    openManager: () => {
      onOpenRuntimeUploadsManager?.();
    }
  };

  useEffect(() => {
    if (!isOwner || runtimeOnly || !codeWorkspaceAvailable) return;
    const previousAssetsApi = window.TwinkleBuildAgent?.assets;
    const assetsApi: BuildAgentWorkspaceAssetsApi = {
      create: (options) => {
        if (!agentAssetApiRef.current) {
          return Promise.reject(new Error('Asset API is not ready.'));
        }
        return agentAssetApiRef.current.create(options);
      },
      createMany: (items) => {
        if (!agentAssetApiRef.current) {
          return Promise.reject(new Error('Asset API is not ready.'));
        }
        return agentAssetApiRef.current.createMany(items);
      },
      list: (options) => {
        if (!agentAssetApiRef.current) {
          return Promise.reject(new Error('Asset API is not ready.'));
        }
        return agentAssetApiRef.current.list(options);
      },
      delete: (assetId) => {
        if (!agentAssetApiRef.current) {
          return Promise.reject(new Error('Asset API is not ready.'));
        }
        return agentAssetApiRef.current.delete(assetId);
      },
      openManager: () => {
        agentAssetApiRef.current?.openManager();
      }
    };
    window.TwinkleBuildAgent = {
      ...(window.TwinkleBuildAgent || {}),
      assets: assetsApi
    };
    return () => {
      const currentAgentApi = window.TwinkleBuildAgent;
      if (currentAgentApi?.assets !== assetsApi) return;
      if (previousAssetsApi) {
        currentAgentApi.assets = previousAssetsApi;
        return;
      }
      delete currentAgentApi.assets;
      if (Object.keys(currentAgentApi).length === 0) {
        delete window.TwinkleBuildAgent;
      }
    };
  }, [buildId, codeWorkspaceAvailable, isOwner, runtimeOnly]);

  async function handleUploadProjectAssets(
    uploadInput: FileList | File[] | null
  ) {
    if (!isOwner || areProjectFileMutationsLocked()) {
      return {
        success: false,
        uploadedCount: 0,
        error: 'Project files are temporarily locked.'
      };
    }
    const uploadedFiles = normalizeUploadInputFiles(uploadInput);
    if (uploadedFiles.length === 0) {
      return {
        success: false,
        uploadedCount: 0,
        error: 'No files were selected.'
      };
    }

    const supportedFiles = uploadedFiles.filter(
      isSupportedBuildAssetUploadFile
    );
    const unsupportedFileNames = uploadedFiles
      .filter((file) => !isSupportedBuildAssetUploadFile(file))
      .map((file) => file.name);

    if (supportedFiles.length === 0) {
      const message = `Only image and audio assets are supported right now. Unsupported: ${summarizeUploadedFileNames(
        unsupportedFileNames
      )}`;
      setProjectFileError(message);
      return {
        success: false,
        uploadedCount: 0,
        error: message
      };
    }

    setProjectFileError('');

    try {
      const uploadTargetBuildId = Number(buildId || 0);
      const token = await ensureBuildApiTokenForBuild(
        ['files:read', 'files:write'],
        uploadTargetBuildId
      );
      const payload = await uploadBuildRuntimeFilesRef.current({
        buildId: uploadTargetBuildId,
        files: supportedFiles,
        token
      });
      await syncCurrentBuildRuntimeUploads(token, uploadTargetBuildId);
      const uploadedAssets = Array.isArray(payload?.assets)
        ? payload.assets
        : [];
      const failedUploads = Array.isArray(payload?.failed)
        ? payload.failed
        : [];
      const warnings: string[] = [];
      if (unsupportedFileNames.length > 0) {
        warnings.push(
          `Skipped unsupported assets: ${summarizeUploadedFileNames(
            unsupportedFileNames
          )}`
        );
      }
      if (failedUploads.length > 0) {
        warnings.push(
          `Some assets failed to upload: ${summarizeUploadedFileNames(
            failedUploads.map((entry: any) => entry.fileName)
          )}`
        );
      }
      if (!isActiveBuildId(uploadTargetBuildId)) {
        const warningText = [
          ...warnings,
          'Asset upload finished on the previous build because you switched builds before it completed.'
        ].join(' ');
        setProjectFileError(warningText);
        return {
          success: true,
          uploadedCount: uploadedAssets.length,
          assets: uploadedAssets,
          warningText
        };
      }
      if (uploadedAssets.length > 0) {
        onOpenRuntimeUploadsManager?.();
      }
      const warningText = warnings.join(' ');
      setProjectFileError(warningText);
      return {
        success: true,
        uploadedCount: uploadedAssets.length,
        assets: uploadedAssets,
        warningText
      };
    } catch (error: any) {
      console.error('Failed to upload project assets', error);
      const message = error?.message || 'Failed to upload project assets.';
      setProjectFileError(message);
      return {
        success: false,
        uploadedCount: 0,
        error: message
      };
    }
  }

  return {
    cleanupRestoredRuntimeAssets,
    createAgentProjectAsset,
    handleUploadProjectAssets,
    syncCurrentBuildRuntimeUploads,
    workspaceRuntimeAssets
  };
}

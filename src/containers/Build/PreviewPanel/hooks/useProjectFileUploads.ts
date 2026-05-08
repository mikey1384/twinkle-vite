import type { RefObject } from 'react';
import {
  isSupportedBuildAssetUploadFile
} from '../agentWorkspaceAssets';
import type {
  EditableProjectFile,
  PreviewRuntimeUploadAsset
} from '../types';
import {
  getPreferredIndexPath,
  isIndexHtmlPath,
  normalizeProjectFilePath
} from '../projectFiles';
import {
  IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX,
  buildImportedRuntimeAttachmentDocumentBasePathsByScript,
  getImportedRuntimeAttachmentSourcePath,
  getImportedRuntimeOriginalAttachmentAssetId,
  getImportedRuntimeThumbAttachmentAssetId,
  importedProjectFileReferencesLocalAsset,
  importedProjectFileReferencesRuntimeAttachment,
  isSupportedBuildProjectUploadFile,
  mergeEditableProjectFiles,
  normalizeUploadInputFiles,
  readLatestEditableProjectFiles,
  resolveUploadedProjectFilePath,
  rewriteImportedProjectFilesWithRuntimeAssetUrls,
  summarizeUploadedFileNames
} from '../previewHelpers';

export default function useProjectFileUploads({
  areProjectFileMutationsLocked,
  buildId,
  buildRef,
  cleanupRestoredRuntimeAssets,
  code,
  editableProjectFilesRef,
  ensureBuildApiTokenForBuild,
  getProjectFileCaseCollisionError,
  isActiveBuildId,
  isOwner,
  persistedProjectFiles,
  saveEditableProjectFilesWithTracking,
  selectedFolderPath,
  setActiveFilePath,
  setEditableFiles,
  setNewFilePath,
  setProjectFileError,
  setSelectedFolderPath,
  syncCurrentBuildRuntimeUploads,
  uploadBuildRuntimeFilesRef
}: {
  areProjectFileMutationsLocked: () => boolean;
  buildId: number;
  buildRef: RefObject<{ id: number } | null>;
  cleanupRestoredRuntimeAssets: (
    assets: PreviewRuntimeUploadAsset[],
    token: string | null,
    targetBuildId?: number
  ) => Promise<void>;
  code: string | null | undefined;
  editableProjectFilesRef: RefObject<EditableProjectFile[]>;
  ensureBuildApiTokenForBuild: (
    requiredScopes: string[],
    targetBuildId: number
  ) => Promise<string>;
  getProjectFileCaseCollisionError: (
    files: EditableProjectFile[]
  ) => string | null;
  isActiveBuildId: (targetBuildId: number) => boolean;
  isOwner: boolean;
  persistedProjectFiles: EditableProjectFile[];
  saveEditableProjectFilesWithTracking: (options: {
    files: EditableProjectFile[];
    fallbackError: string;
    targetBuildId?: number | null;
    targetBuildCode?: string | null;
  }) => Promise<{
    success: boolean;
    error?: string;
    savedSignature?: string;
  }>;
  selectedFolderPath: string | null;
  setActiveFilePath: (path: string) => void;
  setEditableFiles: (
    nextFiles: EditableProjectFile[],
    options?: { markDirty?: boolean }
  ) => void;
  setNewFilePath: (path: string) => void;
  setProjectFileError: (message: string) => void;
  setSelectedFolderPath: (path: string | null) => void;
  syncCurrentBuildRuntimeUploads: (
    token: string,
    targetBuildId?: number
  ) => Promise<any>;
  uploadBuildRuntimeFilesRef: RefObject<(...args: any[]) => Promise<any>>;
}) {
  async function handleUploadProjectFiles(
    uploadInput: FileList | File[] | null,
    options?: {
      requireRelativePaths?: boolean;
      requireRootIndexHtml?: boolean;
      restoreExportedRuntimeAssets?: boolean;
      restoreReferencedLocalAssets?: boolean;
      targetFolderPath?: string | null;
    }
  ) {
    if (!isOwner || areProjectFileMutationsLocked()) {
      return {
        success: false,
        importedCount: 0,
        error: 'Project files are temporarily locked.'
      };
    }
    const uploadedFiles = normalizeUploadInputFiles(uploadInput);
    if (uploadedFiles.length === 0) {
      return {
        success: false,
        importedCount: 0,
        error: 'No files were selected.'
      };
    }
    const selectedFolderPathAtStart =
      options && Object.prototype.hasOwnProperty.call(options, 'targetFolderPath')
        ? options.targetFolderPath ?? null
        : selectedFolderPath;

    if (
      options?.requireRelativePaths &&
      uploadedFiles.some((file) => !String(file.webkitRelativePath || '').trim())
    ) {
      const message =
        'This browser did not preserve folder paths for the selected project. Try importing the folder again.';
      setProjectFileError(message);
      return {
        success: false,
        importedCount: 0,
        error: message
      };
    }

    const resolvedUploadEntries = uploadedFiles.map((file) => {
      const normalizedPath = resolveUploadedProjectFilePath({
        file,
        selectedFolderPath: selectedFolderPathAtStart
      });
      const importedRuntimeAttachmentSourcePath =
        getImportedRuntimeAttachmentSourcePath(file);
      const isValidPath =
        Boolean(normalizedPath) &&
        normalizedPath !== '/' &&
        !normalizedPath.endsWith('/');
      return {
        file,
        normalizedPath,
        isValidPath,
        isProjectTextFile: isSupportedBuildProjectUploadFile(file),
        isSupportedAssetFile: isSupportedBuildAssetUploadFile(file),
        importedRuntimeAttachmentSourcePath,
        isImportedRuntimeAttachment:
          isValidPath && Boolean(importedRuntimeAttachmentSourcePath)
      };
    });

    const textUploadEntries = resolvedUploadEntries.filter(
      (entry) =>
        entry.isProjectTextFile &&
        entry.isValidPath &&
        !(options?.restoreExportedRuntimeAssets && entry.isImportedRuntimeAttachment)
    );
    const importableRuntimeAttachmentEntries =
      options?.restoreExportedRuntimeAssets
        ? resolvedUploadEntries.filter(
            (entry) => entry.isValidPath && entry.isImportedRuntimeAttachment
          )
        : [];
    const importableLocalAssetEntries = options?.restoreReferencedLocalAssets
      ? resolvedUploadEntries.filter(
          (entry) =>
            entry.isValidPath &&
            entry.isSupportedAssetFile &&
            !entry.isProjectTextFile &&
            !entry.isImportedRuntimeAttachment
        )
      : [];
    const unsupportedFileNames = resolvedUploadEntries
      .filter(
        (entry) =>
          !entry.isProjectTextFile &&
          !importableRuntimeAttachmentEntries.some(
            (candidate) => candidate.file === entry.file
          ) &&
          !importableLocalAssetEntries.some(
            (candidate) => candidate.file === entry.file
          )
      )
      .map((entry) => entry.file.name);

    if (textUploadEntries.length === 0) {
      const message = `Only text project files are supported right now. Unsupported: ${summarizeUploadedFileNames(
        unsupportedFileNames
      )}`;
      setProjectFileError(message);
      return {
        success: false,
        importedCount: 0,
        error: message
      };
    }

    const uploadedProjectFiles: EditableProjectFile[] = [];
    const failedFileNames: string[] = resolvedUploadEntries
      .filter(
        (entry) =>
          entry.isProjectTextFile &&
          !entry.isValidPath &&
          !(options?.restoreExportedRuntimeAssets && entry.isImportedRuntimeAttachment)
      )
      .map((entry) => entry.file.name);

    for (const entry of textUploadEntries) {
      try {
        const content = await entry.file.text();
        uploadedProjectFiles.push({
          path: entry.normalizedPath,
          content
        });
      } catch (error) {
        console.error('Failed to read uploaded project file', error);
        failedFileNames.push(entry.file.name);
      }
    }

    if (uploadedProjectFiles.length === 0) {
      const message =
        failedFileNames.length > 0
          ? `Failed to read: ${summarizeUploadedFileNames(failedFileNames)}`
          : 'No valid project files were uploaded.';
      setProjectFileError(message);
      return {
        success: false,
        importedCount: 0,
        error: message
      };
    }

    const uploadByPath = new Map<string, string>();
    for (const file of uploadedProjectFiles) {
      uploadByPath.set(file.path, file.content);
    }
    let dedupedUploads = Array.from(uploadByPath.entries()).map(
      ([path, content]) => ({
        path,
        content
      })
    );
    if (
      options?.requireRootIndexHtml &&
      !dedupedUploads.some((file) => isIndexHtmlPath(file.path))
    ) {
      const message =
        'Imported project folders must contain a root index.html or index.htm file.';
      setProjectFileError(message);
      return {
        success: false,
        importedCount: 0,
        error: message
      };
    }
    const latestEditableProjectFiles = readLatestEditableProjectFiles(
      editableProjectFilesRef
    );
    const collisionPaths = dedupedUploads
      .filter((file) =>
        latestEditableProjectFiles.some(
          (existingFile) => existingFile.path === file.path
        )
      )
      .map((file) => file.path)
      .sort((a, b) => a.localeCompare(b));

    if (collisionPaths.length > 0) {
      const shouldReplace = window.confirm(
        `Replace existing files?\n\n${summarizeUploadedFileNames(
          collisionPaths
        )}`
      );
      if (!shouldReplace) {
        const message = 'Upload cancelled. Existing files were not replaced.';
        setProjectFileError(message);
        return {
          success: false,
          importedCount: 0,
          error: message
        };
      }
    }
    const mergedProjectFilesForReferenceDetection = mergeEditableProjectFiles(
      latestEditableProjectFiles,
      dedupedUploads
    );
    const mergedProjectFileContentByPath = new Map(
      mergedProjectFilesForReferenceDetection.map((file) => [
        file.path,
        file.content || ''
      ])
    );
    const {
      documentBaseFilePathByScriptPath,
      documentBaseFilePathsByScriptPath
    } = buildImportedRuntimeAttachmentDocumentBasePathsByScript(
      mergedProjectFilesForReferenceDetection
    );

    const uploadWarnings: string[] = [];
    let runtimeAssetToken: string | null = null;
    const restoredRuntimeAssets: PreviewRuntimeUploadAsset[] = [];
    const uploadTargetBuildId = Number(
      buildRef.current?.id || buildId || 0
    );

    function didUploadTargetBuildChange() {
      return !isActiveBuildId(uploadTargetBuildId);
    }
    if (
      importableRuntimeAttachmentEntries.length > 0 ||
      importableLocalAssetEntries.length > 0
    ) {
      const referencedRuntimeAttachmentEntries =
        importableRuntimeAttachmentEntries.filter((entry) =>
          mergedProjectFilesForReferenceDetection.some((file) =>
            importedProjectFileReferencesRuntimeAttachment({
              filePath: file.path,
              content: file.content,
              attachmentPath: entry.normalizedPath,
              documentBaseFilePath:
                documentBaseFilePathByScriptPath.get(
                  normalizeProjectFilePath(file.path)
                ) || null,
              documentBaseFilePaths:
                documentBaseFilePathsByScriptPath.get(
                  normalizeProjectFilePath(file.path)
                ) || null
            })
          )
        );
      const referencedLocalAssetEntries = importableLocalAssetEntries.filter(
        (entry) =>
          mergedProjectFilesForReferenceDetection.some((file) =>
            importedProjectFileReferencesLocalAsset({
              filePath: file.path,
              content: file.content,
              assetPath: entry.normalizedPath,
              documentBaseFilePath:
                documentBaseFilePathByScriptPath.get(
                  normalizeProjectFilePath(file.path)
                ) || null,
              documentBaseFilePaths:
                documentBaseFilePathsByScriptPath.get(
                  normalizeProjectFilePath(file.path)
                ) || null
            })
          )
      );
      const skippedLocalAssetNames = importableLocalAssetEntries
        .filter(
          (entry) =>
            !referencedLocalAssetEntries.some(
              (candidate) => candidate.file === entry.file
            )
        )
        .map((entry) => entry.file.name);

      if (
        referencedRuntimeAttachmentEntries.length > 0 ||
        referencedLocalAssetEntries.length > 0
      ) {
        const uploadedRuntimeAssets: PreviewRuntimeUploadAsset[] = [];
        const replacementUrlByAttachmentPath = new Map<string, string>();

        try {
          runtimeAssetToken = await ensureBuildApiTokenForBuild(
            ['files:read', 'files:write'],
            uploadTargetBuildId
          );

          const referencedOriginalEntriesByAssetId = new Map<
            string,
            (typeof referencedRuntimeAttachmentEntries)[number]
          >();
          for (const entry of referencedRuntimeAttachmentEntries) {
            const originalAssetId =
              getImportedRuntimeOriginalAttachmentAssetId(
                entry.importedRuntimeAttachmentSourcePath ||
                  entry.normalizedPath
              );
            if (originalAssetId) {
              referencedOriginalEntriesByAssetId.set(originalAssetId, entry);
            }
          }

          const pairedThumbEntriesByOriginalAssetId = new Map<
            string,
            Array<(typeof referencedRuntimeAttachmentEntries)[number]>
          >();
          const runtimeAttachmentEntriesToUpload: Array<
            (typeof referencedRuntimeAttachmentEntries)[number]
          > = [];

          for (const entry of referencedRuntimeAttachmentEntries) {
            const thumbAssetId = getImportedRuntimeThumbAttachmentAssetId(
              entry.importedRuntimeAttachmentSourcePath ||
                entry.normalizedPath
            );
            if (
              thumbAssetId &&
              referencedOriginalEntriesByAssetId.has(thumbAssetId)
            ) {
              const nextEntries =
                pairedThumbEntriesByOriginalAssetId.get(thumbAssetId) || [];
              nextEntries.push(entry);
              pairedThumbEntriesByOriginalAssetId.set(
                thumbAssetId,
                nextEntries
              );
              continue;
            }
            runtimeAttachmentEntriesToUpload.push(entry);
          }

          const deferredThumbEntries: Array<
            (typeof referencedRuntimeAttachmentEntries)[number]
          > = [];

          async function uploadRuntimeAttachmentEntry(
            entry: (typeof referencedRuntimeAttachmentEntries)[number]
          ) {
            const payload = await uploadBuildRuntimeFilesRef.current({
              buildId: uploadTargetBuildId,
              files: [entry.file],
              token: runtimeAssetToken
            });
            const asset = Array.isArray(payload?.assets)
              ? payload.assets[0]
              : null;
            const runtimeAttachmentSourcePath =
              entry.importedRuntimeAttachmentSourcePath ||
              entry.normalizedPath;
            const replacementUrl = runtimeAttachmentSourcePath.startsWith(
              IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX
            )
              ? String(asset?.thumbUrl || asset?.url || '')
              : String(asset?.url || '');

            if (!asset || !replacementUrl) {
              throw new Error(
                `Failed to restore bundled asset "${entry.file.name}".`
              );
            }

            uploadedRuntimeAssets.push(asset);
            restoredRuntimeAssets.push(asset);
            replacementUrlByAttachmentPath.set(
              entry.normalizedPath,
              replacementUrl
            );

            return asset;
          }

          for (const entry of runtimeAttachmentEntriesToUpload) {
            const asset = await uploadRuntimeAttachmentEntry(entry);
            const originalAssetId = getImportedRuntimeOriginalAttachmentAssetId(
              entry.importedRuntimeAttachmentSourcePath ||
                entry.normalizedPath
            );
            if (!originalAssetId) {
              continue;
            }
            const pairedThumbEntries =
              pairedThumbEntriesByOriginalAssetId.get(originalAssetId) || [];
            if (pairedThumbEntries.length === 0) {
              continue;
            }
            const pairedThumbUrl = String(asset?.thumbUrl || '');
            if (!pairedThumbUrl) {
              deferredThumbEntries.push(...pairedThumbEntries);
              continue;
            }
            for (const thumbEntry of pairedThumbEntries) {
              replacementUrlByAttachmentPath.set(
                thumbEntry.normalizedPath,
                pairedThumbUrl
              );
            }
          }

          for (const thumbEntry of deferredThumbEntries) {
            await uploadRuntimeAttachmentEntry(thumbEntry);
          }

          for (const entry of referencedLocalAssetEntries) {
            await uploadRuntimeAttachmentEntry(entry);
          }
        } catch (error: any) {
          await cleanupRestoredRuntimeAssets(
            uploadedRuntimeAssets,
            runtimeAssetToken,
            uploadTargetBuildId
          );
          console.error('Failed to restore bundled runtime assets', error);
          const message =
            error?.message || 'Failed to restore imported media assets.';
          setProjectFileError(message);
          return {
            success: false,
            importedCount: 0,
            error: message
          };
        }

        const rewrittenMergedProjectFiles =
          rewriteImportedProjectFilesWithRuntimeAssetUrls({
            files: mergedProjectFilesForReferenceDetection,
            replacementUrlByAttachmentPath,
            documentBaseFilePathByScriptPath,
            documentBaseFilePathsByScriptPath
          });
        const nextUploadsByPath = new Map(
          dedupedUploads.map((file) => [file.path, file.content || ''])
        );
        for (const file of rewrittenMergedProjectFiles) {
          const previousContent =
            mergedProjectFileContentByPath.get(file.path) ?? '';
          const nextContent = file.content || '';
          if (previousContent !== nextContent) {
            nextUploadsByPath.set(file.path, nextContent);
          }
        }
        dedupedUploads = Array.from(nextUploadsByPath.entries()).map(
          ([path, content]) => ({
            path,
            content
          })
        );
      }
      if (skippedLocalAssetNames.length > 0) {
        uploadWarnings.push(
          `Skipped local media files that were not referenced by imported code: ${summarizeUploadedFileNames(
            skippedLocalAssetNames
          )}`
        );
      }
    }

    const nextEditableFiles = mergeEditableProjectFiles(
      readLatestEditableProjectFiles(editableProjectFilesRef),
      dedupedUploads
    );
    const nextPersistedFiles = mergeEditableProjectFiles(
      persistedProjectFiles,
      dedupedUploads
    );
    function buildProjectImportWarningText(
      additionalWarnings: string[] = []
    ) {
      const nextWarnings = [...uploadWarnings];
      if (unsupportedFileNames.length > 0) {
        nextWarnings.push(
          `Skipped unsupported files: ${summarizeUploadedFileNames(
            unsupportedFileNames
          )}`
        );
      }
      if (failedFileNames.length > 0) {
        nextWarnings.push(
          `Failed to read: ${summarizeUploadedFileNames(failedFileNames)}`
        );
      }
      nextWarnings.push(
        ...additionalWarnings
          .map((warning) => String(warning || '').trim())
          .filter(Boolean)
      );
      return nextWarnings.join(' ');
    }
    const collisionError = getProjectFileCaseCollisionError(nextEditableFiles);
    if (collisionError) {
      await cleanupRestoredRuntimeAssets(
        restoredRuntimeAssets,
        runtimeAssetToken,
        uploadTargetBuildId
      );
      setProjectFileError(collisionError);
      return {
        success: false,
        importedCount: 0,
        error: collisionError
      };
    }
    const preferredUploadedPath =
      dedupedUploads.find((file) => isIndexHtmlPath(file.path))?.path ||
      dedupedUploads[0]?.path ||
      getPreferredIndexPath(nextEditableFiles) ||
      nextEditableFiles[0]?.path ||
      '/index.html';

    if (runtimeAssetToken && restoredRuntimeAssets.length > 0) {
      const saveResult = await saveEditableProjectFilesWithTracking({
        files: nextPersistedFiles,
        fallbackError: 'Failed to save imported project files',
        targetBuildId: uploadTargetBuildId,
        targetBuildCode: code
      });
      if (!saveResult.success) {
        await cleanupRestoredRuntimeAssets(
          restoredRuntimeAssets,
          runtimeAssetToken,
          uploadTargetBuildId
        );
        return {
          success: false,
          importedCount: 0,
          error:
            saveResult.error || 'Failed to save imported project files.'
        };
      }
      if (didUploadTargetBuildChange()) {
        const warningText = buildProjectImportWarningText([
          'Import finished on the previous build because you switched builds before it completed.'
        ]);
        setProjectFileError(warningText);
        return {
          success: true,
          importedCount: dedupedUploads.length,
          warningText
        };
      }
      // Keep unrelated draft edits local instead of silently committing them
      // just because bundled runtime assets needed an immediate save.
      setEditableFiles(nextEditableFiles, { markDirty: true });
    } else {
      if (didUploadTargetBuildChange()) {
        return {
          success: false,
          importedCount: 0,
          error:
            'Build changed while the import was in progress. Please retry on the active build.'
        };
      }
      setEditableFiles(nextEditableFiles, { markDirty: true });
    }
    setActiveFilePath(preferredUploadedPath);
    setSelectedFolderPath(null);
    setNewFilePath('');

    if (runtimeAssetToken) {
      await syncCurrentBuildRuntimeUploads(runtimeAssetToken, uploadTargetBuildId);
    }
    const warningText = buildProjectImportWarningText();
    setProjectFileError(warningText);
    return {
      success: true,
      importedCount: dedupedUploads.length,
      warningText
    };
  }

  async function handleImportProjectFolder(fileList: FileList | null) {
    await handleUploadProjectFiles(fileList, {
      requireRelativePaths: true,
      requireRootIndexHtml: !selectedFolderPath,
      restoreExportedRuntimeAssets: true,
      restoreReferencedLocalAssets: true
    });
  }

  return {
    handleImportProjectFolder,
    handleUploadProjectFiles
  };
}

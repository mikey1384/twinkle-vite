import type {
  Dispatch,
  RefObject,
  SetStateAction
} from 'react';
import {
  getPreferredIndexPath,
  isIndexHtmlPath,
  isPathWithinFolder,
  listCaseInsensitiveProjectFileCollisionPaths,
  normalizeProjectFilePath,
  remapPathPrefix,
  serializeEditableProjectFiles
} from '../projectFiles';
import type {
  Build,
  EditableProjectFile
} from '../types';
import {
  buildProjectExportBaseName,
  readLatestEditableProjectFiles,
  summarizeUploadedFileNames,
  triggerBrowserDownload
} from '../previewHelpers';

export default function useProjectFileActions({
  activeFile,
  build,
  buildApiTokenRef,
  buildRef,
  downloadingProjectArchive,
  downloadingProjectArchiveRef,
  downloadBuildProjectArchive,
  editableProjectFiles,
  editableProjectFilesRef,
  folderMoveTargetPath,
  getBuildApiTokenRef,
  hasUnsavedProjectFileChanges,
  isOwner,
  isShowingStreamingCode,
  newFilePath,
  onSaveProjectFiles,
  renamePathInput,
  savingProjectFiles,
  savingProjectFilesRef,
  selectedFolderPath,
  setActiveFilePath,
  setCollapsedFolders,
  setDownloadingProjectArchive,
  setEditableProjectFiles,
  setFolderMoveTargetPath,
  setHasLocalEditableProjectFileChanges,
  setNewFilePath,
  setProjectFileError,
  setProjectFileSaveError,
  setRenamePathInput,
  setSavingProjectFiles,
  setSelectedFolderPath
}: {
  activeFile: EditableProjectFile | null;
  build: Build;
  buildApiTokenRef: RefObject<{
    buildId?: number;
    token: string;
    scopes: string[];
    expiresAt: number;
  } | null>;
  buildRef: RefObject<Build>;
  downloadingProjectArchive: boolean;
  downloadingProjectArchiveRef: RefObject<boolean>;
  downloadBuildProjectArchive: (buildId: number) => Promise<any>;
  editableProjectFiles: EditableProjectFile[];
  editableProjectFilesRef: RefObject<EditableProjectFile[]>;
  folderMoveTargetPath: string;
  getBuildApiTokenRef: RefObject<(...args: any[]) => Promise<any>>;
  hasUnsavedProjectFileChanges: boolean;
  isOwner: boolean;
  isShowingStreamingCode: boolean;
  newFilePath: string;
  onSaveProjectFiles: (
    files: EditableProjectFile[],
    options: {
      targetBuildId?: number | null;
      targetBuildCode?: string | null;
    }
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  renamePathInput: string;
  savingProjectFiles: boolean;
  savingProjectFilesRef: RefObject<boolean>;
  selectedFolderPath: string | null;
  setActiveFilePath: Dispatch<SetStateAction<string>>;
  setCollapsedFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
  setDownloadingProjectArchive: Dispatch<SetStateAction<boolean>>;
  setEditableProjectFiles: Dispatch<SetStateAction<EditableProjectFile[]>>;
  setFolderMoveTargetPath: Dispatch<SetStateAction<string>>;
  setHasLocalEditableProjectFileChanges: Dispatch<SetStateAction<boolean>>;
  setNewFilePath: Dispatch<SetStateAction<string>>;
  setProjectFileError: Dispatch<SetStateAction<string>>;
  setProjectFileSaveError: Dispatch<SetStateAction<string>>;
  setRenamePathInput: Dispatch<SetStateAction<string>>;
  setSavingProjectFiles: Dispatch<SetStateAction<boolean>>;
  setSelectedFolderPath: Dispatch<SetStateAction<string | null>>;
}) {
  function setEditableFiles(
    nextFiles: EditableProjectFile[],
    options?: { markDirty?: boolean }
  ) {
    const sorted = [...nextFiles].sort((a, b) =>
      a.path.localeCompare(b.path)
    );
    editableProjectFilesRef.current = sorted;
    setEditableProjectFiles(sorted);
    setHasLocalEditableProjectFileChanges(Boolean(options?.markDirty));
    if (options?.markDirty) {
      setProjectFileSaveError('');
    }
    setActiveFilePath((prev) => {
      if (sorted.some((file) => file.path === prev)) return prev;
      return (
        getPreferredIndexPath(sorted) || sorted[0]?.path || '/index.html'
      );
    });
  }

  function setSavingProjectFilesState(next: boolean) {
    savingProjectFilesRef.current = next;
    setSavingProjectFiles(next);
  }

  function setDownloadingProjectArchiveState(next: boolean) {
    downloadingProjectArchiveRef.current = next;
    setDownloadingProjectArchive(next);
  }

  function areProjectFileMutationsLocked() {
    return (
      savingProjectFilesRef.current || downloadingProjectArchiveRef.current
    );
  }

  function isActiveBuildId(targetBuildId: number) {
    return Number(buildRef.current?.id || 0) === Number(targetBuildId || 0);
  }

  async function ensureBuildApiTokenForBuild(
    requiredScopes: string[],
    targetBuildId: number
  ) {
    if (
      !Number.isFinite(Number(targetBuildId)) ||
      Number(targetBuildId) <= 0
    ) {
      throw new Error('Build not found');
    }
    const now = Math.floor(Date.now() / 1000);
    const cached = buildApiTokenRef.current;
    if (
      cached &&
      cached.buildId === targetBuildId &&
      cached.expiresAt - 30 > now &&
      requiredScopes.every((scope) => cached.scopes.includes(scope))
    ) {
      return cached.token;
    }

    const requestedScopes = Array.from(
      new Set<string>([
        ...(cached?.buildId === targetBuildId
          ? cached.scopes || []
          : []),
        ...requiredScopes
      ])
    );
    const result = await getBuildApiTokenRef.current({
      buildId: targetBuildId,
      scopes: requestedScopes
    });
    if (!result?.token) {
      throw new Error('Failed to obtain API token');
    }
    buildApiTokenRef.current = {
      buildId: targetBuildId,
      token: result.token,
      scopes: result.scopes || requestedScopes,
      expiresAt: result.expiresAt || now + 600
    };
    return result.token;
  }

  function cloneLatestEditableProjectFiles() {
    return readLatestEditableProjectFiles(editableProjectFilesRef).map(
      (file) => ({
        path: file.path,
        content: file.content
      })
    );
  }

  function getProjectFileCaseCollisionError(files: EditableProjectFile[]) {
    const collisionPaths =
      listCaseInsensitiveProjectFileCollisionPaths(files);
    if (collisionPaths.length === 0) {
      return null;
    }
    return `Project files cannot differ only by letter casing: ${summarizeUploadedFileNames(
      collisionPaths
    )}`;
  }

  function toggleFolderCollapsed(folderPath: string) {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  }

  function handleSelectFolder(folderPath: string) {
    setSelectedFolderPath(folderPath);
    setProjectFileError('');
  }

  function handleEditableFileContentChange(content: string) {
    if (!isOwner || !activeFile || areProjectFileMutationsLocked()) return;
    setEditableFiles(
      editableProjectFiles.map((file) =>
        file.path === activeFile.path ? { ...file, content } : file
      ),
      { markDirty: true }
    );
    setProjectFileError('');
  }

  function handleAddProjectFile() {
    if (!isOwner || areProjectFileMutationsLocked()) return;
    const normalizedPath = normalizeProjectFilePath(newFilePath);
    if (
      !normalizedPath ||
      normalizedPath === '/' ||
      normalizedPath.endsWith('/')
    ) {
      setProjectFileError('Enter a valid file path like /src/app.js');
      return;
    }
    if (editableProjectFiles.some((file) => file.path === normalizedPath)) {
      setProjectFileError('A file with this path already exists');
      return;
    }
    const nextFiles = [
      ...editableProjectFiles,
      { path: normalizedPath, content: '' }
    ];
    setEditableFiles(nextFiles, { markDirty: true });
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setNewFilePath('');
    setProjectFileError('');
  }

  function handleDeleteProjectFile(filePath: string) {
    if (!isOwner || areProjectFileMutationsLocked()) return;
    if (isIndexHtmlPath(filePath)) {
      setProjectFileError('Cannot delete /index.html');
      return;
    }
    const nextFiles = editableProjectFiles.filter(
      (file) => file.path !== filePath
    );
    if (nextFiles.length === editableProjectFiles.length) return;
    if (!window.confirm(`Delete ${filePath}?`)) return;
    setEditableFiles(nextFiles, { markDirty: true });
    setProjectFileError('');
  }

  function handleRenameOrMoveActiveFile() {
    if (!isOwner || !activeFile || areProjectFileMutationsLocked()) return;
    const normalizedPath = normalizeProjectFilePath(renamePathInput);
    if (
      !normalizedPath ||
      normalizedPath === '/' ||
      normalizedPath.endsWith('/')
    ) {
      setProjectFileError('Enter a valid target path like /src/app.js');
      return;
    }
    const activeIsIndex = isIndexHtmlPath(activeFile.path);
    if (activeIsIndex && !isIndexHtmlPath(normalizedPath)) {
      setProjectFileError('/index.html can only be moved to /index.htm');
      return;
    }
    if (normalizedPath === activeFile.path) {
      setProjectFileError('');
      return;
    }
    const nextFiles = editableProjectFiles
      .filter(
        (file) =>
          file.path !== normalizedPath || file.path === activeFile.path
      )
      .map((file) =>
        file.path === activeFile.path
          ? { ...file, path: normalizedPath }
          : file
      );
    setEditableFiles(nextFiles, { markDirty: true });
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setRenamePathInput(normalizedPath);
    setProjectFileError('');
  }

  function handleMoveSelectedFolder() {
    if (!isOwner || !selectedFolderPath || areProjectFileMutationsLocked()) {
      return;
    }
    const sourceFolder = normalizeProjectFilePath(selectedFolderPath);
    const targetFolder = normalizeProjectFilePath(folderMoveTargetPath);
    if (!targetFolder || targetFolder === '/') {
      setProjectFileError('Enter a valid target folder like /src/ui');
      return;
    }
    if (sourceFolder === targetFolder) {
      setProjectFileError('');
      return;
    }
    if (
      targetFolder === sourceFolder ||
      targetFolder.startsWith(`${sourceFolder}/`)
    ) {
      setProjectFileError('Cannot move a folder into itself.');
      return;
    }

    const filesInFolder = editableProjectFiles.filter((file) =>
      isPathWithinFolder(file.path, sourceFolder)
    );
    if (filesInFolder.length === 0) {
      setProjectFileError('Selected folder has no files to move.');
      return;
    }

    const movedSourcePaths = new Set(filesInFolder.map((file) => file.path));
    const remappedFiles = filesInFolder.map((file) => ({
      path: remapPathPrefix({
        filePath: file.path,
        fromPrefix: sourceFolder,
        toPrefix: targetFolder
      }),
      content: file.content
    }));
    const remappedTargetPaths = new Set(
      remappedFiles.map((file) => file.path)
    );
    const conflictPaths = editableProjectFiles
      .filter(
        (file) =>
          !movedSourcePaths.has(file.path) &&
          remappedTargetPaths.has(file.path)
      )
      .map((file) => file.path)
      .sort((a, b) => a.localeCompare(b));

    const conflictSet = new Set(conflictPaths);
    const retainedFiles = editableProjectFiles.filter((file) => {
      if (movedSourcePaths.has(file.path)) return false;
      if (conflictSet.has(file.path)) return false;
      return true;
    });
    const merged = [...retainedFiles, ...remappedFiles];
    const deduped = new Map<string, string>();
    for (const file of merged) {
      deduped.set(file.path, file.content);
    }
    const nextFiles = Array.from(deduped.entries()).map(
      ([path, content]) => ({
        path,
        content
      })
    );

    setEditableFiles(nextFiles, { markDirty: true });
    setActiveFilePath((prev) =>
      remapPathPrefix({
        filePath: prev,
        fromPrefix: sourceFolder,
        toPrefix: targetFolder
      })
    );
    setCollapsedFolders((prev) => {
      const next: Record<string, boolean> = {};
      for (const [path, value] of Object.entries(prev)) {
        if (path === sourceFolder || path.startsWith(`${sourceFolder}/`)) {
          const remappedPath = remapPathPrefix({
            filePath: path,
            fromPrefix: sourceFolder,
            toPrefix: targetFolder
          });
          next[remappedPath] = value;
        } else {
          next[path] = value;
        }
      }
      return next;
    });
    setSelectedFolderPath(targetFolder);
    setFolderMoveTargetPath(targetFolder);
    setProjectFileError('');
  }

  async function handleSaveEditableProjectFiles() {
    if (
      !isOwner ||
      areProjectFileMutationsLocked() ||
      !hasUnsavedProjectFileChanges
    ) {
      return;
    }
    const saveResult = await saveEditableProjectFilesWithTracking({
      files: cloneLatestEditableProjectFiles(),
      fallbackError: 'Failed to save project files'
    });
    if (!saveResult.success) {
      return;
    }
  }

  async function saveEditableProjectFilesWithTracking({
    files,
    fallbackError,
    targetBuildId,
    targetBuildCode
  }: {
    files: EditableProjectFile[];
    fallbackError: string;
    targetBuildId?: number | null;
    targetBuildCode?: string | null;
  }) {
    const collisionError = getProjectFileCaseCollisionError(files);
    if (collisionError) {
      setProjectFileError(collisionError);
      setProjectFileSaveError(collisionError);
      return {
        success: false,
        error: collisionError
      };
    }

    const savedSignature = serializeEditableProjectFiles(files);
    setSavingProjectFilesState(true);
    setProjectFileError('');
    setProjectFileSaveError('');
    try {
      const result = await onSaveProjectFiles(files, {
        targetBuildId,
        targetBuildCode
      });
      if (!result?.success) {
        const message = result?.error || fallbackError;
        setProjectFileError(message);
        setProjectFileSaveError(message);
        return {
          success: false,
          error: message
        };
      }
      setProjectFileError('');
      setProjectFileSaveError('');
      return {
        success: true,
        savedSignature
      };
    } finally {
      setSavingProjectFilesState(false);
    }
  }

  async function ensureLatestEditableProjectFilesSavedForExport() {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const files = cloneLatestEditableProjectFiles();
      const saveResult = await saveEditableProjectFilesWithTracking({
        files,
        fallbackError: 'Failed to save project files before export'
      });
      if (!saveResult?.success) {
        return saveResult;
      }

      const latestSignature = serializeEditableProjectFiles(
        cloneLatestEditableProjectFiles()
      );
      if (latestSignature === saveResult.savedSignature) {
        return {
          success: true
        };
      }
    }

    const message =
      'Project files changed while export was preparing. Please stop editing for a moment and try again.';
    setProjectFileError(message);
    setProjectFileSaveError(message);
    return {
      success: false,
      error: message
    };
  }

  async function handleDownloadProjectArchive() {
    if (
      !isOwner ||
      isShowingStreamingCode ||
      areProjectFileMutationsLocked()
    ) {
      return;
    }

    setProjectFileError('');
    setProjectFileSaveError('');
    setDownloadingProjectArchiveState(true);
    try {
      if (hasUnsavedProjectFileChanges) {
        const saveResult =
          await ensureLatestEditableProjectFilesSavedForExport();
        if (!saveResult?.success) {
          return;
        }
      }

      const archiveBytes = await downloadBuildProjectArchive(build.id);
      if (!(archiveBytes instanceof ArrayBuffer)) {
        throw new Error('Failed to download the exported project zip');
      }

      triggerBrowserDownload({
        bytes: archiveBytes,
        fileName: `${buildProjectExportBaseName(build.title, build.id)}.zip`,
        mimeType: 'application/zip'
      });
    } catch (error: any) {
      console.error('Failed to download build project archive:', error);
      setProjectFileError(
        error?.message || 'Failed to download the exported project zip'
      );
    } finally {
      setDownloadingProjectArchiveState(false);
    }
  }

  return {
    areProjectFileMutationsLocked,
    ensureBuildApiTokenForBuild,
    getProjectFileCaseCollisionError,
    handleAddProjectFile,
    handleDeleteProjectFile,
    handleDownloadProjectArchive,
    handleEditableFileContentChange,
    handleMoveSelectedFolder,
    handleRenameOrMoveActiveFile,
    handleSaveEditableProjectFiles,
    handleSelectFolder,
    isActiveBuildId,
    projectFilesLocked: savingProjectFiles || downloadingProjectArchive,
    saveEditableProjectFilesWithTracking,
    setEditableFiles,
    toggleFolderCollapsed
  };
}

import React, {
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import useConfirmModal from '~/components/Modals/hooks/useConfirmModal';
import type { BuildCapabilitySnapshot } from '../types/capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../types/runtimeObservationTypes';
import GuestRestrictionBanner from './GuestRestrictionBanner';
import {
  buildEditableProjectFiles,
  buildProjectExplorerEntries,
  getPreferredIndexPath,
  normalizeProjectFilePath,
  serializeEditableProjectFiles
} from './helpers/projectFiles';
import CodeWorkspacePane from './CodeWorkspacePane';
import { useFrameManager } from './hooks/useFrameManager';
import {
  buildEmptyRuntimeObservationState,
  ensureBuildApiToken,
  normalizeRuntimeExplorationPlan,
  useHostBridge
} from './hooks/useHostBridge';
import {
  buildPreviewBaseSrc,
  useWorkspacePreviewSrc
} from './hooks/useSource';
import {
  getBuildPreviewMessageTargetOrigin
} from '~/helpers/buildPreviewOriginHelpers';
import {
  type BuildAgentAssetCreateOptions
} from '~/containers/Build/helpers/agentWorkspaceAssets';
import type {
  EditableProjectFile,
  PreviewPanelHandle,
  PreviewFrameRetiredHandler,
  PreviewPanelProps
} from './types';
import VersionHistoryModal from './VersionHistoryModal';
import {
  EMPTY_PREVIEW_RUNTIME_UPLOAD_ASSETS,
  PREVIEW_HIDDEN_SUSPEND_DELAY_MS,
  createPreviewRevision,
  getRuntimeIssueStackPreview,
  hasPreservedUploadedProjectRelativePath,
  listCaseInsensitiveFileNameCollisions,
  normalizeUploadInputFiles,
  resolveRuntimeIssueProjectFilePath,
  summarizeUploadedFileNames,
  type PreviewLifecycleState
} from './helpers/previewHelpers';
import AgentManualPane from './AgentManualPane';
import PreviewStage from './PreviewStage';
import ProjectFileInputs from './ProjectFileInputs';
import WorkspaceToolbar from './WorkspaceToolbar';
import {
  workspaceViewOptions,
  type WorkspaceViewMode
} from './constants/workspaceView';
import useAppRequests from './hooks/useAppRequests';
import useProjectFileActions from './hooks/useProjectFileActions';
import useProjectFileUploads from './hooks/useProjectFileUploads';
import useProjectAssets from './hooks/useProjectAssets';
import useVersionHistory from './hooks/useVersionHistory';
const GUEST_RESTRICTION_BANNER_TEXT =
  'Some features were restricted because this app uses user-only data. Sign in to access those parts.';

const panelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  gap: 0;
  overflow: hidden;
`;

const runtimePanelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: 1fr;
  background: #fff;
  overflow: hidden;
`;

const PreviewPanel = React.forwardRef<PreviewPanelHandle, PreviewPanelProps>(
  function PreviewPanel(
    {
      className,
      build,
      code,
      projectFiles,
      streamingProjectFiles = null,
      streamingFocusFilePath = null,
      isOwner,
      codeWorkspaceAvailable = isOwner,
      onReplaceCode,
      onApplyRestoredProjectFiles,
      onSaveProjectFiles,
      runtimeOnly = false,
      runtimeHostVisible = true,
      capabilitySnapshot = null,
      maxProjectFileLines = null,
      onEditableProjectFilesStateChange,
      runtimeExplorationPlan = null,
      onRuntimeObservationChange,
      onRuntimeUploadsSync,
      onAiUsagePolicyUpdate,
      onOpenRuntimeUploadsManager,
      currentBuildRuntimeAssets = EMPTY_PREVIEW_RUNTIME_UPLOAD_ASSETS,
      previewSrcOverride = null,
      mountContext = null,
      launchTarget = null,
      viewerOverride = null,
      onCaptureReadyChange
    }: PreviewPanelProps,
    ref
  ) {
    const [viewMode, setViewMode] = useState<WorkspaceViewMode>('preview');
    const onRuntimeObservationChangeRef = useRef(
      onRuntimeObservationChange || null
    );
    const onRuntimeUploadsSyncRef = useRef(onRuntimeUploadsSync || null);
    const onAiUsagePolicyUpdateRef = useRef(onAiUsagePolicyUpdate || null);
    const onEditableProjectFilesStateChangeRef = useRef(
      onEditableProjectFilesStateChange || null
    );
    const availableWorkspaceViewOptions = useMemo(
      () =>
        codeWorkspaceAvailable
          ? workspaceViewOptions
          : workspaceViewOptions.filter((option) => option.value !== 'code'),
      [codeWorkspaceAvailable]
    );
    const [editableProjectFiles, setEditableProjectFiles] = useState<
      EditableProjectFile[]
    >(() => buildEditableProjectFiles({ code, projectFiles }));
    const [
      hasLocalEditableProjectFileChanges,
      setHasLocalEditableProjectFileChanges
    ] = useState(false);
    const [activeFilePath, setActiveFilePath] = useState('/index.html');
    const [newFilePath, setNewFilePath] = useState('');
    const [renamePathInput, setRenamePathInput] = useState('/index.html');
    const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
      null
    );
    const [folderMoveTargetPath, setFolderMoveTargetPath] = useState('');
    const [collapsedFolders, setCollapsedFolders] = useState<
      Record<string, boolean>
    >({});
    const [savingProjectFiles, setSavingProjectFiles] = useState(false);
    const [downloadingProjectArchive, setDownloadingProjectArchive] =
      useState(false);
    const [projectFileError, setProjectFileError] = useState('');
    const [projectFileSaveError, setProjectFileSaveError] = useState('');
    const [guestRestrictionBannerVisible, setGuestRestrictionBannerVisible] =
      useState(false);

    useEffect(() => {
      if (!codeWorkspaceAvailable && viewMode === 'code') {
        setViewMode('preview');
      }
    }, [codeWorkspaceAvailable, viewMode]);
    const [runtimeObservationState, setRuntimeObservationState] =
      useState<BuildRuntimeObservationState>(() =>
        buildEmptyRuntimeObservationState({
          buildId: build.id,
          codeSignature: null
        })
      );
    const [previewLifecycleState, setPreviewLifecycleState] =
      useState<PreviewLifecycleState>(() =>
        runtimeHostVisible === false ? 'suspended' : 'active'
      );
    const buildRef = useRef(build);
    const projectFileInputRef = useRef<HTMLInputElement | null>(null);
    const projectFolderInputRef = useRef<HTMLInputElement | null>(null);
    const projectAssetInputRef = useRef<HTMLInputElement | null>(null);
    const editableProjectFilesRef = useRef<EditableProjectFile[]>(
      buildEditableProjectFiles({ code, projectFiles })
    );
    const savingProjectFilesRef = useRef(false);
    const downloadingProjectArchiveRef = useRef(false);
    const wasShowingStreamingCodeRef = useRef(false);
    const streamingAutoFollowEnabledRef = useRef(false);
    const autoReturnToPreviewPendingRef = useRef(false);
    const lastStreamingFocusFilePathRef = useRef<string | null>(null);
    const runtimeObservationStateRef = useRef<BuildRuntimeObservationState>(
      buildEmptyRuntimeObservationState({
        buildId: build.id,
        codeSignature: null
      })
    );
    const isOwnerRef = useRef(isOwner);
    const userIdRef = useRef<number | null>(null);
    const usernameRef = useRef<string | null>(null);
    const profilePicUrlRef = useRef<string | null>(null);
    const guestSessionIdRef = useRef<string | null>(null);

    const persistedProjectFiles = useMemo(
      () => buildEditableProjectFiles({ code, projectFiles }),
      [code, projectFiles]
    );
    const streamedProjectFiles = useMemo(
      () =>
        Array.isArray(streamingProjectFiles) && streamingProjectFiles.length > 0
          ? buildEditableProjectFiles({
              code,
              projectFiles: streamingProjectFiles
            })
          : null,
      [code, streamingProjectFiles]
    );
    const persistedProjectFilesSignature = useMemo(
      () => serializeEditableProjectFiles(persistedProjectFiles),
      [persistedProjectFiles]
    );
    const previewProjectFilesRevision = useMemo(
      () => createPreviewRevision(persistedProjectFilesSignature),
      [persistedProjectFilesSignature]
    );
    const editableProjectFilesSignature = useMemo(
      () => serializeEditableProjectFiles(editableProjectFiles),
      [editableProjectFiles]
    );
    const hasUnsavedProjectFileChanges =
      hasLocalEditableProjectFileChanges &&
      editableProjectFilesSignature !== persistedProjectFilesSignature;
    const deferredEditableProjectFiles = useDeferredValue(editableProjectFiles);
    const previewProjectFiles = hasUnsavedProjectFileChanges
      ? deferredEditableProjectFiles
      : persistedProjectFiles;
    const isShowingStreamingCode =
      Boolean(streamedProjectFiles && streamedProjectFiles.length > 0) &&
      !hasUnsavedProjectFileChanges;
    const displayedProjectFiles = isShowingStreamingCode
      ? streamedProjectFiles || persistedProjectFiles
      : hasUnsavedProjectFileChanges
        ? editableProjectFiles
        : persistedProjectFiles;
    const projectFilesForParent = useMemo(
      () =>
        (hasUnsavedProjectFileChanges
          ? editableProjectFiles
          : persistedProjectFiles
        ).map((file) => ({
          path: file.path,
          content: file.content
        })),
      [
        editableProjectFiles,
        hasUnsavedProjectFileChanges,
        persistedProjectFiles
      ]
    );
    const activeFile = useMemo(
      () =>
        displayedProjectFiles.find((file) => file.path === activeFilePath) ||
        displayedProjectFiles[0] ||
        null,
      [displayedProjectFiles, activeFilePath]
    );
    const latestRuntimeObservationIssue = useMemo(
      () =>
        runtimeObservationState.issues[
          runtimeObservationState.issues.length - 1
        ] || null,
      [runtimeObservationState.issues]
    );
    const latestRuntimeObservationProjectFilePath = useMemo(
      () =>
        resolveRuntimeIssueProjectFilePath({
          issue: latestRuntimeObservationIssue,
          files: displayedProjectFiles
        }),
      [displayedProjectFiles, latestRuntimeObservationIssue]
    );
    const latestRuntimeObservationStackPreview = useMemo(
      () =>
        latestRuntimeObservationIssue
          ? getRuntimeIssueStackPreview(latestRuntimeObservationIssue)
          : '',
      [latestRuntimeObservationIssue]
    );

    function openRuntimeIssueProjectFile(path: string) {
      if (!codeWorkspaceAvailable) return;
      setViewMode('code');
      setActiveFilePath(path);
      setSelectedFolderPath(null);
      setRenamePathInput(path);
      setProjectFileError('');
      setProjectFileSaveError('');
    }

    function openProjectFileUploadPicker() {
      if (
        !isOwner ||
        !codeWorkspaceAvailable ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }
      if (viewMode !== 'code') {
        setViewMode('code');
      }
      projectFileInputRef.current?.click();
    }

    function openProjectFolderImportPicker() {
      if (
        !isOwner ||
        !codeWorkspaceAvailable ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }
      if (viewMode !== 'code') {
        setViewMode('code');
      }
      projectFolderInputRef.current?.click();
    }

    function openProjectAssetUploadPicker() {
      if (
        !isOwner ||
        !codeWorkspaceAvailable ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }
      if (viewMode !== 'code') {
        setViewMode('code');
      }
      projectAssetInputRef.current?.click();
    }

    async function captureThumbnail() {
      const previewPath = await resolveFreshCapturePreviewPath();
      if (!previewPath) {
        throw new Error('Preview is unavailable right now');
      }
      const result = await captureBuildThumbnailPreview({
        buildId: build.id,
        previewPath
      });
      const imageUrl = String(result?.imageUrl || '').trim();
      if (imageUrl) {
        return imageUrl;
      }
      throw new Error(
        String(result?.error || 'Failed to capture preview thumbnail')
      );
    }

    async function resolveFreshCapturePreviewPath() {
      const preferredOverride = String(normalizedPreviewSrcOverride || '').trim();
      if (preferredOverride) {
        return await withFreshPreviewAccessToken(preferredOverride);
      }

      const basePreviewSrc = buildPreviewBaseSrc(build);
      if (!previewAuth.userIdRef.current) {
        return basePreviewSrc;
      }

      const token = await ensureBuildApiToken(['preview:read'], previewAuth);
      const separator = basePreviewSrc.includes('?') ? '&' : '?';
      return `${basePreviewSrc}${separator}buildApiToken=${encodeURIComponent(token)}`;
    }

    async function withFreshPreviewAccessToken(rawPreviewPath: string) {
      try {
        const parsedUrl = new URL(rawPreviewPath, window.location.href);
        if (
          !parsedUrl.pathname.startsWith('/build/preview/') ||
          !previewAuth.userIdRef.current
        ) {
          return parsedUrl.toString();
        }
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        parsedUrl.searchParams.set('buildApiToken', token);
        return parsedUrl.toString();
      } catch {
        return rawPreviewPath;
      }
    }

    function discardProjectFileDraft() {
      const nextFiles = persistedProjectFiles.map((file) => ({
        path: file.path,
        content: file.content
      }));
      editableProjectFilesRef.current = nextFiles;
      setEditableProjectFiles(nextFiles);
      setHasLocalEditableProjectFileChanges(false);
      setProjectFileError('');
      setProjectFileSaveError('');
      setActiveFilePath((prev) => {
        const hasPrev = nextFiles.some((file) => file.path === prev);
        if (hasPrev) return prev;
        return (
          getPreferredIndexPath(nextFiles) ||
          nextFiles[0]?.path ||
          '/index.html'
        );
      });
      return nextFiles;
    }

    useImperativeHandle(
      ref,
      () => ({
        openProjectFileUploadPicker,
        openProjectFolderImportPicker,
        openProjectAssetUploadPicker,
        discardProjectFileDraft,
        captureThumbnail,
        async importProjectFilesFromChatUpload(files: File[]) {
          const normalizedFiles = normalizeUploadInputFiles(files);
          const filesWithPreservedPaths = normalizedFiles.filter(
            hasPreservedUploadedProjectRelativePath
          );
          const requiresPreservedPaths = filesWithPreservedPaths.length > 0;
          if (
            requiresPreservedPaths &&
            filesWithPreservedPaths.length !== normalizedFiles.length
          ) {
            const message =
              'This upload mixes files with and without folder paths. Use the manual workspace import controls for project files instead.';
            setProjectFileError(message);
            return {
              success: false,
              importedCount: 0,
              error: message
            };
          }
          if (!requiresPreservedPaths && normalizedFiles.length > 1) {
            const nameCollisions =
              listCaseInsensitiveFileNameCollisions(normalizedFiles);
            if (nameCollisions.length > 0) {
              const message = `These files would collide at the project root: ${summarizeUploadedFileNames(
                nameCollisions
              )}. Use the manual workspace import controls instead.`;
              setProjectFileError(message);
              return {
                success: false,
                importedCount: 0,
                error: message
              };
            }
          }
          const result = await handleUploadProjectFiles(normalizedFiles, {
            requireRelativePaths: requiresPreservedPaths,
            targetFolderPath: null
          });
          if (
            result?.success &&
            !requiresPreservedPaths &&
            normalizedFiles.length > 1
          ) {
            const rootImportWarning =
              'Imported these files at the project root because folder paths were not included.';
            const nextWarningText = String(result.warningText || '').trim();
            const combinedWarningText = nextWarningText
              ? `${nextWarningText} ${rootImportWarning}`
              : rootImportWarning;
            setProjectFileError(combinedWarningText);
            return {
              ...result,
              warningText: combinedWarningText
            };
          }
          return result;
        },
        async uploadProjectAssetsFromChatUpload(files: File[]) {
          return await handleUploadProjectAssets(files);
        },
        async uploadGeneratedProjectAsset(options: BuildAgentAssetCreateOptions) {
          return await createAgentProjectAsset(options);
        }
      })
    );

    useEffect(() => {
      const folderInput = projectFolderInputRef.current;
      if (!folderInput) return;
      folderInput.setAttribute('webkitdirectory', '');
      folderInput.setAttribute('directory', '');
    }, []);
    const persistedFileContentByPath = useMemo(() => {
      const byPath = new Map<string, string>();
      for (const file of persistedProjectFiles) {
        byPath.set(file.path, file.content);
      }
      return byPath;
    }, [persistedProjectFiles]);
    const projectExplorerEntries = useMemo(
      () =>
        buildProjectExplorerEntries({
          files: displayedProjectFiles,
          collapsedFolders
        }),
      [displayedProjectFiles, collapsedFolders]
    );

    const keyUserId = useKeyContext((v) => v.myState.userId);
    const keyUsername = useKeyContext((v) => v.myState.username);
    const keyProfilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
    const resolvedUserId =
      typeof viewerOverride?.id === 'number' ? viewerOverride.id : keyUserId;
    const resolvedUsername =
      typeof viewerOverride?.username === 'string'
        ? viewerOverride.username
        : keyUsername;
    const resolvedProfilePicUrl =
      typeof viewerOverride?.profilePicUrl === 'string'
        ? viewerOverride.profilePicUrl
        : keyProfilePicUrl;
    const normalizedPreviewSrcOverride = useMemo(() => {
      const normalized = String(previewSrcOverride || '').trim();
      return normalized || null;
    }, [previewSrcOverride]);
    const {
      captureBuildThumbnailPreview,
      deleteBuildRuntimeFileRef,
      downloadBuildProjectArchive,
      getBuildApiTokenRef,
      listBuildArtifactsRef,
      listBuildArtifactVersionsRef,
      listBuildRuntimeFilesRef,
      onOpenSigninModal,
      previewRequestRefs,
      restoreBuildArtifactVersionRef,
      uploadBuildRuntimeFilesRef
    } = useAppRequests();

    const buildApiTokenRef = useRef<{
      buildId?: number;
      token: string;
      scopes: string[];
      expiresAt: number;
    } | null>(null);
    const onPreviewFrameRetiredRef =
      useRef<PreviewFrameRetiredHandler | null>(null);
    const hydratedBuildIdRef = useRef<number | null>(null);
    const capabilitySnapshotRef = useRef<BuildCapabilitySnapshot | null>(
      capabilitySnapshot
    );
    const runtimeExplorationPlanRef =
      useRef<BuildRuntimeExplorationPlan | null>(
        normalizeRuntimeExplorationPlan(runtimeExplorationPlan)
      );
    const previewAuth = useRef({
      buildRef,
      isOwnerRef,
      userIdRef,
      usernameRef,
      profilePicUrlRef,
      guestSessionIdRef,
      buildApiTokenRef,
      getBuildApiTokenRef,
      setGuestRestrictionBannerVisible
    }).current;
    buildRef.current = build;
    isOwnerRef.current = isOwner;
    userIdRef.current = resolvedUserId || null;
    usernameRef.current = resolvedUsername || null;
    profilePicUrlRef.current = resolvedProfilePicUrl || null;
    const {
      confirmModal: projectFileConfirmModal,
      requestConfirm: requestProjectFileConfirm
    } = useConfirmModal();
    const {
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
      projectFilesLocked,
      saveEditableProjectFilesWithTracking,
      setEditableFiles,
      toggleFolderCollapsed
    } = useProjectFileActions({
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
      requestConfirm: requestProjectFileConfirm,
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
    });
    const {
      cleanupRestoredRuntimeAssets,
      createAgentProjectAsset,
      handleUploadProjectAssets,
      syncCurrentBuildRuntimeUploads,
      workspaceRuntimeAssets
    } = useProjectAssets({
      areProjectFileMutationsLocked,
      buildId: build.id,
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
    });
    const {
      handleImportProjectFolder,
      handleUploadProjectFiles
    } = useProjectFileUploads({
      areProjectFileMutationsLocked,
      buildId: build.id,
      buildRef,
      cleanupRestoredRuntimeAssets,
      code,
      editableProjectFilesRef,
      ensureBuildApiTokenForBuild,
      getProjectFileCaseCollisionError,
      isActiveBuildId,
      isOwner,
      persistedProjectFiles,
      requestConfirm: requestProjectFileConfirm,
      saveEditableProjectFilesWithTracking,
      selectedFolderPath,
      setActiveFilePath,
      setEditableFiles,
      setNewFilePath,
      setProjectFileError,
      setSelectedFolderPath,
      syncCurrentBuildRuntimeUploads,
      uploadBuildRuntimeFilesRef
    });
    const {
      historyOpen,
      loadingVersions,
      restoringVersionId,
      setHistoryOpen,
      versions,
      handleRestoreVersion
    } = useVersionHistory({
      build,
      buildRef,
      isOwnerRef,
      listBuildArtifactsRef,
      listBuildArtifactVersionsRef,
      onApplyRestoredProjectFiles,
      onReplaceCode,
      restoreBuildArtifactVersionRef,
      setActiveFilePath,
      setEditableProjectFiles,
      setHasLocalEditableProjectFileChanges,
      setProjectFileError
    });
    const resolvedCapabilitySnapshot = useMemo(() => {
      if (!capabilitySnapshot) return null;
      return {
        ...capabilitySnapshot,
        build: {
          ...capabilitySnapshot.build,
          isPublic: Boolean(build.isPublic)
        }
      };
    }, [build.isPublic, capabilitySnapshot]);
    const resolvedRuntimeExplorationPlan = useMemo(
      () => normalizeRuntimeExplorationPlan(runtimeExplorationPlan),
      [runtimeExplorationPlan]
    );

    const hasRuntimePreview = useMemo(() => {
      if (!runtimeOnly) return false;
      return (
        previewProjectFiles.length > 0 || String(code || '').trim().length > 0
      );
    }, [code, previewProjectFiles, runtimeOnly]);

    const runtimePreviewSrc = useMemo(() => {
      if (normalizedPreviewSrcOverride) {
        return normalizedPreviewSrcOverride;
      }
      if (!runtimeOnly || !hasRuntimePreview) return null;
      return buildPreviewBaseSrc(build);
    }, [build, hasRuntimePreview, normalizedPreviewSrcOverride, runtimeOnly]);

    const workspacePreviewSrc = useWorkspacePreviewSrc({
      build,
      runtimeOnly,
      previewRevision: previewProjectFilesRevision,
      viewMode,
      userId: resolvedUserId || null,
      previewAuth
    });
    const previewCodeSignature =
      Number(build.currentArtifactVersionId) > 0
        ? `artifact:${build.currentArtifactVersionId}:${previewProjectFilesRevision}`
        : `current:${build.id}:${Number(build.updatedAt) || 0}:${previewProjectFilesRevision}`;
    const previewHostVisible = runtimeHostVisible !== false;
    const previewFrameSuspended =
      !previewHostVisible && previewLifecycleState === 'suspended';

    useEffect(() => {
      if (previewHostVisible) {
        setPreviewLifecycleState('active');
        return;
      }

      setPreviewLifecycleState((currentState) =>
        currentState === 'active' ? 'background' : 'suspended'
      );
      const suspendTimeout = window.setTimeout(() => {
        setPreviewLifecycleState((currentState) =>
          currentState === 'background' ? 'suspended' : currentState
        );
      }, PREVIEW_HIDDEN_SUSPEND_DELAY_MS);

      return () => {
        window.clearTimeout(suspendTimeout);
      };
    }, [build.id, previewCodeSignature, previewHostVisible]);

    const {
      activePreviewFrame,
      handlePreviewFrameLoad,
      messageTargetFrameRef,
      previewCodeSignatureRef,
      previewFrameMetaRef,
      previewFrameReady,
      previewFrameSources,
      previewFrameSourcesRef,
      previewSrc,
      previewTransitioning,
      previewTransitioningRef,
      primaryIframeRef,
      secondaryIframeRef
    } = useFrameManager({
      buildId: build.id,
      runtimeOnly,
      previewCodeSignature,
      runtimePreviewSrc: previewFrameSuspended ? null : runtimePreviewSrc,
      workspacePreviewSrc:
        previewFrameSuspended
          ? null
          : normalizedPreviewSrcOverride || workspacePreviewSrc,
      onPreviewFrameRetiredRef
    });
    const runtimePreviewFrameSrc = runtimeOnly
      ? previewFrameSources.primary
      : null;
    const runtimePreviewFrameNonce = runtimeOnly
      ? previewFrameMetaRef.current.primary.messageNonce
      : null;
    const shouldShowRuntimePreviewStage = Boolean(
      runtimePreviewFrameSrc || previewSrc
    );
    const shouldMountRuntimePreviewFrame = Boolean(
      runtimePreviewFrameSrc && runtimePreviewFrameNonce
    );
    const shouldShowWorkspacePreviewStage = Boolean(
      previewHostVisible ||
        previewFrameSources.primary ||
        previewFrameSources.secondary ||
        previewSrc
    );

    useEffect(() => {
      const activePreviewNonce =
        previewFrameMetaRef.current[activePreviewFrame]?.messageNonce || null;
      setRuntimeObservationState((prev) => {
        const nextIssues = activePreviewNonce
          ? prev.issues.filter(
              (issue) => issue.previewNonce === activePreviewNonce
            )
          : [];
        if (nextIssues.length === prev.issues.length) {
          return prev;
        }
        return {
          ...prev,
          issues: nextIssues,
          updatedAt: Date.now()
        };
      });
    }, [
      activePreviewFrame,
      previewFrameReady.primary,
      previewFrameReady.secondary,
      previewFrameMetaRef
    ]);

    useEffect(() => {
      if (!onCaptureReadyChange) return;
      const ready =
        previewHostVisible &&
        !previewFrameSuspended &&
        Boolean(previewSrc) &&
        previewFrameReady[activePreviewFrame] &&
        !previewTransitioning;
      onCaptureReadyChange(ready, {
        codeSignature: previewCodeSignature || null,
        previewSrc: previewSrc || null
      });
    }, [
      activePreviewFrame,
      onCaptureReadyChange,
      previewFrameSuspended,
      previewFrameReady,
      previewHostVisible,
      previewCodeSignature,
      previewSrc,
      previewTransitioning
    ]);

    useEffect(() => {
      if (!previewSrc) return;
      const message = {
        source: 'twinkle-parent',
        type: 'host-visibility:update',
        payload: {
          visible: runtimeHostVisible !== false
        }
      };
      const previewFrames = [
        {
          frame: 'primary' as const,
          window: primaryIframeRef.current?.contentWindow || null
        },
        {
          frame: 'secondary' as const,
          window: secondaryIframeRef.current?.contentWindow || null
        }
      ];
      for (const { frame, window: targetWindow } of previewFrames) {
        if (!targetWindow) continue;
        const frameSource =
          frame === 'primary'
            ? previewFrameSources.primary
            : previewFrameSources.secondary;
        const frameMessageNonce =
          frame === 'primary'
            ? previewFrameMetaRef.current.primary.messageNonce
            : previewFrameMetaRef.current.secondary.messageNonce;
        const targetOrigin = getBuildPreviewMessageTargetOrigin(
          frameSource
        );
        targetWindow.postMessage(
          {
            ...message,
            previewNonce: frameMessageNonce
          },
          targetOrigin
        );
      }
    }, [
      previewSrc,
      previewFrameReady.primary,
      previewFrameReady.secondary,
      previewFrameSources.primary,
      previewFrameSources.secondary,
      previewFrameMetaRef,
      primaryIframeRef,
      runtimeHostVisible,
      secondaryIframeRef
    ]);

    useHostBridge({
      runtimeOnly,
      buildId: build.id,
      buildIsPublic: build.isPublic,
      isOwner,
      userId: resolvedUserId || null,
      username: resolvedUsername || null,
      profilePicUrl: resolvedProfilePicUrl || null,
      resolvedCapabilitySnapshot,
      resolvedRuntimeExplorationPlan,
      mountContext,
      launchTarget,
      capabilitySnapshotRef,
      runtimeExplorationPlanRef,
      messageTargetFrameRef,
      previewCodeSignatureRef,
      previewFrameMetaRef,
      previewFrameSourcesRef,
      previewTransitioningRef,
      onPreviewFrameRetiredRef,
      primaryIframeRef,
      secondaryIframeRef,
      setRuntimeObservationState,
      previewAuth,
      requestRefs: previewRequestRefs,
      runtimeUploadsSyncRef: onRuntimeUploadsSyncRef,
      onAiUsagePolicyUpdateRef
    });

    useEffect(() => {
      const nextState = buildEmptyRuntimeObservationState({
        buildId: build.id,
        codeSignature: previewCodeSignature
      });
      runtimeObservationStateRef.current = nextState;
      setRuntimeObservationState(nextState);
    }, [build.id, previewCodeSignature]);

    useEffect(() => {
      runtimeObservationStateRef.current = runtimeObservationState;
      onRuntimeObservationChangeRef.current?.(runtimeObservationState);
    }, [runtimeObservationState]);

    useEffect(() => {
      onRuntimeObservationChangeRef.current =
        onRuntimeObservationChange || null;
    }, [onRuntimeObservationChange]);

    useEffect(() => {
      onRuntimeUploadsSyncRef.current = onRuntimeUploadsSync || null;
    }, [onRuntimeUploadsSync]);

    useEffect(() => {
      onAiUsagePolicyUpdateRef.current = onAiUsagePolicyUpdate || null;
    }, [onAiUsagePolicyUpdate]);

    useEffect(() => {
      onEditableProjectFilesStateChangeRef.current =
        onEditableProjectFilesStateChange || null;
    }, [onEditableProjectFilesStateChange]);

    useEffect(() => {
      buildRef.current = build;
    }, [build]);


    useEffect(() => {
      isOwnerRef.current = isOwner;
    }, [isOwner]);

    useEffect(() => {
      userIdRef.current = resolvedUserId || null;
    }, [resolvedUserId]);

    useEffect(() => {
      usernameRef.current = resolvedUsername || null;
    }, [resolvedUsername]);

    useEffect(() => {
      profilePicUrlRef.current = resolvedProfilePicUrl || null;
    }, [resolvedProfilePicUrl]);

    useEffect(() => {
      buildApiTokenRef.current = null;
    }, [build.id, resolvedUserId]);

    useEffect(() => {
      if (resolvedUserId) {
        setGuestRestrictionBannerVisible(false);
      }
    }, [resolvedUserId]);

    useEffect(() => {
      capabilitySnapshotRef.current = resolvedCapabilitySnapshot;
    }, [resolvedCapabilitySnapshot]);

    useEffect(() => {
      runtimeExplorationPlanRef.current = resolvedRuntimeExplorationPlan;
    }, [resolvedRuntimeExplorationPlan]);

    useEffect(() => {
      editableProjectFilesRef.current = editableProjectFiles;
    }, [editableProjectFiles]);

    useEffect(() => {
      const shouldHydrateForBuild =
        hydratedBuildIdRef.current === null ||
        hydratedBuildIdRef.current !== build.id;
      if (!shouldHydrateForBuild) return;
      hydratedBuildIdRef.current = build.id;
      setEditableProjectFiles(persistedProjectFiles);
      setHasLocalEditableProjectFileChanges(false);
      setActiveFilePath(
        getPreferredIndexPath(persistedProjectFiles) ||
          persistedProjectFiles[0]?.path ||
          '/index.html'
      );
      setProjectFileError('');
      setNewFilePath('');
      setRenamePathInput('/index.html');
      setSelectedFolderPath(null);
      setFolderMoveTargetPath('');
      setCollapsedFolders({});
      setProjectFileSaveError('');
      wasShowingStreamingCodeRef.current = false;
      streamingAutoFollowEnabledRef.current = false;
      autoReturnToPreviewPendingRef.current = false;
      lastStreamingFocusFilePathRef.current = null;
    }, [build.id, persistedProjectFiles, persistedProjectFilesSignature]);

    useEffect(() => {
      if (hasUnsavedProjectFileChanges) return;
      setEditableProjectFiles(persistedProjectFiles);
      setHasLocalEditableProjectFileChanges(false);
      setActiveFilePath((prev) => {
        const hasPrev = persistedProjectFiles.some(
          (file) => file.path === prev
        );
        if (hasPrev) return prev;
        return (
          getPreferredIndexPath(persistedProjectFiles) ||
          persistedProjectFiles[0]?.path ||
          '/index.html'
        );
      });
    }, [
      persistedProjectFiles,
      persistedProjectFilesSignature,
      hasUnsavedProjectFileChanges
    ]);

    useEffect(() => {
      const justStartedStreaming =
        isShowingStreamingCode && !wasShowingStreamingCodeRef.current;
      const justStoppedStreaming =
        !isShowingStreamingCode && wasShowingStreamingCodeRef.current;
      wasShowingStreamingCodeRef.current = isShowingStreamingCode;

      if (justStartedStreaming) {
        const isMobileWorkspace =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches;

        streamingAutoFollowEnabledRef.current = true;
        autoReturnToPreviewPendingRef.current = false;
        // Keep the live simulator visible on mobile while Lumine streams code.
        if (!isMobileWorkspace && viewMode !== 'code') {
          setViewMode('code');
        }
      } else if (justStoppedStreaming) {
        streamingAutoFollowEnabledRef.current = false;
        autoReturnToPreviewPendingRef.current = true;
        lastStreamingFocusFilePathRef.current = null;
      }
    }, [isShowingStreamingCode, viewMode]);

    useEffect(() => {
      if (runtimeOnly) return;
      if (isShowingStreamingCode) return;
      if (!autoReturnToPreviewPendingRef.current) return;
      autoReturnToPreviewPendingRef.current = false;
      if (viewMode !== 'preview') {
        setViewMode('preview');
      }
    }, [
      isShowingStreamingCode,
      runtimeOnly,
      viewMode
    ]);

    useEffect(() => {
      if (!isShowingStreamingCode || !streamingFocusFilePath) return;
      const nextPath = normalizeProjectFilePath(streamingFocusFilePath);
      if (lastStreamingFocusFilePathRef.current === nextPath) return;
      lastStreamingFocusFilePathRef.current = nextPath;
      if (!streamingAutoFollowEnabledRef.current) return;
      setActiveFilePath((prev) => {
        const exists = displayedProjectFiles.some(
          (file) => file.path === nextPath
        );
        if (!exists) return prev;
        return nextPath;
      });
    }, [displayedProjectFiles, isShowingStreamingCode, streamingFocusFilePath]);

    useEffect(() => {
      onEditableProjectFilesStateChangeRef.current?.({
        files: projectFilesForParent,
        hasUnsavedChanges: hasUnsavedProjectFileChanges,
        saving: savingProjectFiles
      });
    }, [
      projectFilesForParent,
      hasUnsavedProjectFileChanges,
      savingProjectFiles
    ]);

    useEffect(() => {
      setRenamePathInput(activeFile?.path || '/index.html');
    }, [activeFile?.path]);

    useEffect(() => {
      if (!selectedFolderPath) {
        setFolderMoveTargetPath('');
        return;
      }
      setFolderMoveTargetPath(selectedFolderPath);
    }, [selectedFolderPath]);

    function handleViewModeChange(nextMode: WorkspaceViewMode) {
      if (nextMode === viewMode) return;
      if (nextMode === 'code' && !codeWorkspaceAvailable) return;
      if (isShowingStreamingCode) {
        streamingAutoFollowEnabledRef.current = nextMode === 'code';
      }
      setViewMode(nextMode);
    }

    return (
      <div
        className={`${runtimeOnly ? runtimePanelClass : panelClass}${className ? ` ${className}` : ''}`}
      >
        <ProjectFileInputs
          projectAssetInputRef={projectAssetInputRef}
          projectFileInputRef={projectFileInputRef}
          projectFolderInputRef={projectFolderInputRef}
          onImportProjectFolder={(fileList) => {
            void handleImportProjectFolder(fileList);
          }}
          onUploadProjectAssets={(fileList) => {
            void handleUploadProjectAssets(fileList);
          }}
          onUploadProjectFiles={(fileList) => {
            void handleUploadProjectFiles(fileList);
          }}
        />
        {!runtimeOnly && (
          <WorkspaceToolbar
            isOwner={isOwner}
            viewMode={viewMode}
            viewOptions={availableWorkspaceViewOptions}
            onOpenHistory={() => setHistoryOpen(true)}
            onViewModeChange={handleViewModeChange}
          />
        )}

        <div
          className={css`
            flex: 1;
            overflow: hidden;
            background: #fff;
            min-height: 0;
          `}
        >
          {runtimeOnly ? (
            <PreviewStage
              activePreviewFrame={activePreviewFrame}
              codeWorkspaceAvailable={codeWorkspaceAvailable}
              isOwner={isOwner}
              latestRuntimeObservationIssue={latestRuntimeObservationIssue}
              latestRuntimeObservationProjectFilePath={
                latestRuntimeObservationProjectFilePath
              }
              latestRuntimeObservationStackPreview={
                latestRuntimeObservationStackPreview
              }
              previewFrameMetaRef={previewFrameMetaRef}
              previewFrameReady={previewFrameReady}
              previewFrameSources={previewFrameSources}
              previewTransitioning={previewTransitioning}
              primaryIframeRef={primaryIframeRef}
              runtimePreviewFrameNonce={runtimePreviewFrameNonce}
              runtimePreviewFrameSrc={runtimePreviewFrameSrc}
              secondaryIframeRef={secondaryIframeRef}
              shouldMountRuntimePreviewFrame={shouldMountRuntimePreviewFrame}
              shouldShowRuntimePreviewStage={shouldShowRuntimePreviewStage}
              shouldShowWorkspacePreviewStage={shouldShowWorkspacePreviewStage}
              variant="runtime"
              onOpenRuntimeIssueProjectFile={openRuntimeIssueProjectFile}
              onPreviewFrameLoad={handlePreviewFrameLoad}
            />
          ) : viewMode === 'preview' ? (
            <PreviewStage
              activePreviewFrame={activePreviewFrame}
              codeWorkspaceAvailable={codeWorkspaceAvailable}
              isOwner={isOwner}
              latestRuntimeObservationIssue={latestRuntimeObservationIssue}
              latestRuntimeObservationProjectFilePath={
                latestRuntimeObservationProjectFilePath
              }
              latestRuntimeObservationStackPreview={
                latestRuntimeObservationStackPreview
              }
              previewFrameMetaRef={previewFrameMetaRef}
              previewFrameReady={previewFrameReady}
              previewFrameSources={previewFrameSources}
              previewTransitioning={previewTransitioning}
              primaryIframeRef={primaryIframeRef}
              runtimePreviewFrameNonce={runtimePreviewFrameNonce}
              runtimePreviewFrameSrc={runtimePreviewFrameSrc}
              secondaryIframeRef={secondaryIframeRef}
              shouldMountRuntimePreviewFrame={shouldMountRuntimePreviewFrame}
              shouldShowRuntimePreviewStage={shouldShowRuntimePreviewStage}
              shouldShowWorkspacePreviewStage={shouldShowWorkspacePreviewStage}
              variant="workspace"
              onOpenRuntimeIssueProjectFile={openRuntimeIssueProjectFile}
              onPreviewFrameLoad={handlePreviewFrameLoad}
            />
          ) : viewMode === 'manual' ? (
            <AgentManualPane
              capabilitySnapshot={resolvedCapabilitySnapshot}
            />
          ) : (
            <CodeWorkspacePane
              displayedProjectFiles={displayedProjectFiles}
              projectExplorerEntries={projectExplorerEntries}
              selectedFolderPath={selectedFolderPath}
              folderMoveTargetPath={folderMoveTargetPath}
              newFilePath={newFilePath}
              activeFilePath={activeFilePath}
              activeFile={activeFile}
              renamePathInput={renamePathInput}
              isOwner={isOwner}
              isShowingStreamingCode={isShowingStreamingCode}
              hasUnsavedProjectFileChanges={hasUnsavedProjectFileChanges}
              savingProjectFiles={savingProjectFiles}
              downloadingProjectArchive={downloadingProjectArchive}
              projectFilesLocked={projectFilesLocked}
              projectFileError={projectFileError}
              projectFileSaveError={projectFileSaveError}
              maxProjectFileLines={maxProjectFileLines ?? 500}
              currentBuildRuntimeAssets={workspaceRuntimeAssets}
              streamingAutoFollowEnabled={streamingAutoFollowEnabledRef.current}
              persistedFileContentByPath={persistedFileContentByPath}
              onNewFilePathChange={setNewFilePath}
              onAddProjectFile={handleAddProjectFile}
              onOpenProjectFileUploadPicker={openProjectFileUploadPicker}
              onOpenProjectFolderImportPicker={openProjectFolderImportPicker}
              onOpenProjectAssetUploadPicker={openProjectAssetUploadPicker}
              onOpenRuntimeUploadsManager={() => {
                onOpenRuntimeUploadsManager?.();
              }}
              onFolderMoveTargetPathChange={setFolderMoveTargetPath}
              onMoveSelectedFolder={handleMoveSelectedFolder}
              onSelectFolder={handleSelectFolder}
              onToggleFolderCollapsed={toggleFolderCollapsed}
              onSelectFile={(path) => {
                if (isShowingStreamingCode) {
                  streamingAutoFollowEnabledRef.current = false;
                }
                setActiveFilePath(path);
                setSelectedFolderPath(null);
                setProjectFileError('');
                setProjectFileSaveError('');
              }}
              onDeleteProjectFile={handleDeleteProjectFile}
              onRenamePathInputChange={setRenamePathInput}
              onRenameOrMoveActiveFile={handleRenameOrMoveActiveFile}
              onSaveEditableProjectFiles={handleSaveEditableProjectFiles}
              onDownloadProjectArchive={handleDownloadProjectArchive}
              onDismissProjectFileError={() => {
                setProjectFileError('');
                setProjectFileSaveError('');
              }}
              onActiveFileContentChange={handleEditableFileContentChange}
            />
          )}
        </div>
        <GuestRestrictionBanner
          visible={guestRestrictionBannerVisible}
          userId={resolvedUserId}
          message={GUEST_RESTRICTION_BANNER_TEXT}
          onOpenSigninModal={onOpenSigninModal}
          onDismiss={() => setGuestRestrictionBannerVisible(false)}
        />
        {!runtimeOnly && (
          <VersionHistoryModal
            isOpen={historyOpen}
            loadingVersions={loadingVersions}
            versions={versions}
            restoringVersionId={restoringVersionId}
            onClose={() => setHistoryOpen(false)}
            onRestoreVersion={handleRestoreVersion}
          />
        )}
        {projectFileConfirmModal}
      </div>
    );
  }
);

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;

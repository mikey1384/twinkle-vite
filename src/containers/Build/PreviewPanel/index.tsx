import React, {
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyContext, useViewContext } from '~/contexts';
import useBuildAudioMuted from '~/helpers/useBuildAudioMuted';
import { css } from '@emotion/css';
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
  useRuntimePreviewSrc,
  useWorkspacePreviewSrc
} from './hooks/useSource';
import { getBuildPreviewMessageTargetOrigin } from '~/helpers/buildPreviewOriginHelpers';
import { type BuildAgentAssetCreateOptions } from '~/containers/Build/helpers/agentWorkspaceAssets';
import type {
  EditableProjectFile,
  PreviewPanelHandle,
  PreviewFrameRetiredHandler,
  PreviewPanelProps
} from './types';
import type { BuildLiveSafetyStopRequest } from './types/previewHostBridgeTypes';
import VersionHistoryModal from './VersionHistoryModal';
import useHostConfirmations from './hooks/useHostConfirmations';
import {
  EMPTY_PREVIEW_RUNTIME_UPLOAD_ASSETS,
  PREVIEW_HIDDEN_SUSPEND_DELAY_MS,
  createPreviewRevision,
  getRuntimeIssueStackPreview,
  resolveRuntimeIssueProjectFilePath,
  type PreviewLifecycleState
} from './helpers/previewHelpers';
import { createIframeFocusController } from '~/helpers/iframeFocus';
import {
  type BuildViewerAgeTier,
  resolveViewerAgeTier
} from './helpers/previewBridgeAuth';
import PreviewStage, { BuildLiveHostSafetyControls } from './PreviewStage';
import ProjectFileInputs from './ProjectFileInputs';
import AgentManualPaneLoader from './AgentManualPaneLoader';
import { createPortal } from 'react-dom';
import WorkspaceToolbar from './WorkspaceToolbar';
import {
  AppHelperBadge,
  AppHelperModal,
  AppHelperToolbarButton
} from './AppHelperControl';
import useAppHelperPairing from './hooks/useAppHelperPairing';
import type {
  AppHelperBridge,
  AppHelperEvents,
  AppHelperRelayState
} from './types/appHelperTypes';
import {
  workspaceViewOptions,
  type WorkspaceViewMode
} from './constants/workspaceView';
import useAppRequests from './hooks/useAppRequests';
import useAppFrameKeyboard from './hooks/useAppFrameKeyboard';
import useProjectFileActions from './hooks/useProjectFileActions';
import useProjectFileUploads from './hooks/useProjectFileUploads';
import useProjectAssets from './hooks/useProjectAssets';
import useVersionHistory from './hooks/useVersionHistory';
import { BUILD_WORKSPACE_COMPACT_MEDIA_QUERY } from '../Editor/constants';
import { getAppInfoRelease } from '~/helpers/buildAppInfo';
import { getBuildPreviewCodeSignature } from '../helpers/previewVersion';
import useLumineWorkSignals from './LumineAtWork/useLumineWorkSignals';
import {
  describeLumineWork,
  LUMINE_KEEPS_WORKING_NOTE,
  resolveLumineWorkMode
} from './LumineAtWork/activity';
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
      lumineRunActive = false,
      lumineActivity = null,
      onReplaceCode,
      onApplyRestoredProjectFiles,
      onSaveProjectFiles,
      runtimeOnly = false,
      appLifecycleSource = null,
      captureScratch = null,
      requireSignedPreviewAccess = false,
      runtimeHostVisible = true,
      preventFrameSuspend = false,
      audioMuted = false,
      capabilitySnapshot = null,
      appMcpSessionId = null,
      appHelperEnabled = false,
      appHelperToolbarSlot = null,
      appHelperCompact = false,
      appHelperHideIdleButton = false,
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
      rewardProposalReviewId = null,
      onCaptureReadyChange
    }: PreviewPanelProps,
    ref
  ) {
    const navigate = useNavigate();
    const pageVisible = useViewContext((v) => v.state.pageVisible);
    // useNavigate changes identity with declarative-router locations. Keep it
    // behind a stable ref so ordinary SPA navigation does not tear down the
    // host bridge's live world/chat subscriptions and runtime sessions.
    const navigateHostContentRef = useRef<(url: string) => void>(
      () => undefined
    );
    navigateHostContentRef.current = (url: string) => {
      const destination = new URL(url);
      navigate(
        `${destination.pathname}${destination.search}${destination.hash}`
      );
    };
    const [viewMode, setViewMode] = useState<WorkspaceViewMode>('preview');
    const previewRootRef = useRef<HTMLDivElement | null>(null);
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
        workspaceViewOptions.filter((option) => {
          if (option.value === 'code' && !codeWorkspaceAvailable) return false;
          return true;
        }),
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
      const viewModeAvailable = availableWorkspaceViewOptions.some(
        (option) => option.value === viewMode
      );
      if (!viewModeAvailable) {
        setViewMode('preview');
      }
    }, [availableWorkspaceViewOptions, viewMode]);
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
    // Save base bound to the current draft buffer: the server-issued files
    // hash captured whenever the buffer is (re)seeded from persisted files.
    // While the user diverges from that snapshot this stays put, so saves keep
    // proving the base their edits actually derive from.
    const draftBaseFilesHashRef = useRef<string | null>(
      typeof build?.projectFilesHash === 'string'
        ? build.projectFilesHash
        : null
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
    const ageTierRef = useRef<BuildViewerAgeTier>('kid');
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
      const preferredOverride = String(
        normalizedPreviewSrcOverride || ''
      ).trim();
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
      draftBaseFilesHashRef.current =
        typeof buildRef.current?.projectFilesHash === 'string'
          ? buildRef.current.projectFilesHash
          : null;
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

    function rebaseDraftBaseFilesHash(filesHash: string) {
      draftBaseFilesHashRef.current = filesHash;
    }

    useImperativeHandle(ref, () => ({
      showPreview() {
        setViewMode('preview');
        window.requestAnimationFrame(() => {
          const frame = previewRootRef.current?.querySelector('iframe');
          if (!frame) return;
          frame.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          try {
            frame.focus({ preventScroll: true });
          } catch {
            frame.focus();
          }
        });
      },
      openProjectFileUploadPicker,
      openProjectFolderImportPicker,
      openProjectAssetUploadPicker,
      discardProjectFileDraft,
      rebaseProjectFileDraftBase: rebaseDraftBaseFilesHash,
      captureThumbnail,
      async uploadGeneratedProjectAsset(options: BuildAgentAssetCreateOptions) {
        return await createAgentProjectAsset(options);
      }
    }));

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
    const [memberAudioMuted] = useBuildAudioMuted(keyUserId);
    const keyUsername = useKeyContext((v) => v.myState.username);
    const keyProfilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
    const keyUnlockedAchievementIds = useKeyContext(
      (v) => v.myState.unlockedAchievementIds
    );
    const resolvedUserId =
      typeof viewerOverride?.id === 'number' ? viewerOverride.id : keyUserId;
    // Achievements are only known for the signed-in user; a previewed override viewer stays 'kid'.
    const resolvedAgeTier: BuildViewerAgeTier =
      keyUserId && resolvedUserId === keyUserId
        ? resolveViewerAgeTier(keyUnlockedAchievementIds)
        : 'kid';
    const previewViewerKey = resolvedUserId
      ? `user:${resolvedUserId}`
      : 'guest';
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
    } = useAppRequests({ rewardProposalReviewId });

    const buildApiTokenRef = useRef<{
      buildId?: number;
      userId?: number;
      token: string;
      scopes: string[];
      expiresAt: number;
    } | null>(null);
    const onPreviewFrameRetiredRef = useRef<PreviewFrameRetiredHandler | null>(
      null
    );
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
      ageTierRef,
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
    ageTierRef.current = resolvedAgeTier;
    const {
      confirmModal: projectFileConfirmModal,
      requestConfirm: requestProjectFileConfirm
    } = useConfirmModal();
    const {
      confirmModal: restoreVersionConfirmModal,
      requestConfirm: requestRestoreVersionConfirm
    } = useConfirmModal();
    const {
      activeBuildLiveSafetyHostSessions,
      setActiveBuildLiveSafetyHostSessions,
      requestBuildLiveSafetyStopRef,
      requestBuildImageGenerationConfirmationRef,
      requestBuildMusicGenerationConfirmationRef,
      requestBuildCoinConfirmationRef,
      requestBuildAppLinkRef,
      requestBuildMediaActionConfirmationRef,
      requestCardCraftSelectionRef,
      hostConfirmationModals
    } = useHostConfirmations({ build, keyUserId, previewRootRef });
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
      getDraftBaseFilesHash: () => draftBaseFilesHashRef.current,
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
      rebaseDraftBaseFilesHash,
      renamePathInput,
      requestConfirm: requestProjectFileConfirm,
      savingProjectFiles,
      savingProjectFilesRef,
      selectedFolderPath,
      userId: resolvedUserId || null,
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
    const { handleImportProjectFolder, handleUploadProjectFiles } =
      useProjectFileUploads({
        areProjectFileMutationsLocked,
        buildId: build.id,
        cleanupRestoredRuntimeAssets,
        code,
        editableProjectFilesRef,
        ensureBuildApiTokenForBuild,
        getDraftBaseFilesHash: () => draftBaseFilesHashRef.current,
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
      restoreError,
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
      lumineRunActive: Boolean(lumineRunActive),
      onApplyRestoredProjectFiles,
      onReplaceCode,
      requestRestoreConfirm: requestRestoreVersionConfirm,
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

    const [runtimeAccessError, setRuntimeAccessError] = useState<string | null>(
      null
    );
    const [workspaceAccessError, setWorkspaceAccessError] = useState<
      string | null
    >(null);
    const [previewAccessRetryNonce, setPreviewAccessRetryNonce] = useState(0);
    const runtimePreviewSrc = useRuntimePreviewSrc({
      build,
      enabled: runtimeOnly && hasRuntimePreview,
      previewSrcOverride: normalizedPreviewSrcOverride,
      appMcpSessionId,
      requireSignedAccess: requireSignedPreviewAccess,
      onAccessError: setRuntimeAccessError,
      retryNonce: previewAccessRetryNonce,
      userId: resolvedUserId || null,
      previewAuth
    });

    const workspacePreviewSrc = useWorkspacePreviewSrc({
      onAccessError: setWorkspaceAccessError,
      retryNonce: previewAccessRetryNonce,
      build,
      runtimeOnly,
      previewRevision: previewProjectFilesRevision,
      viewMode,
      userId: resolvedUserId || null,
      previewAuth
    });
    const previewCodeSignature = getBuildPreviewCodeSignature(
      build,
      previewProjectFilesRevision
    );
    const previewHostEnabled = runtimeHostVisible !== false;
    const previewHostVisible = previewHostEnabled;
    const previewAudioMuted = audioMuted || memberAudioMuted;
    // Only Twinkle-owned visibility may pause, mute, or retire the iframe.
    // Browser tab and desktop switches leave the active app running and audible;
    // the browser remains responsible for native background throttling.
    const previewFrameSuspended =
      !preventFrameSuspend &&
      !previewHostEnabled &&
      previewLifecycleState === 'suspended';

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
      navigatePreviewFrameRef,
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
      viewerKey: previewViewerKey,
      workspacePreviewSrc: previewFrameSuspended
        ? null
        : normalizedPreviewSrcOverride || workspacePreviewSrc,
      onPreviewFrameRetiredRef
    });

    useEffect(() => {
      const focusController = createIframeFocusController({
        cancelScheduledCheck: (checkId) => window.clearTimeout(checkId),
        documentHasFocus: () => document.hasFocus(),
        getActiveElement: () => document.activeElement,
        getOwnedFrames: () => [
          primaryIframeRef.current,
          secondaryIframeRef.current
        ],
        restoreWindowFocus: () => {
          window.dispatchEvent(new Event('focus'));
        },
        scheduleCheck: (callback) => window.setTimeout(callback, 0)
      });

      window.addEventListener('blur', focusController.handleWindowBlur);
      return () => {
        window.removeEventListener('blur', focusController.handleWindowBlur);
        focusController.dispose();
      };
    }, [primaryIframeRef, secondaryIframeRef]);

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
    // Lumine at work (Mikey 11-24): while Lumine builds, or while there is
    // nothing to preview yet, the preview area shows pixel Lumine at her desk
    // instead of an empty frame or "Preview file not found". A working
    // preview stays in view with a small Lumine in the corner.
    const lumineWorkSignals = useLumineWorkSignals({
      running: Boolean(lumineRunActive),
      streamingProjectFiles,
      streamingFocusFilePath,
      terminalState: lumineActivity?.terminalState ?? null
    });
    const previewHasContent = previewProjectFiles.some((file) =>
      Boolean(String(file.content || '').trim())
    );
    const lumineBusy = Boolean(lumineRunActive) || lumineWorkSignals.lingering;
    // The full scene only where there is no working preview to look at; the
    // celebration after a run plays in the corner over an existing preview.
    const lumineStageShown =
      !runtimeOnly &&
      (!previewHasContent ||
        (lumineBusy && !previewFrameReady[activePreviewFrame]));
    const lumineWorkMode = resolveLumineWorkMode({
      running: Boolean(lumineRunActive),
      activity: lumineActivity,
      writingRecently: lumineWorkSignals.writingRecently
    });
    const lumineScene = runtimeOnly
      ? null
      : {
          stage: lumineStageShown,
          corner: lumineBusy && !lumineStageShown,
          mode: lumineWorkMode,
          saveSignal: lumineWorkSignals.saveSignal,
          note:
            lumineRunActive && !lumineWorkSignals.lingering
              ? LUMINE_KEEPS_WORKING_NOTE
              : null,
          ...describeLumineWork({
            mode: lumineWorkMode,
            lingering: lumineWorkSignals.lingering,
            label: lumineActivity?.label ?? null,
            focusFilePath: streamingFocusFilePath,
            isOwner
          })
        };

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
        pageVisible &&
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
      pageVisible,
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
          visible: previewHostVisible
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
            ? previewFrameMetaRef.current.primary.bridgeConfirmed
              ? previewFrameMetaRef.current.primary.messageNonce
              : null
            : previewFrameMetaRef.current.secondary.bridgeConfirmed
              ? previewFrameMetaRef.current.secondary.messageNonce
              : null;
        const targetOrigin = getBuildPreviewMessageTargetOrigin(frameSource);
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
      previewHostVisible,
      secondaryIframeRef
    ]);

    const appHelperRelayStateRef = useRef<AppHelperRelayState>({
      announcement: null,
      paired: null
    });
    const appHelperBridgeRef = useRef<AppHelperBridge | null>(null);
    const appHelperEventsRef = useRef<AppHelperEvents | null>(null);
    // Same rule as Twinkle.app.getInfo: published only for the app page's own
    // run of exactly the published release.
    const appHelperRelease = getAppInfoRelease({
      runtimeOnly,
      previewSrcOverride: normalizedPreviewSrcOverride,
      currentArtifactVersionId: build.currentArtifactVersionId,
      publishedArtifactVersionId: build.publishedArtifactVersionId
    });
    const appHelperSource: 'published' | 'workspace' = appHelperRelease.source;
    const appHelper = useAppHelperPairing({
      buildId: Number(build.id),
      userId: resolvedUserId || null,
      source: appHelperSource,
      artifactVersionId: appHelperRelease.artifactVersionId,
      enabled:
        !appMcpSessionId &&
        (runtimeOnly ? appHelperEnabled && Boolean(appHelperToolbarSlot) : true),
      relayStateRef: appHelperRelayStateRef,
      bridgeRef: appHelperBridgeRef,
      eventsRef: appHelperEventsRef
    });

    const handleAppTextEntry = useAppFrameKeyboard({
      activePreviewFrame,
      previewFrameMetaRef,
      previewFrameSources,
      primaryIframeRef,
      secondaryIframeRef
    });
    const onAppTextEntryRef = useRef(handleAppTextEntry);
    onAppTextEntryRef.current = handleAppTextEntry;

    useHostBridge({
      runtimeOnly,
      appLifecycleSource,
      captureScratch,
      previewSrcOverride: normalizedPreviewSrcOverride,
      appMcpSessionId,
      appHelperRelayStateRef,
      appHelperBridgeRef,
      appHelperEventsRef,
      buildId: build.id,
      buildIsPublic: build.isPublic,
      isOwner,
      userId: resolvedUserId || null,
      username: resolvedUsername || null,
      ageTier: resolvedAgeTier,
      profilePicUrl: resolvedProfilePicUrl || null,
      resolvedCapabilitySnapshot,
      resolvedRuntimeExplorationPlan,
      audioMuted: previewAudioMuted,
      mountContext,
      launchTarget,
      capabilitySnapshotRef,
      runtimeExplorationPlanRef,
      messageTargetFrameRef,
      navigateHostContentRef,
      navigatePreviewFrameRef,
      previewCodeSignatureRef,
      previewFrameMetaRef,
      previewFrameReady,
      previewFrameSources,
      previewFrameSourcesRef,
      previewTransitioningRef,
      onPreviewFrameRetiredRef,
      primaryIframeRef,
      secondaryIframeRef,
      setRuntimeObservationState,
      previewAuth,
      requestRefs: previewRequestRefs,
      runtimeUploadsSyncRef: onRuntimeUploadsSyncRef,
      onAiUsagePolicyUpdateRef,
      requestBuildImageGenerationConfirmationRef,
      requestBuildMusicGenerationConfirmationRef,
      requestBuildMediaActionConfirmationRef,
      requestBuildCoinConfirmationRef,
      requestBuildAppLinkRef,
      requestCardCraftSelectionRef,
      onBuildLiveSafetyHostSessionsChange: setActiveBuildLiveSafetyHostSessions,
      requestBuildLiveSafetyStopRef,
      onAppTextEntryRef
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
      draftBaseFilesHashRef.current =
        typeof buildRef.current?.projectFilesHash === 'string'
          ? buildRef.current.projectFilesHash
          : null;
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
      draftBaseFilesHashRef.current =
        typeof buildRef.current?.projectFilesHash === 'string'
          ? buildRef.current.projectFilesHash
          : null;
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
      hasUnsavedProjectFileChanges,
      build.projectFilesHash
    ]);

    useEffect(() => {
      const justStartedStreaming =
        isShowingStreamingCode && !wasShowingStreamingCodeRef.current;
      const justStoppedStreaming =
        !isShowingStreamingCode && wasShowingStreamingCodeRef.current;
      wasShowingStreamingCodeRef.current = isShowingStreamingCode;

      if (justStartedStreaming) {
        const isCompactWorkspace =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia(BUILD_WORKSPACE_COMPACT_MEDIA_QUERY).matches;

        streamingAutoFollowEnabledRef.current = true;
        autoReturnToPreviewPendingRef.current = false;
        // Keep the live simulator visible in compact workspace while Lumine streams code.
        if (!isCompactWorkspace && viewMode !== 'code') {
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
    }, [isShowingStreamingCode, runtimeOnly, viewMode]);

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
        saving: savingProjectFiles,
        draftBaseFilesHash: draftBaseFilesHashRef.current
      });
    }, [
      projectFilesForParent,
      hasUnsavedProjectFileChanges,
      savingProjectFiles,
      build.projectFilesHash
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

    async function handleBuildLiveSafetyStop(
      request: BuildLiveSafetyStopRequest
    ) {
      const stop = requestBuildLiveSafetyStopRef.current;
      if (!stop) throw new Error('Live safety is unavailable.');
      await stop(request);
    }

    return (
      <div
        ref={previewRootRef}
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
            appHelperButton={<AppHelperToolbarButton pairing={appHelper} />}
            onOpenHistory={() => setHistoryOpen(true)}
            onViewModeChange={handleViewModeChange}
          />
        )}
        {runtimeOnly && appHelperToolbarSlot
          ? createPortal(
              <AppHelperToolbarButton
                pairing={appHelper}
                compact={appHelperCompact}
                hideWhenIdle={appHelperHideIdleButton}
              />,
              appHelperToolbarSlot
            )
          : null}
        <AppHelperModal pairing={appHelper} />

        <div
          className={css`
            flex: 1;
            position: relative;
            overflow: hidden;
            background: #fff;
            min-height: 0;
          `}
        >
          <BuildLiveHostSafetyControls
            sessions={activeBuildLiveSafetyHostSessions}
            onStop={handleBuildLiveSafetyStop}
          />
          <AppHelperBadge pairing={appHelper} />
          {runtimeOnly ? (
            <PreviewStage
              audioMuted={previewAudioMuted}
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
              accessError={!runtimePreviewSrc ? runtimeAccessError : null}
              onRetryAccess={() =>
                setPreviewAccessRetryNonce((nonce) => nonce + 1)
              }
              variant="runtime"
              onOpenRuntimeIssueProjectFile={openRuntimeIssueProjectFile}
              onPreviewFrameLoad={handlePreviewFrameLoad}
            />
          ) : viewMode === 'preview' ? (
            <PreviewStage
              audioMuted={previewAudioMuted}
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
              accessError={!workspacePreviewSrc ? workspaceAccessError : null}
              onRetryAccess={() =>
                setPreviewAccessRetryNonce((nonce) => nonce + 1)
              }
              variant="workspace"
              lumineScene={lumineScene}
              onOpenRuntimeIssueProjectFile={openRuntimeIssueProjectFile}
              onPreviewFrameLoad={handlePreviewFrameLoad}
            />
          ) : viewMode === 'manual' ? (
            <AgentManualPaneLoader
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
            restoreError={restoreError}
            onClose={() => setHistoryOpen(false)}
            onRestoreVersion={handleRestoreVersion}
          />
        )}
        {projectFileConfirmModal}
        {restoreVersionConfirmModal}
        {hostConfirmationModals}
      </div>
    );
  }
);

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;

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
import type {
  BuildLiveSafetyHostSession,
  BuildLiveSafetyStopRequest,
  BuildMediaActionConfirmationRequest,
  PreviewOpenContentConfirmationRequest
} from './types/previewHostBridgeTypes';
import type { BuildRuntimeImageGenerationConfirmationRequest } from './helpers/buildRuntimeImageGeneration';
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
import { createIframeFocusController } from '~/helpers/iframeFocus';
import AgentManualPane from './AgentManualPane';
import PreviewStage, { BuildLiveHostSafetyControls } from './PreviewStage';
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
import { BUILD_WORKSPACE_COMPACT_MEDIA_QUERY } from '../Editor/constants';
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

const openContentDestinationClass = css`
  max-width: 100%;
  max-height: 12rem;
  overflow: auto;
  overflow-wrap: anywhere;
  text-align: center;
`;

const imageGenerationConfirmationClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 100%;
  text-align: left;
`;

const imageGenerationPromptClass = css`
  max-width: 100%;
  max-height: 12rem;
  overflow: auto;
  overflow-wrap: anywhere;
  padding: 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 1.1rem;
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
      requireSignedPreviewAccess = false,
      runtimeHostVisible = true,
      preventFrameSuspend = false,
      audioMuted = false,
      capabilitySnapshot = null,
      appMcpSessionId = null,
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
      openProjectFileUploadPicker,
      openProjectFolderImportPicker,
      openProjectAssetUploadPicker,
      discardProjectFileDraft,
      rebaseProjectFileDraftBase: rebaseDraftBaseFilesHash,
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
    const keyUsername = useKeyContext((v) => v.myState.username);
    const keyProfilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
    const resolvedUserId =
      typeof viewerOverride?.id === 'number' ? viewerOverride.id : keyUserId;
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
    } = useAppRequests();

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
      confirmModal: openContentConfirmModal,
      requestConfirm: requestOpenContentConfirm
    } = useConfirmModal();
    const {
      confirmModal: imageGenerationConfirmModal,
      requestConfirm: requestImageGenerationConfirm
    } = useConfirmModal();
    const {
      confirmModal: mediaActionConfirmModal,
      requestConfirm: requestMediaActionConfirm
    } = useConfirmModal();
    const [
      activeBuildLiveSafetyHostSessions,
      setActiveBuildLiveSafetyHostSessions
    ] = useState<BuildLiveSafetyHostSession[]>([]);
    const requestBuildLiveSafetyStopRef = useRef<
      ((request: BuildLiveSafetyStopRequest) => Promise<void>) | null
    >(null);
    const requestOpenContentConfirmationRef = useRef<
      | ((request: PreviewOpenContentConfirmationRequest) => Promise<boolean>)
      | null
    >(null);
    useEffect(() => {
      requestOpenContentConfirmationRef.current = ({ url }) => {
        const destination = new URL(url);
        return requestOpenContentConfirm({
          title: 'Open Twinkle content?',
          description: (
            <span className={openContentDestinationClass}>
              Open{' '}
              <strong>
                {destination.pathname}
                {destination.search}
                {destination.hash}
              </strong>
              ?
            </span>
          ),
          descriptionFontSize: '1.2rem',
          confirmButtonLabel: 'Open content',
          modalOverModal: true
        });
      };
      return () => {
        requestOpenContentConfirmationRef.current = null;
      };
    }, [requestOpenContentConfirm]);
    const requestBuildImageGenerationConfirmationRef = useRef<
      | ((
          request: BuildRuntimeImageGenerationConfirmationRequest
        ) => Promise<boolean>)
      | null
    >(null);
    useEffect(() => {
      requestBuildImageGenerationConfirmationRef.current = ({
        prompt,
        engine,
        quality
      }) => {
        return requestImageGenerationConfirm({
          title: 'Generate an image with AI Energy?',
          description: (
            <span className={imageGenerationConfirmationClass}>
              <span>
                <strong>{build.title || 'This Build app'}</strong> wants to
                generate an image using your AI Energy.
              </span>
              <span className={imageGenerationPromptClass}>
                <strong>Prompt:</strong> {prompt || '(empty prompt)'}
              </span>
              <span>
                Provider: {engine === 'gemini' ? 'Gemini' : 'OpenAI'}, {quality}{' '}
                quality. Each approval authorizes one generation.
              </span>
            </span>
          ),
          descriptionFontSize: '1.1rem',
          confirmButtonLabel: 'Generate image',
          modalOverModal: true
        });
      };
      return () => {
        requestBuildImageGenerationConfirmationRef.current = null;
      };
    }, [build.title, requestImageGenerationConfirm]);
    const requestBuildMediaActionConfirmationRef = useRef<
      | ((request: BuildMediaActionConfirmationRequest) => Promise<boolean>)
      | null
    >(null);
    useEffect(() => {
      requestBuildMediaActionConfirmationRef.current = ({
        kind,
        audio,
        saveReplay
      }) => {
        const appTitle = build.title || 'This Build app';
        const confirmation =
          kind === 'photo'
            ? {
                title: 'Allow camera use?',
                description: 'use your camera to take one photo',
                detail:
                  'Nothing starts unless you approve. The photo is saved in your Twinkle file storage so this app can use it. Your browser may also ask for camera permission.',
                confirmButtonLabel: 'Take photo'
              }
            : kind === 'clip'
              ? {
                  title: 'Allow camera use?',
                  description:
                    'use your camera to record one short, camera-only clip',
                  detail:
                    'Nothing starts unless you approve. The clip is saved in your Twinkle file storage so this app can use it. Your browser may also ask for camera permission. Processing uses Media Energy.',
                  confirmButtonLabel: 'Record clip'
                }
              : kind === 'clip-upload'
                ? {
                    title: 'Use Media Energy?',
                    description: 'process and save one short video',
                    detail:
                      'Each approval authorizes one video saved in your Twinkle file storage so this app can use it. Processing uses Media Energy.',
                    confirmButtonLabel: 'Process video'
                  }
                : kind === 'live'
                  ? {
                      title: 'Allow camera use?',
                      description: `start a livestream using your camera${
                        audio ? ' and microphone' : ''
                      }`,
                      detail: `Nothing starts unless you approve. Livestreams last up to 15 minutes and use Media Energy.${
                        saveReplay
                          ? ' This stream will also be saved for this app as a replay for seven days. Replay storage and viewing use Media Energy; its creator or the app owner can remove it.'
                          : ''
                      } Your browser may also ask for ${
                        audio
                          ? 'camera and microphone permissions.'
                          : 'camera permission.'
                      }`,
                      confirmButtonLabel: 'Start livestream'
                    }
                  : kind === 'live-watch'
                    ? {
                        title: 'Watch livestream?',
                        description: 'join one livestream',
                        detail:
                          'Each approval authorizes one viewer spot and uses Media Energy.',
                        confirmButtonLabel: 'Watch livestream'
                      }
                    : kind === 'replay-watch'
                        ? {
                            title: 'Watch replay?',
                            description: 'play one saved livestream',
                            detail:
                              'Each approval opens one private playback grant for up to 20 minutes and uses Media Energy.',
                            confirmButtonLabel: 'Watch replay'
                          }
                        : {
                            title: 'Remove replay?',
                            description:
                              'permanently remove this saved livestream',
                            detail:
                              'Only the replay creator or app owner can do this. Twinkle will delete the private recording; this cannot be undone.',
                            confirmButtonLabel: 'Remove replay'
                          };
        return requestMediaActionConfirm({
          title: confirmation.title,
          description: (
            <span className={imageGenerationConfirmationClass}>
              <span>
                <strong>{appTitle}</strong> wants to {confirmation.description}.
              </span>
              <span>{confirmation.detail}</span>
            </span>
          ),
          descriptionFontSize: '1.1rem',
          confirmButtonLabel: confirmation.confirmButtonLabel,
          modalOverModal: true
        });
      };
      return () => {
        requestBuildMediaActionConfirmationRef.current = null;
      };
    }, [build.title, requestMediaActionConfirm]);
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

    const runtimePreviewSrc = useRuntimePreviewSrc({
      build,
      enabled: runtimeOnly && hasRuntimePreview,
      previewSrcOverride: normalizedPreviewSrcOverride,
      appMcpSessionId,
      requireSignedAccess: requireSignedPreviewAccess,
      userId: resolvedUserId || null,
      previewAuth
    });

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
    const previewHostEnabled = runtimeHostVisible !== false;
    const previewHostVisible = previewHostEnabled;
    const previewAudioMuted = audioMuted;
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

    useHostBridge({
      runtimeOnly,
      appMcpSessionId,
      buildId: build.id,
      buildIsPublic: build.isPublic,
      isOwner,
      userId: resolvedUserId || null,
      username: resolvedUsername || null,
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
      requestBuildMediaActionConfirmationRef,
      onBuildLiveSafetyHostSessionsChange: setActiveBuildLiveSafetyHostSessions,
      requestBuildLiveSafetyStopRef,
      requestOpenContentConfirmationRef
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
            <AgentManualPane capabilitySnapshot={resolvedCapabilitySnapshot} />
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
        {openContentConfirmModal}
        {imageGenerationConfirmModal}
        {mediaActionConfirmModal}
      </div>
    );
  }
);

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;

import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import type { BuildCapabilitySnapshot } from '../capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../runtimeObservationTypes';
import GuestRestrictionBanner from './GuestRestrictionBanner';
import {
  buildEditableProjectFiles,
  buildProjectExplorerEntries,
  getPreferredIndexPath,
  isIndexHtmlPath,
  isPathWithinFolder,
  normalizeProjectFilePath,
  remapPathPrefix,
  serializeEditableProjectFiles
} from './projectFiles';
import CodeWorkspacePane from './CodeWorkspacePane';
import { usePreviewFrameManager } from './usePreviewFrameManager';
import {
  buildEmptyRuntimeObservationState,
  normalizeRuntimeExplorationPlan,
  usePreviewHostBridge
} from './usePreviewHostBridge';
import {
  buildPreviewBaseSrc,
  useWorkspacePreviewSrc
} from './usePreviewSource';
import type {
  ArtifactVersion,
  EditableProjectFile,
  PreviewPanelProps
} from './types';
import VersionHistoryModal from './VersionHistoryModal';
const GUEST_RESTRICTION_BANNER_TEXT =
  'Some features were restricted because this app uses user-only data. Sign in to access those parts.';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

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

const toolbarClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: var(--build-workspace-header-height);
  padding: 0 1rem;
  column-gap: 0.75rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    row-gap: 0.65rem;
    padding: 0.9rem 1rem;
  }
`;

const toolbarTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 1.2rem;
  font-family: ${displayFontFamily};
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const previewStageClass = css`
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
`;

const previewPreloadSurfaceClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  background: #fafbff;
  color: var(--chat-text);
  z-index: 1;
`;

const previewPreloadIconWrapClass = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const previewPreloadLabelClass = css`
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.82;
`;

const previewIframeClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  transition: opacity 0.18s ease;
`;

const previewLoadingOverlayClass = css`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--chat-text);
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 4;
  backdrop-filter: blur(1px);
`;

const previewSpinnerClass = css`
  animation: previewSpin 0.9s linear infinite;
  @keyframes previewSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' }
] as const;

export default function PreviewPanel({
  build,
  code,
  projectFiles,
  streamingProjectFiles = null,
  streamingFocusFilePath = null,
  isOwner,
  onReplaceCode,
  onApplyRestoredProjectFiles,
  onSaveProjectFiles,
  runtimeOnly = false,
  capabilitySnapshot = null,
  onEditableProjectFilesStateChange,
  runtimeExplorationPlan = null,
  onRuntimeObservationChange
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(
    null
  );
  const [artifactId, setArtifactId] = useState<number | null>(
    build.primaryArtifactId ?? null
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
  const [projectFileError, setProjectFileError] = useState('');
  const [guestRestrictionBannerVisible, setGuestRestrictionBannerVisible] =
    useState(false);
  const [runtimeObservationState, setRuntimeObservationState] =
    useState<BuildRuntimeObservationState>(() =>
      buildEmptyRuntimeObservationState({
        buildId: build.id,
        codeSignature: null
      })
    );
  const buildRef = useRef(build);
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
    [editableProjectFiles, hasUnsavedProjectFileChanges, persistedProjectFiles]
  );
  const activeFile = useMemo(
    () =>
      displayedProjectFiles.find((file) => file.path === activeFilePath) ||
      displayedProjectFiles[0] ||
      null,
    [displayedProjectFiles, activeFilePath]
  );
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

  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const downloadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.downloadBuildDatabase
  );
  const uploadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.uploadBuildDatabase
  );
  const loadBuildAiPrompts = useAppContext(
    (v) => v.requestHelpers.loadBuildAiPrompts
  );
  const callBuildAiChat = useAppContext(
    (v) => v.requestHelpers.callBuildAiChat
  );
  const listBuildArtifacts = useAppContext(
    (v) => v.requestHelpers.listBuildArtifacts
  );
  const listBuildArtifactVersions = useAppContext(
    (v) => v.requestHelpers.listBuildArtifactVersions
  );
  const restoreBuildArtifactVersion = useAppContext(
    (v) => v.requestHelpers.restoreBuildArtifactVersion
  );
  const queryViewerDb = useAppContext((v) => v.requestHelpers.queryViewerDb);
  const execViewerDb = useAppContext((v) => v.requestHelpers.execViewerDb);
  const getBuildApiToken = useAppContext(
    (v) => v.requestHelpers.getBuildApiToken
  );
  const getBuildApiUser = useAppContext(
    (v) => v.requestHelpers.getBuildApiUser
  );
  const getBuildApiUsers = useAppContext(
    (v) => v.requestHelpers.getBuildApiUsers
  );
  const getBuildDailyReflections = useAppContext(
    (v) => v.requestHelpers.getBuildDailyReflections
  );
  const getBuildMySubjects = useAppContext(
    (v) => v.requestHelpers.getBuildMySubjects
  );
  const getBuildSubject = useAppContext(
    (v) => v.requestHelpers.getBuildSubject
  );
  const getBuildSubjectComments = useAppContext(
    (v) => v.requestHelpers.getBuildSubjectComments
  );
  const getBuildProfileComments = useAppContext(
    (v) => v.requestHelpers.getBuildProfileComments
  );
  const getBuildProfileCommentIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentIds
  );
  const getBuildProfileCommentsByIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentsByIds
  );
  const getBuildProfileCommentCounts = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentCounts
  );
  const getSharedDbTopics = useAppContext(
    (v) => v.requestHelpers.getSharedDbTopics
  );
  const createSharedDbTopic = useAppContext(
    (v) => v.requestHelpers.createSharedDbTopic
  );
  const getSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.getSharedDbEntries
  );
  const addSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntry
  );
  const updateSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.updateSharedDbEntry
  );
  const deleteSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntry
  );
  const getPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.getPrivateDbItem
  );
  const listPrivateDbItems = useAppContext(
    (v) => v.requestHelpers.listPrivateDbItems
  );
  const setPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.setPrivateDbItem
  );
  const deletePrivateDbItem = useAppContext(
    (v) => v.requestHelpers.deletePrivateDbItem
  );
  const listBuildReminders = useAppContext(
    (v) => v.requestHelpers.listBuildReminders
  );
  const createBuildReminder = useAppContext(
    (v) => v.requestHelpers.createBuildReminder
  );
  const updateBuildReminder = useAppContext(
    (v) => v.requestHelpers.updateBuildReminder
  );
  const deleteBuildReminder = useAppContext(
    (v) => v.requestHelpers.deleteBuildReminder
  );
  const getDueBuildReminders = useAppContext(
    (v) => v.requestHelpers.getDueBuildReminders
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );

  const downloadBuildDatabaseRef = useRef(downloadBuildDatabase);
  const uploadBuildDatabaseRef = useRef(uploadBuildDatabase);
  const loadBuildAiPromptsRef = useRef(loadBuildAiPrompts);
  const callBuildAiChatRef = useRef(callBuildAiChat);
  const listBuildArtifactsRef = useRef(listBuildArtifacts);
  const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
  const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
  const queryViewerDbRef = useRef(queryViewerDb);
  const execViewerDbRef = useRef(execViewerDb);
  const getBuildApiTokenRef = useRef(getBuildApiToken);
  const getBuildApiUserRef = useRef(getBuildApiUser);
  const getBuildApiUsersRef = useRef(getBuildApiUsers);
  const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
  const getBuildMySubjectsRef = useRef(getBuildMySubjects);
  const getBuildSubjectRef = useRef(getBuildSubject);
  const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
  const getBuildProfileCommentsRef = useRef(getBuildProfileComments);
  const getBuildProfileCommentIdsRef = useRef(getBuildProfileCommentIds);
  const getBuildProfileCommentsByIdsRef = useRef(getBuildProfileCommentsByIds);
  const getBuildProfileCommentCountsRef = useRef(getBuildProfileCommentCounts);
  const getSharedDbTopicsRef = useRef(getSharedDbTopics);
  const createSharedDbTopicRef = useRef(createSharedDbTopic);
  const getSharedDbEntriesRef = useRef(getSharedDbEntries);
  const addSharedDbEntryRef = useRef(addSharedDbEntry);
  const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
  const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
  const getPrivateDbItemRef = useRef(getPrivateDbItem);
  const listPrivateDbItemsRef = useRef(listPrivateDbItems);
  const setPrivateDbItemRef = useRef(setPrivateDbItem);
  const deletePrivateDbItemRef = useRef(deletePrivateDbItem);
  const listBuildRemindersRef = useRef(listBuildReminders);
  const createBuildReminderRef = useRef(createBuildReminder);
  const updateBuildReminderRef = useRef(updateBuildReminder);
  const deleteBuildReminderRef = useRef(deleteBuildReminder);
  const getDueBuildRemindersRef = useRef(getDueBuildReminders);

  const buildApiTokenRef = useRef<{
    token: string;
    scopes: string[];
    expiresAt: number;
  } | null>(null);
  const hydratedBuildIdRef = useRef<number | null>(null);
  const capabilitySnapshotRef = useRef<BuildCapabilitySnapshot | null>(
    capabilitySnapshot
  );
  const runtimeExplorationPlanRef = useRef<BuildRuntimeExplorationPlan | null>(
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
  const previewRequestRefs = useRef({
    downloadBuildDatabaseRef,
    uploadBuildDatabaseRef,
    loadBuildAiPromptsRef,
    callBuildAiChatRef,
    queryViewerDbRef,
    execViewerDbRef,
    getBuildApiUserRef,
    getBuildApiUsersRef,
    getBuildDailyReflectionsRef,
    getBuildMySubjectsRef,
    getBuildSubjectRef,
    getBuildSubjectCommentsRef,
    getBuildProfileCommentsRef,
    getBuildProfileCommentIdsRef,
    getBuildProfileCommentsByIdsRef,
    getBuildProfileCommentCountsRef,
    getSharedDbTopicsRef,
    createSharedDbTopicRef,
    getSharedDbEntriesRef,
    addSharedDbEntryRef,
    updateSharedDbEntryRef,
    deleteSharedDbEntryRef,
    getPrivateDbItemRef,
    listPrivateDbItemsRef,
    setPrivateDbItemRef,
    deletePrivateDbItemRef,
    listBuildRemindersRef,
    createBuildReminderRef,
    updateBuildReminderRef,
    deleteBuildReminderRef,
    getDueBuildRemindersRef
  }).current;
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
    if (!runtimeOnly || !hasRuntimePreview) return null;
    return buildPreviewBaseSrc(build);
  }, [
    build,
    hasRuntimePreview,
    runtimeOnly
  ]);

  const workspacePreviewSrc = useWorkspacePreviewSrc({
    build,
    runtimeOnly,
    viewMode,
    userId: userId || null,
    previewAuth
  });
  const previewCodeSignature =
    Number(build.currentArtifactVersionId) > 0
      ? `artifact:${build.currentArtifactVersionId}`
      : `current:${build.id}:${Number(build.updatedAt) || 0}`;

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
  } = usePreviewFrameManager({
    buildId: build.id,
    runtimeOnly,
    previewCodeSignature,
    runtimePreviewSrc,
    workspacePreviewSrc
  });

  usePreviewHostBridge({
    runtimeOnly,
    buildId: build.id,
    buildIsPublic: build.isPublic,
    isOwner,
    userId: userId || null,
    username: username || null,
    profilePicUrl: profilePicUrl || null,
    resolvedCapabilitySnapshot,
    resolvedRuntimeExplorationPlan,
    capabilitySnapshotRef,
    runtimeExplorationPlanRef,
    messageTargetFrameRef,
    previewCodeSignatureRef,
    previewFrameMetaRef,
    previewFrameSourcesRef,
    previewTransitioningRef,
    primaryIframeRef,
    secondaryIframeRef,
    setRuntimeObservationState,
    previewAuth,
    requestRefs: previewRequestRefs
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
    onRuntimeObservationChange?.(runtimeObservationState);
  }, [onRuntimeObservationChange, runtimeObservationState]);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    setArtifactId(build.primaryArtifactId ?? null);
  }, [build.primaryArtifactId]);

  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  useEffect(() => {
    userIdRef.current = userId || null;
  }, [userId]);

  useEffect(() => {
    usernameRef.current = username || null;
  }, [username]);

  useEffect(() => {
    profilePicUrlRef.current = profilePicUrl || null;
  }, [profilePicUrl]);

  useEffect(() => {
    buildApiTokenRef.current = null;
  }, [build.id, userId]);

  useEffect(() => {
    if (userId) {
      setGuestRestrictionBannerVisible(false);
    }
  }, [userId]);

  useEffect(() => {
    capabilitySnapshotRef.current = resolvedCapabilitySnapshot;
  }, [resolvedCapabilitySnapshot]);

  useEffect(() => {
    runtimeExplorationPlanRef.current = resolvedRuntimeExplorationPlan;
  }, [resolvedRuntimeExplorationPlan]);

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
      const hasPrev = persistedProjectFiles.some((file) => file.path === prev);
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
      streamingAutoFollowEnabledRef.current = true;
      autoReturnToPreviewPendingRef.current = false;
      if (viewMode !== 'code') {
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
    const hasPreviewSurface = Boolean(
      previewFrameSources.primary || previewFrameSources.secondary || previewSrc
    );
    if (!hasPreviewSurface) return;
    autoReturnToPreviewPendingRef.current = false;
    if (viewMode !== 'preview') {
      setViewMode('preview');
    }
  }, [
    isShowingStreamingCode,
    previewFrameSources.primary,
    previewFrameSources.secondary,
    previewSrc,
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
    onEditableProjectFilesStateChange?.({
      files: projectFilesForParent,
      hasUnsavedChanges: hasUnsavedProjectFileChanges,
      saving: savingProjectFiles
    });
  }, [
    projectFilesForParent,
    hasUnsavedProjectFileChanges,
    savingProjectFiles,
    onEditableProjectFilesStateChange
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

  function setEditableFiles(
    nextFiles: EditableProjectFile[],
    options?: { markDirty?: boolean }
  ) {
    const sorted = [...nextFiles].sort((a, b) => a.path.localeCompare(b.path));
    setEditableProjectFiles(sorted);
    setHasLocalEditableProjectFileChanges(Boolean(options?.markDirty));
    setActiveFilePath((prev) => {
      if (sorted.some((file) => file.path === prev)) return prev;
      return getPreferredIndexPath(sorted) || sorted[0]?.path || '/index.html';
    });
  }

  function handleViewModeChange(nextMode: 'preview' | 'code') {
    if (nextMode === viewMode) return;
    if (isShowingStreamingCode) {
      streamingAutoFollowEnabledRef.current = nextMode === 'code';
    }
    setViewMode(nextMode);
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
    if (!isOwner || !activeFile) return;
    setEditableFiles(
      editableProjectFiles.map((file) =>
        file.path === activeFile.path ? { ...file, content } : file
      ),
      { markDirty: true }
    );
    setProjectFileError('');
  }

  function handleAddProjectFile() {
    if (!isOwner) return;
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
    if (!isOwner) return;
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
    if (!isOwner || !activeFile) return;
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
    if (
      normalizedPath !== activeFile.path &&
      editableProjectFiles.some((file) => file.path === normalizedPath)
    ) {
      // Replace the destination file automatically. Restore history is the
      // safety net for mistaken overwrites.
    }
    if (normalizedPath === activeFile.path) {
      setProjectFileError('');
      return;
    }
    const nextFiles = editableProjectFiles
      .filter(
        (file) => file.path !== normalizedPath || file.path === activeFile.path
      )
      .map((file) =>
        file.path === activeFile.path ? { ...file, path: normalizedPath } : file
      );
    setEditableFiles(nextFiles, { markDirty: true });
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setRenamePathInput(normalizedPath);
    setProjectFileError('');
  }

  function handleMoveSelectedFolder() {
    if (!isOwner || !selectedFolderPath) return;
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
    const remappedTargetPaths = new Set(remappedFiles.map((file) => file.path));
    const conflictPaths = editableProjectFiles
      .filter(
        (file) =>
          !movedSourcePaths.has(file.path) && remappedTargetPaths.has(file.path)
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
    const nextFiles = Array.from(deduped.entries()).map(([path, content]) => ({
      path,
      content
    }));

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
    if (!isOwner || savingProjectFiles || !hasUnsavedProjectFileChanges) return;
    setSavingProjectFiles(true);
    setProjectFileError('');
    const result = await onSaveProjectFiles(editableProjectFiles);
    setSavingProjectFiles(false);
    if (!result?.success) {
      setProjectFileError(result?.error || 'Failed to save project files');
      return;
    }
    setProjectFileError('');
  }

  useEffect(() => {
    if (historyOpen) {
      void loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, artifactId]);

  async function loadVersions() {
    if (!isOwnerRef.current) {
      setVersions([]);
      return;
    }
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setLoadingVersions(true);
    try {
      let activeArtifactId = artifactId;
      if (!activeArtifactId) {
        const artifactsData = await listBuildArtifactsRef.current(
          activeBuild.id
        );
        activeArtifactId = artifactsData?.artifacts?.[0]?.id ?? null;
        if (activeArtifactId) {
          setArtifactId(activeArtifactId);
        }
      }

      if (!activeArtifactId) {
        setVersions([]);
        return;
      }

      const data = await listBuildArtifactVersionsRef.current({
        buildId: activeBuild.id,
        artifactId: activeArtifactId,
        limit: 50
      });
      setVersions(data?.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleRestoreVersion(versionId: number) {
    if (!isOwnerRef.current || !artifactId || restoringVersionId) return;
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setRestoringVersionId(versionId);
    try {
      const result = await restoreBuildArtifactVersionRef.current({
        buildId: activeBuild.id,
        artifactId,
        versionId
      });
      const restoredProjectFiles = Array.isArray(result?.projectFiles)
        ? result.projectFiles
        : [];
      if (restoredProjectFiles.length > 0) {
        const restoredCode =
          typeof result?.code === 'string' ? result.code : null;
        onApplyRestoredProjectFiles(restoredProjectFiles, restoredCode, {
          artifactVersionId: result?.versionId ?? versionId,
          primaryArtifactId: artifactId
        });
        const restoredEditableFiles = buildEditableProjectFiles({
          code: restoredCode,
          projectFiles: restoredProjectFiles
        });
        setEditableProjectFiles(restoredEditableFiles);
        setHasLocalEditableProjectFileChanges(false);
        setActiveFilePath(
          getPreferredIndexPath(restoredEditableFiles) ||
            restoredEditableFiles[0]?.path ||
            '/index.html'
        );
        setProjectFileError('');
      } else if (result?.code) {
        onReplaceCode(result.code);
      }
      if (historyOpen) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
    setRestoringVersionId(null);
  }

  return (
    <div className={runtimeOnly ? runtimePanelClass : panelClass}>
      {!runtimeOnly && (
        <div className={toolbarClass}>
          <div className={toolbarTitleClass}>
            <Icon icon="laptop-code" />
            Workspace
          </div>
          <div className={toolbarActionsClass}>
            {isOwner && (
              <GameCTAButton
                variant="purple"
                size="md"
                icon="clock"
                onClick={() => setHistoryOpen(true)}
              >
                History
              </GameCTAButton>
            )}
            <SegmentedToggle<'preview' | 'code'>
              value={viewMode}
              onChange={handleViewModeChange}
              options={workspaceViewOptions}
              size="md"
              ariaLabel="Workspace mode"
            />
          </div>
        </div>
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
          previewFrameSources.primary || previewSrc ? (
            <div className={previewStageClass}>
              {!previewFrameReady.primary && (
                <div className={previewPreloadSurfaceClass}>
                  <div className={previewPreloadIconWrapClass}>
                    <Icon icon="spinner" className={previewSpinnerClass} />
                  </div>
                  <div className={previewPreloadLabelClass}>Loading...</div>
                </div>
              )}
              <iframe
                ref={primaryIframeRef}
                src={previewFrameSources.primary || previewSrc || undefined}
                title="App preview"
                sandbox="allow-scripts"
                onLoad={() =>
                  handlePreviewFrameLoad(
                    'primary',
                    previewFrameSources.primary || previewSrc
                  )
                }
                className={previewIframeClass}
                style={{
                  opacity: previewFrameReady.primary ? 1 : 0,
                  pointerEvents: previewFrameReady.primary ? 'auto' : 'none'
                }}
              />
            </div>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--chat-text);
                text-align: center;
                padding: 2rem;
                background: #fff;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.6 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--chat-text)',
                  opacity: 0.6
                }}
              >
                This build has no code yet
              </p>
            </div>
          )
        ) : viewMode === 'preview' ? (
          previewFrameSources.primary ||
          previewFrameSources.secondary ||
          previewSrc ? (
            <div className={previewStageClass}>
              {!previewFrameReady[activePreviewFrame] && (
                <div className={previewPreloadSurfaceClass}>
                  <div className={previewPreloadIconWrapClass}>
                    <Icon icon="spinner" className={previewSpinnerClass} />
                  </div>
                  <div className={previewPreloadLabelClass}>Loading...</div>
                </div>
              )}
              {previewFrameSources.primary && (
                <iframe
                  ref={primaryIframeRef}
                  src={previewFrameSources.primary}
                  title="Preview (primary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'primary',
                      previewFrameSources.primary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewFrameSources.secondary && (
                <iframe
                  ref={secondaryIframeRef}
                  src={previewFrameSources.secondary}
                  title="Preview (secondary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'secondary',
                      previewFrameSources.secondary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewTransitioning && (
                <div className={previewLoadingOverlayClass}>
                  <Icon icon="spinner" className={previewSpinnerClass} />
                  Updating preview
                </div>
              )}
            </div>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--chat-text);
                text-align: center;
                padding: 2rem;
                background: #fff;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.6 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--chat-text)',
                  opacity: 0.6
                }}
              >
                {isOwner
                  ? 'Use the chat to describe what you want to build'
                  : 'This build has no code yet'}
              </p>
            </div>
          )
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
            projectFileError={projectFileError}
            streamingAutoFollowEnabled={streamingAutoFollowEnabledRef.current}
            persistedFileContentByPath={persistedFileContentByPath}
            onNewFilePathChange={setNewFilePath}
            onAddProjectFile={handleAddProjectFile}
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
            }}
            onDeleteProjectFile={handleDeleteProjectFile}
            onRenamePathInputChange={setRenamePathInput}
            onRenameOrMoveActiveFile={handleRenameOrMoveActiveFile}
            onSaveEditableProjectFiles={handleSaveEditableProjectFiles}
            onActiveFileContentChange={handleEditableFileContentChange}
          />
        )}
      </div>
      <GuestRestrictionBanner
        visible={guestRestrictionBannerVisible}
        userId={userId}
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
    </div>
  );
}

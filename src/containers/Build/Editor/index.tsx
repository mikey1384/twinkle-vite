import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  ChatPanelCommunicationMode,
  ChatPanelProps
} from './ChatPanel/types';
import CollaborationPanel from './CollaborationPanel';
import Header from './Header';
import VersionStartPanel from './VersionStartPanel';
import ForkHistoryModal from '~/components/Modals/BuildForkHistoryModal';
import useConfirmModal from '~/components/Modals/hooks/useConfirmModal';
import Modals from './Modals';
import Workspace from './Workspace';
import BranchActionModals from './BranchActionModals';
import ProjectFileDraftActionModal from './ProjectFileDraftActionModal';
import useRunIdentity, {
  getSharedBuildRunIdentityState,
  type SharedBuildRunIdentityState
} from './hooks/useRunIdentity';
import useBranches from './hooks/useBranches';
import useChatSync from './hooks/useChatSync';
import useChatUploads from './hooks/useChatUploads';
import useGenerationReset from './hooks/useGenerationReset';
import useLumineModelSelection from './hooks/useLumineModelSelection';
import useLumineSettings from './hooks/useLumineSettings';
import useMutableState from './hooks/useMutableState';
import useMetadata from './hooks/useMetadata';
import usePublishing from './hooks/usePublishing';
import useProjectFiles from './hooks/useProjectFiles';
import useRequests from './hooks/useRequests';
import useWorkspaceLayout from './hooks/useWorkspaceLayout';
import useRuntimeUploads from './hooks/useRuntimeUploads';
import useRunOrchestration from './hooks/useRunOrchestration';
import useRunRecovery from './hooks/useRunRecovery';
import useChatCommandActions from './hooks/useChatCommandActions';
import useChatScrollControls from './hooks/useChatScrollControls';
import useCurrentRunIdentity from './hooks/useCurrentRunIdentity';
import useLocalChatMessages from './hooks/useLocalChatMessages';
import useQueuedRequests from './hooks/useQueuedRequests';
import useRunFeedbackEvents from './hooks/useRunFeedbackEvents';
import useRuntimeFollowUp from './hooks/useRuntimeFollowUp';
import useRunStartActions from './hooks/useRunStartActions';
import useRunTerminalActions from './hooks/useRunTerminalActions';
import useSharedActiveRunReconciliation from './hooks/useSharedActiveRunReconciliation';
import useSharedRunReconciliation from './hooks/useSharedRunReconciliation';
import useSharedRunCleanup from './hooks/useSharedRunCleanup';
import useSharedTerminalRunReconciliation from './hooks/useSharedTerminalRunReconciliation';
import useWorkspaceCommunicationActions from './hooks/useWorkspaceCommunicationActions';
import {
  UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE,
  getContributionConflictMarkerPaths
} from './CollaborationPanel/helpers/collaborationConflicts';
import resolveCurrentBuildRunView from './helpers/resolveCurrentBuildRunView';
import type {
  PreviewPanelHandle,
  PreviewPanelProps
} from '../PreviewPanel/types';
import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../types/runtimeObservationTypes';
import {
  useBuildContext,
  useKeyContext,
  useNotiContext,
  useViewContext
} from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  getBuildDisplayTitle,
  isBuildContributionFork
} from '~/helpers/buildRelationshipHelpers';
import {
  canEditBuildProject,
  normalizeBuildWorkspaceCommunicationMode
} from './helpers/branches';
import {
  EMPTY_BUILD_PROJECT_FILES,
  normalizeProjectFilesForBuild,
  serializedComparableValue
} from './helpers/projectFiles';
import { resolveScopedPlanQuestion } from './helpers/promptBindings';
import {
  chatMessagesEqual,
  mergeChatMessagesWithBuildRun,
  mergeDisplayedChatMessages
} from './helpers/chatMessages';
import {
  lockAppShellScrollSurface,
  resetAppShellScroll
} from '~/helpers/appShellScroll';
import type {
  Build,
  BuildCopilotPolicy,
  BuildEditorProps,
  BuildEditorRouteState,
  BuildPlanAction,
  BuildPromptBinding,
  BuildRequestLimitsSnapshot,
  BuildRunEvent,
  ChatMessage,
  MobilePanelTab,
  MobilePanelTabIntent,
  QueuedBuildRequest
} from './types';
const DEDUPED_PROCESSING_RECOVERY_STATUS = 'Recovering live response...';

interface BranchMainUpdateState {
  checking: boolean;
  rootDrifted: boolean;
  loading: boolean;
  error: string;
}

const pageClass = css`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  overflow: hidden;
  background: var(--page-bg);
  @media (max-width: ${mobileMaxWidth}) {
    height: calc(100% - var(--mobile-nav-total-height, 7rem));
  }
`;

export default function BuildEditor({
  build,
  chatMessages,
  copilotPolicy,
  isOwner,
  initialPrompt = '',
  initialPromptContext = '',
  forceInitialPrompt = false,
  seedGreeting = false,
  onUpdateBuild,
  onUpdateChatMessages,
  onUpdateCopilotPolicy
}: BuildEditorProps) {
  const canEditCurrentBuildProject = isOwner && canEditBuildProject(build);
  const currentBuildIsContributionFork = isBuildContributionFork(build);
  const canEditCurrentBuildMetadata =
    isOwner && !currentBuildIsContributionFork && canEditBuildProject(build);
  const canEditCurrentBuildThumbnail = isOwner && canEditBuildProject(build);
  const location = useLocation();
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const sharedBuildRun = useBuildContext(
    (v) => v.state.buildRuns[String(build.id)] || null
  );
  const buildWorkspaceUi = useBuildContext(
    (v) => v.state.buildWorkspaceUi[String(build.id)] || null
  );
  const getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null = useBuildContext(
    (v) => v.getBuildRunIdentity
  );
  const getLatestBuildRun: (buildId: number) => BuildLiveRunState | null =
    useBuildContext((v) => v.getLatestBuildRun);
  const sharedRuntimeVerifyResults = useBuildContext(
    (v) => v.state.runtimeVerifyResults
  );
  const onRegisterBuildRun = useBuildContext(
    (v) => v.actions.onRegisterBuildRun
  );
  const onUpdateBuildRunStatus = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStatus
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const onRemoveBuildRunMessage = useBuildContext(
    (v) => v.actions.onRemoveBuildRunMessage
  );
  const onClearBuildRun = useBuildContext((v) => v.actions.onClearBuildRun);
  const onSetBuildWorkspaceCommunicationMode = useBuildContext(
    (v) => v.actions.onSetBuildWorkspaceCommunicationMode
  );
  const onSetBuildWorkspaceScroll = useBuildContext(
    (v) => v.actions.onSetBuildWorkspaceScroll
  );
  const onSetBuildWorkspaceForumThread = useBuildContext(
    (v) => v.actions.onSetBuildWorkspaceForumThread
  );
  const onClearBuildRuntimeVerifyResult = useBuildContext(
    (v) => v.actions.onClearBuildRuntimeVerifyResult
  );
  const navigate = useNavigate();
  const routeState = (location.state || {}) as BuildEditorRouteState;
  const routeForumThreadId = Math.max(
    0,
    Math.floor(Number(routeState.forumThreadId || 0))
  );
  const routeOpenCollaborationSettings = Boolean(
    routeState.openCollaborationSettings
  );
  const routeOpenForkHistory = Boolean(routeState.openForkHistory);
  const routeOpenPeoplePanel = Boolean(routeState.openPeoplePanel);
  const routeOpenVersionsPanel = Boolean(routeState.openVersionsPanel);
  useLayoutEffect(() => {
    const unlockAppShellScrollSurface = lockAppShellScrollSurface();
    resetAppShellScroll();
    return unlockAppShellScrollSurface;
  }, [location.pathname]);
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState(
    routeOpenForkHistory ? Number(build.id || 0) : 0
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const todayAiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats.aiUsagePolicy as BuildRequestLimitsSnapshot | null
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const {
    cleanupBuildChatReferenceUploads,
    createBuildChatAssistantNote,
    createBuildChatReferenceNote,
    createBuildChatUserNote,
    createBuildContributionFork,
    deleteBuild,
    deleteBuildChatMessage,
    deleteBuildRuntimeUpload,
    forkBuild,
    getBuildApiToken,
    listBuildRuntimeFiles,
    loadBuild,
    loadBuildContribution,
    loadBuildContributionMergeIntoMyBranch,
    loadBuildContributions,
    loadBuildContributors,
    loadBuildRuntimeUploads,
    loadBuildThumbnailOptions,
    mergeBuildContribution,
    mergeBuildContributionIntoMyBranch,
    onSetUserState,
    publishBuild,
    purchaseBuildGenerationReset,
    replaceBuildContributionIntoMyBranch,
    replaceMainWithBuildContribution,
    routeBuildChatUpload,
    saveFileData,
    unpublishBuild,
    updateBuildContributionFromMain,
    updateBuildLumineChatVisibility,
    updateBuildMetadata,
    updateBuildProjectFiles,
    uploadBuildRuntimeFiles,
    uploadBuildThumbnail,
    uploadFile,
    updateBuildLumineModelPreference
  } = useRequests();
  const onUpdateTodayStatsRef = useRef(onUpdateTodayStats);
  onUpdateTodayStatsRef.current = onUpdateTodayStats;

  const [mobilePanelTabIntent, setMobilePanelTabIntent] =
    useState<MobilePanelTabIntent>(() => ({
      tab: 'chat',
      version: 0
    }));
  const [collaborationSettingsModalShown, setCollaborationSettingsModalShown] =
    useState(false);
  const [branchMainUpdateState, setBranchMainUpdateState] =
    useState<BranchMainUpdateState>({
      checking: false,
      rootDrifted: false,
      loading: false,
      error: ''
    });
  const [dismissedFollowUpPromptKey, setDismissedFollowUpPromptKey] =
    useState('');
  const branchMainUpdateCheckIdRef = useRef(0);
  const branchMainUpdateTarget = getBranchMainUpdateTarget({ build, userId });
  const branchMainUpdateRootBuildId = branchMainUpdateTarget?.rootBuildId || 0;
  const branchMainUpdateContributionBuildId =
    branchMainUpdateTarget?.contributionBuildId || 0;
  const communicationPanelShown =
    isOwner ||
    (!isOwner &&
      Boolean(userId) &&
      Boolean(build.canOpenContributionWorkspace));
  const {
    buildChatPanelWidth,
    buildWorkshopScale,
    handleWorkspaceResizeKeyDown,
    handleWorkspaceResizePointerDown,
    isDesktopWorkspaceLayout,
    workspaceShellRef,
    workspaceShellStyle
  } = useWorkspaceLayout({ communicationPanelShown });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<PreviewPanelHandle | null>(null);
  const didInitialChatScrollRef = useRef(false);
  const didAutoPromptRef = useRef(false);
  const didAutoGreetingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior>('auto');
  const scrollRafRef = useRef<number | null>(null);
  const handledSharedTerminalStateKeyRef = useRef('');
  const { handleChatScroll, maybeAutoScrollDuringStream, scrollChatToBottom } =
    useChatScrollControls({
      chatEndRef,
      chatScrollRef,
      pendingScrollBehaviorRef,
      scrollRafRef,
      shouldAutoScrollRef
    });
  const DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS = 8000;
  const runOrchestration = useRunOrchestration<
    QueuedBuildRequest,
    BuildRunEvent
  >();
  const runIdentity = useRunIdentity();
  const sharedRunReconciliation = useSharedRunReconciliation();
  const currentSharedRunIdentityState =
    getSharedBuildRunIdentityState(sharedBuildRun);
  const {
    clearCurrentPageRunActivity,
    getCurrentActiveAssistantMessageId,
    getCurrentActiveRunRequestId,
    getCurrentActiveUserMessageId,
    getCurrentPageRunActivityRequestId,
    getCurrentRunMode,
    getCurrentRunRequestId,
    hasCurrentPageRunActivity,
    isRunActivityInFlight,
    markCurrentPageRunActivityActive
  } = useCurrentRunIdentity({
    currentSharedRunIdentityState,
    runIdentity,
    runOrchestration
  });
  const RUNTIME_AUTOFIX_ENABLED = false;
  const RUNTIME_AUTO_FIX_WINDOW_MS = 12000;
  const RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS = 18000;
  const STALLED_RUN_RESUME_AFTER_MS = 25000;
  const STALLED_RUN_RECOVER_AFTER_MS = 60000;
  const {
    appendLocalRunEvent,
    clearBufferedRunStartEvents,
    flushBufferedRunStartEvents,
    flushBufferedRunStartEventsToPageFeedback,
    pageFeedbackEvents,
    resetPageFeedbackEvents
  } = useRunFeedbackEvents({
    getActiveBuildId: getActiveBuildRunFeedbackBuildId,
    getCurrentActiveRunRequestId,
    getCurrentSharedRunState: getCurrentSharedRunStateForFeedback,
    onAppendBuildRunEvent,
    runOrchestration,
    shouldHoldTerminalSharedBuildRun:
      shouldHoldTerminalSharedBuildRunForFeedback
  });
  const {
    beginDedupedProcessingRecovery,
    markActiveBuildRunActivity,
    maybeStartSharedDedupedProcessingRecovery,
    requestStopForRecoveredBuildRun,
    resetDedupedProcessingReconcileState,
    scheduleDedupedProcessingReconcile
  } = useRunRecovery({
    buildId: build.id,
    currentSharedRunIdentityState,
    dedupedProcessingRecoveryStatus: DEDUPED_PROCESSING_RECOVERY_STATUS,
    dedupedProcessingReconcileIntervalMs:
      DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS,
    getActiveBuildId: getActiveBuildRunFeedbackBuildId,
    getBuildRunIdentity,
    getCurrentPageRunActivityRequestId,
    getCurrentRunRequestId,
    hasCurrentPageRunActivity,
    onUpdateBuildRunStatus,
    runOrchestration,
    scrollChatToBottom,
    setMobilePanelTab,
    sharedBuildRun,
    stalledRunRecoverAfterMs: STALLED_RUN_RECOVER_AFTER_MS,
    stalledRunResumeAfterMs: STALLED_RUN_RESUME_AFTER_MS
  });
  const {
    enqueueLatestBuildRequest,
    maybeResumePausedQueueAfterSave,
    maybeStartNextQueuedRequest,
    releaseQueuedRequestsIfStopTargetAlreadySettled,
    releaseQueuedRequestsWaitingForStop
  } = useQueuedRequests({
    appendLocalRunEvent,
    currentSharedRunIdentityState,
    getActiveBuildId: getActiveBuildRunFeedbackBuildId,
    getBuildRunIdentity,
    getCurrentActiveUserMessageId,
    getLatestBuildRun,
    getLatestChatMessages: getLatestChatMessagesForQueue,
    handleStopGeneration: handleStopGenerationForQueue,
    hasCurrentPageRunActivity,
    hasPendingRuntimeFollowUp: () =>
      runtimeFollowUp.hasPendingRuntimeFollowUp(),
    isRunActivityInFlight,
    requestStopForRecoveredBuildRun,
    runIdentity,
    runOrchestration,
    startGeneration: startGenerationForQueue
  });
  const runtimeFollowUp = useRuntimeFollowUp({
    buildId: build.id,
    isOwner,
    runtimeAutoFixEnabled: RUNTIME_AUTOFIX_ENABLED,
    runtimeAutoFixWindowMs: RUNTIME_AUTO_FIX_WINDOW_MS,
    runtimePostFixVerificationWindowMs: RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS,
    sharedRuntimeVerifyResults,
    claimRuntimeVerifyResult: sharedRunReconciliation.claimRuntimeVerifyResult,
    onClearBuildRuntimeVerifyResult,
    onAppendLocalRunEvent: appendLocalRunEvent,
    onScrollChatToBottom: scrollChatToBottom,
    onMaybeStartNextQueuedRequest: maybeStartNextQueuedRequest,
    onStartRuntimeAutoFix: startRuntimeAutoFixForFollowUp,
    isRunActivityInFlight
  });

  useEffect(() => {
    if (!isOwner || !routeOpenCollaborationSettings) return;
    setCollaborationSettingsModalShown(true);
    navigate(location.pathname, {
      replace: true,
      state: routeOpenPeoplePanel
        ? { openPeoplePanel: true }
        : routeOpenVersionsPanel
          ? { openVersionsPanel: true }
          : null
    });
  }, [
    isOwner,
    location.pathname,
    navigate,
    routeOpenCollaborationSettings,
    routeOpenPeoplePanel,
    routeOpenVersionsPanel
  ]);

  useEffect(() => {
    if (!routeOpenForkHistory) return;
    setForkHistoryBuildId(Number(build.id || 0));
  }, [build.id, routeOpenForkHistory]);

  const mergedPersistedAndLiveChatMessages = mergeChatMessagesWithBuildRun({
    persistedMessages: chatMessages,
    buildRun: sharedBuildRun
  });
  const {
    getLatestBuild,
    applyBuildUpdate,
    getLatestChatMessages,
    replaceChatMessages,
    getLatestCopilotPolicy,
    replaceCopilotPolicy
  } = useMutableState<Build, ChatMessage, BuildCopilotPolicy | null>({
    build,
    chatMessages: mergedPersistedAndLiveChatMessages,
    copilotPolicy,
    onUpdateBuild,
    onUpdateChatMessages,
    onUpdateCopilotPolicy,
    areChatMessagesEqual: chatMessagesEqual
  });
  const { syncChatMessagesFromServer } = useChatSync({
    applyBuildUpdate,
    buildId: build.id,
    getBuildRunIdentity,
    getCurrentActiveAssistantMessageId,
    getCurrentActiveRunRequestId,
    getCurrentActiveUserMessageId,
    getCurrentRunRequestId,
    getLatestBuild,
    getLatestChatMessages,
    loadBuild,
    markActiveBuildRunActivity,
    replaceChatMessages,
    replaceCopilotPolicy,
    runIdentity,
    setRequiresProjectFilesResyncBeforeSave:
      runOrchestration.setRequiresProjectFilesResyncBeforeSave
  });
  const {
    adoptPersistedBuildRunMessages,
    appendLocalBuildChatAssistantMessage,
    removeDeletedBuildRunMessage,
    removeLocalMessagesByIdentity,
    upsertLocalBuildChatAssistantMessage
  } = useLocalChatMessages({
    buildId: build.id,
    getCurrentSharedRunIdentityState: () =>
      getSharedBuildRunIdentityState(sharedBuildRun),
    getLatestChatMessages,
    hasCurrentPageRunActivity: runOrchestration.hasCurrentPageRunActivity,
    onForceChatAutoScroll: () => {
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('smooth', { force: true });
    },
    onRemoveBuildRunMessage,
    replaceChatMessages,
    runIdentity
  });
  const {
    handleBuildCollaborationPatch,
    handleBuildWorkspaceCommunicationModeChange,
    handleBuildWorkspaceCommunicationScrollChange,
    handleBuildWorkspaceForumThreadChange,
    handleCloseCollaborationSettingsModal,
    handleOpenCollaborationSettingsModal
  } = useWorkspaceCommunicationActions({
    applyBuildUpdate,
    build,
    canEditCurrentBuildMetadata,
    getLatestBuild,
    locationPathname: location.pathname,
    navigate,
    onSetBuildWorkspaceCommunicationMode,
    onSetBuildWorkspaceForumThread,
    onSetBuildWorkspaceScroll,
    routeForumThreadId,
    routeState,
    setCollaborationSettingsModalShown
  });
  const {
    availableVersions,
    availableVersionsLoading,
    branchMergeTargetOptions,
    branchNameDraft,
    canMergeCurrentBranch,
    canReplaceCurrentBranchTarget,
    canShowMergeCurrentBranch,
    canShowVersionStartActions,
    contributionActionError,
    contributionActionLoading,
    currentUserContributionBranch,
    deletingBranch,
    deletingBranchLoading,
    forking,
    handleBeforeContributionAction,
    handleBuildContributionMerge,
    handleCloseDeleteBranch,
    handleCloseReplaceMainConfirm,
    handleContributionBranchCreated,
    handleCreateContribution,
    handleDeleteBranch,
    handleEditableProjectFilesStateChange,
    handleFork,
    handleLoadVersion,
    handleMergeBranchTargetChange,
    handleMergeCurrentBranch,
    handleOpenMainProject,
    handleOpenReplaceMainConfirm,
    handleReplaceMainWithCurrentBranch,
    handleRequestDeleteBranch,
    mergeBranchButtonLabel,
    mergeBranchTargetLabel,
    mergeBranchTargetTitle,
    mergeCurrentBranchShiny,
    replaceBranchButtonLabel,
    replaceBranchTargetLabel,
    refreshCurrentBranchMergeabilityForBuild,
    replaceMainConfirmShown,
    runtimeAssetTransferProgress,
    setBranchNameDraft,
    showContributionButton,
    showForkButton,
    syncAvailableBranchSummary
  } = useBranches({
    applyBuildUpdate,
    build,
    canEditCurrentBuildProject,
    currentBuildIsContributionFork,
    createBuildContributionFork,
    deleteBuild,
    forkBuild,
    getLatestBuild,
    isOwner,
    loadBuildContribution,
    loadBuildContributionMergeIntoMyBranch,
    loadBuildContributions,
    mergeBuildContribution,
    mergeBuildContributionIntoMyBranch,
    onProjectFilesDraftStateChange: (state) =>
      handleProjectFilesDraftStateChange(state),
    prepareProjectFilesForContributionAction: (options) =>
      prepareProjectFilesForContributionAction(options),
    replaceBuildContributionIntoMyBranch,
    replaceMainWithBuildContribution,
    userId
  });
  const {
    captureThumbnailFromPreview,
    descriptionModalShown,
    ensureBuildThumbnailBeforePublish,
    handleCloseDescriptionModal,
    handleCloseThumbnailModal,
    handleOpenDescriptionModal,
    handleOpenThumbnailModal,
    handlePreviewCaptureReadyChange,
    handleSaveMetadata,
    handleSaveThumbnail,
    maybeAutoCaptureBranchThumbnailAfterProgressSave,
    savingDescription,
    savingThumbnail,
    thumbnailModalShown,
    thumbnailOptions,
    thumbnailOptionsLoading,
    thumbnailSaveError
  } = useMetadata({
    applyBuildUpdate,
    build,
    canEditCurrentBuildMetadata,
    canEditCurrentBuildThumbnail,
    getLatestBuild,
    isOwner,
    loadBuildThumbnailOptions,
    previewPanelRef,
    syncAvailableBranchSummary,
    updateBuildMetadata,
    uploadBuildThumbnail
  });
  const { applyGenerateComplete, applyGenerateError, applyGenerateStopped } =
    useRunTerminalActions({
      appendLocalRunEvent,
      applyBuildUpdate,
      applyCopilotRequestLimitsSnapshot,
      beginDedupedProcessingRecovery,
      clearCurrentPageRunActivity,
      dedupedProcessingRecoveryStatus: DEDUPED_PROCESSING_RECOVERY_STATUS,
      enqueueLatestBuildRequest,
      getActiveBuildId: getActiveBuildRunFeedbackBuildId,
      getBuildRunIdentity,
      getCurrentActiveAssistantMessageId,
      getCurrentActiveUserMessageId,
      getCurrentRunMode,
      getCurrentRunRequestId,
      getLatestBuild,
      getLatestBuildRun,
      getLatestChatMessages,
      markActiveBuildRunActivity,
      markCurrentPageRunActivityActive,
      maybeAutoCaptureBranchThumbnailAfterProgressSave,
      maybeStartNextQueuedRequest,
      onCompleteBuildRun,
      onFailBuildRun,
      onStopBuildRun,
      onUpdateBuildRunStatus,
      releaseQueuedRequestsIfStopTargetAlreadySettled,
      releaseQueuedRequestsWaitingForStop,
      removeLocalMessagesByIdentity,
      replaceChatMessages,
      resetDedupedProcessingReconcileState,
      runIdentity,
      runOrchestration,
      runtimeFollowUp,
      scrollChatToBottom,
      setMobilePanelTab,
      syncAvailableBranchSummary,
      syncChatMessagesFromServer,
      upsertLocalBuildChatAssistantMessage
    });
  const {
    ensureProjectFilesPersistedBeforePublish,
    ensureProjectFilesPersistedBeforeRun,
    draftActionPrompt,
    handleApplyRestoredProjectFiles,
    handleProjectFilesDraftStateChange,
    handleReplaceCode,
    handleSaveProjectFiles,
    prepareProjectFilesForContributionAction,
    resolveProjectFilesDraftActionPrompt,
    resetProjectFilesDraftState
  } = useProjectFiles({
    applyBuildUpdate,
    build,
    discardProjectFilesDraft: discardCurrentProjectFileDraft,
    getLatestBuild,
    isOwner,
    maybeAutoCaptureBranchThumbnailAfterProgressSave,
    maybeResumePausedQueueAfterSave,
    onAppendLocalRunEvent: appendLocalRunEvent,
    onRefreshCurrentBranchMergeabilityForBuild:
      refreshCurrentBranchMergeabilityForBuild,
    onSyncAvailableBranchSummary: syncAvailableBranchSummary,
    replaceCopilotPolicy,
    requiresProjectFilesResyncBeforeSave:
      runOrchestration.requiresProjectFilesResyncBeforeSave,
    setRequiresProjectFilesResyncBeforeSave:
      runOrchestration.setRequiresProjectFilesResyncBeforeSave,
    syncChatMessagesFromServer,
    updateBuildProjectFiles
  });
  const { handlePublish, handleUnpublish, publishing } = usePublishing({
    appendLocalRunEvent,
    applyBuildUpdate,
    build,
    canEditCurrentBuildMetadata,
    ensureBuildThumbnailBeforePublish,
    ensureProjectFilesPersistedBeforePublish,
    getLatestBuild,
    publishBuild,
    replaceCopilotPolicy,
    unpublishBuild
  });
  const {
    canManageLumineChatVisibility,
    handleSaveLumineChatVisibility,
    lumineChatVisibility,
    lumineChatVisibilityError,
    lumineChatVisibilitySettingsShown,
    savedLumineChatVisibility,
    savingLumineChatVisibility,
    setAcceptedContributorCount
  } = useLumineSettings({
    applyBuildUpdate,
    build,
    currentBuildIsContributionFork,
    getLatestBuild,
    isOwner,
    loadBuildContributors,
    updateBuildLumineChatVisibility
  });
  const { getCurrentLumineModelSelection, lumineModelSelectionControl } =
    useLumineModelSelection({
      buildId: build.id,
      copilotPolicy,
      getLatestCopilotPolicy,
      isOwner: canEditCurrentBuildProject,
      replaceCopilotPolicy,
      updateBuildLumineModelPreference
    });
  const {
    generationResetError,
    handlePurchaseGenerationReset,
    purchasingGenerationReset
  } = useGenerationReset({
    buildId: build.id,
    isOwner,
    onApplyCopilotRequestLimitsSnapshot: applyCopilotRequestLimitsSnapshot,
    onSetUserState,
    purchaseBuildGenerationReset,
    replaceCopilotPolicy,
    userId
  });
  const {
    confirmModal: runtimeUploadConfirmModal,
    requestConfirm: requestRuntimeUploadConfirm
  } = useConfirmModal();
  const {
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
  } = useRuntimeUploads({
    build,
    canEditCurrentBuildProject,
    deleteBuildRuntimeUpload,
    getBuildApiToken,
    getLatestBuild,
    getLatestCopilotPolicy,
    isOwner,
    listBuildRuntimeFiles,
    loadBuildRuntimeUploads,
    requestConfirm: requestRuntimeUploadConfirm,
    replaceCopilotPolicy,
    uploadBuildRuntimeFiles
  });
  const {
    buildChatDraftMessage,
    buildChatUploadFileObj,
    buildChatUploadInFlight,
    buildChatUploadModalShown,
    handleOpenBuildChatUpload,
    handlePendingBuildChatUploadMessage,
    setBuildChatDraftMessage,
    setBuildChatUploadFileObj,
    setBuildChatUploadModalShown,
    startBuildChatUploadProcessing
  } = useChatUploads({
    appendLocalBuildChatAssistantMessage,
    build,
    cleanupBuildChatReferenceUploads,
    createBuildChatAssistantNote,
    createBuildChatReferenceNote,
    createBuildChatUserNote,
    getLatestBuild,
    getLatestChatMessages,
    isOwner,
    isRunActivityInFlight,
    onForceChatAutoScroll: () => {
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('smooth', { force: true });
    },
    previewPanelRef,
    replaceChatMessages,
    routeBuildChatUpload,
    saveFileData,
    sendBuildMessageText: sendBuildMessageTextForUploads,
    uploadFile,
    userId
  });

  function handlePreviewAiUsagePolicyUpdate(
    aiUsagePolicy: Record<string, any> | null | undefined
  ) {
    applyCopilotRequestLimitsSnapshot(
      aiUsagePolicy as BuildRequestLimitsSnapshot | null | undefined
    );
  }

  function applyCopilotRequestLimitsSnapshot(
    requestLimits: BuildRequestLimitsSnapshot | null | undefined
  ) {
    if (!requestLimits || typeof requestLimits !== 'object') return;
    onUpdateTodayStatsRef.current({
      newStats: {
        aiUsagePolicy: requestLimits
      }
    });
  }

  const mergedChatMessages = mergeDisplayedChatMessages({
    baseMessages: mergedPersistedAndLiveChatMessages,
    supplementalMessages: runtimeFollowUp.runtimeObservationChatNotes
  });
  const currentBuildRunView = resolveCurrentBuildRunView({
    build,
    currentSharedRunIdentityState,
    dismissedFollowUpPromptKey,
    getCurrentActiveAssistantMessageId,
    getCurrentActiveRunRequestId,
    getCurrentActiveUserMessageId,
    getCurrentRunMode,
    hasCurrentPageRunActivity: runOrchestration.hasCurrentPageRunActivity(),
    sharedBuildRun
  });
  const { startGeneration, startGreetingGeneration, startRuntimeAutoFix } =
    useRunStartActions({
      aiFeaturesDisabled: AI_FEATURES_DISABLED,
      appendLocalRunEvent,
      clearBufferedRunStartEvents,
      clearLocalFollowUpPrompt,
      ensureProjectFilesPersistedBeforeRun,
      flushBufferedRunStartEvents,
      flushBufferedRunStartEventsToPageFeedback,
      forceChatAutoScroll: () => {
        shouldAutoScrollRef.current = true;
        scrollChatToBottom('smooth', { force: true });
      },
      getLatestBuild,
      getLatestChatMessages,
      getLumineModelSelection: getCurrentLumineModelSelection,
      getRuntimeExplorationPlan: () =>
        currentBuildRunView.runtimeExplorationPlan,
      isOwner,
      isRunActivityInFlight,
      markActiveBuildRunActivity,
      markCurrentPageRunActivityActive,
      onRegisterBuildRun,
      replaceChatMessages,
      resetDedupedProcessingReconcileState,
      runIdentity,
      runOrchestration,
      runtimeAutoFixEnabled: RUNTIME_AUTOFIX_ENABLED,
      runtimeFollowUp,
      setBuildRuntimeExplorationPlanValue,
      setDismissedFollowUpPromptKey
    });
  const {
    handleAcceptFollowUpPrompt,
    handleAskLumineToResolveMergeConflicts,
    handleCancelScopedPlan,
    handleContinueScopedPlan,
    handleDeleteMessage,
    handleDismissFollowUpPrompt,
    handleFixRuntimeObservationMessage,
    handleSendMessage,
    handleStopGeneration,
    sendBuildMessageText
  } = useChatCommandActions({
    build,
    buildChatUploadInFlight,
    currentBuildIsContributionFork,
    currentBuildRunView,
    deleteBuildChatMessage,
    enqueueLatestBuildRequest,
    getBuildRunIdentity,
    getCurrentPageRunActivityRequestId,
    getLatestBuild,
    handleBuildWorkspaceCommunicationModeChange,
    handlePendingBuildChatUploadMessage,
    isOwner,
    isRunActivityInFlight,
    mergedChatMessages,
    navigate,
    onUpdateBuildRunStatus,
    removeDeletedBuildRunMessage,
    requestStopForRecoveredBuildRun,
    runOrchestration,
    runtimeFollowUp,
    scheduleDedupedProcessingReconcile,
    scrollChatToBottom,
    setDismissedFollowUpPromptKey,
    setMobilePanelTab,
    startGeneration,
    syncChatMessagesFromServer,
    userId
  });

  useEffect(() => {
    if (!branchMainUpdateRootBuildId || !branchMainUpdateContributionBuildId) {
      branchMainUpdateCheckIdRef.current += 1;
      setBranchMainUpdateState((current) =>
        current.checking || current.rootDrifted || current.error
          ? {
              ...current,
              checking: false,
              rootDrifted: false,
              error: ''
            }
          : current
      );
      return;
    }
    const checkId = branchMainUpdateCheckIdRef.current + 1;
    branchMainUpdateCheckIdRef.current = checkId;
    let canceled = false;
    setBranchMainUpdateState((current) => ({
      ...current,
      checking: true,
      error: current.loading ? current.error : ''
    }));
    loadBuildContribution({
      buildId: branchMainUpdateRootBuildId,
      contributionBuildId: branchMainUpdateContributionBuildId
    })
      .then((result: any) => {
        if (canceled || branchMainUpdateCheckIdRef.current !== checkId) {
          return;
        }
        setBranchMainUpdateState((current) => ({
          ...current,
          checking: false,
          rootDrifted: Boolean(result?.rootDrifted),
          error: ''
        }));
      })
      .catch((error: any) => {
        if (canceled || branchMainUpdateCheckIdRef.current !== checkId) {
          return;
        }
        console.error('Failed to check branch main update state:', error);
        setBranchMainUpdateState((current) => ({
          ...current,
          checking: false
        }));
      });
    return () => {
      canceled = true;
    };
    // loadBuildContribution is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    branchMainUpdateContributionBuildId,
    branchMainUpdateRootBuildId,
    build.contributionBaseBuildUpdatedAt,
    build.contributionBaseFilesHash,
    build.contributionStatus
  ]);

  useEffect(() => {
    setDismissedFollowUpPromptKey('');
  }, [build.id]);

  useEffect(() => {
    if (
      !currentBuildRunView.streamingProjectFiles ||
      currentBuildRunView.streamingProjectFiles.length === 0
    ) {
      return;
    }
    const isMobileWorkspace =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches;
    if (!isMobileWorkspace) {
      setMobilePanelTabIntent((currentIntent) => ({
        tab: 'preview',
        version: currentIntent.version + 1
      }));
    }
  }, [currentBuildRunView.streamingProjectFiles]);

  useEffect(() => {
    didInitialChatScrollRef.current = false;
    didAutoPromptRef.current = false;
    didAutoGreetingRef.current = false;
    shouldAutoScrollRef.current = true;
    runOrchestration.reset();
    resetPageFeedbackEvents();
    runtimeFollowUp.reset();
    runIdentity.resetRunMode();
    sharedRunReconciliation.reset();
    handledSharedTerminalStateKeyRef.current = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, runOrchestration, sharedRunReconciliation]);

  useSharedTerminalRunReconciliation({
    applyBuildUpdate,
    applyGenerateComplete,
    applyGenerateError,
    applyGenerateStopped,
    currentSharedRunIdentityState,
    getCurrentActiveRunRequestId,
    getLatestBuild,
    handledSharedTerminalStateKeyRef,
    maybeAutoCaptureBranchThumbnailAfterProgressSave,
    maybeStartNextQueuedRequest,
    releaseQueuedRequestsWaitingForStop,
    sharedBuildRun,
    syncAvailableBranchSummary
  });

  useSharedActiveRunReconciliation({
    adoptPersistedBuildRunMessages,
    currentSharedRunIdentityState,
    dedupedProcessingRecoveryStatus: DEDUPED_PROCESSING_RECOVERY_STATUS,
    getCurrentRunRequestId,
    getLatestChatMessages,
    markActiveBuildRunActivity,
    markCurrentPageRunActivityActive,
    maybeAutoScrollDuringStream,
    maybeStartSharedDedupedProcessingRecovery,
    replaceChatMessages,
    resetDedupedProcessingReconcileState,
    runIdentity,
    runOrchestration,
    sharedBuildRun,
    sharedRunReconciliation
  });

  useSharedRunCleanup({
    buildId: build.id,
    chatMessages,
    isPostCompleteSyncInFlight: runOrchestration.isPostCompleteSyncInFlight,
    loadBuild,
    onClearBuildRun,
    runtimeFollowUpRevision: runtimeFollowUp.runtimeFollowUpRevision,
    sharedBuildRun,
    sharedRunReconciliation,
    shouldHoldTerminalSharedBuildRun:
      runtimeFollowUp.shouldHoldTerminalSharedBuildRun
  });

  useEffect(() => {
    const normalizedFiles = normalizeProjectFilesForBuild(
      build.projectFiles || [],
      build.code || ''
    );
    resetProjectFilesDraftState(normalizedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id]);

  function discardCurrentProjectFileDraft() {
    const discardedFiles = previewPanelRef.current?.discardProjectFileDraft();
    if (Array.isArray(discardedFiles)) {
      return discardedFiles;
    }
    const activeBuild = getLatestBuild();
    return normalizeProjectFilesForBuild(
      activeBuild?.projectFiles || [],
      activeBuild?.code || ''
    ).map((file) => ({
      path: file.path,
      content: file.content
    }));
  }

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      resetDedupedProcessingReconcileState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didAutoPromptRef.current) return;
    if (AI_FEATURES_DISABLED) return;
    if (!isOwner) return;
    const prompt = initialPrompt.trim();
    if (!prompt) return;
    if (!forceInitialPrompt && getLatestChatMessages().length > 0) return;
    didAutoPromptRef.current = true;
    handleBuildWorkspaceCommunicationModeChange('lumine');
    setMobilePanelTab('chat');
    void startGeneration(prompt, {
      messageContext: initialPromptContext.trim() || null
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    isOwner,
    initialPrompt,
    initialPromptContext,
    forceInitialPrompt
  ]);

  useEffect(() => {
    if (didAutoGreetingRef.current) return;
    if (AI_FEATURES_DISABLED) return;
    if (!isOwner) return;
    if (!seedGreeting) return;
    if (initialPrompt.trim()) return;
    if (getLatestChatMessages().length > 0) return;
    didAutoGreetingRef.current = true;
    void startGreetingGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, initialPrompt, isOwner, seedGreeting]);

  useEffect(() => {
    if (didInitialChatScrollRef.current) return;
    if (mergedChatMessages.length === 0) return;
    if (!isDesktopWorkspaceLayout && mobilePanelTabIntent.tab !== 'chat') {
      return;
    }
    if (!chatScrollRef.current && !chatEndRef.current) return;
    didInitialChatScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    scrollChatToBottom('auto', { force: true });
    window.requestAnimationFrame(() => {
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('auto', { force: true });
    });
  }, [
    mergedChatMessages.length,
    build.id,
    isDesktopWorkspaceLayout,
    mobilePanelTabIntent.tab,
    mobilePanelTabIntent.version,
    scrollChatToBottom
  ]);

  function getActiveBuildRunFeedbackBuildId() {
    return Number(getLatestBuild()?.id || build.id);
  }

  function getCurrentSharedRunStateForFeedback() {
    return getBuildRunIdentity(getActiveBuildRunFeedbackBuildId());
  }

  function shouldHoldTerminalSharedBuildRunForFeedback(requestId: string) {
    return runtimeFollowUp.shouldHoldTerminalSharedBuildRun(requestId);
  }

  function getLatestChatMessagesForQueue() {
    return getLatestChatMessages();
  }

  function startGenerationForQueue(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ) {
    return startGeneration(messageText, options);
  }

  function startRuntimeAutoFixForFollowUp(
    observationState: BuildRuntimeObservationState,
    options?: {
      remainingRepairsAfterVerification?: number;
      trigger?: 'initial' | 'verification';
      sourceRequestId?: string | null;
      sourceArtifactVersionId?: number | null;
    }
  ) {
    return startRuntimeAutoFix(observationState, options);
  }

  function sendBuildMessageTextForUploads(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
      ignoreUploadInFlight?: boolean;
    }
  ) {
    return sendBuildMessageText(messageText, options);
  }

  async function handleUpdateCurrentBranchFromMain() {
    if (branchMainUpdateState.loading) return;
    const target = getBranchMainUpdateTarget({
      build: getLatestBuild(),
      userId
    });
    if (!target) return;
    setBranchMainUpdateState((current) => ({
      ...current,
      loading: true,
      error: ''
    }));
    try {
      const preparedFiles = await prepareProjectFilesForContributionAction({
        action: 'update-from-main'
      });
      if (!preparedFiles.ready) return;
      const result = await updateBuildContributionFromMain({
        buildId: target.rootBuildId,
        contributionBuildId: target.contributionBuildId
      });
      if (result?.code === 'build_contribution_conflict_markers_remaining') {
        const markerPaths = normalizeUpdateFromMainConflictMarkerPaths(
          result.conflictMarkerPaths
        );
        setBranchMainUpdateState((current) => ({
          ...current,
          error:
            markerPaths.length > 0
              ? `Fix overlapping branch changes in ${markerPaths.join(', ')} first.`
              : 'Fix overlapping branch changes before updating from main.'
        }));
        return;
      }
      if (!result?.success) {
        setBranchMainUpdateState((current) => ({
          ...current,
          error: result?.error || 'Failed to update from main'
        }));
        return;
      }
      handleBuildContributionMerge({
        build: result.contribution || null,
        projectFiles: Array.isArray(result.projectFiles)
          ? result.projectFiles
          : null
      });
      const conflictPaths = Array.isArray(result.conflicts)
        ? result.conflicts
            .map((conflict: any) => String(conflict?.path || '').trim())
            .filter(Boolean)
        : [];
      setBranchMainUpdateState((current) => ({
        ...current,
        rootDrifted: false,
        error:
          conflictPaths.length > 0
            ? UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE
            : ''
      }));
    } catch (error: any) {
      setBranchMainUpdateState((current) => ({
        ...current,
        error: getUpdateFromMainErrorMessage(error)
      }));
    } finally {
      setBranchMainUpdateState((current) => ({
        ...current,
        loading: false
      }));
    }
  }

  function handleStopGenerationForQueue(options?: {
    stopReason?: 'user' | 'replacement';
  }) {
    handleStopGeneration(options);
  }

  function setBuildRuntimeExplorationPlanValue(
    nextRuntimeExplorationPlan: BuildRuntimeExplorationPlan | null
  ) {
    const activeBuild = getLatestBuild();
    if (!activeBuild) return;
    if (
      serializedComparableValue(activeBuild.runtimeExplorationPlan ?? null) ===
      serializedComparableValue(nextRuntimeExplorationPlan)
    ) {
      return;
    }
    applyBuildUpdate({
      ...activeBuild,
      runtimeExplorationPlan: nextRuntimeExplorationPlan
    });
  }

  function clearLocalFollowUpPrompt() {
    const activeBuild = getLatestBuild();
    if (!activeBuild?.followUpPrompt) return;
    applyBuildUpdate({
      ...activeBuild,
      followUpPrompt: null
    });
  }

  const previewProjectFiles = Array.isArray(build.projectFiles)
    ? build.projectFiles
    : EMPTY_BUILD_PROJECT_FILES;
  const shouldShowVersionStartPanel =
    !canEditCurrentBuildProject && mergedChatMessages.length === 0;
  const buildWorkspaceCommunicationMode =
    normalizeBuildWorkspaceCommunicationMode(
      buildWorkspaceUi?.communicationMode
    );
  const buildWorkspaceScrollTops = buildWorkspaceUi?.scrollTops || {};
  const mainProjectConflictMarkerPaths = getContributionConflictMarkerPaths(
    build.projectFiles
  );
  const branchMainUpdateNoticeError =
    branchMainUpdateTarget && mainProjectConflictMarkerPaths.length > 0
      ? UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE
      : branchMainUpdateState.error;
  const versionNavigationPanel = (
    <VersionStartPanel
      rootBuildId={Number(build.contributionRootBuildId || 0)}
      activeBuildId={Number(build.id || 0)}
      activeBuildTitle={build.title}
      currentUserId={userId}
      rootProjectTitle={build.rootBuildTitle || getBuildDisplayTitle(build)}
      versionOwnerUsername={build.username}
      isOwnBranch={Number(build.userId || 0) === Number(userId || 0)}
      isProjectOwner={isOwner && !currentBuildIsContributionFork}
      branchName={branchNameDraft}
      forking={forking}
      canStartVersion={canShowVersionStartActions}
      canFork={showForkButton}
      versions={availableVersions}
      versionsLoading={availableVersionsLoading}
      deletingBranchId={deletingBranch?.id || null}
      pendingCollaborationRequestCount={build.pendingCollaborationRequestCount}
      releaseStatus={build.releaseStatus || null}
      publishing={publishing}
      mainProjectConflictMarkerPaths={mainProjectConflictMarkerPaths}
      status={build.contributionStatus || null}
      onBranchNameChange={setBranchNameDraft}
      onStartVersion={handleCreateContribution}
      onLoadVersion={handleLoadVersion}
      onDeleteBranch={handleRequestDeleteBranch}
      onFork={handleFork}
      onFixMergeConflicts={() => {
        void handleAskLumineToResolveMergeConflicts(
          mainProjectConflictMarkerPaths
        );
      }}
      onOpenTeamPanel={() =>
        handleBuildWorkspaceCommunicationModeChange('people')
      }
      onUpdatePublishedApp={handlePublish}
      initialScrollTop={buildWorkspaceScrollTops.versions || 0}
      onScrollTopChange={(scrollTop) =>
        handleBuildWorkspaceCommunicationScrollChange('versions', scrollTop)
      }
    />
  );
  const versionsPanelShown =
    currentBuildIsContributionFork ||
    canShowVersionStartActions ||
    showForkButton ||
    availableVersionsLoading ||
    availableVersions.length > 0;
  const luminePanelOverride = shouldShowVersionStartPanel
    ? versionNavigationPanel
    : null;
  const versionsPanel =
    versionsPanelShown && !luminePanelOverride ? versionNavigationPanel : null;
  const preferredCommunicationMode: ChatPanelCommunicationMode =
    routeOpenPeoplePanel
      ? 'people'
      : routeOpenVersionsPanel
        ? 'versions'
        : buildWorkspaceCommunicationMode;
  const chatPanelProps: Omit<ChatPanelProps, 'className' | 'workshopScale'> = {
    preferredCommunicationMode,
    onCommunicationModeChange: handleBuildWorkspaceCommunicationModeChange,
    communicationScrollTops: buildWorkspaceScrollTops,
    onCommunicationScrollChange: handleBuildWorkspaceCommunicationScrollChange,
    showMainProjectNavigation: currentBuildIsContributionFork,
    onOpenMainProject: handleOpenMainProject,
    luminePanelOverride,
    versionsPanel,
    lumineTabLabel: luminePanelOverride ? 'Branches' : 'Lumine',
    lumineTabIcon: luminePanelOverride ? 'code-branch' : 'sparkles',
    lumineChatVisibilityControl: canManageLumineChatVisibility
      ? {
          value: lumineChatVisibility,
          savedValue: savedLumineChatVisibility,
          loading: savingLumineChatVisibility,
          error: lumineChatVisibilityError,
          onSave: handleSaveLumineChatVisibility
        }
      : null,
    lumineModelSelectionControl,
    mainUpdateNoticeControl: branchMainUpdateTarget
      ? {
          shown:
            branchMainUpdateState.rootDrifted ||
            Boolean(branchMainUpdateNoticeError),
          canUpdate: branchMainUpdateState.rootDrifted,
          loading: branchMainUpdateState.loading,
          error: branchMainUpdateNoticeError,
          onUpdate: handleUpdateCurrentBranchFromMain
        }
      : null,
    peoplePanel: (
      <CollaborationPanel
        build={build}
        embedded
        isOwner={isOwner}
        onBuildPatch={handleBuildCollaborationPatch}
        onContributionBranchCreated={handleContributionBranchCreated}
        onCanonicalMerge={handleBuildContributionMerge}
        onVersionProjectFilesUpdate={handleBuildContributionMerge}
        onBeforeContributionAction={handleBeforeContributionAction}
        onAskLumineToResolveConflicts={handleAskLumineToResolveMergeConflicts}
        onAcceptedContributorCountChange={setAcceptedContributorCount}
        onOpenCollaborationSettings={handleOpenCollaborationSettingsModal}
        initialScrollTop={buildWorkspaceScrollTops.people || 0}
        onScrollTopChange={(scrollTop) =>
          handleBuildWorkspaceCommunicationScrollChange('people', scrollTop)
        }
        initialSelectedForumThreadId={
          routeForumThreadId || buildWorkspaceUi?.selectedForumThreadId || 0
        }
        onSelectedForumThreadChange={handleBuildWorkspaceForumThreadChange}
      />
    ),
    messages: mergedChatMessages,
    executionPlan: currentBuildRunView.executionPlan,
    scopedPlanQuestion: resolveScopedPlanQuestion(
      currentBuildRunView.executionPlan
    ),
    followUpPrompt: currentBuildRunView.followUpPrompt,
    runMode: currentBuildRunView.runMode,
    generating: currentBuildRunView.generating,
    generatingStatus: currentBuildRunView.status,
    assistantStatusSteps: currentBuildRunView.assistantStatusSteps,
    requestId: currentBuildRunView.requestId,
    agentContext: currentBuildRunView.agentContext,
    lifecycle: currentBuildRunView.lifecycle,
    copilotPolicy,
    aiUsagePolicy: todayAiUsagePolicy,
    pageFeedbackEvents,
    runEvents: currentBuildRunView.runEvents,
    runError: currentBuildRunView.error,
    activeStreamMessageIds: currentBuildRunView.activeStreamMessageIds,
    isOwner: canEditCurrentBuildProject,
    buildId: build.id,
    chatScrollRef,
    chatEndRef,
    onChatScroll: handleChatScroll,
    draftMessage: buildChatDraftMessage,
    onDraftMessageChange: setBuildChatDraftMessage,
    onSendMessage: handleSendMessage,
    onContinueScopedPlan: handleContinueScopedPlan,
    onCancelScopedPlan: handleCancelScopedPlan,
    onAcceptFollowUpPrompt: handleAcceptFollowUpPrompt,
    onDismissFollowUpPrompt: handleDismissFollowUpPrompt,
    onOpenBuildChatUpload: handleOpenBuildChatUpload,
    uploadInFlight: buildChatUploadInFlight,
    runtimeUploadsModalShown,
    runtimeUploadAssets,
    runtimeUploadsNextCursor,
    runtimeUploadsLoading,
    runtimeUploadsLoadingMore,
    runtimeUploadsError,
    runtimeUploadDeletingId,
    onOpenRuntimeUploadsManager: handleOpenRuntimeUploadsManager,
    onCloseRuntimeUploadsManager: handleCloseRuntimeUploadsManager,
    onLoadMoreRuntimeUploads: handleLoadMoreRuntimeUploads,
    onDeleteRuntimeUpload: handleDeleteRuntimeUploadManagerAsset,
    onCreateGeneratedRuntimeAsset: handleCreateGeneratedRuntimeAsset,
    twinkleCoins: Number(twinkleCoins) || 0,
    purchasingGenerationReset,
    generationResetError,
    onPurchaseGenerationReset: handlePurchaseGenerationReset,
    onStopGeneration: handleStopGeneration,
    onFixRuntimeObservationMessage: handleFixRuntimeObservationMessage,
    onDeleteMessage: handleDeleteMessage
  };
  const previewPanelProps: Omit<PreviewPanelProps, 'className'> = {
    build,
    code: build.code,
    projectFiles: previewProjectFiles,
    streamingProjectFiles: currentBuildRunView.streamingProjectFiles,
    streamingFocusFilePath: currentBuildRunView.streamingFocusFilePath,
    isOwner: canEditCurrentBuildProject,
    codeWorkspaceAvailable: canEditCurrentBuildProject,
    capabilitySnapshot: build.capabilitySnapshot || null,
    maxProjectFileLines: copilotPolicy?.limits?.maxFileLines ?? null,
    runtimeExplorationPlan: currentBuildRunView.runtimeExplorationPlan,
    onReplaceCode: handleReplaceCode,
    onApplyRestoredProjectFiles: handleApplyRestoredProjectFiles,
    onSaveProjectFiles: (files, options) =>
      handleSaveProjectFiles(files, {
        resumePausedQueue: true,
        ...options
      }),
    onEditableProjectFilesStateChange: handleEditableProjectFilesStateChange,
    onRuntimeObservationChange: runtimeFollowUp.handleRuntimeObservationChange,
    onRuntimeUploadsSync: handleRuntimeUploadsSyncFromPreview,
    onAiUsagePolicyUpdate: handlePreviewAiUsagePolicyUpdate,
    onOpenRuntimeUploadsManager: handleOpenRuntimeUploadsManager,
    currentBuildRuntimeAssets,
    onCaptureReadyChange: handlePreviewCaptureReadyChange
  };

  return (
    <div className={pageClass}>
      <Header
        build={build}
        forking={forking}
        canEditMetadata={canEditCurrentBuildMetadata}
        canEditThumbnail={canEditCurrentBuildThumbnail}
        isOwner={isOwner}
        profileTheme={profileTheme}
        publishing={publishing}
        savingThumbnail={savingThumbnail}
        showContributionButton={showContributionButton}
        contributionActionError={contributionActionError}
        contributionActionLoading={contributionActionLoading}
        runtimeAssetTransferProgress={runtimeAssetTransferProgress}
        canMergeBranch={canMergeCurrentBranch}
        showMergeBranch={canShowMergeCurrentBranch}
        mergeBranchDisabled={!canMergeCurrentBranch}
        mergeBranchShiny={mergeCurrentBranchShiny}
        mergeBranchButtonLabel={mergeBranchButtonLabel}
        mergeBranchTargetId={Number(currentUserContributionBranch?.id || 0)}
        mergeBranchTargetLabel={mergeBranchTargetLabel}
        mergeBranchTargetOptions={branchMergeTargetOptions}
        mergeBranchTargetTitle={mergeBranchTargetTitle}
        showReplaceBranch={canReplaceCurrentBranchTarget}
        replaceBranchDisabled={!canReplaceCurrentBranchTarget}
        replaceBranchButtonLabel={replaceBranchButtonLabel}
        showForkButton={showForkButton}
        onContribute={handleCreateContribution}
        onFork={handleFork}
        onMergeBranch={handleMergeCurrentBranch}
        onReplaceMainBranch={handleOpenReplaceMainConfirm}
        onMergeBranchTargetChange={handleMergeBranchTargetChange}
        onOpenCollaborationSettings={handleOpenCollaborationSettingsModal}
        onOpenDescriptionModal={handleOpenDescriptionModal}
        onOpenThumbnailModal={handleOpenThumbnailModal}
        onTogglePublish={handlePublish}
        onUnpublish={handleUnpublish}
      />
      {forkHistoryBuildId ? (
        <ForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={() => setForkHistoryBuildId(0)}
        />
      ) : null}
      <Workspace
        buildChatPanelWidth={buildChatPanelWidth}
        buildWorkshopScale={buildWorkshopScale}
        chatPanelProps={chatPanelProps}
        communicationPanelShown={communicationPanelShown}
        isDesktopWorkspaceLayout={isDesktopWorkspaceLayout}
        mobilePanelTabIntent={mobilePanelTabIntent}
        onMobilePanelTabChange={setMobilePanelTab}
        onWorkspaceResizeKeyDown={handleWorkspaceResizeKeyDown}
        onWorkspaceResizePointerDown={handleWorkspaceResizePointerDown}
        previewPanelProps={previewPanelProps}
        previewPanelRef={previewPanelRef}
        workspaceShellRef={workspaceShellRef}
        workspaceShellStyle={workspaceShellStyle}
      />
      <Modals
        build={build}
        canEditMetadata={canEditCurrentBuildMetadata}
        canEditThumbnail={canEditCurrentBuildThumbnail}
        buildChatDraftMessage={buildChatDraftMessage}
        buildChatUploadFileObj={buildChatUploadFileObj}
        buildChatUploadModalShown={buildChatUploadModalShown}
        buildDescription={build.description}
        buildTitle={getBuildDisplayTitle(build)}
        canShowLumineChatVisibilitySetting={lumineChatVisibilitySettingsShown}
        collaborationSettingsModalShown={collaborationSettingsModalShown}
        descriptionModalShown={descriptionModalShown}
        isOwner={isOwner}
        savingDescription={savingDescription}
        savingThumbnail={savingThumbnail}
        thumbnailInitialImageUrl={
          build.thumbnailUrl || getLatestBuild()?.thumbnailUrl || null
        }
        thumbnailModalShown={thumbnailModalShown}
        thumbnailOptions={thumbnailOptions}
        thumbnailOptionsLoading={thumbnailOptionsLoading}
        thumbnailSaveError={thumbnailSaveError}
        onCaptureThumbnailFromPreview={captureThumbnailFromPreview}
        onCompleteBuildChatUpload={() => {
          setBuildChatDraftMessage('');
          setBuildChatUploadFileObj(null);
        }}
        onCustomUploadSubmit={({ files, caption }) =>
          startBuildChatUploadProcessing(files, {
            messageText: caption,
            historyUserNoteText: caption
          })
        }
        onHideBuildChatUploadFileModal={() => setBuildChatUploadFileObj(null)}
        onHideBuildChatUploadModal={() => setBuildChatUploadModalShown(false)}
        onHideCollaborationSettingsModal={handleCloseCollaborationSettingsModal}
        onHideDescriptionModal={handleCloseDescriptionModal}
        onHideThumbnailModal={handleCloseThumbnailModal}
        onBuildCollaborationPatch={handleBuildCollaborationPatch}
        onSaveThumbnail={handleSaveThumbnail}
        onSelectBuildChatUploadFile={(file) => {
          setBuildChatUploadModalShown(false);
          setBuildChatUploadFileObj(file);
        }}
        onSelectBuildChatUploadFiles={(files) => {
          setBuildChatUploadModalShown(false);
          setBuildChatUploadFileObj(files);
        }}
        onSubmitBuildMetadata={handleSaveMetadata}
      />
      <BranchActionModals
        activeBuildTitle={build.title}
        deletingBranch={deletingBranch}
        deletingBranchLoading={deletingBranchLoading}
        replaceMainConfirmShown={replaceMainConfirmShown}
        replaceBranchButtonLabel={replaceBranchButtonLabel}
        replaceBranchTargetLabel={replaceBranchTargetLabel}
        onCloseDeleteBranch={handleCloseDeleteBranch}
        onCloseReplaceMainConfirm={handleCloseReplaceMainConfirm}
        onDeleteBranch={handleDeleteBranch}
        onReplaceMainWithCurrentBranch={handleReplaceMainWithCurrentBranch}
      />
      <ProjectFileDraftActionModal
        prompt={draftActionPrompt}
        onChoose={resolveProjectFilesDraftActionPrompt}
      />
      {runtimeUploadConfirmModal}
    </div>
  );

  function setMobilePanelTab(tab: MobilePanelTab) {
    setMobilePanelTabIntent((currentIntent) => ({
      tab,
      version: currentIntent.version + 1
    }));
    if (tab === 'chat' && !isDesktopWorkspaceLayout) {
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('auto', { force: true });
      window.requestAnimationFrame(() => {
        shouldAutoScrollRef.current = true;
        scrollChatToBottom('auto', { force: true });
      });
    }
  }
}

function getBranchMainUpdateTarget({
  build,
  userId
}: {
  build: Build;
  userId?: number | null;
}) {
  if (!isBuildContributionFork(build)) return null;
  const normalizedUserId = Number(userId || 0);
  const contributorUserId =
    Number(build.contributionContributorId || build.userId || 0) || 0;
  if (!normalizedUserId || contributorUserId !== normalizedUserId) {
    return null;
  }
  const status = String(build.contributionStatus || '').trim();
  if (status !== 'draft' && status !== 'merged') return null;
  const rootBuildId = Number(build.contributionRootBuildId || 0);
  const contributionBuildId = Number(build.id || 0);
  if (!rootBuildId || !contributionBuildId) return null;
  return {
    rootBuildId,
    contributionBuildId
  };
}

function normalizeUpdateFromMainConflictMarkerPaths(value: unknown) {
  return Array.isArray(value)
    ? value.map((path) => String(path || '').trim()).filter(Boolean)
    : [];
}

function getUpdateFromMainErrorMessage(error: any) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    'Failed to update from main'
  );
}

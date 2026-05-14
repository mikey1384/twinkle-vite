import {
  markBuildContributionWorkspaceEdited,
  markBuildReleaseStatusUnpublished
} from '../helpers/branches';
import {
  normalizeProjectFilePath,
  normalizeProjectFilesForBuild,
  resolveIndexEntryPathFromProjectFiles,
  resolveIndexHtmlFromProjectFiles
} from '../helpers/projectFiles';
import useProjectFileDrafts, {
  type BuildProjectFileContributionAction,
  type BuildProjectFilesDraftState
} from './useProjectFileDrafts';
import type {
  Build,
  BuildCopilotPolicy,
  BuildRunEvent,
  ProjectFileSaveOptions,
  ProjectFileSaveResult
} from '../types';

interface BuildEditorProjectFilesFeedbackEvent {
  kind: BuildRunEvent['kind'];
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface UseBuildEditorProjectFilesOptions {
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  getLatestBuild: () => Build;
  isOwner: boolean;
  maybeAutoCaptureBranchThumbnailAfterProgressSave: (
    savedBuild: Build | null | undefined
  ) => void;
  maybeResumePausedQueueAfterSave: () => void;
  onAppendLocalRunEvent: (event: BuildEditorProjectFilesFeedbackEvent) => void;
  onRefreshCurrentBranchMergeabilityForBuild: (
    nextBuild: Build | null | undefined
  ) => void;
  onSyncAvailableBranchSummary: (nextBuild: Build) => void;
  discardProjectFilesDraft: () => Array<{ path: string; content?: string }>;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  requiresProjectFilesResyncBeforeSave: () => boolean;
  setRequiresProjectFilesResyncBeforeSave: (nextValue: boolean) => void;
  syncChatMessagesFromServer: (
    serverMessages?: any[],
    fromWriter?: boolean,
    options?: Record<string, any>
  ) => Promise<void>;
  updateBuildProjectFiles: (options: Record<string, any>) => Promise<any>;
}

export default function useProjectFiles({
  applyBuildUpdate,
  build,
  getLatestBuild,
  isOwner,
  maybeAutoCaptureBranchThumbnailAfterProgressSave,
  maybeResumePausedQueueAfterSave,
  onAppendLocalRunEvent,
  onRefreshCurrentBranchMergeabilityForBuild,
  onSyncAvailableBranchSummary,
  discardProjectFilesDraft,
  replaceCopilotPolicy,
  requiresProjectFilesResyncBeforeSave,
  setRequiresProjectFilesResyncBeforeSave,
  syncChatMessagesFromServer,
  updateBuildProjectFiles
}: UseBuildEditorProjectFilesOptions) {
  const projectFileDrafts = useProjectFileDrafts({
    isOwner,
    normalizeProjectFilePath,
    persistProjectFilesDraft,
    discardProjectFilesDraft,
    onAppendFeedbackEvent: onAppendLocalRunEvent
  });

  function handleReplaceCode(newCode: string) {
    const activeBuild = getLatestBuild();
    const currentFiles = normalizeProjectFilesForBuild(
      activeBuild?.projectFiles || [],
      activeBuild?.code || ''
    );
    const nextFiles = currentFiles.map((file) =>
      file.path.toLowerCase() === '/index.html' ||
      file.path.toLowerCase() === '/index.htm'
        ? { ...file, content: newCode, sizeBytes: newCode.length }
        : file
    );
    handleProjectFilesChange(nextFiles);
  }

  function handleApplyRestoredProjectFiles(
    restoredFilesInput: Array<{ path: string; content?: string }>,
    restoredCode?: string | null,
    options?: {
      artifactVersionId?: number | null;
      primaryArtifactId?: number | null;
      contributionStatus?: Build['contributionStatus'];
    }
  ) {
    const activeBuild = getLatestBuild();
    if (!activeBuild) return;
    if (!Array.isArray(restoredFilesInput) || restoredFilesInput.length === 0) {
      if (typeof restoredCode === 'string') {
        handleReplaceCode(restoredCode);
      }
      return;
    }
    const fallbackCode =
      typeof restoredCode === 'string' ? restoredCode : activeBuild.code || '';
    const normalizedFiles = normalizeProjectFilesForBuild(
      restoredFilesInput,
      fallbackCode
    );
    const nextCode = resolveIndexHtmlFromProjectFiles(
      normalizedFiles,
      fallbackCode
    );
    const nextBuild = {
      ...activeBuild,
      code: nextCode,
      primaryArtifactId:
        options?.primaryArtifactId ?? activeBuild.primaryArtifactId ?? null,
      currentArtifactVersionId:
        options?.artifactVersionId ??
        activeBuild.currentArtifactVersionId ??
        null,
      contributionStatus:
        options?.contributionStatus ?? activeBuild.contributionStatus,
      contributionClosedAt:
        options?.contributionStatus === 'draft'
          ? 0
          : activeBuild.contributionClosedAt ?? null,
      projectManifest: {
        entryPath: resolveIndexEntryPathFromProjectFiles(
          normalizedFiles,
          activeBuild?.projectManifest?.entryPath || '/index.html'
        ),
        storageMode: 'project-files',
        fileCount: normalizedFiles.length
      },
      projectFiles: normalizedFiles
    };
    const appliedBuild = markBuildReleaseStatusUnpublished(
      markBuildContributionWorkspaceEdited(nextBuild)
    );
    applyBuildUpdate(appliedBuild);
    onSyncAvailableBranchSummary(appliedBuild);
  }

  function handleProjectFilesChange(
    nextFilesInput: Array<{ path: string; content?: string }>
  ) {
    const activeBuild = getLatestBuild();
    if (!activeBuild) return;
    const normalizedFiles = normalizeProjectFilesForBuild(
      nextFilesInput,
      activeBuild.code || ''
    );
    const nextCode = resolveIndexHtmlFromProjectFiles(
      normalizedFiles,
      activeBuild.code || ''
    );
    const nextBuild = {
      ...activeBuild,
      code: nextCode,
      projectManifest: {
        entryPath: resolveIndexEntryPathFromProjectFiles(
          normalizedFiles,
          activeBuild?.projectManifest?.entryPath || '/index.html'
        ),
        storageMode: 'project-files',
        fileCount: normalizedFiles.length
      },
      projectFiles: normalizedFiles
    };
    applyBuildUpdate(
      markBuildReleaseStatusUnpublished(
        markBuildContributionWorkspaceEdited(nextBuild),
        { force: true }
      )
    );
  }

  async function handleSaveProjectFiles(
    nextFilesInput: Array<{ path: string; content?: string }>,
    options?: ProjectFileSaveOptions
  ): Promise<ProjectFileSaveResult> {
    if (!isOwner) {
      return { success: false, error: 'Not authorized' };
    }
    const activeBuild = getLatestBuild();
    const explicitTargetBuildId = Number(options?.targetBuildId || 0);
    const hasExplicitTargetBuild =
      Number.isFinite(explicitTargetBuildId) && explicitTargetBuildId > 0;
    const requestBuild = hasExplicitTargetBuild ? null : activeBuild || build;
    const requestBuildId = hasExplicitTargetBuild
      ? explicitTargetBuildId
      : Number(requestBuild?.id || 0);
    if (!Number.isFinite(requestBuildId) || requestBuildId <= 0) {
      return { success: false, error: 'Build not found' };
    }
    if (requiresProjectFilesResyncBeforeSave()) {
      try {
        await syncChatMessagesFromServer(undefined, true);
        setRequiresProjectFilesResyncBeforeSave(false);
      } catch (syncError) {
        console.error(
          'Failed to refresh project files before save after generation:',
          syncError
        );
        return {
          success: false,
          error:
            'Unable to verify latest generated files yet. Please retry in a moment.'
        };
      }
    }
    const requestBuildCode = hasExplicitTargetBuild
      ? options?.targetBuildCode || null
      : requestBuild?.code || '';
    const normalizedFiles = normalizeProjectFilesForBuild(
      nextFilesInput,
      requestBuildCode
    );
    try {
      const result = await updateBuildProjectFiles({
        buildId: requestBuildId,
        files: normalizedFiles.map((file) => ({
          path: file.path,
          content: file.content
        })),
        createVersion: true
      });
      const savedFiles = normalizeProjectFilesForBuild(
        Array.isArray(result?.projectFiles)
          ? result.projectFiles
          : normalizedFiles,
        requestBuildCode
      );
      const nextCode = resolveIndexHtmlFromProjectFiles(
        savedFiles,
        requestBuildCode
      );
      const latestBuild = getLatestBuild();
      if (!latestBuild || Number(latestBuild.id) !== requestBuildId) {
        if (options?.resumePausedQueue && !hasExplicitTargetBuild) {
          maybeResumePausedQueueAfterSave();
        }
        if (hasExplicitTargetBuild) {
          return { success: true };
        }
        return {
          success: false,
          error:
            'Build changed while save was in progress. Please retry on the active build.'
        };
      }
      const nextBuild = {
        ...latestBuild,
        code: nextCode,
        primaryArtifactId:
          result?.artifactVersion?.artifactId ??
          latestBuild.primaryArtifactId ??
          null,
        currentArtifactVersionId:
          result?.artifactVersion?.versionId ??
          latestBuild.currentArtifactVersionId ??
          null,
        updatedAt: Number(result?.updatedAt || 0) || latestBuild.updatedAt,
        contributionStatus:
          result?.contributionStatus ?? latestBuild.contributionStatus,
        contributionClosedAt:
          result?.contributionStatus === 'draft'
            ? 0
            : latestBuild.contributionClosedAt ?? null,
        releaseStatus: result?.releaseStatus ?? latestBuild.releaseStatus ?? null,
        projectManifest: result?.projectManifest || {
          entryPath: resolveIndexEntryPathFromProjectFiles(
            savedFiles,
            latestBuild.projectManifest?.entryPath || '/index.html'
          ),
          storageMode: 'project-files',
          fileCount: savedFiles.length
        },
        projectFiles: savedFiles
      };
      const appliedBuild = markBuildContributionWorkspaceEdited(nextBuild);
      applyBuildUpdate(appliedBuild);
      onSyncAvailableBranchSummary(appliedBuild);
      onRefreshCurrentBranchMergeabilityForBuild(appliedBuild);
      maybeAutoCaptureBranchThumbnailAfterProgressSave(appliedBuild);
      if (Object.prototype.hasOwnProperty.call(result || {}, 'copilotPolicy')) {
        replaceCopilotPolicy(result?.copilotPolicy || null);
      }
      if (options?.resumePausedQueue) {
        maybeResumePausedQueueAfterSave();
      }
      return { success: true };
    } catch (error: any) {
      console.error('Failed to save project files:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save project files';
      return { success: false, error: message };
    }
  }

  async function persistProjectFilesDraft(
    files: Array<{ path: string; content?: string }>
  ): Promise<ProjectFileSaveResult> {
    return await handleSaveProjectFiles(files, {
      resumePausedQueue: false
    });
  }

  function handleProjectFilesDraftStateChange(
    state: BuildProjectFilesDraftState
  ) {
    projectFileDrafts.handleProjectFilesDraftStateChange(state);
  }

  function prepareProjectFilesForContributionAction(options: {
    action: BuildProjectFileContributionAction;
  }) {
    return projectFileDrafts.prepareProjectFilesForContributionAction(options);
  }

  return {
    draftActionPrompt: projectFileDrafts.draftActionPrompt,
    ensureProjectFilesPersistedBeforePublish:
      projectFileDrafts.ensureProjectFilesPersistedBeforePublish,
    ensureProjectFilesPersistedBeforeRun:
      projectFileDrafts.ensureProjectFilesPersistedBeforeRun,
    handleApplyRestoredProjectFiles,
    handleProjectFilesChange,
    handleProjectFilesDraftStateChange,
    handleReplaceCode,
    handleSaveProjectFiles,
    prepareProjectFilesForContributionAction,
    resolveProjectFilesDraftActionPrompt:
      projectFileDrafts.resolveProjectFilesDraftActionPrompt,
    resetProjectFilesDraftState: projectFileDrafts.resetDraftState
  };
}

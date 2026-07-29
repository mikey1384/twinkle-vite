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
  onAdvanceProjectFilesDraftBase: (filesHash: string) => void;
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
  onAdvanceProjectFilesDraftBase,
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
    onAdvanceProjectFilesDraftBase,
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
      filesHash?: string | null;
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
          : (activeBuild.contributionClosedAt ?? null),
      projectManifest: {
        entryPath: resolveIndexEntryPathFromProjectFiles(
          normalizedFiles,
          activeBuild?.projectManifest?.entryPath || '/index.html'
        ),
        storageMode: 'project-files',
        fileCount: normalizedFiles.length
      },
      projectFiles: normalizedFiles,
      // Restores rewrite the server files; without a fresh server-issued hash
      // the synced base is unknown, so null it rather than keep a stale one.
      projectFilesHash:
        typeof options?.filesHash === 'string' ? options.filesHash : null
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
      // Prove this save is based on the snapshot the files were derived from
      // so a stale session (e.g. a tab opened before a branch merge landed)
      // cannot silently rewind newer canonical state. Prefer the draft-bound
      // base (captured when the draft buffer last matched persisted files):
      // it keeps a stale draft failing the guard even after this client hears
      // about newer files or navigates elsewhere. Explicit-target saves must
      // always carry that captured base because active build state may now
      // belong to a different build. Only ordinary saves without a supplied
      // draft base may fall back to the active build's last-synced hash.
      const latestBuildForBase = getLatestBuild();
      const targetsTrackedBuild =
        latestBuildForBase && Number(latestBuildForBase.id) === requestBuildId;
      const hasDraftBaseFilesHash = Object.prototype.hasOwnProperty.call(
        options || {},
        'draftBaseFilesHash'
      );
      const normalizedDraftBaseFilesHash =
        typeof options?.draftBaseFilesHash === 'string' &&
        options.draftBaseFilesHash.trim()
          ? options.draftBaseFilesHash.trim()
          : null;
      if (
        (hasDraftBaseFilesHash || hasExplicitTargetBuild) &&
        !normalizedDraftBaseFilesHash
      ) {
        return {
          success: false,
          error:
            'Unable to verify which server version these edits were based on. Your unsaved edits are kept in this editor — copy anything you need, then discard them or reload to continue from the latest files.'
        };
      }
      const baseFilesHash = hasDraftBaseFilesHash
        ? normalizedDraftBaseFilesHash
        : targetsTrackedBuild
          ? latestBuildForBase.projectFilesHash || null
          : null;
      const result = await updateBuildProjectFiles({
        buildId: requestBuildId,
        files: normalizedFiles.map((file) => ({
          path: file.path,
          content: file.content
        })),
        createVersion: true,
        baseFilesHash
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
      const savedFilesHash =
        typeof result?.filesHash === 'string' && result.filesHash.trim()
          ? result.filesHash.trim()
          : null;
      const latestBuild = getLatestBuild();
      if (!latestBuild || Number(latestBuild.id) !== requestBuildId) {
        if (options?.resumePausedQueue && !hasExplicitTargetBuild) {
          maybeResumePausedQueueAfterSave();
        }
        if (hasExplicitTargetBuild) {
          return { success: true, filesHash: savedFilesHash };
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
        // Taken from the save response rather than left stale: a fresh branch
        // starts with no delta, and the contributor's send-to-owner panel keys
        // off this, so preserving the old empty value hid the panel until a
        // full reload.
        contributionRevisionHash:
          typeof result?.contributionRevisionHash === 'string'
            ? result.contributionRevisionHash
            : latestBuild.contributionRevisionHash,
        contributionStatus:
          result?.contributionStatus ?? latestBuild.contributionStatus,
        contributionClosedAt:
          result?.contributionStatus === 'draft'
            ? 0
            : (latestBuild.contributionClosedAt ?? null),
        releaseStatus:
          result?.releaseStatus ?? latestBuild.releaseStatus ?? null,
        projectManifest: result?.projectManifest || {
          entryPath: resolveIndexEntryPathFromProjectFiles(
            savedFiles,
            latestBuild.projectManifest?.entryPath || '/index.html'
          ),
          storageMode: 'project-files',
          fileCount: savedFiles.length
        },
        projectFiles: savedFiles,
        projectFilesHash: savedFilesHash
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
      return { success: true, filesHash: savedFilesHash };
    } catch (error: any) {
      console.error('Failed to save project files:', error);
      // Typed rejection preserved by the updateBuildProjectFiles helper
      // (handleError strips response payloads from ordinary rejections).
      if (error?.code === 'build_project_files_stale') {
        try {
          await refreshBuildAfterStaleSave(requestBuildId);
        } catch (syncError) {
          console.error(
            'Failed to refresh canonical build after stale save:',
            syncError
          );
        }
        // Saving again will keep failing (the draft stays bound to the old
        // snapshot), so steer the user toward re-basing instead of retrying.
        return {
          success: false,
          error:
            'This project changed since these files were loaded (for example a merged branch or a save from another session). Your unsaved edits are kept in this editor — copy anything you need, then discard them or reload to continue from the latest files.'
        };
      }
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save project files';
      return { success: false, error: message };
    }
  }

  // A stale-base save was rejected: reload the complete canonical build from
  // the writer without touching the user's local draft buffers. Applying only
  // the files/hash included in the 409 would create a hybrid build whose
  // release, contribution, artifact, and update metadata still came from the
  // stale client snapshot. The identity guard also prevents this reload from
  // landing if the user navigates to another build while it is in flight.
  async function refreshBuildAfterStaleSave(requestBuildId: number) {
    const latestBuild = getLatestBuild();
    if (!latestBuild || Number(latestBuild.id) !== requestBuildId) return;
    await syncChatMessagesFromServer(undefined, true, {
      expectedBuildId: requestBuildId,
      preserveLocalMessages: true,
      preserveActiveAssistantState: true
    });
  }

  async function persistProjectFilesDraft(
    files: Array<{ path: string; content?: string }>,
    draftBaseFilesHash?: string | null
  ): Promise<ProjectFileSaveResult> {
    return await handleSaveProjectFiles(files, {
      resumePausedQueue: false,
      // Preserve an explicit unknown base so the save is stopped instead of
      // being rebound to newer server state and overwriting it.
      draftBaseFilesHash: draftBaseFilesHash ?? null
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBuildWorkspacePath } from '../buildNavigation';
import {
  canMergeBuildBranch,
  canMergeBuildBranchIntoOwnBranch,
  canStartProjectScopedContribution,
  canStartStandaloneFork,
  canUseBuildBranchAsMergeTarget,
  formatBranchFullDisplayTitle,
  getBuildBranchMergeTargetLabel,
  getBuildContributionContributorUserId,
  normalizeBuildVersionSummary,
  sortBuildVersionSummaries
} from './domain/buildBranches';
import { resolveIndexEntryPathFromProjectFiles } from './domain/projectFiles';
import { isBuildContributionFork } from '../shared/domain/buildRelationshipLabels';
import type {
  Build,
  BuildBranchDeleteTarget,
  BuildVersionSummary
} from './types';
import type { BuildProjectFilesDraftState } from './useBuildProjectFileDrafts';

type ContributionAction = 'merge' | 'update-from-main';

interface ContributionActionPreparationResult {
  ready: boolean;
  files?: Array<{ path: string; content?: string }>;
}

interface UseBuildEditorBranchesOptions {
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  canEditCurrentBuildProject: boolean;
  currentBuildIsContributionFork: boolean;
  createBuildContributionFork: (options: {
    buildId: number;
    name: string;
  }) => Promise<any>;
  deleteBuild: (options: {
    buildId: number;
    confirmTitle: string;
  }) => Promise<any>;
  forkBuild: (buildId: number) => Promise<any>;
  getLatestBuild: () => Build;
  isOwner: boolean;
  loadBuildContribution: (options: Record<string, any>) => Promise<any>;
  loadBuildContributionMergeIntoMyBranch: (
    options: Record<string, any>
  ) => Promise<any>;
  loadBuildContributions: (buildId: number) => Promise<any>;
  mergeBuildContribution: (options: Record<string, any>) => Promise<any>;
  mergeBuildContributionIntoMyBranch: (
    options: Record<string, any>
  ) => Promise<any>;
  onProjectFilesDraftStateChange: (
    state: BuildProjectFilesDraftState
  ) => void;
  prepareProjectFilesForContributionAction: (options: {
    action: ContributionAction;
  }) => Promise<ContributionActionPreparationResult>;
  replaceMainWithBuildContribution: (
    options: Record<string, any>
  ) => Promise<any>;
  userId: number;
}

export default function useBuildEditorBranches({
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
  onProjectFilesDraftStateChange,
  prepareProjectFilesForContributionAction,
  replaceMainWithBuildContribution,
  userId
}: UseBuildEditorBranchesOptions) {
  const navigate = useNavigate();
  const [forking, setForking] = useState(false);
  const [contributionActionLoading, setContributionActionLoading] = useState<
    'merge' | 'replace-main' | ''
  >('');
  const [contributionActionError, setContributionActionError] = useState('');
  const [replaceMainConfirmShown, setReplaceMainConfirmShown] = useState(false);
  const [
    currentBranchMergeableFileCount,
    setCurrentBranchMergeableFileCount
  ] = useState<number | null>(null);
  const [
    currentBranchMergeabilityLoadFailed,
    setCurrentBranchMergeabilityLoadFailed
  ] = useState(false);
  const [
    currentBranchProjectFileDraftState,
    setCurrentBranchProjectFileDraftState
  ] = useState({
    hasUnsavedChanges: false,
    saving: false
  });
  const [
    currentBranchMergeabilityRefreshKey,
    setCurrentBranchMergeabilityRefreshKey
  ] = useState(0);
  const [availableVersions, setAvailableVersions] = useState<
    BuildVersionSummary[]
  >([]);
  const [
    currentUserContributionBranches,
    setCurrentUserContributionBranches
  ] = useState<BuildVersionSummary[]>([]);
  const [currentUserContributionBranch, setCurrentUserContributionBranch] =
    useState<BuildVersionSummary | null>(null);
  const [availableVersionsLoading, setAvailableVersionsLoading] =
    useState(false);
  const [deletingBranch, setDeletingBranch] =
    useState<BuildBranchDeleteTarget | null>(null);
  const [deletingBranchLoading, setDeletingBranchLoading] = useState(false);
  const [branchNameDraft, setBranchNameDraft] = useState('');

  const currentBranchRootBuildId = currentBuildIsContributionFork
    ? Number(build.contributionRootBuildId || 0)
    : 0;
  const currentBranchContributionBuildId = currentBuildIsContributionFork
    ? Number(build.id || 0)
    : 0;
  const currentBranchRootProjectTitle = currentBuildIsContributionFork
    ? build.rootBuildTitle || ''
    : build.title || '';
  const canMergeCurrentBranchToMain = canMergeBuildBranch(build, userId);
  const canMergeCurrentBranchIntoOwnBranch = canMergeBuildBranchIntoOwnBranch({
    build,
    userId,
    ownBranch: currentUserContributionBranch
  });
  const currentBranchMergeTarget: 'main' | 'own-branch' | null =
    canMergeCurrentBranchToMain
      ? 'main'
      : canMergeCurrentBranchIntoOwnBranch
        ? 'own-branch'
        : null;
  const branchMergeTargetBranches = currentUserContributionBranches.filter(
    (version) =>
      canUseBuildBranchAsMergeTarget({
        version,
        activeBuildId: currentBranchContributionBuildId,
        userId
      })
  );
  const selectedBranchMergeTarget =
    currentBranchMergeTarget === 'own-branch'
      ? branchMergeTargetBranches.find(
          (version) =>
            Number(version.id || 0) ===
            Number(currentUserContributionBranch?.id || 0)
        ) ||
        currentUserContributionBranch ||
        null
      : null;
  const branchMergeTargetOptions =
    currentBranchMergeTarget === 'own-branch'
      ? branchMergeTargetBranches.map((version) => {
          const branchTitle = getBuildBranchMergeTargetLabel({
            version,
            rootProjectTitle: currentBranchRootProjectTitle
          });
          return {
            id: Number(version.id || 0),
            label: branchTitle,
            title: formatBranchFullDisplayTitle({
              projectTitle: currentBranchRootProjectTitle,
              branchTitle
            })
          };
        })
      : [];
  const selectedBranchMergeTargetLabel = selectedBranchMergeTarget
    ? getBuildBranchMergeTargetLabel({
        version: selectedBranchMergeTarget,
        rootProjectTitle: currentBranchRootProjectTitle
      })
    : '';
  const mergeBranchTargetLabel =
    currentBranchMergeTarget === 'own-branch'
      ? selectedBranchMergeTargetLabel
      : '';
  const mergeBranchTargetTitle =
    currentBranchMergeTarget === 'own-branch' && selectedBranchMergeTargetLabel
      ? formatBranchFullDisplayTitle({
          projectTitle: currentBranchRootProjectTitle,
          branchTitle: selectedBranchMergeTargetLabel
        })
      : '';
  const mergeBranchButtonLabel =
    currentBranchMergeTarget === 'main' ? 'Merge into Main' : 'Merge';
  const canShowMergeCurrentBranch = Boolean(currentBranchMergeTarget);
  const currentBranchHasMergeableFileChanges =
    currentBranchMergeableFileCount !== null &&
    currentBranchMergeableFileCount > 0;
  const currentBranchHasPendingProjectFileDrafts =
    canEditCurrentBuildProject &&
    (currentBranchProjectFileDraftState.hasUnsavedChanges ||
      currentBranchProjectFileDraftState.saving);
  const canMergeCurrentBranch =
    canShowMergeCurrentBranch &&
    (currentBranchHasMergeableFileChanges ||
      currentBranchMergeabilityLoadFailed ||
      currentBranchHasPendingProjectFileDrafts);
  const canReplaceMainWithCurrentBranch =
    currentBranchMergeTarget === 'main' && canMergeCurrentBranch;
  const mergeCurrentBranchShiny =
    canShowMergeCurrentBranch &&
    (currentBranchHasMergeableFileChanges ||
      currentBranchHasPendingProjectFileDrafts);
  const canShowVersionStartActions =
    !currentBuildIsContributionFork &&
    Boolean(userId) &&
    (isOwner ||
      (Boolean(build.canOpenContributionWorkspace) &&
        canStartProjectScopedContribution(build)));
  const showContributionButton = false;
  const showForkButton =
    Boolean(userId) &&
    canStartStandaloneFork(build) &&
    (!isOwner || currentBuildIsContributionFork);

  useEffect(() => {
    setCurrentBranchProjectFileDraftState({
      hasUnsavedChanges: false,
      saving: false
    });
  }, [build.id]);

  useEffect(() => {
    const branchListBuildId = currentBuildIsContributionFork
      ? Number(build.contributionRootBuildId || 0)
      : Number(build.id || 0);
    if (
      !userId ||
      !branchListBuildId ||
      (!isOwner &&
        !currentBuildIsContributionFork &&
        !build.canOpenContributionWorkspace)
    ) {
      setAvailableVersions([]);
      setCurrentUserContributionBranches([]);
      setCurrentUserContributionBranch(null);
      setAvailableVersionsLoading(false);
      return;
    }
    let canceled = false;
    setAvailableVersionsLoading(true);
    loadBuildContributions(branchListBuildId)
      .then((result: any) => {
        if (canceled) return;
        const nextVersions = Array.isArray(result?.contributions)
          ? result.contributions
          : [];
        const explicitCurrentUserBranches = Array.isArray(
          result?.currentUserContributions
        )
          ? result.currentUserContributions
              .map((version: any) => normalizeBuildVersionSummary(version))
              .filter(Boolean)
          : [];
        const currentUserBranchFromResponse = normalizeBuildVersionSummary(
          result?.currentUserContribution
        );
        const currentUserBranchesById = new Map<number, BuildVersionSummary>();
        [
          ...explicitCurrentUserBranches,
          currentUserBranchFromResponse,
          ...nextVersions
            .filter(
              (version: BuildVersionSummary) =>
                getBuildContributionContributorUserId(version) ===
                Number(userId || 0)
            )
            .map((version: BuildVersionSummary) =>
              normalizeBuildVersionSummary(version)
            )
        ].forEach((version) => {
          if (version?.id) currentUserBranchesById.set(version.id, version);
        });
        const nextCurrentUserBranches = sortBuildVersionSummaries(
          Array.from(currentUserBranchesById.values())
        );
        const mergeTargetBranches = nextCurrentUserBranches.filter(
          (version) =>
            canUseBuildBranchAsMergeTarget({
              version,
              activeBuildId: build.id,
              userId
            })
        );
        const fallbackCurrentUserBranch =
          currentUserBranchFromResponse ||
          mergeTargetBranches[0] ||
          null;
        setAvailableVersions(nextVersions);
        setCurrentUserContributionBranches(nextCurrentUserBranches);
        setCurrentUserContributionBranch((previousBranch) => {
          const previousBranchId = Number(previousBranch?.id || 0);
          const preservedBranch = mergeTargetBranches.find(
            (version) => Number(version.id || 0) === previousBranchId
          );
          return preservedBranch || fallbackCurrentUserBranch;
        });
      })
      .catch((error: any) => {
        if (canceled) return;
        console.error('Failed to load build branches:', error);
        setAvailableVersions([]);
        setCurrentUserContributionBranches([]);
        setCurrentUserContributionBranch(null);
      })
      .finally(() => {
        if (!canceled) {
          setAvailableVersionsLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
    // loadBuildContributions is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.canOpenContributionWorkspace,
    build.contributionRootBuildId,
    build.id,
    currentBuildIsContributionFork,
    isOwner,
    userId
  ]);

  useEffect(() => {
    if (
      !canShowMergeCurrentBranch ||
      !currentBranchRootBuildId ||
      !currentBranchContributionBuildId
    ) {
      setCurrentBranchMergeableFileCount(null);
      setCurrentBranchMergeabilityLoadFailed(false);
      return;
    }
    let canceled = false;
    setCurrentBranchMergeableFileCount(null);
    setCurrentBranchMergeabilityLoadFailed(false);
    const loadMergeability =
      currentBranchMergeTarget === 'own-branch'
        ? loadBuildContributionMergeIntoMyBranch
        : loadBuildContribution;
    loadMergeability({
      buildId: currentBranchRootBuildId,
      contributionBuildId: currentBranchContributionBuildId,
      ...(currentBranchMergeTarget === 'own-branch'
        ? {
            targetContributionBuildId: Number(
              currentUserContributionBranch?.id || 0
            )
          }
        : {})
    })
      .then((result: any) => {
        if (canceled) return;
        const changedFiles = Array.isArray(result?.diff?.changedFiles)
          ? result.diff.changedFiles
          : [];
        const mergeableChangedFiles = changedFiles.filter(
          (file: any) => file?.mergeStatus !== 'unchanged'
        );
        setCurrentBranchMergeableFileCount(mergeableChangedFiles.length);
        setCurrentBranchMergeabilityLoadFailed(false);
      })
      .catch((error: any) => {
        if (canceled) return;
        console.error('Failed to load current branch merge diff:', error);
        setCurrentBranchMergeableFileCount(null);
        setCurrentBranchMergeabilityLoadFailed(true);
      });
    return () => {
      canceled = true;
    };
    // loadBuildContribution and loadBuildContributionMergeIntoMyBranch are stable context request helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.contributionBaseBuildUpdatedAt,
    build.contributionStatus,
    build.updatedAt,
    canShowMergeCurrentBranch,
    currentBranchContributionBuildId,
    currentBranchMergeTarget,
    currentBranchMergeabilityRefreshKey,
    currentBranchRootBuildId,
    currentUserContributionBranch?.id,
    currentUserContributionBranch?.updatedAt
  ]);

  function refreshCurrentBranchMergeability() {
    setCurrentBranchMergeabilityRefreshKey((key) => key + 1);
  }

  function refreshCurrentBranchMergeabilityForBuild(
    nextBuild: Build | null | undefined
  ) {
    if (nextBuild && canMergeBuildBranch(nextBuild, userId)) {
      refreshCurrentBranchMergeability();
    }
  }

  async function handleCreateContribution() {
    if (!userId || forking || currentBuildIsContributionFork) return;
    const branchName = branchNameDraft.trim();
    if (!branchName) return;
    setForking(true);
    try {
      const latestBuild = getLatestBuild();
      const result = await createBuildContributionFork({
        buildId: latestBuild.id,
        name: branchName
      });
      if (result?.success && result?.build) {
        setBranchNameDraft('');
        navigate(getBuildWorkspacePath(result.build));
      }
    } catch (error) {
      console.error('Failed to create branch:', error);
    } finally {
      setForking(false);
    }
  }

  function handleLoadVersion(version: BuildVersionSummary) {
    if (!version?.id) return;
    navigate(getBuildWorkspacePath(version), {
      state: {
        openVersionsPanel: true
      }
    });
  }

  function handleMergeBranchTargetChange(targetBranchId: number) {
    const targetBranch = branchMergeTargetBranches.find(
      (version) => Number(version.id || 0) === Number(targetBranchId || 0)
    );
    if (!targetBranch) return;
    setCurrentUserContributionBranch(targetBranch);
  }

  function handleRequestDeleteBranch(target: BuildBranchDeleteTarget) {
    if (!target?.id || deletingBranchLoading) return;
    setDeletingBranch(target);
  }

  function handleCloseDeleteBranch() {
    if (deletingBranchLoading) return;
    setDeletingBranch(null);
  }

  async function handleDeleteBranch(confirmTitle: string) {
    const target = deletingBranch;
    if (!target || deletingBranchLoading) return;
    setDeletingBranchLoading(true);
    try {
      const result = await deleteBuild({
        buildId: target.id,
        confirmTitle
      });
      if (result?.success) {
        setAvailableVersions((versions) =>
          versions.filter((version) => Number(version.id) !== Number(target.id))
        );
        if (
          Number(currentUserContributionBranch?.id || 0) === Number(target.id)
        ) {
          setCurrentUserContributionBranch(null);
        }
        setDeletingBranch(null);
        if (Number(target.id) === Number(getLatestBuild().id || 0)) {
          const rootBuildId = Number(
            getLatestBuild().contributionRootBuildId || 0
          );
          if (rootBuildId > 0) {
            navigate(`/build/${rootBuildId}`, {
              state: {
                openVersionsPanel: true,
                skipDefaultContributionBranchRedirect: true
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete branch:', error);
    } finally {
      setDeletingBranchLoading(false);
    }
  }

  function handleOpenMainProject() {
    const rootBuildId = Number(getLatestBuild().contributionRootBuildId || 0);
    if (!rootBuildId) return;
    navigate(`/build/${rootBuildId}`, {
      state: {
        openVersionsPanel: true,
        skipDefaultContributionBranchRedirect: true
      }
    });
  }

  async function handleFork() {
    if (!userId || forking || (isOwner && !currentBuildIsContributionFork)) {
      return;
    }
    setForking(true);
    try {
      const latestBuild = getLatestBuild();
      const result = await forkBuild(latestBuild.id);
      if (result?.success && result?.build) {
        navigate(`/build/${result.build.id}`);
      }
    } catch (error) {
      console.error('Failed to fork build:', error);
    } finally {
      setForking(false);
    }
  }

  async function handleMergeCurrentBranch() {
    const latestBuild = getLatestBuild();
    const rootBuildId = Number(latestBuild.contributionRootBuildId || 0);
    const contributionBuildId = Number(latestBuild.id || 0);
    if (
      !rootBuildId ||
      !contributionBuildId ||
      !currentBranchMergeTarget ||
      !canMergeCurrentBranch ||
      contributionActionLoading
    ) {
      return;
    }
    setContributionActionLoading('merge');
    setContributionActionError('');
    try {
      const preparedFiles = await handleBeforeContributionAction('merge');
      if (!preparedFiles.ready) return;
      const result =
        currentBranchMergeTarget === 'own-branch'
          ? await mergeBuildContributionIntoMyBranch({
              buildId: rootBuildId,
              contributionBuildId,
              targetContributionBuildId: Number(
                currentUserContributionBranch?.id || 0
              )
            })
          : await mergeBuildContribution({
              buildId: rootBuildId,
              contributionBuildId,
              projectFiles: preparedFiles.files
            });
      if (result?.success) {
        const mergedBranch = result.contribution || null;
        if (currentBranchMergeTarget === 'own-branch' && mergedBranch) {
          handleContributionBranchCreated(mergedBranch);
          navigate(getBuildWorkspacePath(mergedBranch), {
            state: {
              openVersionsPanel: true
            }
          });
        } else {
          navigate(`/build/${rootBuildId}`, {
            state: {
              openVersionsPanel: true
            }
          });
        }
      }
    } catch (error: any) {
      setContributionActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to merge branch'
      );
    } finally {
      setContributionActionLoading('');
    }
  }

  function handleOpenReplaceMainConfirm() {
    if (!canReplaceMainWithCurrentBranch || contributionActionLoading) return;
    setContributionActionError('');
    setReplaceMainConfirmShown(true);
  }

  function handleCloseReplaceMainConfirm() {
    if (contributionActionLoading) return;
    setReplaceMainConfirmShown(false);
  }

  async function handleReplaceMainWithCurrentBranch() {
    const latestBuild = getLatestBuild();
    const rootBuildId = Number(latestBuild.contributionRootBuildId || 0);
    const contributionBuildId = Number(latestBuild.id || 0);
    if (
      !rootBuildId ||
      !contributionBuildId ||
      !canReplaceMainWithCurrentBranch ||
      contributionActionLoading
    ) {
      return;
    }
    setContributionActionLoading('replace-main');
    setContributionActionError('');
    try {
      const preparedFiles = await handleBeforeContributionAction('merge');
      if (!preparedFiles.ready) return;
      const result = await replaceMainWithBuildContribution({
        buildId: rootBuildId,
        contributionBuildId,
        projectFiles: preparedFiles.files
      });
      if (result?.success) {
        setReplaceMainConfirmShown(false);
        navigate(`/build/${rootBuildId}`, {
          state: {
            openVersionsPanel: true
          }
        });
      } else {
        setContributionActionError(result?.error || 'Failed to replace main');
      }
    } catch (error: any) {
      setContributionActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to replace main'
      );
    } finally {
      setContributionActionLoading('');
      setReplaceMainConfirmShown(false);
    }
  }

  function handleContributionBranchCreated(branch: Record<string, any>) {
    const nextVersion = normalizeBuildVersionSummary(branch);
    if (!nextVersion) return;
    if (
      getBuildContributionContributorUserId(nextVersion) === Number(userId || 0)
    ) {
      setCurrentUserContributionBranch(nextVersion);
    }
    setAvailableVersions((versions) => {
      const nextVersions = versions.some(
        (version) => Number(version.id || 0) === Number(nextVersion.id || 0)
      )
        ? versions.map((version) =>
            Number(version.id || 0) === Number(nextVersion.id || 0)
              ? { ...version, ...nextVersion }
              : version
          )
        : [...versions, nextVersion];
      return sortBuildVersionSummaries(nextVersions);
    });
  }

  function syncAvailableBranchSummary(nextBuild: Build) {
    if (!isBuildContributionFork(nextBuild)) return;
    setCurrentUserContributionBranch((currentBranch) => {
      if (
        !currentBranch ||
        Number(currentBranch.id || 0) !== Number(nextBuild.id || 0)
      ) {
        return currentBranch;
      }
      return {
        ...currentBranch,
        title: nextBuild.title || currentBranch.title,
        thumbnailUrl: nextBuild.thumbnailUrl || null,
        updatedAt: nextBuild.updatedAt || currentBranch.updatedAt,
        contributionStatus:
          nextBuild.contributionStatus || currentBranch.contributionStatus
      };
    });
    setAvailableVersions((versions) =>
      versions.map((version) =>
        Number(version.id || 0) === Number(nextBuild.id || 0)
          ? {
              ...version,
              title: nextBuild.title || version.title,
              thumbnailUrl: nextBuild.thumbnailUrl || null,
              updatedAt: nextBuild.updatedAt || version.updatedAt,
              contributionStatus:
                nextBuild.contributionStatus || version.contributionStatus
            }
          : version
      )
    );
  }

  function handleBuildContributionMerge({
    build: mergedBuild,
    projectFiles
  }: {
    build?: Record<string, any> | null;
    projectFiles?: Array<{ path: string; content?: string }> | null;
  }) {
    const latestBuild = getLatestBuild();
    const nextProjectFiles = Array.isArray(projectFiles)
      ? projectFiles
      : latestBuild.projectFiles || [];
    applyBuildUpdate({
      ...latestBuild,
      ...(mergedBuild || {}),
      projectFiles: nextProjectFiles,
      projectManifest: Array.isArray(projectFiles)
        ? {
            entryPath: resolveIndexEntryPathFromProjectFiles(
              nextProjectFiles,
              latestBuild.projectManifest?.entryPath || '/index.html'
            ),
            storageMode: 'project-files',
            fileCount: nextProjectFiles.length
          }
        : latestBuild.projectManifest || null
    });
  }

  async function handleBeforeContributionAction(action: ContributionAction) {
    return prepareProjectFilesForContributionAction({ action });
  }

  function handleEditableProjectFilesStateChange(
    state: BuildProjectFilesDraftState
  ) {
    onProjectFilesDraftStateChange(state);
    setCurrentBranchProjectFileDraftState((current) => {
      const next = {
        hasUnsavedChanges: Boolean(state.hasUnsavedChanges),
        saving: Boolean(state.saving)
      };
      return current.hasUnsavedChanges === next.hasUnsavedChanges &&
        current.saving === next.saving
        ? current
        : next;
    });
  }

  return {
    availableVersions,
    availableVersionsLoading,
    branchMergeTargetOptions,
    branchNameDraft,
    canMergeCurrentBranch,
    canReplaceMainWithCurrentBranch,
    canShowMergeCurrentBranch,
    canShowVersionStartActions,
    contributionActionError,
    contributionActionLoading,
    currentBranchMergeTarget,
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
    refreshCurrentBranchMergeability,
    refreshCurrentBranchMergeabilityForBuild,
    replaceMainConfirmShown,
    setBranchNameDraft,
    showContributionButton,
    showForkButton,
    syncAvailableBranchSummary
  };
}

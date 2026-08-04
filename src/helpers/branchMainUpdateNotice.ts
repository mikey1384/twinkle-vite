interface BranchMainUpdateNoticeStateInput {
  rootDrifted: boolean;
  fixChecking: boolean;
  hasLumineFix: boolean;
  lumineFixStatus: string;
  lumineFixBlocksBranchSync?: boolean;
  lumineFixTargetsCurrentBranch?: boolean;
  lumineFixWasApplied: boolean;
  branchHasConflictMarkers: boolean;
  updateError: string;
}

export function selectCurrentBranchCanonicalContribution({
  contributionBuildId,
  result
}: {
  contributionBuildId: number;
  result: any;
}) {
  const canonicalContribution =
    result?.contribution && typeof result.contribution === 'object'
      ? result.contribution
      : null;
  const canonicalContributionBuildId = Number(
    result?.contributionBuildId || canonicalContribution?.id || 0
  );
  return contributionBuildId > 0 &&
    canonicalContributionBuildId === contributionBuildId
    ? (canonicalContribution as Record<string, any>)
    : null;
}

export function shouldLoadCurrentBranchLumineFixState({
  contributionBuildId,
  projectResult
}: {
  contributionBuildId: number;
  projectResult: any;
}) {
  return Boolean(
    contributionBuildId > 0 &&
    !selectCurrentBranchCanonicalContribution({
      contributionBuildId,
      result: projectResult
    })
  );
}

export function resolveBuildProjectLumineFixScope({
  currentBuildId,
  contributionRootBuildId,
  isContributionFork,
  userId,
  isCurrentBuildOwner,
  isProjectOwner,
  canOpenContributionWorkspace
}: {
  currentBuildId: unknown;
  contributionRootBuildId: unknown;
  isContributionFork: boolean;
  userId: unknown;
  isCurrentBuildOwner: boolean;
  isProjectOwner: boolean;
  canOpenContributionWorkspace: boolean;
}) {
  const normalizedCurrentBuildId = Number(currentBuildId || 0);
  const rootBuildId = isContributionFork
    ? Number(contributionRootBuildId || 0)
    : normalizedCurrentBuildId;
  const openContributionBuildId = isContributionFork
    ? normalizedCurrentBuildId
    : 0;
  const canAccessProjectRepair = Boolean(
    Number(userId || 0) > 0 &&
    (isCurrentBuildOwner || isProjectOwner || canOpenContributionWorkspace)
  );

  return {
    active: Boolean(rootBuildId > 0 && canAccessProjectRepair),
    rootBuildId: rootBuildId > 0 ? rootBuildId : 0,
    openContributionBuildId:
      openContributionBuildId > 0 ? openContributionBuildId : 0
  };
}

export function shouldShowStandaloneBuildProjectLumineFix({
  hasLumineFix,
  isCurrentBuildOwner,
  isProjectOwner
}: {
  hasLumineFix: boolean;
  isCurrentBuildOwner: boolean;
  isProjectOwner: boolean;
}) {
  return hasLumineFix && !isCurrentBuildOwner && !isProjectOwner;
}

export function shouldShowStandaloneBranchLumineFixAction({
  ownerReview,
  contributionStatus,
  canAskLumineToResolveConflicts,
  hasNoticeLumineFixAction,
  activeConflictMarkerCount
}: {
  ownerReview: boolean;
  contributionStatus: string;
  canAskLumineToResolveConflicts: boolean;
  hasNoticeLumineFixAction: boolean;
  activeConflictMarkerCount: number;
}) {
  return Boolean(
    !ownerReview &&
    contributionStatus === 'draft' &&
    canAskLumineToResolveConflicts &&
    !hasNoticeLumineFixAction &&
    activeConflictMarkerCount > 0
  );
}

export function resolveBranchMainUpdateNoticeState({
  rootDrifted,
  fixChecking,
  hasLumineFix,
  lumineFixStatus,
  lumineFixBlocksBranchSync,
  lumineFixTargetsCurrentBranch = false,
  lumineFixWasApplied,
  branchHasConflictMarkers,
  updateError
}: BranchMainUpdateNoticeStateInput) {
  // Stale means the proposal's Main snapshot changed, not that canonical Main
  // still has conflicts. The update endpoint reloads and validates Main, so
  // keep that canonical revalidation path available.
  const lumineFixIsStale =
    hasLumineFix && String(lumineFixStatus || '').trim() === 'stale';
  const hasBlockingLumineFix =
    hasLumineFix &&
    (lumineFixTargetsCurrentBranch ||
      (typeof lumineFixBlocksBranchSync === 'boolean'
        ? lumineFixBlocksBranchSync
        : !lumineFixIsStale));
  const lumineFixNoLongerBlocks = hasLumineFix && !hasBlockingLumineFix;
  const showBranchLumineFix = branchHasConflictMarkers;
  const error = hasBlockingLumineFix
    ? ''
    : showBranchLumineFix
      ? ''
      : lumineFixWasApplied || lumineFixNoLongerBlocks
        ? ''
        : updateError;
  const canUpdate = Boolean(
    rootDrifted &&
    !fixChecking &&
    !hasBlockingLumineFix &&
    !branchHasConflictMarkers
  );

  return {
    shown: hasLumineFix || canUpdate || showBranchLumineFix || Boolean(error),
    canUpdate,
    error,
    showLumineFix: hasLumineFix,
    lumineFixBlocksBranchSync: hasBlockingLumineFix,
    lumineFixTargetsCurrentBranch:
      hasLumineFix && lumineFixTargetsCurrentBranch,
    showBranchLumineFix
  };
}

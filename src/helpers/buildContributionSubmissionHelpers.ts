interface BuildContributionSubmissionUpdateActionInput {
  isOwner: boolean;
  isPublic?: boolean | number | null;
  releaseStatus?: {
    hasUnpublishedChanges?: boolean;
  } | null;
  status?: string | null;
}

export function canUpdateAppFromBuildContributionSubmission({
  isOwner,
  isPublic,
  releaseStatus,
  status
}: BuildContributionSubmissionUpdateActionInput) {
  return Boolean(
    isOwner &&
      status === 'merged' &&
      Number(isPublic || 0) === 1 &&
      releaseStatus?.hasUnpublishedChanges
  );
}

export function resolveCanonicalBuildContributionSubmissionState({
  contribution,
  current,
  eventTimeMs
}: {
  contribution?: Record<string, any> | null;
  current?: Record<string, any> | null;
  eventTimeMs: number;
}) {
  if (!contribution || !eventTimeMs) return current || null;
  if (current && Number(current.__eventTime || 0) > eventTimeMs) {
    return current;
  }
  const contributionStatus = String(contribution?.contributionStatus || '');
  const status = contribution
    ? contributionStatus === 'merged'
      ? 'merged'
      : contributionStatus === 'merging'
        ? 'merging'
        : 'open'
    : null;
  return {
    ...(current || {}),
    ...(status ? { status } : {}),
    __eventTime: eventTimeMs
  };
}

export function resolveCanonicalBuildContributionReleaseState({
  build,
  current,
  eventTimeMs
}: {
  build?: Record<string, any> | null;
  current?: Record<string, any> | null;
  eventTimeMs: number;
}) {
  if (!build || !eventTimeMs) return current || null;
  if (current && Number(current.__eventTime || 0) > eventTimeMs) {
    return current;
  }
  return {
    isPublic: Number(build.isPublic || 0) === 1,
    releaseStatus: build.releaseStatus || null,
    __eventTime: eventTimeMs
  };
}

export function applyCanonicalBuildContributionSubmissionUpdate({
  state,
  branchBuildId,
  rootBuildId,
  build,
  contribution,
  eventTimeMs
}: {
  state: Record<string, any>;
  branchBuildId: number;
  rootBuildId?: number;
  build?: Record<string, any> | null;
  contribution?: Record<string, any> | null;
  eventTimeMs: number;
}) {
  const resolvedBranchBuildId = Number(branchBuildId || contribution?.id || 0);
  const resolvedRootBuildId = Number(rootBuildId || build?.id || 0);
  if (
    !eventTimeMs ||
    ((!resolvedBranchBuildId || !contribution) &&
      (!resolvedRootBuildId || !build))
  ) {
    return state;
  }
  let nextState = state;

  if (resolvedBranchBuildId && contribution) {
    const current =
      state.buildContributionSubmissionByBranchId?.[resolvedBranchBuildId] ||
      null;
    const next = resolveCanonicalBuildContributionSubmissionState({
      contribution,
      current,
      eventTimeMs
    });
    if (next !== current) {
      nextState = {
        ...nextState,
        buildContributionSubmissionByBranchId: {
          ...(nextState.buildContributionSubmissionByBranchId || {}),
          [resolvedBranchBuildId]: next
        }
      };
    }
  }

  if (resolvedRootBuildId && build) {
    const current =
      state.buildContributionReleaseByRootBuildId?.[resolvedRootBuildId] ||
      null;
    const next = resolveCanonicalBuildContributionReleaseState({
      build,
      current,
      eventTimeMs
    });
    if (next !== current) {
      nextState = {
        ...nextState,
        buildContributionReleaseByRootBuildId: {
          ...(nextState.buildContributionReleaseByRootBuildId || {}),
          [resolvedRootBuildId]: next
        }
      };
    }
  }

  return nextState;
}

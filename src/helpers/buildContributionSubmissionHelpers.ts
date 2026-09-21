import { isCachedCardStateFresher } from './buildCardState';

interface BuildContributionSubmissionUpdateActionInput {
  isOwner: boolean;
  isPublic?: boolean | number | null;
  releaseStatus?: {
    hasUnpublishedChanges?: boolean;
  } | null;
  status?: string | null;
}

export interface BuildContributionLumineFixSocketUpdate {
  branchBuildId: number;
  rootBuildId: number;
  build?: Record<string, any> | null;
  contribution?: Record<string, any> | null;
  lumineFix: Record<string, any> | null;
  eventTimeMs: number;
}

export function resolveBuildContributionLumineFixSocketUpdate(
  payload: unknown
): BuildContributionLumineFixSocketUpdate | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const update = payload as Record<string, any>;
  const branchBuildId = Number(update.branchBuildId || 0);
  const rootBuildId = Number(update.rootBuildId || 0);
  const eventTimeMs = Number(update.eventTimeMs || 0);
  const hasLumineFix = Object.prototype.hasOwnProperty.call(
    update,
    'lumineFix'
  );
  const hasBuild = Object.prototype.hasOwnProperty.call(update, 'build');
  const hasContribution = Object.prototype.hasOwnProperty.call(
    update,
    'contribution'
  );
  const lumineFix = update.lumineFix;
  const build = update.build;
  const contribution = update.contribution;
  if (
    !Number.isFinite(branchBuildId) ||
    branchBuildId <= 0 ||
    !Number.isFinite(rootBuildId) ||
    rootBuildId <= 0 ||
    !Number.isFinite(eventTimeMs) ||
    eventTimeMs <= 0 ||
    !hasLumineFix ||
    (lumineFix !== null &&
      (typeof lumineFix !== 'object' || Array.isArray(lumineFix))) ||
    (hasBuild &&
      build !== null &&
      (typeof build !== 'object' || Array.isArray(build))) ||
    (hasContribution &&
      contribution !== null &&
      (typeof contribution !== 'object' || Array.isArray(contribution)))
  ) {
    return null;
  }
  return {
    branchBuildId: Math.floor(branchBuildId),
    rootBuildId: Math.floor(rootBuildId),
    ...(hasBuild ? { build } : {}),
    ...(hasContribution ? { contribution } : {}),
    lumineFix,
    eventTimeMs: Math.floor(eventTimeMs)
  };
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

export function resolveBuildContributionSubmissionPayload({
  submission,
  cachedSubmissionState,
  cachedReleaseState
}: {
  submission?: Record<string, any> | null;
  cachedSubmissionState?: Record<string, any> | null;
  cachedReleaseState?: Record<string, any> | null;
}) {
  const useCachedBranch = isCachedCardStateFresher(
    cachedSubmissionState,
    submission
  );
  const hasMergeBaseline =
    Number.isSafeInteger(submission?.submittedAfterMergeId) &&
    Number(submission?.submittedAfterMergeId) >= 0;
  const cachedCompletionPredatesSubmission = Boolean(
    hasMergeBaseline &&
      cachedSubmissionState?.status === 'merged' &&
      !cachedSubmissionState?.lumineFix &&
      cachedSubmissionState?.lastCompletedMerge &&
      Number(cachedSubmissionState.lastCompletedMerge.id) <=
        Number(submission?.submittedAfterMergeId)
  );
  const branchPayload = useCachedBranch && !cachedCompletionPredatesSubmission
    ? { ...(submission || {}), ...(cachedSubmissionState || {}) }
    : { ...(submission || {}) };
  const completedMerge = branchPayload.lastCompletedMerge;
  const mergedAfterSubmission = Boolean(
    completedMerge &&
      (hasMergeBaseline
        ? Number(completedMerge.id) > Number(submission?.submittedAfterMergeId)
        : Number(submission?.createdAt) > 0 &&
          Number(completedMerge.createdAt) > Number(submission?.createdAt))
  );
  // A canonical completed merge settles this message permanently, even when
  // a newer branch-wide event reopens the branch or starts another repair.
  // A later submission has its own merge baseline and remains actionable.
  const settledPayload =
    branchPayload.status !== 'gone' &&
    (Number(submission?.submissionMergedAt) > 0 || mergedAfterSubmission)
      ? {
          ...branchPayload,
          status: 'merged',
          lumineFix: null,
          submissionMergedAt:
            Number(submission?.submissionMergedAt) || completedMerge.createdAt
        }
      : branchPayload;
  return isCachedCardStateFresher(cachedReleaseState, submission)
    ? { ...settledPayload, ...(cachedReleaseState || {}) }
    : settledPayload;
}

export function resolveCanonicalBuildContributionSubmissionState({
  contribution,
  current,
  lumineFix,
  eventTimeMs
}: {
  contribution?: Record<string, any> | null;
  current?: Record<string, any> | null;
  lumineFix?: Record<string, any> | null;
  eventTimeMs: number;
}) {
  if (!eventTimeMs) return current || null;
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
  const lastCompletedMerge = contribution?.lastCompletedMerge;
  const advancesCompletedMerge =
    Number.isSafeInteger(lastCompletedMerge?.id) &&
    lastCompletedMerge.id > Number(current?.lastCompletedMerge?.id || 0) &&
    Number.isSafeInteger(lastCompletedMerge.createdAt) &&
    lastCompletedMerge.createdAt > 0;
  return {
    ...(current || {}),
    ...(status ? { status } : {}),
    ...(lumineFix === undefined ? {} : { lumineFix }),
    ...(advancesCompletedMerge ? { lastCompletedMerge } : {}),
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
  lumineFix,
  eventTimeMs
}: {
  state: Record<string, any>;
  branchBuildId: number;
  rootBuildId?: number;
  build?: Record<string, any> | null;
  contribution?: Record<string, any> | null;
  lumineFix?: Record<string, any> | null;
  eventTimeMs: number;
}) {
  const resolvedBranchBuildId = Number(branchBuildId || contribution?.id || 0);
  const resolvedRootBuildId = Number(rootBuildId || build?.id || 0);
  if (
    !eventTimeMs ||
    ((!resolvedBranchBuildId || (!contribution && lumineFix === undefined)) &&
      (!resolvedRootBuildId || !build))
  ) {
    return state;
  }
  let nextState = state;

  if (resolvedBranchBuildId && (contribution || lumineFix !== undefined)) {
    const current =
      state.buildContributionSubmissionByBranchId?.[resolvedBranchBuildId] ||
      null;
    const next = resolveCanonicalBuildContributionSubmissionState({
      contribution,
      current,
      lumineFix,
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

export function upsertBuildContributionSubmissionState({
  state,
  branchBuildId,
  rootBuildId,
  build,
  contribution,
  lumineFix,
  eventTimeMs
}: {
  state: Record<string, any>;
  branchBuildId: number;
  rootBuildId?: number;
  build?: Record<string, any> | null;
  contribution?: Record<string, any> | null;
  lumineFix?: Record<string, any> | null;
  eventTimeMs?: number;
}) {
  const normalizedEventTimeMs = Number(eventTimeMs || 0);
  if (!normalizedEventTimeMs) return state;
  const nextEventTimeMs =
    normalizedEventTimeMs > 1000000000000
      ? normalizedEventTimeMs
      : normalizedEventTimeMs * 1000;
  return applyCanonicalBuildContributionSubmissionUpdate({
    state,
    branchBuildId,
    rootBuildId,
    build,
    contribution,
    lumineFix,
    eventTimeMs: nextEventTimeMs
  });
}

interface ProjectLimitRequestVersion {
  requestId?: number | null;
  revision?: number | null;
  eventTimeMs?: number | null;
}

interface ProjectLimitApprovalVersion {
  canonicalBuildId?: number | null;
  latestRequest?: ProjectLimitRequestVersion | null;
}

interface ProjectLimitPolicyVersion {
  limits?: unknown;
  usage?: unknown;
  projectLimitApproval?: ProjectLimitApprovalVersion | null;
}

export function getBuildProjectLimitRequestOpenPath({
  buildId,
  myId,
  requestedByUserId,
  reviewerUserId,
  status
}: {
  buildId: number;
  myId: number;
  requestedByUserId: number;
  reviewerUserId: number;
  status: 'pending' | 'approved' | 'rejected';
}) {
  const normalizedBuildId = Math.floor(Number(buildId || 0));
  if (normalizedBuildId <= 0) return null;
  const isRequester =
    Number(myId || 0) > 0 && Number(myId) === Number(requestedByUserId);
  const isActiveReviewer =
    status === 'pending' &&
    Number(reviewerUserId || 0) > 0 &&
    Number(myId) === Number(reviewerUserId);
  if (isRequester || isActiveReviewer) return `/build/${normalizedBuildId}`;
  return null;
}

export function compareBuildProjectLimitRequestVersions(
  incoming?: ProjectLimitRequestVersion | null,
  current?: ProjectLimitRequestVersion | null
) {
  const incomingRequestId = Number(incoming?.requestId || 0);
  const currentRequestId = Number(current?.requestId || 0);
  if (incomingRequestId !== currentRequestId) {
    return incomingRequestId - currentRequestId;
  }

  const incomingRevision = Number(incoming?.revision || 0);
  const currentRevision = Number(current?.revision || 0);
  if (incomingRevision !== currentRevision) {
    return incomingRevision - currentRevision;
  }

  return Number(incoming?.eventTimeMs || 0) - Number(current?.eventTimeMs || 0);
}

export function shouldApplyBuildProjectLimitApproval(
  incoming?: ProjectLimitApprovalVersion | null,
  current?: ProjectLimitApprovalVersion | null
) {
  if (!incoming && !current) return true;
  if (!incoming) return false;
  if (!current) return true;
  const incomingBuildId = Number(incoming.canonicalBuildId || 0);
  const currentBuildId = Number(current.canonicalBuildId || 0);
  if (
    incomingBuildId > 0 &&
    currentBuildId > 0 &&
    incomingBuildId !== currentBuildId
  ) {
    return true;
  }
  return (
    compareBuildProjectLimitRequestVersions(
      incoming.latestRequest,
      current.latestRequest
    ) >= 0
  );
}

export function mergeBuildPolicyPreservingNewerProjectLimits<
  TPolicy extends ProjectLimitPolicyVersion
>(incoming: TPolicy, current?: TPolicy | null): TPolicy {
  if (
    !current ||
    shouldApplyBuildProjectLimitApproval(
      incoming.projectLimitApproval,
      current.projectLimitApproval
    )
  ) {
    return incoming;
  }

  return {
    ...incoming,
    limits: current.limits,
    usage: current.usage,
    projectLimitApproval: current.projectLimitApproval
  } as TPolicy;
}

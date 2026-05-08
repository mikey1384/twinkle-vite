export function getBuildWorkspacePath(build: {
  id?: number | string | null;
  contributionRootBuildId?: number | string | null;
  contributionBranchNumber?: number | string | null;
}) {
  const rootBuildId = Number(build?.contributionRootBuildId || 0);
  const branchNumber = Number(build?.contributionBranchNumber || 0);
  if (rootBuildId > 0 && branchNumber > 0) {
    return `/build/${rootBuildId}/${branchNumber}`;
  }
  return `/build/${Number(build?.id || 0)}`;
}

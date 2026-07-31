export type BuildRuntimeSource = 'published' | 'workspace';

interface BuildWorkspaceViewAppTargetOptions {
  isBuildOwner: boolean;
  isContributionBranch: boolean;
  isPublic: boolean;
}

export const BUILD_RUNTIME_SOURCE_QUERY_PARAM = 'runtimeSource';

export function getBuildRuntimeSourceFromSearch(
  search: string
): BuildRuntimeSource {
  return new URLSearchParams(search).get(BUILD_RUNTIME_SOURCE_QUERY_PARAM) ===
    'workspace'
    ? 'workspace'
    : 'published';
}

export function getBuildRuntimePath(
  buildId: number,
  source: BuildRuntimeSource = 'published'
) {
  const basePath = `/app/${buildId}`;
  if (source === 'published') return basePath;
  const params = new URLSearchParams();
  params.set(BUILD_RUNTIME_SOURCE_QUERY_PARAM, source);
  return `${basePath}?${params.toString()}`;
}

export function resolveBuildWorkspaceViewAppTarget({
  isBuildOwner,
  isContributionBranch,
  isPublic
}: BuildWorkspaceViewAppTargetOptions): {
  source: BuildRuntimeSource;
  visible: boolean;
} {
  return {
    // A branch workspace is only returned after the server admits the viewer.
    // That same access boundary authorizes its saved-workspace runtime.
    visible: isContributionBranch || isPublic || isBuildOwner,
    source: isContributionBranch ? 'workspace' : 'published'
  };
}

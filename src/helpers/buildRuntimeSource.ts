export type BuildRuntimeSource = 'published' | 'workspace';

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

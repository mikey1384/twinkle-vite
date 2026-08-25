import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';

function getCanonicalPinnedBuildsPayload(payload: unknown) {
  const canonicalPayload = payload as {
    buildIds?: unknown;
    builds?: unknown;
  } | null;
  if (
    !Array.isArray(canonicalPayload?.buildIds) ||
    canonicalPayload.buildIds.some(
      (buildId) => !Number.isInteger(buildId) || buildId <= 0
    ) ||
    !Array.isArray(canonicalPayload?.builds)
  ) {
    throw new Error('Pinned builds response did not include canonical data');
  }
  return {
    buildIds: canonicalPayload.buildIds as number[],
    builds: canonicalPayload.builds as BuildProjectListItemData[]
  };
}

export function getCanonicalPinnedBuildsWritePayload(payload: unknown) {
  return getCanonicalPinnedBuildsPayload(payload);
}

export function getCanonicalPinnedBuildsLoadPayload(payload: unknown) {
  const canonicalPayload = payload as { isTopBuilds?: unknown } | null;
  const pinnedBuilds = getCanonicalPinnedBuildsPayload(payload);
  if (typeof canonicalPayload?.isTopBuilds !== 'boolean') {
    throw new Error(
      'Pinned builds response did not include canonical display data'
    );
  }
  return {
    ...pinnedBuilds,
    isTopBuilds: canonicalPayload.isTopBuilds
  };
}

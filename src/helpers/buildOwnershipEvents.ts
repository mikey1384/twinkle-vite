export const BUILD_OWNERSHIP_CHANGED = 'twinkle:build-ownership-changed';

export function notifyBuildOwnershipChanged(buildIds: number[]) {
  for (const buildId of new Set(buildIds)) {
    window.dispatchEvent(
      new CustomEvent(BUILD_OWNERSHIP_CHANGED, { detail: { buildId } })
    );
  }
}

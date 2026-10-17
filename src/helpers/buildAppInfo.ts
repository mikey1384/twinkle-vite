// Which release the frame runs: the published artifact on the app page, the
// editable workspace in the editor's preview.
export function getAppInfoRelease({
  runtimeOnly,
  currentArtifactVersionId
}: {
  runtimeOnly: boolean;
  currentArtifactVersionId?: unknown;
}) {
  const artifactVersionId = Number(currentArtifactVersionId);
  return runtimeOnly && Number.isSafeInteger(artifactVersionId) && artifactVersionId > 0
    ? { source: 'published' as const, artifactVersionId }
    : { source: 'workspace' as const, artifactVersionId: null };
}

// Which release a Build frame runs. 'published' only when the frame is the
// app page's own run (no thumbnail/view_preview capture override) of exactly
// the build's published release; otherwise 'workspace' with no version: the
// editor preview, a ?runtimeSource=workspace run and a private build (no
// published release) all load workspace code.
export function getAppInfoRelease({
  runtimeOnly,
  previewSrcOverride,
  currentArtifactVersionId,
  publishedArtifactVersionId
}: {
  runtimeOnly: boolean;
  previewSrcOverride?: string | null;
  currentArtifactVersionId?: unknown;
  publishedArtifactVersionId?: unknown;
}) {
  const current = Number(currentArtifactVersionId);
  const published = Number(publishedArtifactVersionId);
  const runsPublished =
    runtimeOnly &&
    !String(previewSrcOverride || '').trim() &&
    Number.isSafeInteger(published) &&
    published > 0 &&
    current === published;
  return runsPublished
    ? { source: 'published' as const, artifactVersionId: published }
    : { source: 'workspace' as const, artifactVersionId: null };
}

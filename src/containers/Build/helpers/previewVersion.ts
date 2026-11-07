import { createStringRevision } from '~/helpers/stringRevision';
import {
  buildEditableProjectFiles,
  serializeEditableProjectFiles
} from '../PreviewPanel/helpers/projectFiles';

// Which project files a preview frame is showing. The preview stamps every
// runtime observation with `${versionKey}:${filesRevision}` (codeSignature),
// so a Lumine run can tell whether an observation came from the exact files
// it starts from, or from older ones.

export interface BuildPreviewVersionSource {
  id: number;
  currentArtifactVersionId?: number | null;
}

export interface BuildPreviewFilesSource {
  code?: string | null;
  projectFiles?: Array<{ path: string; content?: string }> | null;
}

// The same revision PreviewPanel computes from the saved files it previews.
export function getBuildPreviewFilesRevision(build: BuildPreviewFilesSource) {
  return createStringRevision(
    serializeEditableProjectFiles(
      buildEditableProjectFiles({
        code: build.code ?? null,
        projectFiles: Array.isArray(build.projectFiles)
          ? build.projectFiles
          : []
      })
    )
  );
}

// A build with no saved version yet is keyed by its files alone, so a title
// or other metadata update does not change the stamp.
export function getBuildPreviewVersionKey(build: BuildPreviewVersionSource) {
  return Number(build.currentArtifactVersionId) > 0
    ? `artifact:${build.currentArtifactVersionId}`
    : `current:${build.id}`;
}

export function getBuildPreviewCodeSignature(
  build: BuildPreviewVersionSource,
  previewProjectFilesRevision: string
) {
  return `${getBuildPreviewVersionKey(build)}:${previewProjectFilesRevision}`;
}

function getCodeSignatureFilesRevision(codeSignature?: string | null) {
  const signature = String(codeSignature || '');
  const separatorIndex = signature.lastIndexOf(':');
  return separatorIndex >= 0 ? signature.slice(separatorIndex + 1) : '';
}

// A run may send the preview's runtime summary only when the preview showed
// this build's exact files the run starts from. An older version's errors are
// not the current app's errors. The files decide, not the version id: saving
// the same files the preview showed makes a new version but the same app.
export function isRuntimeObservationForBuildFiles(
  observation: {
    buildId?: number | null;
    codeSignature?: string | null;
  } | null,
  build: (BuildPreviewVersionSource & BuildPreviewFilesSource) | null
) {
  if (!observation || !build) return false;
  if (Number(observation.buildId) !== Number(build.id)) return false;
  const observedRevision = getCodeSignatureFilesRevision(
    observation.codeSignature
  );
  return (
    Boolean(observedRevision) &&
    observedRevision === getBuildPreviewFilesRevision(build)
  );
}

// The first observation that matches the run's files: the latest one, or the
// one taken before the pre-run save (the preview may reload during the save).
export function pickRuntimeObservationForBuildFiles<
  T extends { buildId?: number | null; codeSignature?: string | null }
>(
  candidates: Array<T | null | undefined>,
  build: (BuildPreviewVersionSource & BuildPreviewFilesSource) | null
): T | null {
  for (const candidate of candidates) {
    if (candidate && isRuntimeObservationForBuildFiles(candidate, build)) {
      return candidate;
    }
  }
  return null;
}

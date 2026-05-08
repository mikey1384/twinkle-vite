import type { BuildProjectFile } from './types';

const CONTRIBUTION_CONFLICT_MARKER_START = '<<<<<<< Current Build';
const CONTRIBUTION_CONFLICT_MARKER_SEPARATOR = '=======';
const CONTRIBUTION_CONFLICT_MARKER_END = '>>>>>>> Contribution';

export const UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE =
  'Main was merged into this branch with conflict markers. Ask Lumine to resolve them before merging.';
export const MERGE_CONFLICT_MARKERS_MESSAGE =
  'Conflict markers were written into the project files. Resolve them with Lumine or edit the files, then complete the merge.';

function hasContributionConflictMarkers(content: string) {
  const text = String(content || '');
  return (
    text.includes(CONTRIBUTION_CONFLICT_MARKER_START) &&
    text.includes(CONTRIBUTION_CONFLICT_MARKER_SEPARATOR) &&
    text.includes(CONTRIBUTION_CONFLICT_MARKER_END)
  );
}

export function getContributionConflictMarkerPaths(
  files?: BuildProjectFile[] | null
) {
  return (Array.isArray(files) ? files : [])
    .filter((file) => hasContributionConflictMarkers(file.content || ''))
    .map((file) => String(file.path || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export function stringArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function canClearConflictMarkerActionError(message: string) {
  const normalized = String(message || '').trim();
  return (
    normalized === UPDATE_FROM_MAIN_CONFLICT_MARKERS_MESSAGE ||
    normalized === MERGE_CONFLICT_MARKERS_MESSAGE ||
    /^Resolve conflict markers in .+ first\.$/.test(normalized) ||
    /^Resolve all conflict markers before (?:updating from main|completing this merge)\.$/.test(
      normalized
    )
  );
}

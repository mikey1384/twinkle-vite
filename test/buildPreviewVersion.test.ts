import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getBuildPreviewCodeSignature,
  getBuildPreviewFilesRevision,
  isRuntimeObservationForBuildFiles,
  pickRuntimeObservationForBuildFiles
} from '../src/containers/Build/helpers/previewVersion';

// Synthetic fixtures only. A queued request can start right after the run
// before it saved new files, while the preview is still reporting the old
// ones. Those old errors must not reach Lumine as current.

const filesA = [{ path: '/index.html', content: '<p>A</p>' }];
const filesB = [{ path: '/index.html', content: '<p>B</p>' }];

function observe(
  build: { id: number; currentArtifactVersionId?: number | null },
  projectFiles: Array<{ path: string; content?: string }>
) {
  return {
    buildId: build.id,
    codeSignature: getBuildPreviewCodeSignature(
      build,
      getBuildPreviewFilesRevision({ code: '', projectFiles })
    )
  };
}

test('a run sends the preview summary only for the files it starts from', () => {
  const build = {
    id: 7,
    currentArtifactVersionId: 42,
    code: '',
    projectFiles: filesA
  };
  assert.equal(
    isRuntimeObservationForBuildFiles(observe(build, filesA), build),
    true
  );

  // The previous run saved new files; the preview still shows the old ones.
  const older = observe({ ...build, currentArtifactVersionId: 41 }, filesB);
  assert.equal(isRuntimeObservationForBuildFiles(older, build), false);

  // Another build, a missing stamp, or no observation: nothing is sent.
  assert.equal(
    isRuntimeObservationForBuildFiles(
      { ...observe(build, filesA), buildId: 8 },
      build
    ),
    false
  );
  assert.equal(
    isRuntimeObservationForBuildFiles(
      { buildId: 7, codeSignature: null },
      build
    ),
    false
  );
  assert.equal(isRuntimeObservationForBuildFiles(null, build), false);
});

test('saving the exact files the preview showed keeps its summary', () => {
  // Unsaved edits are saved before the run and make version 43, but the
  // preview already showed those files (stamped under version 42).
  const beforeSave = observe({ id: 7, currentArtifactVersionId: 42 }, filesB);
  const savedBuild = {
    id: 7,
    currentArtifactVersionId: 43,
    code: '',
    projectFiles: filesB
  };
  assert.equal(isRuntimeObservationForBuildFiles(beforeSave, savedBuild), true);
  // The latest observation is checked first, then the one taken before the save.
  const staleLatest = observe({ id: 7, currentArtifactVersionId: 42 }, filesA);
  assert.equal(
    pickRuntimeObservationForBuildFiles([staleLatest, beforeSave], savedBuild),
    beforeSave
  );
  // The saved files differ from what the preview showed: dropped.
  assert.equal(
    pickRuntimeObservationForBuildFiles([staleLatest], savedBuild),
    null
  );
});

test('a build with no saved version keeps its stamp across metadata updates', () => {
  const unsaved = {
    id: 9,
    currentArtifactVersionId: null,
    code: '',
    projectFiles: filesA
  };
  const observation = observe(unsaved, filesA);
  assert.doesNotMatch(String(observation.codeSignature), /updatedAt|:\d{10}:/);
  // A title or other metadata change does not touch the files.
  assert.equal(
    isRuntimeObservationForBuildFiles(observation, {
      ...unsaved,
      title: 'Renamed'
    } as any),
    true
  );
  assert.equal(
    isRuntimeObservationForBuildFiles(observation, {
      ...unsaved,
      projectFiles: filesB
    }),
    false
  );
});

test('the preview stamps observations and the run start reads them through the same helpers', () => {
  const read = (path: string) =>
    readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const previewPanel = read('src/containers/Build/PreviewPanel/index.tsx');
  assert.match(
    previewPanel,
    /const previewCodeSignature = getBuildPreviewCodeSignature\(/
  );
  // The preview's revision is computed from the saved files the same way.
  assert.match(
    previewPanel,
    /buildEditableProjectFiles\(\{ code, projectFiles \}\)[\s\S]*?serializeEditableProjectFiles\(persistedProjectFiles\)[\s\S]*?createPreviewRevision\(persistedProjectFilesSignature\)/
  );
  const runStart = read(
    'src/containers/Build/Editor/hooks/useRunStartActions.ts'
  );
  assert.ok(
    runStart.indexOf('runtimeFollowUp.captureRuntimeObservation()') <
      runStart.indexOf('await ensureProjectFilesPersistedBeforeRun('),
    'the observation is captured before the pre-run save'
  );
  assert.match(
    runStart,
    /getRuntimeObservationSummaryForBuild\(\s*activeBuild,\s*runtimeObservationBeforeSave\s*\)/
  );
});

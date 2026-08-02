import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applyBuildProjectFilesSocketUpdate,
  resolveBuildProjectFilesSocketUpdate
} from '../src/helpers/buildProjectFilesSocketUpdate';

const editorRouteSource = readFileSync(
  new URL('../src/containers/Build/EditorRoute.tsx', import.meta.url),
  'utf8'
);
const previewPanelSource = readFileSync(
  new URL('../src/containers/Build/PreviewPanel/index.tsx', import.meta.url),
  'utf8'
);

function canonicalUpdate(eventTimeMs = 2_000) {
  return resolveBuildProjectFilesSocketUpdate({
    buildId: 12,
    build: {
      id: 12,
      currentArtifactVersionId: 91,
      releaseStatus: { hasUnpublishedChanges: true },
      updatedAt: 1_700
    },
    projectFiles: [
      { path: '/index.html', content: '<main>resolved</main>' },
      { path: 'game.js', content: 'start();' }
    ],
    filesHash: 'canonical-files-hash',
    source: 'contribution_lumine_fix',
    eventTimeMs
  });
}

test('an owner workspace adopts canonical Lumine files and hash', () => {
  const update = canonicalUpdate();
  assert.ok(update);
  const currentBuild = {
    id: 12,
    userId: 34,
    title: 'Game',
    code: '<main>conflicted</main>',
    projectFiles: [
      { path: '/index.html', content: '<main>conflicted</main>' }
    ],
    projectFilesHash: 'old-files-hash',
    projectManifest: {
      entryPath: '/index.html',
      storageMode: 'project-files',
      fileCount: 1
    }
  };

  const applied = applyBuildProjectFilesSocketUpdate({
    currentBuild,
    currentEventTimeMs: 1_000,
    update: update!
  });

  assert.equal(applied.eventTimeMs, 2_000);
  assert.equal(applied.build.code, '<main>resolved</main>');
  assert.equal(applied.build.projectFilesHash, 'canonical-files-hash');
  assert.equal(applied.build.currentArtifactVersionId, 91);
  assert.equal(applied.build.title, 'Game');
  assert.deepEqual(applied.build.projectFiles, [
    { path: '/index.html', content: '<main>resolved</main>' },
    { path: '/game.js', content: 'start();' }
  ]);
  assert.deepEqual(applied.build.projectManifest, {
    entryPath: '/index.html',
    storageMode: 'project-files',
    fileCount: 2
  });
});

test('stale and wrong-project workspace events cannot replace newer files', () => {
  const currentBuild = {
    id: 12,
    code: '<main>newer</main>',
    projectFilesHash: 'newer-files-hash',
    currentArtifactVersionId: 92,
    updatedAt: 1_800
  };
  const staleUpdate = canonicalUpdate(2_000);
  assert.ok(staleUpdate);
  const staleResult = applyBuildProjectFilesSocketUpdate({
    currentBuild,
    currentEventTimeMs: 3_000,
    update: staleUpdate!
  });
  assert.equal(staleResult.build, currentBuild);
  assert.equal(staleResult.eventTimeMs, 3_000);

  const delayedOlderSnapshot = applyBuildProjectFilesSocketUpdate({
    currentBuild,
    currentEventTimeMs: 1_000,
    update: { ...staleUpdate!, eventTimeMs: 4_000 }
  });
  assert.equal(delayedOlderSnapshot.build, currentBuild);
  assert.equal(delayedOlderSnapshot.eventTimeMs, 1_000);

  assert.equal(
    resolveBuildProjectFilesSocketUpdate({
      ...staleUpdate,
      build: { id: 13 }
    }),
    null
  );
});

test('workspace updates reject incomplete source snapshots', () => {
  const valid = canonicalUpdate();
  assert.ok(valid);
  for (const payload of [
    { ...valid, filesHash: '' },
    { ...valid, source: 'unknown' },
    { ...valid, projectFiles: [{ path: '/index.html' }] },
    {
      ...valid,
      projectFiles: [{ path: '/game.js', content: 'start();' }]
    }
  ]) {
    assert.equal(resolveBuildProjectFilesSocketUpdate(payload), null);
  }
});

test('canonical workspace updates do not mutate a separate unsaved draft', () => {
  const unsavedDraft = Object.freeze([
    Object.freeze({ path: '/index.html', content: '<main>local edit</main>' })
  ]);
  const update = canonicalUpdate();
  assert.ok(update);

  applyBuildProjectFilesSocketUpdate({
    currentBuild: {
      id: 12,
      code: '<main>conflicted</main>',
      projectFiles: [
        { path: '/index.html', content: '<main>conflicted</main>' }
      ],
      projectFilesHash: 'old-files-hash'
    },
    currentEventTimeMs: 1_000,
    update: update!
  });

  assert.deepEqual(unsavedDraft, [
    { path: '/index.html', content: '<main>local edit</main>' }
  ]);
});

test('the editor wires owner events and recovery without replacing dirty buffers', () => {
  assert.match(
    editorRouteSource,
    /socket\.on\('build_project_files_updated', applyCanonicalProjectFiles\)/
  );
  assert.match(
    editorRouteSource,
    /loadBuild\(currentBuildId, \{ fromWriter: true \}\)/
  );
  assert.match(
    previewPanelSource,
    /if \(hasUnsavedProjectFileChanges\) return;[\s\S]*?setEditableProjectFiles\(persistedProjectFiles\)/
  );
});

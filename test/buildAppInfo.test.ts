import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppInfoRelease } from '../src/helpers/buildAppInfo';

const published = { source: 'published', artifactVersionId: 15081 };
const workspace = { source: 'workspace', artifactVersionId: null };

test('only the app page running exactly the published release reports it', () => {
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: true, currentArtifactVersionId: 15081, publishedArtifactVersionId: 15081 }),
    published
  );
});

test('workspace, private, editor and capture runs never claim the published release', () => {
  // ?runtimeSource=workspace on the app page: current is the newer workspace version
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: true, currentArtifactVersionId: 15120, publishedArtifactVersionId: 15081 }),
    workspace
  );
  // private build: no published release in the payload
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: true, currentArtifactVersionId: 15120, publishedArtifactVersionId: null }),
    workspace
  );
  // editor preview
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: false, currentArtifactVersionId: 15081, publishedArtifactVersionId: 15081 }),
    workspace
  );
  // thumbnail / Lumine view_preview capture
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: true, previewSrcOverride: '/build/2676/preview?x=1', currentArtifactVersionId: 15081, publishedArtifactVersionId: 15081 }),
    workspace
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppInfoRelease } from '../src/helpers/buildAppInfo';

test('Twinkle.app.getInfo names the published release the frame runs', () => {
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: true, currentArtifactVersionId: '15081' }),
    { source: 'published', artifactVersionId: 15081 }
  );
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: false, currentArtifactVersionId: 15081 }),
    { source: 'workspace', artifactVersionId: null }
  );
  assert.deepEqual(
    getAppInfoRelease({ runtimeOnly: true, currentArtifactVersionId: null }),
    { source: 'workspace', artifactVersionId: null }
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BUILD_PROJECT_ASSET_UPLOAD_ACCEPT,
  createAgentAssetFile,
  isSupportedBuildAssetUploadFile
} from '../src/containers/Build/helpers/agentWorkspaceAssets';

test('Build project assets accept .mid and .midi even without browser MIME inference', () => {
  for (const extension of ['.mid', '.midi']) {
    const file = new File(
      [new Uint8Array([0x4d, 0x54, 0x68, 0x64])],
      `theme${extension}`
    );
    assert.equal(isSupportedBuildAssetUploadFile(file), true);
    assert.match(
      BUILD_PROJECT_ASSET_UPLOAD_ACCEPT,
      new RegExp(`\\${extension}(?:,|$)`)
    );
  }
});

test('generated MIDI assets infer a stable .mid filename', async () => {
  const file = await createAgentAssetFile({
    mimeType: 'audio/midi',
    bytes: new Uint8Array([0x4d, 0x54, 0x68, 0x64])
  });
  assert.match(file.name, /^asset-\d+\.mid$/);
  assert.equal(file.type, 'audio/midi');
});

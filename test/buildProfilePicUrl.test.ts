import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toBuildProfilePicUrl } from '../src/helpers/buildProfilePicUrl';

const ASSET_ORIGIN = 'https://assets.example';

test('Build profile pic URLs normalize to HTTPS for iframe consumers', () => {
  assert.equal(
    toBuildProfilePicUrl({
      src: '/profile/5/photo.jpg',
      assetOrigin: ASSET_ORIGIN
    }),
    `${ASSET_ORIGIN}/profile/5/photo.jpg`
  );
  assert.equal(
    toBuildProfilePicUrl({
      src: 'pictures/legacy.jpg',
      assetOrigin: ASSET_ORIGIN
    }),
    `${ASSET_ORIGIN}/pictures/legacy.jpg`
  );
  assert.equal(
    toBuildProfilePicUrl({
      src: 'https://legacy.example/avatar.png',
      assetOrigin: ASSET_ORIGIN
    }),
    'https://legacy.example/avatar.png'
  );
  assert.equal(
    toBuildProfilePicUrl({ src: null, assetOrigin: ASSET_ORIGIN }),
    null
  );
});

test('Build profile pic URLs reject insecure and malformed sources', () => {
  for (const src of [
    'http://legacy.example/avatar.png',
    '//legacy.example/avatar.png',
    'https:legacy.example/avatar.png',
    'javascript:alert(1)',
    'data:image/png;base64,abc',
    'https://user:password@legacy.example/avatar.png',
    '/\\legacy.example/avatar.png',
    'x'.repeat(2049)
  ]) {
    assert.equal(
      toBuildProfilePicUrl({ src, assetOrigin: ASSET_ORIGIN }),
      null,
      src
    );
  }
});

test('Build viewer and world bridges use canonical profile pic sources', () => {
  const authSource = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/helpers/previewBridgeAuth.ts',
      import.meta.url
    ),
    'utf8'
  );
  const hostBridgeSource = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(authSource, /toBuildProfilePicUrl/);
  assert.match(
    authSource,
    /profilePicUrl:\s*toBuildProfilePicUrl\(\{\s*src:\s*previewAuth\.profilePicUrlRef\.current,\s*assetOrigin:\s*cloudFrontURL/
  );
  assert.match(
    hostBridgeSource,
    /profilePicUrl:\s*viewer\.isLoggedIn\s*\?\s*viewer\.profilePicUrl\s*:\s*payload\?\.player\?\.profilePicUrl/
  );
});

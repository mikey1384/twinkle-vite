import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicMinecraftRead } from '../src/containers/Build/PreviewPanel/helpers/publicMinecraftReads';

test('a signed-out visitor reads play areas through the public route', () => {
  for (const route of ['levels', 'level', 'level/chunks']) {
    assert.equal(isPublicMinecraftRead({ access: 'read', route, guest: true }), true, route);
  }
});

test('everything else still needs sign-in, and signed-in viewers keep their token path', () => {
  for (const route of ['worlds', 'people', 'chat', 'designs', 'zero', 'levels/capture', 'link']) {
    assert.equal(isPublicMinecraftRead({ access: 'read', route, guest: true }), false, route);
  }
  assert.equal(isPublicMinecraftRead({ access: 'write', route: 'level', guest: true }), false);
  assert.equal(isPublicMinecraftRead({ access: 'read', route: 'level', guest: false }), false);
});

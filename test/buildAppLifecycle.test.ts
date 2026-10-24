import test from 'node:test';
import assert from 'node:assert/strict';

// The host side of Twinkle.app.lifecycle: what an app may store, the key, and
// the unload handshake. (No IndexedDB here; storing is exercised end to end.)
(globalThis as any).window = globalThis;
const lifecycle = await import('../src/helpers/buildAppLifecycle.ts');

test('only plain JSON within 1 MB is kept, measured on the host', () => {
  assert.equal(lifecycle.normalizeAppLifecycleState(null), null);
  assert.equal(lifecycle.normalizeAppLifecycleState([1, 2]), null);
  assert.equal(lifecycle.normalizeAppLifecycleState({ big: 'x'.repeat(1_200_000) }), null);
  // Blobs, Maps and buffers do not survive JSON: stored as what JSON keeps
  const kept = lifecycle.normalizeAppLifecycleState({ level: 3, map: new Map([[1, 2]]), when: new Date(0) });
  assert.deepEqual(kept, { level: 3, map: {}, when: '1970-01-01T00:00:00.000Z' });
});

test('snapshots are kept per viewer, app, runtime source and subject mount', () => {
  assert.equal(lifecycle.appLifecycleKey({ userId: 5, buildId: 2610, source: 'published' }), '5:2610:published:app');
  assert.equal(lifecycle.appLifecycleKey({ userId: null, buildId: 2610, source: 'workspace', mount: { type: 'subject', id: 9 } }), '0:2610:workspace:subject-9');
});

test('an unload waits for a fresh snapshot, but not for an app that cannot give one', async () => {
  assert.equal(await lifecycle.requestAppLifecycleSnapshot(77, 'unload'), false);
  const asked: string[] = [];
  const off = lifecycle.registerAppLifecycleFrame(77, (reason) => asked.push(reason));
  lifecycle.setAppLifecycleStatus(77, { suspend: true, webgl: 1 });
  const waiting = lifecycle.requestAppLifecycleSnapshot(77, 'unload');
  assert.deepEqual(asked, ['unload']);
  lifecycle.acceptAppLifecycleSnapshot(77, 'k', { state: { a: 1 }, savedAt: 1, reason: 'unload' });
  assert.equal(await waiting, true);
  off();
  lifecycle.forgetRunningApp(77);
});

test('a closed app is remembered until it starts again', () => {
  lifecycle.markAppClosed(88);
  assert.equal(lifecycle.isAppClosed(88), true);
  lifecycle.noteAppStarted(88);
  assert.equal(lifecycle.isAppClosed(88), false);
});

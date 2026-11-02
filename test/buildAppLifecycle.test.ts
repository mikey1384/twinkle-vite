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

test('a late message from an unloaded app does not bring back its old flags', () => {
  lifecycle.setAppLifecycleStatus(99, { suspend: true, webgl: 2 });
  assert.deepEqual(lifecycle.getAppLifecycleStatus(99), { suspend: false, webgl: 0 });
  const off = lifecycle.registerAppLifecycleFrame(99, () => {});
  lifecycle.setAppLifecycleStatus(99, { suspend: true, webgl: 2 });
  assert.deepEqual(lifecycle.getAppLifecycleStatus(99), { suspend: true, webgl: 2 });
  off();
  lifecycle.forgetRunningApp(99);
  lifecycle.setAppLifecycleStatus(99, { webgl: 3 });
  assert.deepEqual(lifecycle.getAppLifecycleStatus(99), { suspend: false, webgl: 0 });
});

// 11-02 (Mikey): Newspaper opened the next morning at yesterday's scroll.
// Only a return (same tab session, under 30 minutes) gets the whole snapshot;
// a new visit gets only what the app marked as unfinished work.
test('a return gets the whole snapshot back, a new visit only the work', () => {
  const resolve = lifecycle.resolveAppLifecycleResume;
  const minute = 60_000;
  const now = 1_800_000_000_000;
  const state = { scrollY: 900, articleId: 4, game: { level: 3 }, draft: '' };
  const snap = (extra: Record<string, unknown>) => ({ state, reason: 'hidden', ...extra }) as any;
  const at = (visit: string) => ({ now, visit });

  // Same tab session, a few minutes ago (phone unloaded it, reload, quick switch)
  assert.deepEqual(resolve(snap({ savedAt: now - 5 * minute, visit: 'tab-a' }), at('tab-a')), {
    kind: 'return', state, savedAt: now - 5 * minute, ageMs: 5 * minute, reason: 'hidden'
  });
  // Next day in the same tab, or minutes later in a new tab: a new visit.
  // Nothing marked as work: a fresh start, so old scroll never comes back.
  assert.equal(resolve(snap({ savedAt: now - 20 * 60 * minute, visit: 'tab-a' }), at('tab-a')), null);
  assert.equal(resolve(snap({ savedAt: now - 2 * minute, visit: 'tab-a' }), at('tab-b')), null);
  assert.equal(resolve(snap({ savedAt: now - 31 * minute, visit: 'tab-a' }), at('tab-a')), null);
  // Work keys survive a new visit; empty work (null/missing) means start fresh.
  assert.deepEqual(resolve(snap({ savedAt: now - 20 * 60 * minute, visit: 'tab-a', work: ['game', 'draft', 'gone'] }), at('tab-b')), {
    kind: 'new_visit', state: { game: { level: 3 }, draft: '' }, savedAt: now - 20 * 60 * minute, ageMs: 20 * 60 * minute, reason: 'hidden'
  });
  assert.equal(resolve({ state: { scrollY: 9, game: null }, savedAt: now - 60 * minute, visit: 'tab-a', work: ['game'], reason: 'x' } as any, at('tab-a')), null);
  assert.deepEqual(resolve(snap({ savedAt: now - 60 * minute, visit: 'tab-a', work: true }), at('tab-a'))?.state, state);
  // Older than a week, from the future (clock changed), or malformed: nothing.
  assert.equal(resolve(snap({ savedAt: now - 8 * 24 * 60 * minute, visit: 'tab-a', work: true }), at('tab-a')), null);
  assert.equal(resolve(snap({ savedAt: now + minute, visit: 'tab-a' }), at('tab-a')), null);
  assert.equal(resolve({ state: [1], savedAt: now, visit: 'tab-a' } as any, at('tab-a')), null);
  // Snapshots from before 11-02 have no visit: by age alone.
  assert.equal(resolve(snap({ savedAt: now - 10 * minute }), at('tab-a'))?.kind, 'return');
  assert.equal(resolve(snap({ savedAt: now - 20 * 60 * minute }), at('tab-a')), null);
});

test('the work option is a list of top-level keys or true', () => {
  assert.equal(lifecycle.normalizeAppLifecycleWork(true), true);
  assert.equal(lifecycle.normalizeAppLifecycleWork(undefined), null);
  assert.equal(lifecycle.normalizeAppLifecycleWork('game'), null);
  assert.equal(lifecycle.normalizeAppLifecycleWork([]), null);
  assert.deepEqual(lifecycle.normalizeAppLifecycleWork(['game', 'game', 3, '', 'x'.repeat(65), 'draft']), ['game', 'draft']);
});

test('the tab session id stays the same within a tab', () => {
  const store = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value)
  };
  const first = lifecycle.getAppVisitId();
  assert.equal(lifecycle.getAppVisitId(), first);
  store.clear(); // a new tab
  assert.notEqual(lifecycle.getAppVisitId(), first);
  delete (globalThis as any).sessionStorage;
});

// 11-02: each app start is traced for the owner (numbers and flags, never the
// snapshot), so the rule can be checked on Mikey's own phone in the field.
test('the owner trace says what kind of start it was, without contents', () => {
  const now = 1_800_000_000_000;
  const describe = lifecycle.describeAppLifecycleStart;
  const snap = { state: { scrollY: 1, game: { secret: 'x' } }, savedAt: now - 60_000, reason: 'hidden', visit: 'tab-a', work: ['game'] } as any;
  const back = lifecycle.resolveAppLifecycleResume(snap, { now, visit: 'tab-a' });
  assert.deepEqual(describe(snap, back, { now, visit: 'tab-a' }), { kind: 'return', stored: true, ageMs: 60_000, sameTab: true, work: 1, keys: 2 });
  const later = lifecycle.resolveAppLifecycleResume(snap, { now, visit: 'tab-b' });
  assert.deepEqual(describe(snap, later, { now, visit: 'tab-b' }), { kind: 'new_visit', stored: true, ageMs: 60_000, sameTab: false, work: 1, keys: 1 });
  assert.deepEqual(describe(null, null, { now, visit: 'tab-a' }), { kind: 'none', stored: false, ageMs: null, sameTab: null, work: null, keys: 0 });
  const legacy = { state: { scrollY: 1 }, savedAt: now - 20 * 3600_000, reason: 'hidden' } as any;
  assert.deepEqual(describe(legacy, null, { now, visit: 'tab-a' }), { kind: 'none', stored: true, ageMs: 20 * 3600_000, sameTab: null, work: null, keys: 0 });
  assert.ok(!JSON.stringify(describe(snap, back, { now, visit: 'tab-a' })).includes('secret'));
});

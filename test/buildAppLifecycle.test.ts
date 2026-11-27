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

function createFakeIndexedDb(
  initialSnapshots: Record<string, unknown> = {}
) {
  const writes: Array<{ store: string; key: string; value: unknown }> = [];
  const data = new Map<string, unknown>(Object.entries(initialSnapshots));
  let txCount = 0;
  let openDb: any = null;
  const fakeDb = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => ({}),
    onclose: null as null | (() => void),
    onversionchange: null as null | (() => void),
    close() {
      this.onclose?.();
    },
    transaction(_stores: string[], _mode: string) {
      txCount += 1;
      const tx: any = {
        oncomplete: null as null | (() => void),
        onerror: null as null | (() => void),
        onabort: null as null | (() => void),
        objectStore(store: string) {
          return {
            put(value: unknown, key: string) {
              writes.push({ store, key, value });
              if (store === 'snapshots') data.set(key, value);
              return { result: key };
            },
            delete(key: string) {
              if (store === 'snapshots') data.delete(key);
              return { result: undefined };
            },
            get(key: string) {
              return {
                result: store === 'snapshots' ? data.get(key) : undefined
              };
            },
            openCursor() {
              return { onsuccess: null, result: null };
            },
            openKeyCursor() {
              return { onsuccess: null, result: null };
            }
          };
        }
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    }
  };
  const fakeIndexedDB = {
    open() {
      const request: any = {
        result: fakeDb,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null
      };
      queueMicrotask(() => {
        openDb = fakeDb;
        request.onsuccess?.();
      });
      return request;
    }
  };
  return {
    writes,
    getTxCount: () => txCount,
    snapshotWrites: () => writes.filter((entry) => entry.store === 'snapshots'),
    install() {
      (globalThis as any).indexedDB = fakeIndexedDB;
    },
    teardown() {
      openDb?.onclose?.();
      openDb = null;
      delete (globalThis as any).indexedDB;
    }
  };
}

function createFakePageEvents() {
  const winListeners = new Map<string, Set<(...args: any[]) => void>>();
  const docListeners = new Map<string, Set<(...args: any[]) => void>>();
  const prevWinAdd = (globalThis as any).addEventListener;
  const prevWinRemove = (globalThis as any).removeEventListener;
  const prevDoc = (globalThis as any).document;
  const fakeDocument = {
    visibilityState: 'visible' as 'visible' | 'hidden',
    addEventListener(type: string, fn: (...args: any[]) => void) {
      if (!docListeners.has(type)) docListeners.set(type, new Set());
      docListeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: (...args: any[]) => void) {
      docListeners.get(type)?.delete(fn);
    }
  };
  (globalThis as any).addEventListener = (type: string, fn: (...args: any[]) => void) => {
    if (!winListeners.has(type)) winListeners.set(type, new Set());
    winListeners.get(type)!.add(fn);
  };
  (globalThis as any).removeEventListener = (type: string, fn: (...args: any[]) => void) => {
    winListeners.get(type)?.delete(fn);
  };
  (globalThis as any).document = fakeDocument;
  return {
    document: fakeDocument,
    emitWindow(type: string, event: any = {}) {
      for (const fn of [...(winListeners.get(type) || [])]) fn(event);
    },
    emitDocument(type: string, event: any = {}) {
      for (const fn of [...(docListeners.get(type) || [])]) fn(event);
    },
    teardown() {
      (globalThis as any).addEventListener = prevWinAdd;
      (globalThis as any).removeEventListener = prevWinRemove;
      if (prevDoc === undefined) delete (globalThis as any).document;
      else (globalThis as any).document = prevDoc;
    }
  };
}

test('pagehide flushes throttled saves synchronously, requests unload on iOS, and preserves the 1s throttle', async () => {
  const idb = createFakeIndexedDb();
  const page = createFakePageEvents();
  idb.install();
  const stopWatch = lifecycle.watchAppPageUnload();
  // Let openDb() cache the IDBDatabase handle before pagehide fires.
  await new Promise((resolve) => setTimeout(resolve, 0));

  const asked: string[] = [];
  const off = lifecycle.registerAppLifecycleFrame(79, (reason) => asked.push(reason));
  lifecycle.setAppLifecycleStatus(79, { suspend: true, webgl: 0 });
  try {
    // First snapshot has wait === 0 and writes immediately.
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 1 }, savedAt: 1, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 1);

    // Second and third snapshots within 1s are throttled (queued behind pendingTimer).
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 2 }, savedAt: 2, reason: 'autosave' });
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 3 }, savedAt: 3, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 1);

    // iOS Safari skips beforeunload and fires only pagehide: queued snapshot must
    // start its IndexedDB transaction synchronously without awaiting a microtask,
    // and the app must still be asked for a fresh unload snapshot.
    page.emitWindow('pagehide');
    assert.equal(idb.snapshotWrites().length, 2);
    assert.deepEqual((idb.snapshotWrites()[1].value as any).state, { step: 3 });
    assert.deepEqual(asked, ['unload']);

    // The requested unload snapshot writes immediately.
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 4 }, savedAt: 4, reason: 'unload' });
    assert.equal(idb.snapshotWrites().length, 3);
    assert.deepEqual((idb.snapshotWrites()[2].value as any).state, { step: 4 });

    // If the leave did not actually unload the page, rapid unrequested snapshots
    // stay throttled to 1/s instead of triggering an IndexedDB write storm.
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 5 }, savedAt: 5, reason: 'autosave' });
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 6 }, savedAt: 6, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 3);

    // Restoring from bfcache clears the leaving window and keeps throttling active.
    page.emitWindow('pageshow', { persisted: true });
    lifecycle.acceptAppLifecycleSnapshot(79, 'k79', { state: { step: 7 }, savedAt: 7, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 3);
  } finally {
    off();
    lifecycle.forgetRunningApp(79);
    stopWatch();
    page.teardown();
    idb.teardown();
  }
});

test('beforeunload allows at most one unrequested urgent write per app and visibilitychange hidden flushes queued saves synchronously', async () => {
  const idb = createFakeIndexedDb();
  const page = createFakePageEvents();
  idb.install();
  const stopWatch = lifecycle.watchAppPageUnload();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const asked80: string[] = [];
  const off80 = lifecycle.registerAppLifecycleFrame(80, (reason) => asked80.push(reason));
  const asked81: string[] = [];
  const off81 = lifecycle.registerAppLifecycleFrame(81, (reason) => asked81.push(reason));
  lifecycle.setAppLifecycleStatus(81, { suspend: true, webgl: 0 });
  try {
    // App 80 does not register onSuspend: first writes immediately, second queues.
    lifecycle.acceptAppLifecycleSnapshot(80, 'k80', { state: { v: 1 }, savedAt: 1, reason: 'autosave' });
    lifecycle.acceptAppLifecycleSnapshot(80, 'k80', { state: { v: 2 }, savedAt: 2, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 1);

    // Backgrounding (visibilitychange -> hidden) flushes queued saves synchronously
    // and requests a fresh hidden snapshot from apps that support onSuspend.
    page.document.visibilityState = 'hidden';
    page.emitDocument('visibilitychange');
    assert.equal(idb.snapshotWrites().length, 2);
    assert.deepEqual((idb.snapshotWrites()[1].value as any).state, { v: 2 });
    assert.deepEqual(asked81, ['hidden']);
    assert.deepEqual(asked80, []);

    // Returning to visible restores normal throttling.
    page.document.visibilityState = 'visible';
    lifecycle.acceptAppLifecycleSnapshot(80, 'k80', { state: { v: 3 }, savedAt: 3, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 2);

    // beforeunload flushes queued save synchronously; pagehide right after does not double-ask.
    page.emitWindow('beforeunload');
    assert.equal(idb.snapshotWrites().length, 3);
    assert.deepEqual((idb.snapshotWrites()[2].value as any).state, { v: 3 });
    assert.deepEqual(asked81, ['hidden', 'unload']);
    page.emitWindow('pagehide');
    assert.deepEqual(asked81, ['hidden', 'unload']);

    // App 80 gets one unrequested urgent leave write, then subsequent writes are throttled.
    lifecycle.acceptAppLifecycleSnapshot(80, 'k80', { state: { v: 4 }, savedAt: 4, reason: 'unload' });
    assert.equal(idb.snapshotWrites().length, 4);
    lifecycle.acceptAppLifecycleSnapshot(80, 'k80', { state: { v: 5 }, savedAt: 5, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 4);
  } finally {
    off80();
    off81();
    lifecycle.forgetRunningApp(80);
    lifecycle.forgetRunningApp(81);
    stopWatch();
    page.teardown();
    idb.teardown();
  }
});

test('forgetRunningApp flushes queued throttled saves on eviction, but skips closed apps', async () => {
  const idb = createFakeIndexedDb();
  idb.install();
  lifecycle.warmAppLifecycleStore();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const off82 = lifecycle.registerAppLifecycleFrame(82, () => {});
  const off83 = lifecycle.registerAppLifecycleFrame(83, () => {});
  try {
    // App 82 does not register onSuspend: first snapshot writes immediately,
    // newer snapshots within the 1s throttle window queue behind pendingTimer.
    lifecycle.acceptAppLifecycleSnapshot(82, 'k82', { state: { step: 1 }, savedAt: 1, reason: 'autosave' });
    lifecycle.acceptAppLifecycleSnapshot(82, 'k82', { state: { step: 2 }, savedAt: 2, reason: 'autosave' });
    lifecycle.acceptAppLifecycleSnapshot(82, 'k82', { state: { step: 3 }, savedAt: 3, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 1);

    // Mobile memory eviction awaits requestAppLifecycleSnapshot (false here) and
    // calls forgetRunningApp without markAppClosed: the queued snapshot must flush.
    assert.equal(await lifecycle.requestAppLifecycleSnapshot(82, 'unload'), false);
    lifecycle.forgetRunningApp(82);
    assert.equal(idb.snapshotWrites().length, 2);
    assert.deepEqual((idb.snapshotWrites()[1].value as any).state, { step: 3 });

    // Explicit user close marks the app closed before forgetRunningApp: queued
    // and late snapshots must not be written.
    lifecycle.acceptAppLifecycleSnapshot(83, 'k83', { state: { step: 1 }, savedAt: 1, reason: 'autosave' });
    lifecycle.acceptAppLifecycleSnapshot(83, 'k83', { state: { step: 2 }, savedAt: 2, reason: 'autosave' });
    assert.equal(idb.snapshotWrites().length, 3);
    lifecycle.markAppClosed(83);
    lifecycle.acceptAppLifecycleSnapshot(83, 'k83', { state: { step: 3 }, savedAt: 3, reason: 'autosave' });
    lifecycle.forgetRunningApp(83);
    assert.equal(idb.snapshotWrites().length, 3);
  } finally {
    off82();
    off83();
    lifecycle.forgetRunningApp(82);
    lifecycle.forgetRunningApp(83);
    lifecycle.noteAppStarted(83);
    idb.teardown();
  }
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

test('init backup validation enforces scope, size, timestamps, and closed runs', () => {
  const now = 1_800_000_000_000;
  const key = '5:2:published:app';
  const valid = lifecycle.normalizeAppLifecycleBackup(
    {
      key,
      visit: 'tab-a',
      runId: 'run-ok',
      state: { level: 5 },
      savedAt: now - 5_000,
      reason: 'pagehide',
      work: ['level']
    },
    { expectedKey: key, now }
  );
  assert.deepEqual(valid, {
    state: { level: 5 },
    savedAt: now - 5_000,
    reason: 'pagehide',
    visit: 'tab-a',
    work: ['level']
  });

  // Wrong key (different user/build/source/mount) is rejected
  assert.equal(
    lifecycle.normalizeAppLifecycleBackup(
      { key: '6:2:published:app', visit: 'tab-a', state: { level: 5 }, savedAt: now - 1000 },
      { expectedKey: key, now }
    ),
    null
  );
  // Missing visit, oversized state, expired or future timestamps are rejected
  assert.equal(
    lifecycle.normalizeAppLifecycleBackup(
      { key, state: { level: 5 }, savedAt: now - 1000 },
      { expectedKey: key, now }
    ),
    null
  );
  assert.equal(
    lifecycle.normalizeAppLifecycleBackup(
      { key, visit: 'tab-a', state: { big: 'x'.repeat(1_200_000) }, savedAt: now - 1000 },
      { expectedKey: key, now }
    ),
    null
  );
  assert.equal(
    lifecycle.normalizeAppLifecycleBackup(
      { key, visit: 'tab-a', state: { level: 5 }, savedAt: now + 60_000 },
      { expectedKey: key, now }
    ),
    null
  );
  assert.equal(
    lifecycle.normalizeAppLifecycleBackup(
      { key, visit: 'tab-a', state: { level: 5 }, savedAt: now - 8 * 24 * 3600_000 },
      { expectedKey: key, now }
    ),
    null
  );
});

test('pickNewerAppLifecycleSnapshot chooses whichever valid snapshot is newer', () => {
  const now = 1_800_000_000_000;
  const older = { state: { level: 2 }, savedAt: now - 10_000, reason: 'autosave', visit: 'tab-a' };
  const newer = { state: { level: 5 }, savedAt: now - 1_000, reason: 'pagehide', visit: 'tab-a' };

  assert.deepEqual(lifecycle.pickNewerAppLifecycleSnapshot(older, newer, { now }), {
    snapshot: newer,
    source: 'backup'
  });
  assert.deepEqual(lifecycle.pickNewerAppLifecycleSnapshot(newer, older, { now }), {
    snapshot: newer,
    source: 'stored'
  });
  // Ties prefer the already-stored host snapshot
  assert.deepEqual(lifecycle.pickNewerAppLifecycleSnapshot(newer, { ...newer }, { now }), {
    snapshot: newer,
    source: 'stored'
  });
  assert.deepEqual(lifecycle.pickNewerAppLifecycleSnapshot(null, newer, { now }), {
    snapshot: newer,
    source: 'backup'
  });
  // Future/invalid backup cannot beat a valid stored snapshot
  const future = { state: { level: 99 }, savedAt: now + 60_000, reason: 'pagehide', visit: 'tab-a' };
  assert.deepEqual(lifecycle.pickNewerAppLifecycleSnapshot(older, future, { now }), {
    snapshot: older,
    source: 'stored'
  });
});

test('loadAppLifecycleSnapshot merges newer init backup into IndexedDB, keeps newer host snapshot, and rejects closed runs', async () => {
  const key = '5:91:published:app';
  const sessionStore = new Map<string, string>();
  const localStore = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (k: string) => sessionStore.get(k) ?? null,
    setItem: (k: string, v: string) => sessionStore.set(k, v)
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => localStore.get(k) ?? null,
    setItem: (k: string, v: string) => localStore.set(k, v),
    removeItem: (k: string) => localStore.delete(k)
  };
  const visit = lifecycle.getAppVisitId();
  const now = Date.now();
  const idb = createFakeIndexedDb({
    [key]: { state: { level: 2 }, savedAt: now - 10_000, reason: 'autosave', visit }
  });
  idb.install();
  try {
    // 1. Newer frame backup wins and is persisted to IndexedDB.
    const newerBackup = {
      key,
      visit,
      runId: 'run-newer',
      state: { level: 5 },
      savedAt: now - 1_000,
      reason: 'pagehide'
    };
    const resumedNewer = await lifecycle.loadAppLifecycleSnapshot(key, undefined, {
      backup: newerBackup
    });
    assert.equal(resumedNewer?.kind, 'return');
    assert.deepEqual(resumedNewer?.state, { level: 5 });
    assert.equal(idb.snapshotWrites().length, 1);
    assert.deepEqual((idb.snapshotWrites()[0].value as any).state, { level: 5 });

    // 2. Older backup loses to the newer IndexedDB snapshot (no write).
    const olderBackup = {
      key,
      visit,
      runId: 'run-older',
      state: { level: 3 },
      savedAt: now - 20_000,
      reason: 'pagehide'
    };
    const resumedStored = await lifecycle.loadAppLifecycleSnapshot(key, undefined, {
      backup: olderBackup
    });
    assert.equal(resumedStored?.kind, 'return');
    assert.deepEqual(resumedStored?.state, { level: 5 });
    assert.equal(idb.snapshotWrites().length, 1);

    // 3. New tab with backup carrying work keys resumes as new_visit with only work keys.
    const otherTabKey = '5:92:published:app';
    const workBackup = {
      key: otherTabKey,
      visit: 'other-tab',
      runId: 'run-work',
      state: { scrollY: 400, run: { score: 88 } },
      savedAt: now - 2_000,
      reason: 'pagehide',
      work: ['run']
    };
    const resumedWork = await lifecycle.loadAppLifecycleSnapshot(otherTabKey, undefined, {
      backup: workBackup
    });
    assert.equal(resumedWork?.kind, 'new_visit');
    assert.deepEqual(resumedWork?.state, { run: { score: 88 } });

    // 4. Explicit Close app triggers clearBackup and rejects a late pagehide backup from that run.
    let clearedCount = 0;
    const closedKey = '5:93:published:app';
    const off = lifecycle.registerAppLifecycleFrame(
      93,
      () => {},
      () => {
        clearedCount += 1;
      }
    );
    const closedRunId = lifecycle.beginAppLifecycleRun(93);
    lifecycle.markAppClosed(93);
    assert.equal(clearedCount, 1);
    assert.equal(lifecycle.isAppLifecycleRunClosed(closedRunId), true);
    const rejected = await lifecycle.loadAppLifecycleSnapshot(closedKey, undefined, {
      backup: {
        key: closedKey,
        visit,
        runId: closedRunId,
        state: { level: 10 },
        savedAt: now - 500,
        reason: 'pagehide'
      }
    });
    assert.equal(rejected, null);
    off();
    lifecycle.forgetRunningApp(93);
    lifecycle.noteAppStarted(93);
  } finally {
    idb.teardown();
    delete (globalThis as any).sessionStorage;
    delete (globalThis as any).localStorage;
  }
});

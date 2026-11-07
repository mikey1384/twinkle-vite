import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  applyClientUpdateAtHiddenBoundary,
  applyClientUpdateAtSafeBoundary,
  clearSilentClientUpdateMemory,
  gateClientUpdateNavigation,
  isClientUpdatePending,
  markClientUpdatePending,
  noteClientPageHide,
  noteClientPageShow
} from '../src/helpers/clientUpdate';

const socketInitSource = readFileSync(
  fileURLToPath(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
      import.meta.url
    )
  ),
  'utf8'
);

const SILENT_ATTEMPT_KEY = 'twinkleSilentUpdateAttempt';

function createStorage() {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem(key: string) {
      return entries.get(key) || null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  };
}

const runningDoc = {
  querySelectorAll: (selector: string) =>
    selector === 'script[src]'
      ? [{ getAttribute: () => 'https://x.vercel.app/assets/index-OLD1.js' }]
      : []
} as any;

function newerDeployFetcher() {
  return async () => ({
    ok: true,
    text: async () =>
      '<!doctype html><script type="module" src="https://x.vercel.app/assets/index-NEW2.js"></script>'
  });
}

test('a hidden boundary while the page is being dismissed claims nothing', () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };
  markClientUpdatePending();

  // pagehide, then the unload-time visibilitychange (WebKit order).
  noteClientPageHide();
  assert.equal(
    applyClientUpdateAtHiddenBoundary({
      version: '2.5.38',
      storage,
      now: 1000,
      reload,
      hasUnsavedWork: () => false
    }),
    'dismissed'
  );
  assert.equal(reloads, 0);
  // No reload note/budget spent, and the update is still owed.
  assert.equal(storage.entries.has(SILENT_ATTEMPT_KEY), false);
  assert.equal(isClientUpdatePending(), true);

  // Restored from the back/forward cache: the next hidden moment applies it.
  noteClientPageShow({ persisted: true });
  assert.equal(
    applyClientUpdateAtHiddenBoundary({
      version: '2.5.38',
      storage,
      now: 2000,
      reload,
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);
});

test('an ordinary hidden tab still updates silently, never over unsaved work', () => {
  clearSilentClientUpdateMemory();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };
  assert.equal(
    applyClientUpdateAtHiddenBoundary({
      version: '2.5.38',
      storage: createStorage(),
      reload,
      hasUnsavedWork: () => false
    }),
    'current'
  );
  markClientUpdatePending();
  // A first page load also fires pageshow (persisted: false).
  noteClientPageShow({ persisted: false });
  assert.equal(
    applyClientUpdateAtHiddenBoundary({
      version: '2.5.38',
      storage: createStorage(),
      reload,
      hasUnsavedWork: () => true
    }),
    'deferred'
  );
  assert.equal(reloads, 0);
  assert.equal(
    applyClientUpdateAtHiddenBoundary({
      version: '2.5.38',
      storage: createStorage(),
      reload,
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);
});

test('a back/forward-cache restore after an unrealised reload does not hold navigation', async () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  // The browser ignores this navigation (the page is frozen instead).
  const ignoredReload = () => {
    reloads += 1;
  };
  markClientUpdatePending();
  assert.equal(
    applyClientUpdateAtHiddenBoundary({
      version: '2.5.38',
      storage,
      now: 1000,
      reload: ignoredReload,
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);

  noteClientPageShow({ persisted: true });
  let released = 0;
  const outcome = await gateClientUpdateNavigation({
    destination: '/chat',
    check: () =>
      applyClientUpdateAtSafeBoundary({
        version: '2.5.38',
        now: 2000,
        doc: runningDoc,
        fetcher: newerDeployFetcher(),
        storage,
        reload: ignoredReload,
        hasUnsavedWork: () => false
      }),
    release: () => {
      released += 1;
    }
  });
  // This version's silent budget is spent within the hour, so the update
  // stays pending (popup paths remain), but the route is released.
  assert.equal(outcome, 'deferred');
  assert.equal(released, 1);
  assert.equal(reloads, 1);
});

test('useInitSocket routes the hidden boundary through the dismissal guard', () => {
  assert.match(
    socketInitSource,
    /window\.addEventListener\('pagehide', onPageHide\)/
  );
  assert.match(
    socketInitSource,
    /window\.removeEventListener\('pagehide', onPageHide\)/
  );
  assert.match(
    socketInitSource,
    /function onPageHide\(\) \{\s*noteClientPageHide\(\);/
  );
  assert.match(
    socketInitSource,
    /async function onPageShow\(event: PageTransitionEvent\) \{\s*noteClientPageShow\(\{ persisted: event\.persisted \}\);/
  );
  assert.match(
    socketInitSource,
    /applyClientUpdateAtHiddenBoundary\(\{\s*version: clientVersion,\s*hasUnsavedWork: \(\) =>\s*hasUnsavedUserWork\(\{ inputState: getInputState\?\.\(\) \}\)\s*\}\)/
  );
  assert.doesNotMatch(socketInitSource, /trigger: 'hidden-tab'/);
});

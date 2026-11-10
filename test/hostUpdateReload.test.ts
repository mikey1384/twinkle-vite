import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyClientUpdateAtSafeBoundary,
  clearSilentClientUpdateMemory,
  hasUnsavedUserWork,
  isClientUpdatePending
} from '../src/helpers/clientUpdate';
import { LOADED_BUILD_RUNTIME_SESSION_SELECTOR } from '../src/constants/appShell';
import {
  decideHostReload,
  noteHostUpdateRequired,
  resetHostUpdateRequired,
  wasHostUpdateRequired
} from '../src/containers/Build/PreviewPanel/helpers/hostReload';

// A Twinkle page older than the SDK inside an app frame (11-09: the new #363
// ran inside pages from before the land release). The frame's SDK asks this
// page to reload (host:reload), and the app's own Update button takes a
// deployed website update with it.

function createStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) || null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    }
  };
}

const RUNNING = 'https://x.vercel.app/assets/index-AAA1.js';
const entryDocument = (srcs: string[]) =>
  ({
    querySelectorAll: (selector: string) =>
      selector === 'script[src]' ? srcs.map((src) => ({ getAttribute: () => src })) : []
  }) as any;
const entryHtml = (basename: string) =>
  `<!doctype html><script type="module" crossorigin src="https://x.vercel.app/assets/${basename}"></script>`;
const fetcherFor = (html: string, calls: string[] = []) => async (url: string) => {
  calls.push(url);
  return { ok: true, text: async () => html };
};
// a page with `loaded` loaded app sessions and no typed text
const rootWithApps = (loaded: number) =>
  ({
    querySelectorAll: (selector: string) =>
      selector === LOADED_BUILD_RUNTIME_SESSION_SELECTOR
        ? Array.from({ length: loaded }, () => ({}))
        : []
  }) as any;

test('host:reload: a page that knows the message says so, and reloads only when it is out of date and the player tapped', () => {
  const active = { isActive: true };
  // the SDK's question before it draws its Reload button
  assert.deepEqual(
    decideHostReload({ check: true, hostUpdateRequired: false, updatePending: false, userActivation: null }),
    { allowed: true, reload: false, response: { canReload: true } }
  );
  // an up-to-date page is never reloaded by an app
  const fresh = decideHostReload({ check: false, hostUpdateRequired: false, updatePending: false, userActivation: active });
  assert.equal(fresh.allowed, false);
  assert.equal(!fresh.allowed && fresh.code, 'host_reload_not_needed');
  // out of date, but no tap
  const noTap = decideHostReload({ check: false, hostUpdateRequired: true, updatePending: false, userActivation: { isActive: false } });
  assert.equal(noTap.allowed, false);
  assert.equal(!noTap.allowed && noTap.code, 'USER_ACTIVATION_REQUIRED');
  // out of date (the bridge refused a request, or a newer build is armed) and the player tapped
  for (const state of [
    { hostUpdateRequired: true, updatePending: false },
    { hostUpdateRequired: false, updatePending: true }
  ]) {
    assert.deepEqual(decideHostReload({ check: false, ...state, userActivation: active }), {
      allowed: true,
      reload: true,
      response: { reloading: true }
    });
  }
  // a browser without navigator.userActivation: the page already knows it is out of date
  assert.equal(
    decideHostReload({ check: false, hostUpdateRequired: true, updatePending: false, userActivation: undefined }).allowed,
    true
  );
});

test('the bridge remembers that it refused an unknown request', () => {
  resetHostUpdateRequired();
  assert.equal(wasHostUpdateRequired(), false);
  noteHostUpdateRequired();
  assert.equal(wasHostUpdateRequired(), true);
  resetHostUpdateRequired();
});

test('the session being replaced by the Update button does not hold back a website update; any other loaded app does', () => {
  const base = { inputState: {}, moduleStores: [{}] };
  assert.equal(hasUnsavedUserWork({ ...base, root: rootWithApps(1) }), true);
  assert.equal(hasUnsavedUserWork({ ...base, root: rootWithApps(1), replacedBuildRuntimeSessions: 1 }), false);
  assert.equal(hasUnsavedUserWork({ ...base, root: rootWithApps(2), replacedBuildRuntimeSessions: 1 }), true);
  // typed text anywhere still holds it back
  assert.equal(
    hasUnsavedUserWork({ inputState: { chat: { text: 'half a message' } }, moduleStores: [{}], root: rootWithApps(1), replacedBuildRuntimeSessions: 1 }),
    true
  );
});

test('the Update button reloads the whole page when a newer website build is deployed, even right after a "current" answer', async () => {
  clearSilentClientUpdateMemory();
  const reloads: string[] = [];
  const calls: string[] = [];
  const update = (now: number, html: string, apps = 1) =>
    applyClientUpdateAtSafeBoundary({
      version: '2.5.66',
      now,
      doc: entryDocument([RUNNING]),
      fetcher: fetcherFor(html, calls),
      storage: createStorage(),
      reload: () => {
        reloads.push('reload');
      },
      trigger: 'app-update',
      fresh: true,
      hasUnsavedWork: () =>
        hasUnsavedUserWork({ inputState: {}, moduleStores: [{}], root: rootWithApps(apps), replacedBuildRuntimeSessions: 1 })
    });

  // the deployment serves this tab's bundle: update the app in place
  assert.equal(await update(1_000_000, entryHtml('index-AAA1.js')), 'current');
  assert.equal(reloads.length, 0);
  // one minute later (inside the 10 min probe interval) a new website is live: asked again, and the page reloads
  assert.equal(await update(1_060_000, entryHtml('index-BBB2.js')), 'reloading');
  assert.equal(calls.length, 2);
  assert.equal(reloads.length, 1);

  // another loaded app would be lost: the update stays pending and the app updates in place
  clearSilentClientUpdateMemory();
  assert.equal(await update(2_000_000, entryHtml('index-BBB2.js'), 2), 'deferred');
  assert.equal(isClientUpdatePending(), true);
  assert.equal(reloads.length, 1);

  // no answer from the deployment (offline): nothing to conclude, the app updates in place
  clearSilentClientUpdateMemory();
  assert.equal(
    await applyClientUpdateAtSafeBoundary({
      version: '2.5.66',
      now: 3_000_000,
      doc: entryDocument([RUNNING]),
      fetcher: async () => {
        throw new Error('offline');
      },
      storage: createStorage(),
      reload: () => {
        reloads.push('reload');
      },
      trigger: 'app-update',
      fresh: true,
      hasUnsavedWork: () => false
    }),
    'current'
  );
  assert.equal(reloads.length, 1);
  clearSilentClientUpdateMemory();
});

test('an ordinary navigation still respects the 10 min probe interval', async () => {
  clearSilentClientUpdateMemory();
  const calls: string[] = [];
  const navigate = (now: number, html: string) =>
    applyClientUpdateAtSafeBoundary({
      version: '2.5.66',
      now,
      doc: entryDocument([RUNNING]),
      fetcher: fetcherFor(html, calls),
      storage: createStorage(),
      reload: () => {},
      hasUnsavedWork: () => false
    });
  assert.equal(await navigate(1_000_000, entryHtml('index-AAA1.js')), 'current');
  assert.equal(await navigate(1_060_000, entryHtml('index-BBB2.js')), 'current');
  assert.equal(calls.length, 1);
  clearSilentClientUpdateMemory();
});

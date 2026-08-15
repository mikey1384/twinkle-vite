import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { type TestContext } from 'node:test';
import {
  persistAuthToken,
  readAuthToken,
  removeStoredItem,
  resetAuthTokenMemoryForTests
} from '../src/helpers/userDataHelpers';

test.beforeEach(() => {
  resetAuthTokenMemoryForTests();
});

test.afterEach(() => {
  resetAuthTokenMemoryForTests();
});

function installStorage(
  t: TestContext,
  storage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  }
) {
  const previousWindow = (globalThis as any).window;
  (globalThis as any).window = { localStorage: storage };
  t.after(() => {
    (globalThis as any).window = previousWindow;
  });
}

test('auth token persistence is confirmed by a storage round trip', (t) => {
  const values = new Map<string, string>();
  installStorage(t, {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  });

  assert.equal(persistAuthToken('session-token'), true);
  assert.equal(values.get('token'), 'session-token');
});

test('auth token persistence fails closed when mobile storage drops the write', (t) => {
  installStorage(t, {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined
  });

  assert.equal(persistAuthToken('session-token'), false);
});

test('auth token persistence fails closed when storage throws', (t) => {
  installStorage(t, {
    getItem: () => null,
    setItem: () => {
      throw new Error('storage unavailable');
    },
    removeItem: () => undefined
  });

  assert.equal(persistAuthToken('session-token'), false);
});

test('a transient mobile storage read failure retains the confirmed page session', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  let readsThrow = false;
  installStorage(t, {
    getItem: (key) => {
      if (readsThrow) throw new Error('storage temporarily unavailable');
      return values.get(key) || null;
    },
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  });

  assert.deepEqual(readAuthToken(), {
    storageAvailable: true,
    token: 'session-token',
    usedMemoryFallback: false
  });

  readsThrow = true;
  assert.deepEqual(readAuthToken(), {
    storageAvailable: false,
    token: 'session-token',
    usedMemoryFallback: true
  });
});

test('a transient missing token entry is repaired from the confirmed page session', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  installStorage(t, {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  });

  assert.equal(readAuthToken().token, 'session-token');
  values.delete('token');

  assert.deepEqual(readAuthToken(), {
    storageAvailable: true,
    token: 'session-token',
    usedMemoryFallback: true
  });
  assert.equal(values.get('token'), 'session-token');
});

test('an explicit logout clears both durable and in-memory credentials', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  installStorage(t, {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  });

  assert.equal(readAuthToken().token, 'session-token');
  assert.equal(removeStoredItem('token'), true);
  assert.equal(readAuthToken().token, '');
});

test('a transient storage failure cannot resurrect an explicitly removed token', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  let removalsWork = false;
  installStorage(t, {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => {
      if (removalsWork) values.delete(key);
    }
  });

  assert.equal(readAuthToken().token, 'session-token');
  assert.equal(removeStoredItem('token'), true);
  assert.equal(values.get('token'), 'session-token');
  assert.equal(readAuthToken().token, '');

  removalsWork = true;
  assert.equal(readAuthToken().token, '');
  assert.equal(values.has('token'), false);
});

test('every browser session-producing flow requires confirmed persistence', () => {
  const userRequests = readFileSync(
    new URL('../src/contexts/requestHelpers/user.ts', import.meta.url),
    'utf8'
  );
  const captureHost = readFileSync(
    new URL(
      '../src/containers/Build/ThumbnailCaptureHost.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const app = readFileSync(
    new URL('../src/containers/App/index.tsx', import.meta.url),
    'utf8'
  );
  const handleInitStart = app.indexOf('async function handleInit(');
  const handleInitRequest = app.indexOf('await loadMyData(', handleInitStart);
  const handleInitPreamble = app.slice(handleInitStart, handleInitRequest);

  assert.doesNotMatch(userRequests, /setStoredItem\(['"]token['"]/);
  assert.match(userRequests, /persistReturnedSessionToken\(data\.token\)/);
  assert.match(
    userRequests,
    /persistReturnedSessionToken\(nextToken, \{ preserveNavSession: true \}\)/
  );
  assert.match(captureHost, /persistAuthToken\(rawAuthToken\)/);
  assert.ok(
    captureHost.indexOf('if (error)') <
      captureHost.indexOf('if (loading || !authReady)')
  );
  assert.ok(handleInitStart > 0 && handleInitRequest > handleInitStart);
  assert.doesNotMatch(handleInitPreamble, /if \(!userId\)/);
  assert.match(handleInitPreamble, /const initToken = auth\(\)/);
});

test('automatic browser auth failures interrupt without destructive logout or reload loops', () => {
  const app = readFileSync(
    new URL('../src/containers/App/index.tsx', import.meta.url),
    'utf8'
  );
  const socketInit = readFileSync(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
      import.meta.url
    ),
    'utf8'
  );
  const apiSocket = readFileSync(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/index.ts',
      import.meta.url
    ),
    'utf8'
  );
  const authEffectStart = app.indexOf('const tokenRead = readAuthToken();');
  const authEffectEnd = app.indexOf(
    'const handleVisibilityChange',
    authEffectStart
  );
  const authEffect = app.slice(authEffectStart, authEffectEnd);
  const socketBindStart = socketInit.indexOf('function bindSocketToUser');
  const socketBindEnd = socketInit.indexOf(
    'function hydrateOnlinePresence',
    socketBindStart
  );
  const socketBind = socketInit.slice(socketBindStart, socketBindEnd);

  assert.ok(authEffectStart > 0 && authEffectEnd > authEffectStart);
  assert.match(authEffect, /onInterruptSession/);
  assert.match(authEffect, /!sessionInterruption/);
  assert.doesNotMatch(authEffect, /onLogout/);
  assert.match(app, /if \(error\?\.status === 401\) return;/);
  assert.ok(socketBindStart > 0 && socketBindEnd > socketBindStart);
  assert.match(socketBind, /interruptSocketSession\('session_token_invalid'\)/);
  assert.doesNotMatch(socketBind, /window\.location\.reload/);
  assert.match(apiSocket, /if \(sessionInterruption\)/);
  assert.match(apiSocket, /if \(socket\.connected\) socket\.disconnect\(\)/);
});

test('an offline start keeps the session and rehydrates after connectivity returns', () => {
  const app = readFileSync(
    new URL('../src/containers/App/index.tsx', import.meta.url),
    'utf8'
  );
  const socketInit = readFileSync(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
      import.meta.url
    ),
    'utf8'
  );

  const handleInitStart = app.indexOf('async function handleInit(');
  const handleInitEnd = app.indexOf(
    'async function handleThumbnailUpload',
    handleInitStart
  );
  const handleInit = app.slice(handleInitStart, handleInitEnd);
  const ensureConnectedStart = socketInit.indexOf(
    'function ensureSocketConnected()'
  );
  const ensureConnectedEnd = socketInit.indexOf(
    'function onVisibilityChange()',
    ensureConnectedStart
  );
  const ensureConnected = socketInit.slice(
    ensureConnectedStart,
    ensureConnectedEnd
  );

  assert.doesNotMatch(handleInit, /removeStoredItem|onLogout/);
  assert.match(handleInit, /return handleInit\(attempts \+ 1/);
  assert.match(socketInit, /window\.addEventListener\('online', onOnline\)/);
  assert.match(ensureConnected, /socket\.connect\(\)/);
  assert.match(socketInit, /onInit\(\);/);
});

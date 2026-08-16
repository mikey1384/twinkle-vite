import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { type TestContext } from 'node:test';
import {
  adoptAuthTokenStorageChange,
  isExplicitAuthLogoutMarkerStorageEvent,
  isExplicitAuthTokenRemovalStorageEvent,
  isExplicitAuthLogoutStorageEvent,
  persistAuthToken,
  readAuthToken,
  removeStoredItem,
  resetAuthTokenMemoryForTests
} from '../src/helpers/userDataHelpers';
import { getNavSessionMeta } from '../src/helpers/navTabOrder';

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
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjk4NzY1NDMyMX0.signature';
  const sessionGenerationBefore = getNavSessionMeta('987654321').sessionGen;
  installStorage(t, {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined
  });

  assert.equal(persistAuthToken(token), false);
  assert.equal(readAuthToken().token, '');
  assert.equal(
    getNavSessionMeta('987654321').sessionGen,
    sessionGenerationBefore,
    'a failed durable write must not publish an account-session transition'
  );
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
  assert.equal(readAuthToken().token, '');
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

test('an authoritative cross-tab logout clears the page fallback credential', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  installStorage(t, {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  });

  assert.equal(readAuthToken().token, 'session-token');
  values.delete('token');
  adoptAuthTokenStorageChange(null);
  assert.equal(readAuthToken().token, '');
});

test('cross-tab token removal requires a recent explicit logout signal', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
  installStorage(t, storage);

  assert.equal(readAuthToken().token, 'session-token');
  values.delete('token');
  assert.equal(
    isExplicitAuthTokenRemovalStorageEvent({
      key: 'token',
      newValue: null,
      storageArea: storage as Storage
    }),
    false
  );
  assert.equal(
    readAuthToken().token,
    'session-token',
    'an unexplained removal must be repaired from confirmed page memory'
  );

  assert.equal(removeStoredItem('token'), true);
  assert.equal(
    isExplicitAuthTokenRemovalStorageEvent({
      key: 'token',
      newValue: null,
      storageArea: storage as Storage
    }),
    true
  );
});

test('the explicit logout marker is authoritative without a token removal event', (t) => {
  const values = new Map<string, string>([['token', 'session-token']]);
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
  installStorage(t, storage);

  assert.equal(readAuthToken().token, 'session-token');
  assert.equal(
    isExplicitAuthLogoutStorageEvent(
      {
        key: 'twinkleExplicitLogoutAt',
        newValue: '5000',
        storageArea: storage as Storage
      },
      5001
    ),
    true
  );
  assert.equal(
    isExplicitAuthLogoutMarkerStorageEvent(
      { key: 'twinkleExplicitLogoutAt', newValue: '5000' },
      5001
    ),
    true
  );
  assert.equal(
    isExplicitAuthLogoutStorageEvent(
      {
        key: 'twinkleExplicitLogoutAt',
        newValue: null,
        storageArea: storage as Storage
      },
      5001
    ),
    false,
    'removing an old marker during a new login is not a logout'
  );
});

test('an old logout signal cannot authorize a later storage cleanup', (t) => {
  const values = new Map<string, string>([['twinkleExplicitLogoutAt', '1000']]);
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
  installStorage(t, storage);

  assert.equal(
    isExplicitAuthTokenRemovalStorageEvent(
      { key: 'token', newValue: null, storageArea: storage as Storage },
      62_000
    ),
    false
  );
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
  assert.match(
    userRequests,
    /async loadMyData\(\)[\s\S]*?maxRetries: 0[\s\S]*?totalTimeoutMs: 15_000/
  );
  assert.ok(
    captureHost.indexOf('if (error)') <
      captureHost.indexOf('if (loading || !authReady)')
  );
  assert.ok(handleInitStart > 0 && handleInitRequest > handleInitStart);
  assert.doesNotMatch(handleInitPreamble, /if \(!userId\)/);
  assert.match(handleInitPreamble, /const initToken = auth\(\)/);
});

test('only canonical auth rejection interrupts; unreadable browser storage stays recoverable', () => {
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
    'const handleAuthTokenStorageChange',
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
  assert.match(authEffect, /setSessionCredentialUnavailable/);
  assert.match(authEffect, /!sessionInterruption/);
  assert.doesNotMatch(
    authEffect,
    /onLogout|onInterruptSession|createSessionInterruption/
  );
  assert.match(app, /if \(error\?\.status === 401\) return false;/);
  assert.ok(socketBindStart > 0 && socketBindEnd > socketBindStart);
  assert.match(
    socketBind,
    /if \(!tokenRead\.token\) \{[\s\S]*?markSocketTransportGap\(true\);[\s\S]*?socket\.disconnect\(\)/
  );
  assert.doesNotMatch(
    socketBind,
    /if \(!tokenRead\.token\) \{[\s\S]{0,400}?(interruptSocketSession|onInterruptSession)/
  );
  assert.match(
    socketBind,
    /result\?\.authError[\s\S]*?onInit\(\)[\s\S]*?sessionConfirmed[\s\S]*?socket\.connect\(\)/
  );
  assert.doesNotMatch(
    socketBind,
    /result\?\.authError[\s\S]{0,300}interruptSocketSession/
  );
  assert.doesNotMatch(socketBind, /window\.location\.reload/);
  assert.match(apiSocket, /if \(sessionInterruption\)/);
  assert.match(
    apiSocket,
    /if \(sessionInterruption\) \{[\s\S]*socket\.disconnect\(\)/
  );
  assert.doesNotMatch(
    socketInit.slice(
      socketInit.indexOf('function stopSocketAuthRecovery'),
      socketInit.indexOf('function handleMarkArrivalIfCold')
    ),
    /if \(socket\.connected\)/
  );
  assert.match(app, /window\.addEventListener\('storage'/);
  assert.match(
    app,
    /if \(isExplicitAuthLogoutStorageEvent\(event\)\) \{[\s\S]*?authRef\.current = null;[\s\S]*?onAdoptCrossTabLogout\(\)[\s\S]*?if \(event\.key !== 'token'\) return;/
  );
  assert.match(
    readFileSync(
      new URL('../src/contexts/User/actions.ts', import.meta.url),
      'utf8'
    ),
    /onAdoptCrossTabLogout\(\)[\s\S]*?dispatch\(\{[\s\S]*?type: 'LOGOUT'[\s\S]*?\}\)[\s\S]*?onInterruptSession/
  );
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
  const socketConfig = readFileSync(
    new URL('../src/constants/sockets/api.ts', import.meta.url),
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
  assert.match(handleInit, /return handleInit\([\s\S]*attempts \+ 1/);
  assert.match(
    handleInit,
    /if \(browserReportsOffline\(\) && !allowOfflineProbe\)/
  );
  assert.match(socketInit, /window\.addEventListener\('online', onOnline\)/);
  assert.match(socketInit, /window\.addEventListener\('offline', onOffline\)/);
  assert.match(socketInit, /if \(browserReportsOffline\(\)\) return;/);
  assert.match(ensureConnected, /socket\.connect\(\)/);
  assert.match(socketInit, /onInit\(\);/);
  assert.match(app, /window\.addEventListener\('online', onOnline\)/);
  assert.match(app, /window\.addEventListener\('focus', onFocus\)/);
  assert.match(app, /window\.addEventListener\('pageshow', onPageShow\)/);
  assert.match(app, /window\.addEventListener\('offline', onOffline\)/);
  assert.match(app, /socket\.on\('disconnect', scheduleOfflineRecoveryProbe\)/);
  assert.match(
    app,
    /socket\.off\('disconnect', scheduleOfflineRecoveryProbe\)/
  );
  assert.match(app, /OFFLINE_SESSION_RECOVERY_PROBE_DELAYS_MS/);
  assert.match(
    app,
    /socket\.active` remains true after Socket\.IO exhausts[\s\S]*resumeSavedSession\(true\);[\s\S]*scheduleOfflineRecoveryProbe\(\)/
  );
  assert.match(app, /socket\.connected && canonicalSessionUserId/);
  assert.match(app, /resumeSavedSession\(true\)/);
  assert.match(app, /browserReportsOffline\(\) && !allowOfflineProbe/);
  assert.match(app, /markBrowserNetworkReachable\(\);/);
  assert.match(
    app,
    /if \(!browserReportsOffline\(\) && !socket\.connected\) \{[\s\S]*?socket\.connect\(\)/
  );
  assert.doesNotMatch(app, /!socket\.active/);
  assert.match(
    socketInit,
    /else if \(readAuthToken\(\)\.token\) \{[\s\S]*onInit\(\);/
  );
  assert.match(
    socketInit,
    /markBrowserNetworkReachable\(\);[\s\S]*!canonicalSessionUserIdRef\.current[\s\S]*onInit\(\);/
  );
  assert.match(
    app,
    /hasSavedSessionIdentity[\s\S]*!recoveredToken[\s\S]*setSessionCredentialUnavailable\(true\)/
  );
  assert.match(app, /sessionInitPromiseRef\.current/);
  assert.match(
    app,
    /!sessionInterruption &&[\s\S]*sessionCredentialUnavailable[\s\S]*!canonicalSessionUserId && readAuthToken\(\)\.token/
  );
  assert.match(app, /data-session-recovery="true"/);
  assert.match(app, /Restoring your session…/);
  assert.doesNotMatch(app, /Your session is saved/);
  assert.doesNotMatch(app, /Twinkle has not logged you out/);
  assert.match(
    app,
    /!awaitingCanonicalSession \? \([\s\S]*?<Routes>[\s\S]*?<Route\s+path="\/chat\/\*"/
  );
  assert.match(
    app,
    /!awaitingCanonicalSession &&[\s\S]*?runtimeKeepAliveHostEnabled/
  );
  assert.match(
    socketInit,
    /getSocketBindRetryDelayMs\([\s\S]*socketBindRetryCountRef\.current/
  );
  assert.match(
    socketInit,
    /if \(reason === 'io server disconnect'\) \{[\s\S]*if \(socketBindRetryTimerRef\.current\) return;/
  );
  assert.match(socketConfig, /reconnectionAttempts: 6/);
});

test('explicit logout leaves the shared socket manager disconnected until a new login', () => {
  const accountMenu = readFileSync(
    new URL('../src/containers/App/Header/AccountMenu.tsx', import.meta.url),
    'utf8'
  );
  const logoutStart = accountMenu.indexOf('function handleLogout()');
  const logoutBody = accountMenu.slice(logoutStart);

  assert.ok(logoutStart > 0);
  assert.match(logoutBody, /socket\.disconnect\(\)/);
  assert.match(logoutBody, /onLogout\(\)/);
  assert.doesNotMatch(logoutBody, /socket\.connect\(\)/);
  assert.doesNotMatch(logoutBody, /setTimeout/);
});

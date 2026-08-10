import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { type TestContext } from 'node:test';
import { persistAuthToken } from '../src/helpers/userDataHelpers';

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

import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import {
  browserReportsOffline,
  markBrowserNetworkOffline,
  markBrowserNetworkReachable,
  resetBrowserNetworkForTests
} from '../src/helpers/browserNetwork';

test.beforeEach(() => {
  resetBrowserNetworkForTests();
});

test.afterEach(() => {
  resetBrowserNetworkForTests();
});

function withNavigatorOnlineState(
  t: TestContext,
  onLine: boolean | undefined
) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: onLine === undefined ? {} : { onLine }
  });
  t.after(() => {
    if (descriptor) {
      Object.defineProperty(globalThis, 'navigator', descriptor);
    } else {
      delete (globalThis as { navigator?: unknown }).navigator;
    }
  });
}

test('only an explicit browser-offline signal pauses network work', (t) => {
  withNavigatorOnlineState(t, false);
  assert.equal(browserReportsOffline(), true);
});

test('unknown or online browser state does not suppress reconnection', (t) => {
  withNavigatorOnlineState(t, undefined);
  assert.equal(browserReportsOffline(), false);
});

test('an explicit browser-online signal allows reconnection', (t) => {
  withNavigatorOnlineState(t, true);
  assert.equal(browserReportsOffline(), false);
});

test('a canonical response briefly overrides a stale Safari offline hint', (t) => {
  withNavigatorOnlineState(t, false);
  markBrowserNetworkReachable(10_000);

  assert.equal(browserReportsOffline(39_999), false);
  assert.equal(browserReportsOffline(40_001), true);
});

test('an explicit offline transition retires canonical reachability evidence', (t) => {
  withNavigatorOnlineState(t, false);
  markBrowserNetworkReachable(10_000);
  markBrowserNetworkOffline();

  assert.equal(browserReportsOffline(10_001), true);
});

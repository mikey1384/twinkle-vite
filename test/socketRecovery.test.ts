import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getServerDisconnectReconnectDelayMs,
  getSocketBindRetryDelayMs
} from '../src/helpers/socketRecovery';

const socketInitSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
    import.meta.url
  ),
  'utf8'
);

test('server-forced socket reconnects are spread across a bounded recovery window', () => {
  assert.equal(getServerDisconnectReconnectDelayMs(0), 1_000);
  assert.equal(getServerDisconnectReconnectDelayMs(0.25), 2_000);
  assert.equal(getServerDisconnectReconnectDelayMs(0.75), 4_000);
  assert.equal(getServerDisconnectReconnectDelayMs(0.999_999), 4_999);
  assert.equal(getServerDisconnectReconnectDelayMs(-1), 1_000);
  assert.equal(getServerDisconnectReconnectDelayMs(2), 5_000);
  assert.equal(getServerDisconnectReconnectDelayMs(Number.NaN), 1_000);
});

test('authenticated bind failures back off to a bounded retry cadence', () => {
  assert.equal(getSocketBindRetryDelayMs(0), 1_000);
  assert.equal(getSocketBindRetryDelayMs(1), 2_000);
  assert.equal(getSocketBindRetryDelayMs(4), 16_000);
  assert.equal(getSocketBindRetryDelayMs(5), 30_000);
  assert.equal(getSocketBindRetryDelayMs(50), 30_000);
  assert.equal(getSocketBindRetryDelayMs(Number.NaN), 1_000);
});

test('missing socket bind credentials use the bounded bind retry owner', () => {
  const bindErrorBranch = socketInitSource.match(
    /if \(result\?\.bindError\) \{[\s\S]*?\n\s*\}/
  )?.[0];
  assert.ok(bindErrorBranch);
  assert.match(bindErrorBranch, /handleSocketBindFailure/);
  assert.doesNotMatch(bindErrorBranch, /dispatchSocketAuthReady/);
});

test('every failed or credential-less bind cancels Manager recovery even between connections', () => {
  const bindStart = socketInitSource.indexOf('function bindSocketToUser');
  const bindEnd = socketInitSource.indexOf(
    'function hydrateOnlinePresence',
    bindStart
  );
  const bindSource = socketInitSource.slice(bindStart, bindEnd);
  const failureStart = socketInitSource.indexOf(
    'function handleSocketBindFailure'
  );
  const failureEnd = socketInitSource.indexOf(
    'function clearSocketBindRetryTimer',
    failureStart
  );
  const failureSource = socketInitSource.slice(failureStart, failureEnd);

  assert.ok(bindStart > 0 && bindEnd > bindStart);
  assert.ok(failureStart > 0 && failureEnd > failureStart);
  assert.doesNotMatch(bindSource, /if \(socket\.connected\) socket\.disconnect\(\)/);
  assert.doesNotMatch(
    failureSource,
    /if \(socket\.connected\) socket\.disconnect\(\)/
  );
  assert.match(bindSource, /if \(!tokenRead\.token\)[\s\S]*?socket\.disconnect\(\)/);
  assert.match(failureSource, /socket\.disconnect\(\)/);
});

test('the chat bootstrap watchdog never restarts the bounded transport loop', () => {
  const watchdogStart = socketInitSource.indexOf('const WATCHDOG_TICK_MS');
  const watchdogEnd = socketInitSource.indexOf(
    'const prevUserIdRef',
    watchdogStart
  );
  const watchdogSource = socketInitSource.slice(watchdogStart, watchdogEnd);

  assert.ok(watchdogStart > 0 && watchdogEnd > watchdogStart);
  assert.match(
    watchdogSource,
    /chat-bootstrap-watchdog-waiting-for-transport/
  );
  assert.doesNotMatch(watchdogSource, /socket\.connect\(\)/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { getServerDisconnectReconnectDelayMs } from '../src/helpers/socketRecovery';

test('server-forced socket reconnects are spread across a bounded recovery window', () => {
  assert.equal(getServerDisconnectReconnectDelayMs(0), 1_000);
  assert.equal(getServerDisconnectReconnectDelayMs(0.25), 2_000);
  assert.equal(getServerDisconnectReconnectDelayMs(0.75), 4_000);
  assert.equal(getServerDisconnectReconnectDelayMs(0.999_999), 4_999);
  assert.equal(getServerDisconnectReconnectDelayMs(-1), 1_000);
  assert.equal(getServerDisconnectReconnectDelayMs(2), 5_000);
  assert.equal(getServerDisconnectReconnectDelayMs(Number.NaN), 1_000);
});

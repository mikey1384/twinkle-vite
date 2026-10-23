import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocketReconnectEvidence } from '../src/helpers/socketReconnectEvidence';

test('the next bind carries the preceding disconnect only for the same viewer', () => {
  let now = 1000;
  const evidence = createSocketReconnectEvidence(() => now);
  assert.equal(evidence.forUser(5), undefined);
  evidence.record({
    userId: 5,
    socketId: 'old-transport',
    reason: 'ping timeout',
    visibility: 'hidden',
    hiddenForMs: 58000,
    online: true
  });
  now += 200;
  assert.equal(evidence.forUser(6), undefined);
  assert.deepEqual(evidence.forUser(5), {
    socketId: 'old-transport',
    reason: 'ping timeout',
    visibility: 'hidden',
    hiddenForMs: 58000,
    online: true,
    ageMs: 200
  });
  evidence.record({
    userId: 5,
    socketId: 'new-transport',
    reason: 'transport close',
    visibility: 'visible',
    hiddenForMs: null,
    online: false
  });
  assert.equal(evidence.forUser(5)?.socketId, 'new-transport');
  assert.equal(evidence.forUser(5)?.ageMs, 0);
  assert.equal('userId' in evidence.forUser(5)!, false);
});

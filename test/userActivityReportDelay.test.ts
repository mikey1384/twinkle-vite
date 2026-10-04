import assert from 'node:assert/strict';
import test from 'node:test';
import {
  USER_ACTIVITY_END_GRACE_MS,
  userActivityReportDelayMs
} from '../src/helpers/userActivity';

// Mikey 2026-10-04: a kid's chess-puzzle badge kept blinking for everyone;
// the gap between puzzles switched the activity off and on.
test('an ending activity waits before others hear it; starting or switching does not', () => {
  const chess = { kind: 'game', id: 'chess-puzzles' };
  const playing = JSON.stringify(chess);
  assert.equal(userActivityReportDelayMs({ next: null, lastReportedKey: playing }), USER_ACTIVITY_END_GRACE_MS);
  assert.equal(userActivityReportDelayMs({ next: chess, lastReportedKey: 'null' }), 100);
  assert.equal(userActivityReportDelayMs({ next: { kind: 'game', id: 'wordle' }, lastReportedKey: playing }), 100);
  // nothing was showing: nothing to hold back
  assert.equal(userActivityReportDelayMs({ next: null, lastReportedKey: 'null' }), 100);
  assert.equal(userActivityReportDelayMs({ next: null, lastReportedKey: '' }), 100);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { newlyPinnedKey } from '../src/containers/App/Header/MainNavs/pinnedReveal';

test('only one tab joining an already-loaded pinned row counts as a new pin', () => {
  // first load and the 0 → 1 case only set the baseline
  assert.equal(newlyPinnedKey(null, ['a', 'b']), null);
  assert.equal(newlyPinnedKey(new Set(), ['a']), null);
  assert.equal(newlyPinnedKey(new Set(['a', 'b']), ['a', 'b', 'c']), 'c');
  // a pin that lands mid-list still counts
  assert.equal(newlyPinnedKey(new Set(['a', 'c']), ['a', 'b', 'c']), 'b');
  // unpin, reorder, no change: nothing new
  assert.equal(newlyPinnedKey(new Set(['a', 'b']), ['a']), null);
  assert.equal(newlyPinnedKey(new Set(['a', 'b']), ['b', 'a']), null);
  assert.equal(newlyPinnedKey(new Set(['a', 'b']), ['a', 'b']), null);
  // a sync or account switch bringing several keys at once
  assert.equal(newlyPinnedKey(new Set(['a']), ['a', 'x', 'y']), null);
  // swap one for another in the same update still reveals the newcomer
  assert.equal(newlyPinnedKey(new Set(['a', 'b']), ['a', 'c']), 'c');
});

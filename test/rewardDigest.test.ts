import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNewcomers, getDigestDayLabel } from '../src/helpers/rewardDigest';

test('a digest names its reward day plainly', () => {
  const now = Date.parse('2026-10-17T05:00:00Z');
  assert.equal(getDigestDayLabel('2026-10-17', now), 'Today');
  assert.equal(getDigestDayLabel('2026-10-16', now), 'Yesterday');
  assert.equal(getDigestDayLabel('2026-10-12', now), 'Oct 12');
  assert.equal(getDigestDayLabel('garbage', now), 'Earlier');
});

test('newcomers read as two names and the rest, from two up', () => {
  assert.equal(formatNewcomers({ count: 8, names: ['Mina', 'Joon'] }), 'Mina, Joon, +6');
  assert.equal(formatNewcomers({ count: 2, names: ['Mina', 'Joon'] }), 'Mina, Joon');
  assert.equal(formatNewcomers({ count: 1, names: ['Mina'] }), '');
  assert.equal(formatNewcomers(null), '');
});

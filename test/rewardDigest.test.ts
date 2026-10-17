import test from 'node:test';
import assert from 'node:assert/strict';
import { getDigestDayLabel } from '../src/helpers/rewardDigest';

test('a digest names its reward day plainly', () => {
  const now = Date.parse('2026-10-17T05:00:00Z');
  assert.equal(getDigestDayLabel('2026-10-17', now), 'Today');
  assert.equal(getDigestDayLabel('2026-10-16', now), 'Yesterday');
  assert.equal(getDigestDayLabel('2026-10-12', now), 'Oct 12');
  assert.equal(getDigestDayLabel('garbage', now), 'Earlier');
});

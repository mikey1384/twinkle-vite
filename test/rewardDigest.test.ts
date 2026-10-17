import test from 'node:test';
import assert from 'node:assert/strict';
import { getDigestDayLabel, getNewcomerSummary } from '../src/helpers/rewardDigest';

test('a digest names its reward day plainly', () => {
  const now = Date.parse('2026-10-17T05:00:00Z');
  assert.equal(getDigestDayLabel('2026-10-17', now), 'Today');
  assert.equal(getDigestDayLabel('2026-10-16', now), 'Yesterday');
  assert.equal(getDigestDayLabel('2026-10-12', now), 'Oct 12');
  assert.equal(getDigestDayLabel('garbage', now), 'Earlier');
});

test('newcomers show from two up: the first two named, the rest counted', () => {
  const users = [
    { userId: 1, username: 'Mina' },
    { userId: 2, username: 'Joon' }
  ];
  assert.deepEqual(getNewcomerSummary({ count: 8, users }), { users, rest: 6 });
  assert.deepEqual(getNewcomerSummary({ count: 2, users }), { users, rest: 0 });
  assert.equal(getNewcomerSummary({ count: 1, users: users.slice(0, 1) }), null);
  assert.equal(getNewcomerSummary(null), null);
});

test('the latest line says what was discovered, with the tier as a tag', async () => {
  const { getDigestLatestLine } = await import('../src/helpers/rewardDigest');
  assert.deepEqual(
    getDigestLatestLine({
      title: 'World First: Intermediate word',
      subject: { kind: 'item', action: 'discover', title: 'Puddle' }
    }),
    {
      lead: 'discovered',
      subjectTitle: 'Puddle',
      after: ' first',
      tag: 'Intermediate word',
      ruleTitle: 'World First: Intermediate word'
    }
  );
  const song = getDigestLatestLine({
    title: 'Listen to a song',
    subject: { kind: 'song', action: 'listen', title: 'Night Drive' }
  });
  assert.equal(song.lead, 'listened to');
  assert.equal(song.subjectTitle, 'Night Drive');
  assert.equal(song.tag, 'Listen to a song');
  const plain = getDigestLatestLine({ title: "Reach Today's Star", subject: null });
  assert.equal(plain.lead, 'just earned');
  assert.equal(plain.subjectTitle, null);
});

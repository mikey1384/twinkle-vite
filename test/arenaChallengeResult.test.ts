import assert from 'node:assert/strict';
import test from 'node:test';
import { latestArenaResult } from '../src/containers/Home/Stories/FeedCard/helpers/arenaResult';

const before = {
  contentType: 'arenaChallenge', arenaResultObservedAt: 1000,
  raw: 100, max: 148, xpEarned: 15000, coinsEarned: 275,
  markingPending: true, rewardPending: false
};
const after = {
  ...before, arenaResultObservedAt: 2000, raw: 120,
  xpEarned: 17000, coinsEarned: 300, markingPending: false
};

test('a refreshed feed replaces a hydrated result from before settlement', () => {
  const result = latestArenaResult(before, after);
  assert.equal(result.raw, 120);
  assert.equal(result.xpEarned, 17000);
  assert.equal(result.coinsEarned, 300);
  assert.equal(result.markingPending, false);
});

test('an older preview cannot overwrite a newer hydrated result', () => {
  assert.deepEqual(latestArenaResult(after, before), latestArenaResult(before, after));
});

test('the newer canonical amount wins even when it decreases', () => {
  const correction = { ...after, arenaResultObservedAt: 3000, xpEarned: 0, coinsEarned: 0, rewardPending: true };
  const result = latestArenaResult(after, correction);
  assert.equal(result.xpEarned, 0);
  assert.equal(result.coinsEarned, 0);
  assert.equal(result.rewardPending, true);
});

test('the score bonus follows its paid receipt and a newer snapshot can remove it', () => {
  const withBonus = { ...after, rewardStatus: 'awarded', scoreBonusXpEarned: 2000, scoreBonusCoinsEarned: 25 };
  const paid = latestArenaResult(before, withBonus);
  assert.equal(paid.scoreBonusXpEarned, 2000);
  assert.equal(paid.scoreBonusCoinsEarned, 25);
  assert.equal(paid.rewardStatus, 'awarded');
  const correction = { ...after, arenaResultObservedAt: 3000 };
  const merged = { ...withBonus, ...latestArenaResult(withBonus, correction) };
  assert.equal(merged.scoreBonusXpEarned, undefined);
  assert.equal(merged.scoreBonusCoinsEarned, undefined);
  assert.equal(merged.rewardStatus, undefined);
  assert.equal(merged.xpEarned, 17000);
});

test('legacy missing receipt fields stay unknown; result merge cannot override engagement or other card types', () => {
  assert.deepEqual(latestArenaResult({ contentType: 'arenaChallenge' }, {}), {});
  assert.equal(latestArenaResult(before, { ...after, likes: ['fake'], comments: ['fake'] }).likes, undefined);
  assert.deepEqual(latestArenaResult({ ...before, contentType: 'dailyReflection' }, after), {});
  assert.equal(latestArenaResult({ contentType: 'arenaChallenge' }, after).xpEarned, 17000);
});

// Mikey 10-31 ("B is the best"): a helped win names its companion.
test('shared headlines: daily clears all read the same; helped wins name the companion', async () => {
  const { arenaChallengeHeadline } = await import('../src/helpers/arenaChallengeCopy');
  assert.equal(arenaChallengeHeadline({ kind: 'today' }), 'cleared Today’s Challenge');
  assert.equal(arenaChallengeHeadline({ kind: 'today', assisted: true, assistLabel: 'with Zero' }), 'cleared Today’s Challenge');
  assert.equal(arenaChallengeHeadline({ raw: 100, max: 100 }), 'got a perfect score! Can you match it?');
  assert.equal(arenaChallengeHeadline({ raw: 100, max: 100, assisted: true, assistLabel: 'with Zero' }), 'got a perfect score with Zero. Can you match it?');
  assert.equal(arenaChallengeHeadline({ raw: 90, max: 100, assisted: true, assistLabel: 'with Zero and Ciel' }), 'took on a boss with Zero and Ciel and won. Can you do better?');
  assert.equal(arenaChallengeHeadline({ raw: 90, max: 100, assisted: true }), 'took on a boss with a companion and won. Can you do better?', 'an older API sends only the flag');
});

test('the help label and the member\'s own note', async () => {
  const { arenaAssistLabel, arenaAssistNote } = await import('../src/helpers/arenaChallengeCopy');
  assert.equal(arenaAssistLabel({ assisted: false }), null);
  assert.equal(arenaAssistLabel(null), null);
  assert.equal(arenaAssistLabel({ assisted: true, assistLabel: 'with Ciel' }), 'with Ciel');
  assert.equal(arenaAssistLabel({ assisted: true }), 'with a companion');
  assert.equal(arenaAssistNote('with Zero'), 'You had Zero’s help on this one, so it shares as “with Zero” and stays off Boss Records.');
  assert.equal(arenaAssistNote('with Zero and Ciel'), 'You had Zero and Ciel’s help on this one, so it shares as “with Zero and Ciel” and stays off Boss Records.');
  assert.equal(arenaAssistNote('with a companion'), 'You had help on this one, so it shares as “with a companion” and stays off Boss Records.');
});

test('a newer snapshot carries the help flag and label', () => {
  const merged = latestArenaResult({ contentType: 'arenaChallenge', arenaResultObservedAt: 1 }, { arenaResultObservedAt: 2, assisted: true, assistLabel: 'with Zero' });
  assert.equal(merged.assisted, true);
  assert.equal(merged.assistLabel, 'with Zero');
});

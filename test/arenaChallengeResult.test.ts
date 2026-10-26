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

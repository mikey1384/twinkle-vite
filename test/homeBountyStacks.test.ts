import test from 'node:test';
import assert from 'node:assert/strict';
import { getBountyStacks } from '../src/helpers/homeBountyStacks';

const bounty = (id: number, recommendations: number | string = 0) => ({
  contentType: 'bounty', contentId: id, feedId: id, uploaderId: 5,
  totalRecommendations: recommendations
});

test('consecutive recommended bounties from one person remain individual items', () => {
  const result = getBountyStacks([bounty(1, 1), bounty(2, '2'), bounty(3, 1)]);
  assert.equal(result.stacks.size, 0);
  assert.equal(result.hidden.size, 0);
});

test('a recommended story separates ordinary stacks without hiding either story', () => {
  const result = getBountyStacks([
    bounty(1), bounty(2), bounty(3, 1), bounty(4), bounty(5)
  ]);
  assert.deepEqual([...result.hidden.keys()], [1, 4]);
  assert.deepEqual([...result.stacks.values()].map(s => s.size), [2, 2]);
  assert.ok(!result.hidden.has(2));
});

test('canonical removal of the last recommendation restores ordinary stacking', () => {
  const result = getBountyStacks([bounty(1), bounty(2, '0')]);
  assert.equal(result.stacks.get(0)?.size, 2);
  assert.equal(result.hidden.get(1), 'bounty-5-1');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countRewardRows,
  groupRewardRules,
  OTHER_REWARDS_TITLE
} from '../src/containers/Home/Earn/Bounties/rewardGroups';
import type { EarnHubRule } from '../src/containers/Home/Earn/Bounties/useEarnHub';

function rule(id: string, extra: Partial<EarnHubRule> = {}): EarnHubRule {
  return {
    id,
    title: id,
    xp: 1000,
    coins: 100,
    verifier: 'completion',
    available: true,
    earnedToday: null,
    attemptsToday: 0,
    ...extra
  };
}
const shape = (rules: EarnHubRule[]) =>
  groupRewardRules(rules).map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => row.rules.map((r) => r.id))
  }));

test('declared categories become sections in first-appearance order with one row per series', () => {
  const rules = [
    rule('mc-link', { category: 'Get started' }),
    rule('boss', { category: 'Ashen Vigil', series: 'boss' }),
    rule('friend-1', { category: 'Bring friends', series: 'new-friend' }),
    rule('trial', { category: 'Ashen Vigil' }),
    rule('boss-2', { category: 'Ashen Vigil', series: 'boss' }),
    rule('friend-2', { category: 'Bring friends', series: 'new-friend' }),
    rule('loose')
  ];
  assert.deepEqual(shape(rules), [
    { title: 'Get started', rows: [['mc-link']] },
    { title: 'Ashen Vigil', rows: [['boss', 'boss-2'], ['trial']] },
    { title: 'Bring friends', rows: [['friend-1', 'friend-2']] },
    { title: OTHER_REWARDS_TITLE, rows: [['loose']] }
  ]);
  assert.equal(countRewardRows(rules), 5);
});

test('an app that names no series gets its obvious repeats collapsed under one neutral section', () => {
  const rules = [
    rule('recruit-1'),
    rule('recruit-2'),
    rule('recruit-3'),
    rule('boss'),
    rule('boss-2'),
    rule('boss-3'),
    rule('clear')
  ];
  assert.deepEqual(shape(rules), [
    {
      title: null,
      rows: [['recruit-1', 'recruit-2', 'recruit-3'], ['boss', 'boss-2', 'boss-3'], ['clear']]
    }
  ]);
});

test('numbered rules that differ, skip a number or stand alone stay separate rows', () => {
  const stages = [1, 2, 3].map((n) => rule(`stage-${n}`, { xp: 300 * n }));
  assert.equal(countRewardRows(stages), 3);
  assert.equal(countRewardRows([rule('lap-1'), rule('lap-3')]), 2);
  assert.equal(countRewardRows([rule('lap'), rule('lap-1'), rule('lap-2')]), 3);
  assert.equal(countRewardRows([rule('solo-1'), rule('e1-daily'), rule('mc-link')]), 3);
  // A declared series anywhere turns inference off: the app said what repeats.
  assert.equal(
    countRewardRows([rule('a-1', { series: 'a' }), rule('a-2', { series: 'a' }), rule('b-1'), rule('b-2')]),
    3
  );
});

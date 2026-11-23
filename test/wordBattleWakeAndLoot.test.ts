import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextWakeStage,
  readingMs,
  wakeLine
} from '../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/wake';
import {
  dropTitle,
  pointsLabel,
  rarityOf,
  summarizeLoot
} from '../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/loot';

test('wake-up lines hold at reading pace: 1.6 to 2 s, longer for longer lines', () => {
  const holds = (['sleep', 'stir', 'peek', 'yawn'] as const).map((stage) =>
    readingMs(wakeLine(stage, 'ubiquitous'))
  );
  for (const ms of holds) assert.ok(ms >= 1600 && ms <= 2000, `${ms}`);
  assert.ok(holds[0] > holds[1], 'the six-word line holds longer than the two-word one');
  const total = holds.reduce((sum, ms) => sum + ms, 0);
  assert.ok(total >= 6400, `the intro takes ${total} ms unskipped, not ~1.3 s`);
});

test('before the battle is ready the lines never pass a cracked eye', () => {
  assert.equal(nextWakeStage('sleep', false), 'stir');
  assert.equal(nextWakeStage('stir', false), 'peek');
  assert.equal(nextWakeStage('peek', false), 'stir');
  assert.equal(nextWakeStage('peek', true), 'yawn');
  assert.equal(nextWakeStage('yawn', true), 'wake');
  assert.equal(nextWakeStage('wake', true), 'awake');
  assert.equal(nextWakeStage('awake', true), null);
  assert.equal(wakeLine('wake', 'ubiquitous'), 'A wild UBIQUITOUS appears!');
});

test('loot window: base points always, every drop in its own slot, commonest first', () => {
  const won = summarizeLoot({
    kind: 'energy_recharge',
    reward: { xp: 7000, coins: 700, basePoints: 5 },
    drops: [
      { kind: 'points', tier: 'massive', points: 500 },
      { kind: 'black_ai_card', quality: 'rare' },
      { kind: 'energy_recharge' }
    ]
  });
  assert.deepEqual(
    { xp: won.xp, coins: won.coins, basePoints: won.basePoints },
    { xp: 7000, coins: 700, basePoints: 5 }
  );
  assert.deepEqual(won.drops.map((d) => [d.kind, rarityOf(d)]), [
    ['energy_recharge', 'epic'],
    ['points', 'legendary'],
    ['black_ai_card', 'legendary']
  ]);
  assert.equal(dropTitle(won.drops[1]), '💎 MASSIVE! +500 Word Master pts');
  assert.equal(rarityOf({ kind: 'points', tier: 'tiny', points: 2 }), 'common');
  assert.equal(rarityOf({ kind: 'points', tier: 'small', points: 7 }), 'common');
  assert.equal(rarityOf({ kind: 'points', tier: 'big', points: 50 }), 'epic');
  assert.equal(pointsLabel(1), '+1 pt');
  assert.equal(pointsLabel(1500), '+1,500 pts');

  const lost = summarizeLoot({ kind: 'none', reward: { xp: 0, coins: 0, basePoints: 3 }, drops: [] });
  assert.deepEqual(lost, { xp: 0, coins: 0, basePoints: 3, drops: [] });
  const nothing = summarizeLoot({ kind: 'xp', amount: 1400, reward: { xp: 1400, coins: 140 }, drops: [] });
  assert.equal(nothing.basePoints, 0, 'no points chip when none were paid');
  assert.deepEqual(nothing.drops, []);
});

test('loot window: an API from before drops still shows its single landing and points', () => {
  const old = summarizeLoot({
    kind: 'black_ai_card',
    quality: 'elite',
    reward: { xp: 4200, coins: 420, points: 3 }
  });
  assert.equal(old.basePoints, 3);
  assert.deepEqual(old.drops, [{ kind: 'black_ai_card', quality: 'elite' }]);
  assert.deepEqual(summarizeLoot(null), { xp: 0, coins: 0, basePoints: 0, drops: [] });
});

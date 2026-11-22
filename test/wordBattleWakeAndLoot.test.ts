import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextWakeStage,
  readingMs,
  wakeLine
} from '../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/wake';
import { dropLine } from '../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/lines';

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

test('with the win reward known, the drop line names the drop and the chips carry the amounts', () => {
  const reward = { xp: 4200, coins: 420, points: 3 };
  assert.equal(dropLine({ kind: 'xp', reward }), 'Victory! Your loot:');
  assert.match(dropLine({ kind: 'black_ai_card', quality: 'rare', reward }), /QUALITY: RARE! Plus:$/i);
  assert.equal(dropLine({ kind: 'xp', amount: 12 }), 'Got 12 XP!');
  assert.match(dropLine({ kind: 'none' }), /dust/);
});

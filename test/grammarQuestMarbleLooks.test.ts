import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerLooks,
  bestStreak
} from '../src/containers/Home/GrammarGameModal/Quest/marbleLooks';

const seq = (s: string) =>
  s.split('').map((c) => ({ isCorrect: c === 'R', forgiven: c === 'F' }));

test('right answers are green and misses gray; no streak recolours a right answer until gold', () => {
  assert.deepEqual(answerLooks(seq('RRRWRWRR')), [
    'shiny', 'shiny', 'shiny', 'dull', 'shiny', 'dull', 'shiny', 'shiny'
  ]);
  assert.equal(bestStreak(seq('RRRWRWRR')), 3);
});

test('a fifth right in a row turns its whole streak gold, and only that streak', () => {
  assert.deepEqual(answerLooks(seq('RRRR')), ['shiny', 'shiny', 'shiny', 'shiny']);
  assert.deepEqual(answerLooks(seq('RWRRRRRRW')), [
    'shiny', 'dull', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'dull'
  ]);
  assert.equal(bestStreak(seq('RWRRRRRRW')), 6);
});

test('a forgiven miss is clear and neither breaks nor adds to the streak, like the server combo', () => {
  assert.deepEqual(answerLooks(seq('RRFRRR')), ['gold', 'gold', 'clear', 'gold', 'gold', 'gold']);
  assert.equal(bestStreak(seq('RRFRRR')), 5);
  assert.equal(bestStreak(seq('FW')), 0);
});

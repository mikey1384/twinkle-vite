// "See what changes" on a topic brain card and in History
// (src/helpers/topicBrain.ts): the change is what the member sees, long
// unchanged stretches fold away, and a huge text never stalls the page.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  diffTopicBrainLines,
  foldTopicBrainDiff
} from '../src/helpers/topicBrain';

test('an appended note shows as one added line after folded unchanged notes', () => {
  const before = Array.from({ length: 30 }, (_, i) => `Fact ${i + 1}`).join('\n');
  const after = `${before}\n\nWhat’s next: plan the dragon fight.`;
  const rows = foldTopicBrainDiff(diffTopicBrainLines(before, after));
  assert.deepEqual(rows, [
    { type: 'skipped', count: 29 },
    { type: 'same', text: 'Fact 30' },
    { type: 'added', text: '' },
    { type: 'added', text: 'What’s next: plan the dragon fight.' }
  ]);
});

test('a replaced line keeps one line of context on each side', () => {
  const before = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].join('\n');
  const after = ['a', 'b', 'c', 'D', 'e', 'f', 'g'].join('\n');
  const rows = foldTopicBrainDiff(diffTopicBrainLines(before, after));
  assert.deepEqual(rows, [
    { type: 'skipped', count: 2 },
    { type: 'same', text: 'c' },
    { type: 'removed', text: 'd' },
    { type: 'added', text: 'D' },
    { type: 'same', text: 'e' },
    { type: 'skipped', count: 2 }
  ]);
});

test('with no change nothing folds, so History can show the whole text', () => {
  const text = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
  const rows = foldTopicBrainDiff(diffTopicBrainLines(text, text));
  assert.equal(rows.length, 10);
  assert.ok(rows.every((row) => row.type === 'same'));
});

test('thousands of changed lines are compared without a huge table', () => {
  const before = Array.from({ length: 5000 }, (_, i) => `old ${i}`).join('\n');
  const after = Array.from({ length: 5000 }, (_, i) => `new ${i}`).join('\n');
  const started = Date.now();
  const lines = diffTopicBrainLines(before, after);
  assert.ok(Date.now() - started < 1000);
  assert.equal(lines.filter((line) => line.type === 'removed').length, 5000);
  assert.equal(lines.filter((line) => line.type === 'added').length, 5000);
});

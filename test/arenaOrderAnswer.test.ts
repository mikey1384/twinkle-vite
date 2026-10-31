import assert from 'node:assert/strict';
import test from 'node:test';
import { frameParts, orderSentence, parseOrder } from '../src/containers/Arena/OrderAnswer';

// TOEFL iBT® Build a Sentence: the page prints the same sentence the API's
// review and Zero/Ciel read (helpers/arena/paper.ts orderSentence)
test('a Build a Sentence frame fills blank by blank from the tile order', () => {
  const frame = 'Do you know ___ ___ ___ tonight?';
  const tiles = ['the shuttle', 'when', 'leaves', 'campus'];
  assert.equal(frameParts(frame).length - 1, 3);
  assert.deepEqual(parseOrder('1, 0 2'), [1, 0, 2]);
  assert.deepEqual(parseOrder(null), []);
  assert.equal(orderSentence(frame, tiles, '1 0 2'), 'Do you know when the shuttle leaves tonight?');
  // a half-built answer keeps its empty blanks
  assert.equal(orderSentence(frame, tiles, '1'), 'Do you know when ___ ___ tonight?');
  assert.equal(orderSentence('I ___ ___ .', ['saw', 'it'], '0 1'), 'I saw it.');
});

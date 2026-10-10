import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reviewList,
  withForgiven
} from '../src/containers/Home/GrammarGameModal/Quest/reviewList';
import {
  decodeOrder,
  encodeOrder,
  ownAnswer
} from '../src/containers/Home/GrammarGameModal/Quest/MultiTapQuestion';
import type { QuestAnswer } from '../src/containers/Home/GrammarGameModal/Quest/types';

function answer(partial: Partial<QuestAnswer>): QuestAnswer {
  return {
    position: 0,
    isCorrect: false,
    selectedIndex: 0,
    correctIndex: 1,
    ...partial
  };
}

test('a several-tap miss keeps the learner’s own taps beside the key', () => {
  assert.equal(ownAnswer(answer({ selectedIndex: 5 }), []), 5);
  // a boss hit landed right: its last wrong try is the learner's own
  assert.equal(
    ownAnswer(answer({ isCorrect: true, selectedIndex: 3 }), [6, 2]),
    2
  );
  assert.equal(ownAnswer(answer({ isCorrect: true }), []), null);
  // a counter whose clock ran out has no taps
  assert.equal(
    ownAnswer(answer({ counter: true, selectedIndex: -1 }), []),
    null
  );
  // not settled yet (a boss's wrong click keeps the key hidden)
  assert.equal(ownAnswer(answer({ correctIndex: null }), [4]), null);
  assert.equal(ownAnswer(undefined, []), null);
});

test('a built order decodes back to the taps that made it', () => {
  assert.deepEqual(decodeOrder(encodeOrder([2, 0, 3, 1], 4), 4), [2, 0, 3, 1]);
});

test('the result lists each question once, counters and forgiven misses included', () => {
  const challenge = (questionId: number) => ({ questionId, checked: false });
  const list = reviewList([
    answer({ position: 0, challenge: challenge(7), questionText: 'A' }),
    // a hit with no wrong clicks: nothing to challenge
    answer({ position: 1, isCorrect: true, questionText: 'B' }),
    answer({
      position: 2,
      counter: true,
      challenge: challenge(9),
      questionText: 'C'
    }),
    // the same question asked again: one ruling, but its forgiveness shows
    answer({
      position: 3,
      challenge: challenge(7),
      forgiven: true,
      questionText: 'A'
    }),
    answer({ position: 4, forgiven: true, questionText: 'D' }),
    answer({ position: 5, challenge: challenge(11) })
  ]);
  assert.deepEqual(
    list.map((a) => [a.position, !!a.forgiven, !!a.counter]),
    [
      [0, true, false],
      [2, false, true],
      [4, true, false]
    ]
  );
});

test('the finish’s forgiven flags reach the screen’s answers', () => {
  const merged = withForgiven(
    [answer({ position: 0 }), answer({ position: 1 })],
    [{ position: 1, forgiven: true }, { position: 0 }]
  );
  assert.deepEqual(
    merged.map((a) => !!a.forgiven),
    [false, true]
  );
  const same = [answer({ position: 0 })];
  assert.equal(withForgiven(same, undefined), same);
});

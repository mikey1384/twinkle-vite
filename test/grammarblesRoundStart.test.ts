import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGrammarRoundStart } from '../src/containers/Home/GrammarGameModal/roundStart';
import { countAnsweredGrammarQuestions } from '../src/containers/Home/GrammarGameModal/closeAction';

const question = (index: number) => ({
  index,
  question: `Question ${index + 1}`,
  choices: ['a', 'b', 'c', 'd']
});

test('a new round starts at question 1 with no grades', () => {
  const round = buildGrammarRoundStart({
    sessionId: 5,
    totalQuestions: 10,
    question: question(0)
  });
  assert.ok(round);
  assert.equal(round.currentIndex, 0);
  assert.equal(round.lastClickId, 0);
  assert.equal(round.finished, false);
  assert.deepEqual(round.questionIds, [...Array(10).keys()]);
  assert.equal(round.questionObj[0].question, 'Question 1');
  assert.equal(round.questionObj[0].revealDelayMs, undefined);
  assert.ok(Object.values(round.questionObj).every((q: any) => !q.score));
});

test('a resumed round shows its earned grades and continues at the question in play', () => {
  const round = buildGrammarRoundStart({
    sessionId: 6,
    totalQuestions: 10,
    resumed: true,
    question: question(3),
    grades: ['S', 'A', 'C', null, null, null, null, null, null, null],
    wrongPicks: 2,
    revealDelayMs: 0,
    lastClickId: 7,
    finished: false
  });
  assert.ok(round);
  assert.equal(round.currentIndex, 3);
  assert.equal(round.lastClickId, 7);
  assert.deepEqual(
    round.questionIds.map((id) => round.questionObj[id].score || null),
    ['S', 'A', 'C', null, null, null, null, null, null, null]
  );
  assert.equal(round.questionObj[3].question, 'Question 4');
  assert.equal(round.questionObj[3].wrongPicks, 2);
  assert.equal(round.questionObj[3].revealDelayMs, 0);
  // Closing now is a failed level: the earlier picks count as answered.
  assert.equal(
    countAnsweredGrammarQuestions(round.questionIds, round.questionObj),
    4
  );
});

test('a resumed question never seen keeps its normal reveal and no wrong-pick mark', () => {
  const round = buildGrammarRoundStart({
    sessionId: 6,
    totalQuestions: 10,
    resumed: true,
    question: question(1),
    grades: ['S', null, null, null, null, null, null, null, null, null],
    wrongPicks: 0,
    revealDelayMs: 1500,
    lastClickId: 1
  });
  assert.ok(round);
  assert.equal(round.questionObj[1].revealDelayMs, 1500);
  assert.equal(round.questionObj[1].wasWrong, undefined);
});

test('a resumed round answered to the end opens ready to finish', () => {
  const round = buildGrammarRoundStart({
    sessionId: 6,
    totalQuestions: 3,
    resumed: true,
    question: null,
    grades: ['S', 'B', 'A'],
    lastClickId: 4,
    finished: true
  });
  assert.ok(round);
  assert.equal(round.finished, true);
  assert.equal(round.currentIndex, 2);
  assert.deepEqual(
    round.questionIds.map((id) => round.questionObj[id].score),
    ['S', 'B', 'A']
  );
});

test('a broken start payload starts nothing', () => {
  for (const start of [
    null,
    {},
    { sessionId: 1, totalQuestions: 10 },
    { sessionId: 1, totalQuestions: 10, question: question(4) },
    { sessionId: 1, totalQuestions: 10, resumed: true, question: question(10) },
    {
      sessionId: 1,
      totalQuestions: 2,
      resumed: true,
      question: null,
      grades: ['S', null],
      finished: true
    }
  ]) {
    assert.equal(buildGrammarRoundStart(start as any), null);
  }
});

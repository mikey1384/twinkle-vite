import assert from 'node:assert/strict';
import test from 'node:test';
import { checkGrammarAnswerWithRetry } from '../src/containers/Home/GrammarGameModal/answerCheck';

const noSleep = async () => {};

test('a pick is checked once when the server answers', async () => {
  let calls = 0;
  const outcome = await checkGrammarAnswerWithRetry({
    send: async () => {
      calls++;
      return { isCorrect: true, grade: 'S', choiceIndex: 2 };
    },
    sleep: noSleep
  });
  assert.equal(calls, 1);
  assert.deepEqual(outcome, {
    type: 'result',
    result: { isCorrect: true, grade: 'S', choiceIndex: 2 }
  });
});

test('a dropped connection is retried, then gives up without a verdict', async () => {
  let calls = 0;
  const outcome = await checkGrammarAnswerWithRetry({
    send: async () => {
      calls++;
      throw { message: 'Network Error' };
    },
    sleep: noSleep
  });
  assert.equal(calls, 3);
  assert.deepEqual(outcome, { type: 'failed' });
});

test('a closed round is reported at once and a refused pick is not retried', async () => {
  let calls = 0;
  const closed = await checkGrammarAnswerWithRetry({
    send: async () => {
      calls++;
      throw { status: 409, code: 'grammar_session_closed' };
    },
    sleep: noSleep
  });
  assert.deepEqual(closed, { type: 'sessionClosed' });
  assert.equal(calls, 1);
  const refused = await checkGrammarAnswerWithRetry({
    send: async () => {
      calls++;
      throw { status: 426, code: 'client_refresh_required' };
    },
    sleep: noSleep
  });
  assert.deepEqual(refused, { type: 'failed' });
  assert.equal(calls, 2);
});

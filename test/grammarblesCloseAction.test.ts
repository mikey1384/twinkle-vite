import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countAnsweredGrammarQuestions,
  resolveGrammarCloseAction
} from '../src/containers/Home/GrammarGameModal/closeAction';

test('closing never cancels a finished round whose result is unsaved', () => {
  assert.deepEqual(
    resolveGrammarCloseAction({
      uploadInFlight: false,
      hasUnsavedResult: true,
      startedAttemptNumber: 3,
      answeredCount: 10
    }),
    { type: 'resend' }
  );
  // A result upload still in flight keeps retrying on its own; no cancel
  // may race it.
  assert.deepEqual(
    resolveGrammarCloseAction({
      uploadInFlight: true,
      hasUnsavedResult: true,
      startedAttemptNumber: 3,
      answeredCount: 10
    }),
    { type: 'none' }
  );
});

test('closing cancels only the attempt this session started', () => {
  assert.deepEqual(
    resolveGrammarCloseAction({
      uploadInFlight: false,
      hasUnsavedResult: false,
      startedAttemptNumber: 2,
      answeredCount: 4
    }),
    { type: 'cancel', attemptNumber: 2, answeredCount: 4 }
  );
  assert.deepEqual(
    resolveGrammarCloseAction({
      uploadInFlight: false,
      hasUnsavedResult: false,
      startedAttemptNumber: null,
      answeredCount: 4
    }),
    { type: 'none' }
  );
});

test('a wrong pick counts as answering, an untouched question does not', () => {
  const questions = {
    0: { score: 'S', selectedChoiceIndex: 1 },
    1: { wasWrong: true, selectedChoiceIndex: null },
    2: { selectedChoiceIndex: 0 },
    3: { selectedChoiceIndex: null }
  };
  assert.equal(countAnsweredGrammarQuestions([0, 1, 2, 3, 4], questions), 3);
  assert.equal(countAnsweredGrammarQuestions([3, 4], questions), 0);
  assert.equal(countAnsweredGrammarQuestions([0], undefined), 0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  challengeReviewLabel,
  createChallengeReviewStore,
  type ChallengeResult
} from '../src/containers/Home/GrammarGameModal/Review/challengeReviews';

function deferred() {
  let resolve!: (result: ChallengeResult) => void;
  const promise = new Promise<ChallengeResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('closing and reopening a running review shares one request and retains its rejected explanation', async () => {
  const store = createChallengeReviewStore();
  const response = deferred();
  let calls = 0;
  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications++;
  });
  const request = async (thought: (text: string, delta?: boolean) => void) => {
    calls++;
    thought('Checking');
    thought(' the answers', true);
    return response.promise;
  };
  const first = store.start(7, 10, request);
  unsubscribe(); // the dialog closes, but the review keeps running
  await store.start(7, 10, request); // reopening must not submit again
  assert.equal(calls, 1);
  assert.deepEqual(store.get(7)[10], {
    status: 'pending',
    thought: 'Checking the answers'
  });
  const result = {
    justified: false,
    explanation: 'The past conditional is correct.'
  };
  response.resolve(result);
  await first;
  assert.deepEqual(store.get(7)[10], { status: 'complete', result });
  await store.start(7, 10, request);
  assert.equal(calls, 1, 'View review must not spend Energy again');
  assert.equal(notifications, 3, 'the closed dialog is not notified');
});

test('a late result stays with its original account and question', async () => {
  const store = createChallengeReviewStore();
  const old = deferred();
  const pending = store.start(7, 10, () => old.promise);
  const result = { justified: false, explanation: 'Another learner’s review.' };
  await store.start(8, 10, async () => result);
  assert.equal(store.get(8)[11], undefined);
  old.resolve({ justified: true, explanation: 'Fixed.', newBalance: 50100 });
  await pending;
  assert.deepEqual(store.get(8)[10], { status: 'complete', result });
  assert.equal(store.get(7)[10].status, 'complete');
});

test('failed and conflicting reviews wait for an explicit retry without becoming permanently blocked', async () => {
  const store = createChallengeReviewStore();
  let calls = 0;
  const fail = async () => {
    calls++;
    throw { status: 502, message: 'No usable fix returned.' };
  };
  await store.start(7, 10, fail);
  assert.equal(calls, 1);
  assert.deepEqual(store.get(7)[10], {
    status: 'error',
    message: 'No usable fix returned.',
    canRetry: true
  });
  await store.start(7, 10, async () => ({
    justified: true,
    explanation: 'Fixed.',
    newBalance: 50000
  }));
  assert.equal(store.get(7)[10].status, 'complete');
  await store.start(7, 11, async () => {
    throw { status: 409, message: 'A challenge is already in progress.' };
  });
  assert.equal(calls, 1);
  assert.deepEqual(store.get(7)[11], {
    status: 'error',
    message: 'A challenge is already in progress.',
    canRetry: true
  });
  // The competing review failed. The learner explicitly retries, and the
  // server now returns a completed review instead of another conflict.
  await store.start(7, 11, async () => ({
    justified: false,
    explanation: 'The answer is correct.'
  }));
  assert.equal(store.get(7)[11].status, 'complete');
  await store.start(7, 12, async () => {
    throw { status: 401, message: 'Please sign in again.' };
  });
  await store.start(7, 12, fail);
  assert.equal(calls, 1, 'an expired session must not submit again');
});

test('missing response fields never become a rejected or accepted decision', async () => {
  const store = createChallengeReviewStore();
  await store.start(7, 10, async () => ({}) as ChallengeResult);
  assert.equal(store.get(7)[10].status, 'error');
});

test('a Quest miss met on a rewritten wording says why and never retries', async () => {
  const store = createChallengeReviewStore();
  let calls = 0;
  const rewritten = async () => {
    calls++;
    throw {
      status: 409,
      message: 'This question was reworded after you met it.',
      rewritten: true
    };
  };
  await store.start(7, 10, rewritten);
  assert.deepEqual(store.get(7)[10], {
    status: 'error',
    message: 'This question was reworded after you met it.',
    canRetry: false,
    rewritten: true
  });
  assert.equal(challengeReviewLabel(store.get(7)[10]), 'Reworded since');
  await store.start(7, 10, rewritten);
  assert.equal(calls, 1);
});

const { EventEmitter } = require('node:events');
const { assert, test, compile, deferred } = require('./helpers/chatDialogHarness.cjs');

function fixture() {
  const response = deferred();
  const socket = new EventEmitter();
  const energyUpdates = [];
  const balanceUpdates = [];
  let currentUserId = 7;
  let errorHandlingCalls = 0;
  const requestHelpers = compile('src/contexts/requestHelpers/content.ts', {
    './axiosInstance': { post: () => response.promise },
    '~/constants/URL': 'https://local-test.invalid',
    axios: {},
    '~/helpers/stringHelpers': {},
    '~/helpers': {},
    '~/helpers/analytics': {},
    '~/helpers/liveComments': {},
    '~/helpers/featuredSubjects': {}
  }).default({
    auth: () => ({}),
    handleError: async (error) => {
      errorHandlingCalls++;
      throw { status: error.response.status, message: error.response.data.error };
    }
  });
  const app = {
    requestHelpers,
    user: { actions: { onSetUserState: (update) => balanceUpdates.push(update) } }
  };
  const useChallengeReviews = compile(
    'src/containers/Home/GrammarGameModal/Review/useChallengeReviews.ts',
    {
      react: { useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() },
      '~/contexts': {
        useAppContext: (select) => select(app),
        useKeyContext: (select) => select({ myState: { userId: currentUserId } }),
        useNotiContext: (select) => select({
          actions: { onUpdateTodayStats: (update) => energyUpdates.push(update) }
        })
      },
      '~/constants/sockets/api': { socket },
      '~/helpers/userDataHelpers': { getStoredItem: () => String(currentUserId) },
      './challengeReviews': compile(
        'src/containers/Home/GrammarGameModal/Review/challengeReviews.ts', {}
      )
    }
  ).default;
  return {
    response, socket, energyUpdates, balanceUpdates, useChallengeReviews,
    setUser: (id) => { currentUserId = id; },
    get errorHandlingCalls() { return errorHandlingCalls; }
  };
}

for (const switchAccount of [false, true]) {
  test(`failed review preserves canonical Energy and cleans up its stream${switchAccount ? ' after an account switch' : ''}`, async () => {
    const f = fixture();
    const pending = f.useChallengeReviews().startReview(10);
    assert.equal(f.socket.listenerCount('grammar_challenge_thought_streamed'), 1);
    if (switchAccount) f.setUser(8);
    const aiUsagePolicy = { energyPercent: 46 };
    f.response.reject({ response: { status: 502, data: {
      error: 'No usable fix returned.', aiUsagePolicy
    } } });
    await pending;
    assert.equal(f.errorHandlingCalls, 1, 'keep shared error/session handling');
    assert.equal(f.socket.listenerCount('grammar_challenge_thought_streamed'), 0);
    assert.deepEqual(f.energyUpdates, switchAccount ? [] : [{ newStats: { aiUsagePolicy } }]);
    assert.deepEqual(f.balanceUpdates, []);
    f.setUser(7);
    assert.equal(f.useChallengeReviews().reviews[10].status, 'error');
  });
}

test('a completed review keeps its result but never updates the next account’s balance or Energy', async () => {
  const f = fixture();
  const pending = f.useChallengeReviews().startReview(10);
  f.setUser(8);
  f.response.resolve({ data: {
    justified: true, explanation: 'Fixed.', newBalance: 50100,
    aiUsagePolicy: { energyPercent: 46 }
  } });
  await pending;
  assert.deepEqual(f.energyUpdates, []);
  assert.deepEqual(f.balanceUpdates, []);
  assert.equal(f.socket.listenerCount('grammar_challenge_thought_streamed'), 0);
  assert.equal(f.useChallengeReviews().reviews[10], undefined);
  f.setUser(7);
  assert.equal(f.useChallengeReviews().reviews[10].status, 'complete');
});

test('a review completed elsewhere returns its saved explanation without allowing another paid retry', async () => {
  const f = fixture();
  const pending = f.useChallengeReviews().startReview(10);
  const savedReview = { outcome: 'accepted', explanation: 'The earlier challenge fixed an ambiguous choice.' };
  f.response.reject({ response: { status: 409, data: {
    error: 'This question has already been checked.', challengeReview: savedReview
  } } });
  await pending;
  assert.deepEqual(f.useChallengeReviews().reviews[10], {
    status: 'error', message: 'This question has already been checked.',
    canRetry: false, savedReview
  });
  assert.deepEqual(f.balanceUpdates, []);
  assert.deepEqual(f.energyUpdates, []);
  assert.equal(f.socket.listenerCount('grammar_challenge_thought_streamed'), 0);
});

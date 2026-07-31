import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearPendingTransactionRequest,
  getTransactionClientRequestId
} from '../src/containers/Chat/Modals/TransactionModal/pendingTransactionRequest';

function createStorage() {
  const entries = new Map<string, string>();
  return {
    getItem(key: string) {
      return entries.get(key) || null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    },
    removeItem(key: string) {
      entries.delete(key);
    }
  };
}

const runExclusive = async <T>(
  _key: string,
  operation: () => T | Promise<T>
) => operation();

test('unresolved transactions retain independent request ids across A → B → A', async () => {
  const storage = createStorage();
  const generatedIds = ['request-a', 'request-b', 'request-b-next', 'request-a-next'];
  const dependencies = {
    storage,
    createRequestId: () => generatedIds.shift()!,
    runExclusive
  };
  const requestA = {
    type: 'send',
    wanted: { coins: 0, cardIds: [], groupIds: [] },
    offered: { coins: 100, cardIds: [], groupIds: [] },
    targetId: 2
  };
  const requestB = {
    type: 'send',
    wanted: { coins: 0, cardIds: [], groupIds: [] },
    offered: { coins: 250, cardIds: [], groupIds: [] },
    targetId: 3
  };

  const firstA = await getTransactionClientRequestId({
    userId: 1,
    requestPayload: requestA,
    dependencies
  });
  const firstB = await getTransactionClientRequestId({
    userId: 1,
    requestPayload: requestB,
    dependencies
  });
  const retriedA = await getTransactionClientRequestId({
    userId: 1,
    requestPayload: requestA,
    dependencies
  });

  assert.equal(firstA, 'request-a');
  assert.equal(firstB, 'request-b');
  assert.equal(retriedA, firstA);

  await clearPendingTransactionRequest({
    userId: 1,
    requestPayload: requestB,
    clientRequestId: firstB,
    dependencies
  });
  assert.equal(
    await getTransactionClientRequestId({
      userId: 1,
      requestPayload: requestA,
      dependencies
    }),
    firstA
  );
  assert.equal(
    await getTransactionClientRequestId({
      userId: 1,
      requestPayload: requestB,
      dependencies
    }),
    'request-b-next'
  );

  await clearPendingTransactionRequest({
    userId: 1,
    requestPayload: requestA,
    clientRequestId: firstA,
    dependencies
  });
  assert.equal(
    await getTransactionClientRequestId({
      userId: 1,
      requestPayload: requestA,
      dependencies
    }),
    'request-a-next'
  );
});

test('only the matching canonical response clears a pending transaction id', async () => {
  const storage = createStorage();
  let generated = 0;
  const requestPayload = {
    type: 'send',
    wanted: { coins: 0, cardIds: [], groupIds: [] },
    offered: { coins: 75, cardIds: [], groupIds: [] },
    targetId: 8
  };
  const dependencies = {
    storage,
    createRequestId: () => `exact-clear-${++generated}`,
    runExclusive
  };
  const first = await getTransactionClientRequestId({
    userId: 7,
    requestPayload,
    dependencies
  });

  await clearPendingTransactionRequest({
    userId: 7,
    requestPayload,
    clientRequestId: 'different-request',
    dependencies
  });
  assert.equal(
    await getTransactionClientRequestId({
      userId: 7,
      requestPayload,
      dependencies
    }),
    first
  );

  await clearPendingTransactionRequest({
    userId: 7,
    requestPayload,
    clientRequestId: first,
    dependencies
  });
  assert.equal(
    await getTransactionClientRequestId({
      userId: 7,
      requestPayload,
      dependencies
    }),
    'exact-clear-2'
  );
});

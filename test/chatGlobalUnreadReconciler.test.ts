import assert from 'node:assert/strict';
import test from 'node:test';
import { markChatUnreadActivity } from '../src/helpers/chatUnreadActivity';
import { loadFreshCanonicalChatGlobalUnreadCount } from '../src/helpers/chatGlobalUnreadReconciler';

test('a global unread snapshot that races a completed read mutation is retried', async () => {
  const returnedCounts = [1, 0];
  let attempts = 0;

  const result = await loadFreshCanonicalChatGlobalUnreadCount({
    load: async () => {
      const value = returnedCounts[attempts++];
      if (attempts === 1) markChatUnreadActivity();
      return value;
    }
  });

  assert.equal(attempts, 2);
  assert.equal(result, 0);
});

test('a global unread snapshot cannot cross account ownership', async () => {
  const result = await loadFreshCanonicalChatGlobalUnreadCount({
    load: async () => 1,
    isCurrentOwner: () => false
  });

  assert.equal(result, null);
});

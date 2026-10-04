import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadChatMessageInBatch } from '../src/containers/Chat/Message/messageLoadBatch';
import {
  prefetchTopicMessages,
  takePrefetchedTopicMessages
} from '../src/containers/Chat/topicPrefetch';
import { markChatProjectionSocketEvent } from '../src/helpers/chatUnreadActivity';

test('messages that ask together load in one batch; a missing one fails alone', async () => {
  const batches: number[][] = [];
  let singles = 0;
  const loadBatch = async ({ messageIds }: { messageIds: number[] }) => {
    batches.push(messageIds);
    return {
      messages: messageIds.filter((id) => id !== 3).map((id) => ({ id })),
      missingIds: [3]
    };
  };
  const loadSingle = async ({ messageId }: { messageId: number }) => {
    singles += 1;
    return { id: messageId };
  };
  const results = await Promise.allSettled(
    [1, 2, 3, 2].map((messageId) =>
      loadChatMessageInBatch({ messageId, loadBatch, loadSingle })
    )
  );
  assert.equal(batches.length, 1);
  assert.deepEqual(batches[0], [1, 2, 3]);
  assert.equal(singles, 0);
  assert.deepEqual(
    results.map((r) => r.status),
    ['fulfilled', 'fulfilled', 'rejected', 'fulfilled']
  );
});

test('an older server without the batch route falls back to single loads', async () => {
  const loaded: number[] = [];
  const messages = await Promise.all(
    [7, 8].map((messageId) =>
      loadChatMessageInBatch({
        messageId,
        loadBatch: async () => {
          throw new Error('404');
        },
        loadSingle: async ({ messageId }) => {
          loaded.push(messageId);
          return { id: messageId };
        }
      })
    )
  );
  assert.deepEqual(loaded.sort(), [7, 8]);
  assert.deepEqual(messages.map((m) => m.id), [7, 8]);
});

test('a topic prefetch is used when nothing happened in the channel since', async () => {
  prefetchTopicMessages(async () => ({ messages: ['fresh'] }), { channelId: 11, topicId: 1 });
  assert.deepEqual(await takePrefetchedTopicMessages(11, 1), { messages: ['fresh'] });
  assert.equal(await takePrefetchedTopicMessages(11, 1), null, 'used once');
});

test('a topic prefetch overtaken by a message in its channel is dropped', async () => {
  prefetchTopicMessages(async () => ({ messages: ['stale'] }), { channelId: 12, topicId: 1 });
  markChatProjectionSocketEvent('new_message_received', { channelId: 12 });
  assert.equal(await takePrefetchedTopicMessages(12, 1), null);
  // activity in another channel does not matter
  prefetchTopicMessages(async () => ({ messages: ['ok'] }), { channelId: 13, topicId: 1 });
  markChatProjectionSocketEvent('new_message_received', { channelId: 14 });
  assert.deepEqual(await takePrefetchedTopicMessages(13, 1), { messages: ['ok'] });
});

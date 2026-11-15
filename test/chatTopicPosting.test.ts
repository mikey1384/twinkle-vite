import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatChosenSummary,
  formatTopicPostersLine,
  loadTopicPostingWithRetry,
  topicOwnerMayChangePosting,
  topicPostingAccess,
  topicPostingModeOf,
  topicPostingSetByOf
} from '../src/containers/Chat/topicPosting';

const topic = (settings: any, extra: Record<string, unknown> = {}) => ({
  id: 5,
  userId: 2,
  username: 'twosteps',
  settings,
  ...extra
});

test('the old switch reads as "Only me"', () => {
  assert.equal(topicPostingModeOf({}), 'everyone');
  assert.equal(topicPostingModeOf({ isOwnerPostingOnly: true }), 'owner');
  assert.equal(topicPostingModeOf({ postingMode: 'chosen' }), 'chosen');
  assert.equal(topicPostingModeOf(undefined), 'everyone');
});

test('who the message box lets post', () => {
  const access = (t: any, userId: number, extra: Record<string, unknown> = {}) =>
    topicPostingAccess({ topic: t, userId, channelOwnerId: 1, isTwoPeople: false, ...extra });
  const chosen = topic({ postingMode: 'chosen', postingSetBy: 'topic_owner', posters: [{ id: 3, username: 'Lucy' }] });
  assert.equal(access(chosen, 3), 'allowed', 'chosen');
  assert.equal(access(chosen, 2), 'allowed', 'topic owner, their own rule');
  assert.equal(access(chosen, 1), 'allowed', 'chat owner');
  assert.equal(access(chosen, 4), 'blocked');
  // the list not loaded yet: unknown (the chat reads it from the server)
  assert.equal(access(topic({ postingMode: 'chosen', postingSetBy: 'topic_owner' }), 4), 'unknown');
  // an old switch in a group was the chat owner's: the topic owner is bound
  const legacy = topic({ isOwnerPostingOnly: true });
  assert.equal(access(legacy, 2), 'blocked');
  assert.equal(access(legacy, 1), 'allowed');
  assert.equal(access(topic({ postingMode: 'chosen', postingSetBy: 'chat_owner', posters: [] }), 2), 'blocked');
  assert.equal(access(legacy, 1, { isTwoPeople: true }), 'blocked', 'a direct chat has no owner override');
  assert.equal(access(legacy, 2, { isTwoPeople: true }), 'allowed');
  assert.equal(access(null, 4), 'allowed');
});

test('who set the rule decides whether the topic owner may change it', () => {
  assert.equal(topicPostingSetByOf({ isOwnerPostingOnly: true }, false), 'chat_owner');
  assert.equal(topicPostingSetByOf({ isOwnerPostingOnly: true }, true), 'topic_owner');
  assert.equal(topicOwnerMayChangePosting({}), true);
  assert.equal(topicOwnerMayChangePosting({ isOwnerPostingOnly: true }), false);
  assert.equal(topicOwnerMayChangePosting({ postingMode: 'chosen', postingSetBy: 'topic_owner' }), true);
});

test('the quiet line names who can post', () => {
  const names = (posters: string[]) =>
    topic({
      postingMode: 'chosen',
      postingSetBy: 'topic_owner',
      posters: posters.map((username, index) => ({ id: 10 + index, username }))
    });
  const group = { isTwoPeople: false, channelOwnerId: 2 };
  assert.equal(
    formatTopicPostersLine({ topic: names([]), ...group }),
    'Only twosteps can post in this topic'
  );
  assert.equal(
    formatTopicPostersLine({ topic: names(['Lucy']), ...group }),
    'Only twosteps and Lucy can post in this topic'
  );
  assert.equal(
    formatTopicPostersLine({ topic: names(['Lucy', 'Mina']), ...group }),
    'Only twosteps, Lucy and Mina can post in this topic'
  );
  assert.equal(
    formatTopicPostersLine({ topic: names(['Lucy', 'Mina', 'Ari', 'Bo']), ...group }),
    'Only twosteps, Lucy and 3 others can post in this topic'
  );
  assert.equal(
    formatTopicPostersLine({
      topic: names(['Lucy']),
      isTwoPeople: false,
      channelOwnerId: 1,
      channelOwnerName: 'mikey'
    }),
    'Only twosteps, Lucy and mikey can post in this topic'
  );
  assert.equal(
    formatTopicPostersLine({ topic: topic({ isOwnerPostingOnly: true }), isTwoPeople: true }),
    'Only twosteps can post in this topic'
  );
});

test('a chat-owner rule names the chat owner, not the topic owner', () => {
  assert.equal(
    formatTopicPostersLine({
      topic: topic({ isOwnerPostingOnly: true }),
      isTwoPeople: false,
      channelOwnerId: 1,
      channelOwnerName: 'mikey'
    }),
    'Only mikey can post in this topic'
  );
});

test('long names are shortened in the line and the row', () => {
  const long = 'the_extremely_long_username_of_a_builder';
  assert.equal(
    formatChosenSummary([{ id: 1, username: long }, { id: 2, username: 'Lucy' }]),
    'the_extremely_lon…, Lucy'
  );
  assert.match(
    formatTopicPostersLine({
      topic: topic({ postingMode: 'chosen', postingSetBy: 'topic_owner', posters: [{ id: 3, username: long }] }),
      isTwoPeople: false
    }),
    /^Only twosteps and the_extremely_lon… can post in this topic$/
  );
});

test('the compact chosen row', () => {
  assert.equal(formatChosenSummary([]), 'No one yet');
  assert.equal(formatChosenSummary([{ id: 1, username: 'Lucy' }]), 'Lucy');
  assert.equal(
    formatChosenSummary(
      ['Lucy', 'twosteps', 'a', 'b', 'c'].map((username, id) => ({ id, username }))
    ),
    'Lucy, twosteps +3'
  );
});

test('reading the rule retries with backoff, then gives up (the box is not left stuck)', async () => {
  const waits: number[] = [];
  const wait = async (ms: number) => { waits.push(ms); };
  let calls = 0;
  const flaky = await loadTopicPostingWithRetry({
    load: async () => {
      calls++;
      if (calls < 3) throw new Error('network');
      return { postingMode: 'chosen', posters: [] };
    },
    wait
  });
  assert.deepEqual(flaky, { postingMode: 'chosen', posters: [] });
  assert.deepEqual(waits, [1000, 2000]);

  waits.length = 0;
  calls = 0;
  const failing = await loadTopicPostingWithRetry({
    load: async () => { calls++; throw new Error('down'); },
    wait
  });
  assert.equal(failing, null);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [1000, 2000]);

  let canceled = false;
  const stopped = await loadTopicPostingWithRetry({
    load: async () => { canceled = true; throw new Error('x'); },
    isCanceled: () => canceled,
    wait
  });
  assert.equal(stopped, null);
});

test('a rule the topic owner set stays theirs by who set it, even if they owned the chat then', () => {
  const settings = { postingMode: 'owner', postingSetBy: 'chat_owner', postingSetById: 2 };
  assert.equal(topicPostingSetByOf(settings, false, 2), 'topic_owner');
  assert.equal(topicPostingSetByOf(settings, false, 3), 'chat_owner');
  assert.equal(topicOwnerMayChangePosting(settings, 2), true);
  assert.equal(
    topicPostingAccess({ topic: topic(settings), userId: 2, channelOwnerId: 9, isTwoPeople: false }),
    'allowed'
  );
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { enterRoutedTopic } from '../src/containers/Chat/topicRoute';

test('a valid routed topic selects the topic without a legacy subject request', () => {
  const calls: Array<[string, unknown]> = [];

  const entered = enterRoutedTopic({
    channelId: 42,
    topicId: 91,
    onSetChannelState: (params) => calls.push(['state', params]),
    onEnterTopic: (params) => calls.push(['topic', params]),
    updateLastTopicId: (params) => calls.push(['history', params])
  });

  assert.equal(entered, true);
  assert.deepEqual(calls, [
    ['state', { channelId: 42, newState: { selectedTab: 'topic' } }],
    ['topic', { channelId: 42, topicId: 91 }],
    ['history', { channelId: 42, topicId: 91 }]
  ]);
});

test('an invalid routed topic does not mutate chat navigation state', () => {
  let called = false;
  const action = () => {
    called = true;
  };

  const entered = enterRoutedTopic({
    channelId: 42,
    topicId: Number.NaN,
    onSetChannelState: action,
    onEnterTopic: action,
    updateLastTopicId: action
  });

  assert.equal(entered, false);
  assert.equal(called, false);
});

test('both chat entry paths use the routed-topic boundary', () => {
  const source = readFileSync(
    new URL('../src/containers/Chat/Main.tsx', import.meta.url),
    'utf8'
  );

  assert.equal(source.match(/enterRoutedTopic\(\{/g)?.length, 2);
  assert.doesNotMatch(source, /loadChatSubject\(subjectId\)/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { getTopicNavigation } from '../src/containers/Chat/LeftMenu/helpers/topicNavigation';

test('empty and unloaded topics do not reserve a second navigation column', () => {
  for (const options of [
    {},
    { topicObj: null, pinnedTopicIds: null },
    { topicObj: { null: { content: 'Main chat' } } },
    { featuredTopicId: 99, pinnedTopicIds: [98], lastTopicId: 97, topicObj: {} }
  ]) {
    assert.equal(getTopicNavigation(options).isVisible, false);
  }
});

test('featured, pinned, recent and additional topics preserve their canonical order', () => {
  const topics = {
    1: { id: 1, content: 'Featured' },
    2: { id: 2, content: 'Second pin' },
    3: { id: 3, content: 'First pin' },
    4: { id: 4, content: 'Recent' },
    5: { id: 5, content: 'Other' }
  };
  const result = getTopicNavigation({
    featuredTopicId: 1, pinnedTopicIds: [3, 1, 99, 2], lastTopicId: 4, topicObj: topics
  });
  assert.equal(result.featuredTopic, topics[1]);
  assert.deepEqual(result.pinnedTopics, [topics[3], topics[2]]);
  assert.equal(result.lastTopic, topics[4]);
  assert.deepEqual(result.additionalTopics, [topics[5]]);
  assert.equal(result.isVisible, true);
});

test('recent topics already featured or pinned are not repeated', () => {
  const topicObj = { 1: { id: 1, content: 'Featured' }, 2: { id: 2, content: 'Pinned' } };
  for (const lastTopicId of [1, 2]) {
    const result = getTopicNavigation({ featuredTopicId: 1, pinnedTopicIds: [2], lastTopicId, topicObj });
    assert.equal(result.lastTopic, null);
  }
});

test('DM fallback ignores the main-chat placeholder and preserves subject IDs', () => {
  const topic = { id: 8, subjectId: 18, content: 'Latest topic' };
  const result = getTopicNavigation({
    featuredTopicId: null,
    pinnedTopicIds: [18],
    topicObj: { 18: topic, null: { content: 'Main chat' } }
  });
  assert.equal(result.featuredTopic, topic);
  assert.equal(result.appliedFeaturedTopicId, 18);
  assert.deepEqual(result.pinnedTopics, []);
});

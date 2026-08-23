import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getChatTopicProjectionIds,
  getRoutedChatTopicId,
  MAX_CHAT_TOPIC_PROJECTION_IDS
} from '../src/helpers/chatTopicProjection';
import {
  mergeCanonicalTopicProjection,
  reconcileCanonicalTopicNavigation
} from '../src/contexts/Chat/topicProjectionState';

test('General bootstrap requests the routed topic and recent navigation history', () => {
  assert.equal(getRoutedChatTopicId('/chat/157435485/topic/42'), 42);
  assert.equal(getRoutedChatTopicId('/chat/157435485/main/topic/nope'), 0);
  assert.deepEqual(
    getChatTopicProjectionIds({
      pathname: '/chat/157435485/main/topic/42',
      channel: {
        selectedTopicId: 41,
        topicHistory: [40, 41, 42]
      }
    }),
    [42, 41, 40]
  );

  const bounded = getChatTopicProjectionIds({
    pathname: '/chat/157435485',
    channel: {
      topicHistory: Array.from({ length: 150 }, (_, index) => index + 1)
    }
  });
  assert.equal(bounded.length, MAX_CHAT_TOPIC_PROJECTION_IDS);
  assert.equal(bounded[0], 150);
  assert.equal(bounded.at(-1), 51);
});

test('partial canonical topic projections preserve only unrequested cached metadata', () => {
  const merged = mergeCanonicalTopicProjection({
    existingTopicObj: {
      1: { id: 1, content: 'cached one', loaded: true, messageIds: [10] },
      2: { id: 2, content: 'cached two', loaded: true, messageIds: [20] },
      3: { id: 3, content: 'cached three', loaded: true, messageIds: [30] }
    },
    serverChannel: {
      topicCatalogComplete: false,
      topicProjectionRequestedIds: [1, 2],
      topicObj: {
        1: { id: 1, content: 'canonical one' }
      }
    },
    preserveUnrequestedTopics: true
  });

  assert.equal(merged.topicObj[1].content, 'canonical one');
  assert.equal(merged.topicObj[1].loaded, false);
  assert.deepEqual(merged.topicObj[1].messageIds, []);
  assert.equal(merged.topicObj[2], undefined);
  assert.equal(merged.topicObj[3].content, 'cached three');
  assert.equal(merged.topicObj[3].loaded, false);

  const newUserProjection = mergeCanonicalTopicProjection({
    existingTopicObj: { 3: { id: 3, content: 'previous user topic' } },
    serverChannel: {
      topicCatalogComplete: false,
      topicProjectionRequestedIds: [1],
      topicObj: { 1: { id: 1, content: 'current user topic' } }
    },
    preserveUnrequestedTopics: false
  });
  assert.deepEqual(Object.keys(newUserProjection.topicObj), ['1']);
});

test('partial topic navigation removes confirmed deletions without guessing about omitted topics', () => {
  const retained = reconcileCanonicalTopicNavigation({
    existingChannel: {
      selectedTab: 'topic',
      selectedTopicId: 3,
      topicHistory: [1, 2, 3],
      currentTopicIndex: 2
    },
    canonicalTopicObj: { 1: { id: 1 } },
    topicCatalogComplete: false,
    topicProjectionRequestedIds: [1, 2]
  });
  assert.deepEqual(retained.topicHistory, [1, 3]);
  assert.equal(retained.selectedTopicId, 3);
  assert.equal(retained.currentTopicIndex, 1);

  const deletedSelection = reconcileCanonicalTopicNavigation({
    existingChannel: {
      selectedTab: 'topic',
      selectedTopicId: 2,
      topicHistory: [1, 2],
      currentTopicIndex: 1
    },
    canonicalTopicObj: { 1: { id: 1 } },
    topicCatalogComplete: false,
    topicProjectionRequestedIds: [1, 2]
  });
  assert.deepEqual(deletedSelection, {
    selectedTab: 'all',
    selectedTopicId: null,
    topicHistory: [],
    currentTopicIndex: -1
  });
});

test('both General bootstrap and channel recovery request partial topic projections', () => {
  const requestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/chat.ts', import.meta.url),
    'utf8'
  );
  const reducerSource = readFileSync(
    new URL('../src/contexts/Chat/reducer.ts', import.meta.url),
    'utf8'
  );
  const recoverySource = readFileSync(
    new URL(
      '../src/containers/Chat/Body/MessagesContainer/index.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.equal(
    (requestSource.match(/compactGeneralTopics=1/g) || []).length,
    2
  );
  assert.match(requestSource, /priority: compactGeneralTopics \? 'high'/);
  assert.match(
    recoverySource,
    /compactGeneralTopics = selectedChannelId === GENERAL_CHAT_ID[\s\S]*topicIds:/
  );
  assert.match(
    reducerSource,
    /case 'ENTER_CHANNEL':[\s\S]*mergeCanonicalTopicProjection\(\{/
  );
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applyCanonicalChatMessagePage,
  buildCanonicalChatMessagePageState
} from '../src/contexts/Chat/messagePageState';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('a writer-hydrated reconnect page replaces stale details without placeholders', () => {
  const result = applyCanonicalChatMessagePage({
    existingMessagesObj: {
      7: {
        id: 7,
        content: 'old content',
        isLoaded: true,
        targetMessage: { id: 3, content: 'stale reply target' }
      }
    },
    messages: [
      {
        id: 7,
        content: 'canonical content',
        targetMessage: { id: 3, content: 'canonical reply target' }
      }
    ],
    messagesHydrated: true
  });

  assert.deepEqual(result[7], {
    id: 7,
    content: 'canonical content',
    isLoaded: true,
    targetMessage: { id: 3, content: 'canonical reply target' }
  });
});

test('an ordinary channel summary still uses lazy message hydration', () => {
  const result = applyCanonicalChatMessagePage({
    existingMessagesObj: {
      7: { id: 7, content: 'previous detail', isLoaded: true }
    },
    messages: [{ id: 7, content: 'canonical summary' }],
    messagesHydrated: false
  });

  assert.deepEqual(result[7], {
    id: 7,
    content: 'canonical summary',
    isLoaded: false
  });
});

test('a canonical hydrated page trims the sentinel without unloading its rows', () => {
  const messages = Array.from({ length: 21 }, (_, index) => ({
    id: index + 1,
    content: `message ${index + 1}`
  }));
  const result = buildCanonicalChatMessagePageState({
    existingMessagesObj: {
      1: { id: 1, content: 'stale detail', isLoaded: true }
    },
    messages,
    messagesHydrated: true
  });

  assert.equal(result.messagesLoadMoreButton, true);
  assert.equal(result.messageIds.length, 20);
  assert.equal(result.messagesObj[1].content, 'message 1');
  assert.equal(result.messagesObj[1].isLoaded, true);
  assert.equal(result.messagesObj[20].isLoaded, true);
  assert.equal(result.messagesObj[21], undefined);
});

test('every whole-channel refresh that can replace a rendered cache requests hydration', () => {
  const reconnectSource = readSource(
    'src/containers/Chat/Body/MessagesContainer/index.tsx'
  );
  const initSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );
  const chatSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const topicItemSource = readSource(
    'src/containers/Chat/Modals/TopicSelectorModal/TopicItem.tsx'
  );
  const topicSettingsSource = readSource(
    'src/containers/Chat/Modals/TopicSettingsModal/index.tsx'
  );
  const settingsSource = readSource(
    'src/containers/Chat/Modals/SettingsModal/index.tsx'
  );
  const actionsSource = readSource('src/contexts/Chat/actions.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const requestSource = readSource('src/contexts/requestHelpers/chat.ts');

  assert.match(reconnectSource, /hydrateMessages: true/);
  assert.match(
    initSocketSource,
    /hydrateMessages: preserveSelectedProjection/
  );
  assert.match(chatSocketSource, /hydrateMessages: true/);
  assert.match(topicItemSource, /hydrateMessages: true/);
  assert.match(topicSettingsSource, /hydrateMessages: true/);
  assert.match(settingsSource, /hydrateMessages: true/);
  assert.match(
    chatSocketSource,
    /messagesHydrated: data\.messagesHydrated === true/
  );
  assert.match(
    topicSettingsSource,
    /messagesHydrated: data\.messagesHydrated === true/
  );
  assert.match(
    settingsSource,
    /messagesHydrated: data\.messagesHydrated === true/
  );
  assert.match(
    requestSource,
    /loadTopicMessages\(\{[\s\S]*?messagesHydrated: messagesHydrated === true/
  );
  assert.match(
    actionsSource,
    /type: 'LOAD_TOPIC_MESSAGES',[\s\S]*?messagesHydrated/
  );
  assert.match(
    reducerSource,
    /case 'LOAD_TOPIC_MESSAGES':[\s\S]*?applyCanonicalChatMessagePage\(\{[\s\S]*?messagesHydrated: action\.messagesHydrated === true/
  );
});

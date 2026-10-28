const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const { transformSync } = require('esbuild');
function compile(file, deps, globals = {}) {
  const module = { exports: {} };
  const code = transformSync(fs.readFileSync(file, 'utf8'), {
    loader: 'ts',
    format: 'cjs'
  }).code;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(
    (name) => {
      assert.ok(name in deps, name);
      return deps[name];
    },
    module,
    module.exports,
    ...Object.values(globals)
  );
  return module.exports;
}
function fixture() {
  const handlers = new Map();
  const store = compile(
    'src/containers/App/AssistantDock/conversationStore.ts',
    {
      '~/constants/sockets/api': {
        socket: {
          on(name, fn) {
            handlers.set(name, fn);
          },
          off(name) {
            handlers.delete(name);
          }
        }
      },
      '~/constants/defaultValues': { CIEL_TWINKLE_ID: 2, ZERO_TWINKLE_ID: 3 },
      '~/helpers/canonicalTextStream': {
        applyCanonicalTextStreamUpdate: ({ currentText, delta, snapshot }) =>
          snapshot ?? currentText + delta
      },
      '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions':
        { readAgentSuggestions: () => [] },
      '~/containers/Chat/Message/MessageBody/WebsiteAgentCard': {
        isWebsiteAgentCardData: () => false
      }
    },
    { window: { setInterval: () => 1, clearInterval: () => {} } }
  );
  store.attachAssistantConversationListeners();
  return { store, emit: (name, ...args) => handlers.get(name)?.(...args) };
}
test('streamed replies in different topics never mix and voice receipts remain in their own topic', () => {
  const { store, emit } = fixture();
  store.startAssistantReply(10, 0);
  store.startAssistantReply(10, 7);
  emit('new_ai_message_received', {
    channelId: 10,
    message: { id: 1, userId: 2, subjectId: 7, content: '' }
  });
  emit('ai_message_delta_streamed', {
    channelId: 10,
    messageId: 1,
    delta: 'Topic answer'
  });
  emit('ai_message_done', 10, 1);
  assert.equal(store.getAssistantReply(10, 7).text, 'Topic answer');
  assert.equal(store.getAssistantReply(10, 0).text, '');
  emit('new_message_received', {
    message: {
      id: 2,
      channelId: 10,
      subjectId: 7,
      userId: 1,
      content: 'Spoken follow-up'
    }
  });
  assert.equal(store.getAssistantReply(10, 7), null);
  assert.deepEqual(
    store.getAssistantTranscript(10, 7).map((line) => line.content),
    ['Topic answer', 'Spoken follow-up']
  );
  assert.deepEqual(store.getAssistantTranscript(10, 0), []);
});
test('canonical edits and deletions update the transcript, and account reset drops every conversation', () => {
  const { store, emit } = fixture();
  store.followAssistantConversation(10, 7);
  emit('new_message_received', {
    message: { id: 1, channelId: 10, subjectId: 7, userId: 1, content: '' }
  });
  emit('chat_message_edited', {
    channelId: 10,
    messageId: 1,
    editedMessage: 'Final spoken transcript'
  });
  assert.equal(
    store.getAssistantTranscript(10, 7)[0].content,
    'Final spoken transcript'
  );
  emit('chat_message_deleted', { channelId: 10, messageId: 1 });
  assert.deepEqual(store.getAssistantTranscript(10, 7), []);
  store.startAssistantReply(10, 7);
  store.resetAssistantConversations();
  assert.equal(store.getAssistantReply(10, 7), null);
});
test('window drafts, attachments and reading position survive mode/window changes but not account changes', () => {
  const dock = compile('src/containers/App/AssistantDock/dockState.ts', {});
  const question = { kind: 'page', label: 'Question A' };
  dock.openAssistantDock('Ciel', question, 7);
  dock.setAssistantDraft('Ciel', 7, 'Unsent equation');
  dock.setAssistantWindowView({ position: { x: 18, y: 24 }, expanded: true });
  dock.setAssistantScroll('Ciel', 7, { top: 100, pinned: false });
  dock.openAssistantDock('Zero', null, 0);
  dock.setAssistantDraft('Zero', 0, 'Another draft');
  dock.openAssistantDock('Ciel', undefined, 7);
  assert.equal(dock.getAssistantAskContext(), question);
  assert.equal(dock.getAssistantDraft('Ciel', 7), 'Unsent equation');
  assert.deepEqual(dock.getAssistantScroll('Ciel', 7), {
    top: 100,
    pinned: false
  });
  dock.closeAssistantDock();
  dock.openAssistantDock('Ciel', undefined, 7);
  assert.equal(dock.getAssistantAskContext(), question);
  dock.clearAssistantAskContext();
  dock.closeAssistantDock();
  dock.openAssistantDock('Ciel', undefined, 7);
  assert.equal(dock.getAssistantAskContext(), null);
  const epoch = dock.getAssistantAccountEpoch();
  dock.resetAssistantDock();
  assert.equal(dock.getAssistantDraft('Ciel', 7), '');
  assert.equal(dock.getAssistantAccountEpoch(), epoch + 1);
});

test('a reconnect replaces missed edits and deletions without dropping newer live receipts', () => {
  const { store, emit } = fixture();
  store.followAssistantConversation(10, 7);
  for (const id of [1, 2, 4])
    emit('new_message_received', {
      message: {
        id,
        channelId: 10,
        subjectId: 7,
        userId: 1,
        content: 'Before ' + id
      }
    });
  store.seedAssistantTranscript(
    [
      { id: 2, channelId: 10, subjectId: 7, userId: 1, content: 'Edited' },
      {
        id: 3,
        channelId: 10,
        subjectId: 7,
        userId: 1,
        content: 'Final spoken turn'
      }
    ],
    10,
    7
  );
  assert.deepEqual(
    store.getAssistantTranscript(10, 7).map((row) => row.content),
    ['Edited', 'Final spoken turn', 'Before 4']
  );
  store.seedAssistantTranscript([], 10, 7);
  assert.deepEqual(store.getAssistantTranscript(10, 7), []);
  emit('new_message_received', {
    message: {
      id: 5,
      channelId: 10,
      subjectId: 7,
      userId: 1,
      content: 'Deleted while offline'
    }
  });
  store.seedAssistantTranscript(
    [
      {
        id: 2,
        channelId: 10,
        subjectId: 7,
        userId: 1,
        content: 'Last remaining turn'
      }
    ],
    10,
    7,
    5
  );
  assert.deepEqual(
    store.getAssistantTranscript(10, 7).map((row) => row.id),
    [2]
  );
});

test('a delayed send consumes only its original attachment after switching assistants', () => {
  const dock = compile('src/containers/App/AssistantDock/dockState.ts', {});
  const original = { kind: 'page', label: 'Original' },
    other = { kind: 'page', label: 'New question' };
  dock.openAssistantDock('Ciel', original, 7);
  dock.openAssistantDock('Zero', other, 0);
  dock.consumeAssistantAskContext('Ciel', 7, original);
  assert.equal(dock.getAssistantAskContext(), other);
  dock.openAssistantDock('Ciel', undefined, 7);
  assert.equal(dock.getAssistantAskContext(), null);
});

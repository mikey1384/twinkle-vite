import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getCanonicalGeneratingAiMessageId,
  getCanonicalAiGenerationStartedAt,
  isActiveAiStreamMessage,
  isCanonicalAiGenerationConfirmed,
  reconcileCanonicalAiGenerationReceipt,
  reconcileCanonicalGeneratingAiMessagePage,
  reconcileCanonicalStreamingMessageId
} from '../src/contexts/Chat/aiGenerationState';

const ZERO_TWINKLE_ID = 2;
const CIEL_TWINKLE_ID = 3;
const assistantUserIds = [ZERO_TWINKLE_ID, CIEL_TWINKLE_ID];

const messagesContainerSource = readFileSync(
  new URL(
    '../src/containers/Chat/Body/MessagesContainer/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const textMessageSource = readFileSync(
  new URL(
    '../src/containers/Chat/Message/MessageBody/TextMessage/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const reducerSource = readFileSync(
  new URL('../src/contexts/Chat/reducer.ts', import.meta.url),
  'utf8'
);
const aiSocketSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useAISocket.ts',
    import.meta.url
  ),
  'utf8'
);
const chatRequestHelperSource = readFileSync(
  new URL('../src/contexts/requestHelpers/chat.ts', import.meta.url),
  'utf8'
);
const chatActionSource = readFileSync(
  new URL('../src/contexts/Chat/actions.ts', import.meta.url),
  'utf8'
);

test('the AI generation chat surface remains valid executable TSX', () => {
  assert.doesNotThrow(() =>
    parse(messagesContainerSource, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })
  );
});

function readReducerCase(caseName: string, nextCaseName: string) {
  const start = reducerSource.indexOf(`case '${caseName}':`);
  const end = reducerSource.indexOf(`case '${nextCaseName}':`, start + 1);
  assert.ok(start >= 0, `Missing reducer case ${caseName}`);
  assert.ok(end > start, `Missing reducer case after ${caseName}`);
  return reducerSource.slice(start, end);
}

test('canonical generating settings restore the latest active message id', () => {
  const messages = [
    {
      id: 10,
      userId: ZERO_TWINKLE_ID,
      settings: { aiGenerationStatus: 'generating' }
    },
    { id: 11, settings: {} },
    {
      id: 12,
      userId: CIEL_TWINKLE_ID,
      settings: JSON.stringify({ aiGenerationStatus: 'generating' })
    }
  ];
  assert.equal(
    getCanonicalGeneratingAiMessageId({ messages, assistantUserIds }),
    12
  );
});

test('only server-confirmed assistant generation markers gate chat', () => {
  assert.equal(
    getCanonicalGeneratingAiMessageId({
      assistantUserIds,
      messages: [
        {
          id: 20,
          userId: 999,
          settings: { aiGenerationStatus: 'generating' }
        },
        {
          id: 21,
          userId: ZERO_TWINKLE_ID,
          content: 'Canonical answer',
          settings: {}
        },
        {
          id: 22,
          userId: CIEL_TWINKLE_ID,
          filePath: 'private/generated/report.pdf',
          settings: {}
        }
      ]
    }),
    null
  );
});

test('canonical message pages preserve out-of-scope generation and settle in-scope generation', () => {
  assert.equal(
    reconcileCanonicalGeneratingAiMessagePage({
      currentMessageId: 20,
      messages: [{ id: 21, settings: {} }],
      assistantUserIds
    }),
    20
  );
  assert.equal(
    reconcileCanonicalGeneratingAiMessagePage({
      currentMessageId: 20,
      messages: [{ id: 20, settings: { hasError: true } }],
      assistantUserIds
    }),
    null
  );
  assert.equal(
    reconcileCanonicalGeneratingAiMessagePage({
      currentMessageId: 30,
      messages: [
        {
          id: 25,
          userId: ZERO_TWINKLE_ID,
          settings: { aiGenerationStatus: 'generating' }
        }
      ],
      assistantUserIds
    }),
    30,
    'an older partial-page generation cannot steal a newer out-of-page stream'
  );
  assert.equal(
    reconcileCanonicalGeneratingAiMessagePage({
      currentMessageId: 30,
      messages: [
        {
          id: 35,
          userId: CIEL_TWINKLE_ID,
          settings: { aiGenerationStatus: 'generating' }
        }
      ],
      assistantUserIds
    }),
    35,
    'a newer canonical page generation supersedes older local ownership'
  );
});

test('a canonical per-message terminal snapshot clears the interaction gate', () => {
  assert.equal(
    reconcileCanonicalStreamingMessageId({
      currentMessageId: 30,
      messageId: 30,
      newState: { settings: { aiGenerationStatus: 'generating' } }
    }),
    30
  );
  assert.equal(
    reconcileCanonicalStreamingMessageId({
      currentMessageId: 30,
      messageId: 30,
      newState: { settings: { hasError: true } },
      assistantUserIds,
      messages: [
        {
          id: 29,
          userId: ZERO_TWINKLE_ID,
          content: 'Confirmed partial stream',
          settings: { aiGenerationStatus: 'generating' }
        },
        {
          id: 30,
          userId: CIEL_TWINKLE_ID,
          settings: { aiGenerationStatus: 'generating' }
        }
      ]
    }),
    29,
    'settling the latest reply restores another confirmed active generation'
  );
});

test('successive confirmed cancellation deletions cannot resurrect an older generation', () => {
  let cachedMessages = [
    {
      id: 30,
      userId: ZERO_TWINKLE_ID,
      settings: { aiGenerationStatus: 'generating' }
    },
    {
      id: 31,
      userId: ZERO_TWINKLE_ID,
      settings: { aiGenerationStatus: 'generating' }
    }
  ];

  cachedMessages = cachedMessages.filter((message) => message.id !== 30);
  assert.equal(
    reconcileCanonicalStreamingMessageId({
      currentMessageId: 31,
      messageId: 31,
      newState: { settings: {} },
      assistantUserIds,
      messages: cachedMessages
    }),
    null
  );

  const deleteMessageCase = readReducerCase(
    'DELETE_MESSAGE',
    'DISPLAY_ATTACHED_FILE'
  );
  assert.match(
    deleteMessageCase,
    /const nextMessagesObj = \{ \.\.\.prevChannelObj\?\.messagesObj \};[\s\S]*?delete nextMessagesObj\[action\.messageId\];/
  );
  assert.match(
    deleteMessageCase,
    /messages: Object\.values\(nextMessagesObj\)[\s\S]*?messagesObj: nextMessagesObj/
  );
});

test('canonical generation timing comes from server message state', () => {
  assert.equal(
    getCanonicalAiGenerationStartedAt({
      timeStamp: 40,
      settings: { aiGenerationStartedAt: 50 }
    }),
    50
  );
  assert.equal(
    isCanonicalAiGenerationConfirmed({
      settings: JSON.stringify({ aiGenerationStatus: 'generating' })
    }),
    true
  );
  assert.equal(
    isCanonicalAiGenerationConfirmed({ settings: { hasError: true } }),
    false
  );
});

test('stream projections belong only to the active canonical generation', () => {
  assert.equal(
    isActiveAiStreamMessage({ currentMessageId: 40, messageId: 40 }),
    true
  );
  assert.equal(
    isActiveAiStreamMessage({ currentMessageId: 41, messageId: 40 }),
    false
  );
  assert.equal(
    isActiveAiStreamMessage({ currentMessageId: null, messageId: 40 }),
    false
  );
  assert.equal(
    isActiveAiStreamMessage({ currentMessageId: 40, messageId: 0 }),
    false
  );
  assert.equal(
    reconcileCanonicalAiGenerationReceipt({
      currentMessageId: 40,
      message: {
        id: 41,
        settings: { aiGenerationStatus: 'generating' }
      }
    }),
    41
  );
  assert.equal(
    reconcileCanonicalAiGenerationReceipt({
      currentMessageId: 41,
      message: {
        id: 40,
        settings: { aiGenerationStatus: 'generating' }
      }
    }),
    41,
    'an older confirmed placeholder cannot reclaim a newer stream slot'
  );
  assert.equal(
    reconcileCanonicalAiGenerationReceipt({
      currentMessageId: 41,
      message: { id: 42, settings: {} }
    }),
    42,
    'a canonical legacy placeholder receipt remains compatible during rollout'
  );
  assert.equal(
    reconcileCanonicalAiGenerationReceipt({
      currentMessageId: 42,
      message: {
        id: 43,
        content: 'Canonical answer',
        settings: {}
      }
    }),
    42,
    'a terminal message cannot claim streaming ownership'
  );
  assert.equal(
    reconcileCanonicalAiGenerationReceipt({
      currentMessageId: 42,
      message: { id: 44, settings: { hasError: true } }
    }),
    42,
    'a failed message cannot claim streaming ownership'
  );

  assert.match(
    readReducerCase(
      'APPEND_AI_MESSAGE_DELTA',
      'CONFIRM_CANONICAL_AI_GENERATION'
    ),
    /isActiveAiStreamMessage/
  );
  assert.match(
    readReducerCase(
      'CONFIRM_CANONICAL_AI_GENERATION',
      'FINISH_AI_MESSAGE'
    ),
    /reconcileCanonicalAiGenerationReceipt/
  );
  assert.match(
    readReducerCase('EDIT_MESSAGE', 'APPLY_AI_GENERATED_DEFINITIONS'),
    /action\.isAIStreamProjection[\s\S]*?isActiveAiStreamMessage/
  );
  assert.match(
    readReducerCase('UPDATE_AI_THINKING_STATUS', 'UPDATE_AI_THOUGHT_STREAM'),
    /isActiveAiStreamMessage/
  );
  assert.match(
    readReducerCase('UPDATE_AI_THOUGHT_STREAM', 'UPDATE_AI_GENERATED_FILE'),
    /isActiveAiStreamMessage/
  );
  assert.match(
    chatActionSource,
    /onEditMessage\(\{[\s\S]*?isAIStreamProjection[\s\S]*?type: 'EDIT_MESSAGE'[\s\S]*?isAIStreamProjection/
  );
  assert.match(
    aiSocketSource,
    /onConfirmCanonicalAIGeneration\(\{ channelId, message \}\)[\s\S]*?existingPendingReply[\s\S]*?message\.id[\s\S]*?>=\s*Number\(existingPendingReply\.messageId/
  );
});

test('Think Hard deltas reconcile by canonical stream offset in the thought reducer', () => {
  const confirmGenerationCase = readReducerCase(
    'CONFIRM_CANONICAL_AI_GENERATION',
    'FINISH_AI_MESSAGE'
  );
  const thoughtStreamCase = readReducerCase(
    'UPDATE_AI_THOUGHT_STREAM',
    'UPDATE_AI_GENERATED_FILE'
  );

  assert.doesNotMatch(confirmGenerationCase, /currentThoughtContent/);
  assert.match(
    thoughtStreamCase,
    /const currentThoughtContent = String\([\s\S]*?applyCanonicalTextStreamUpdate\(\{[\s\S]*?startOffset: action\.startOffset[\s\S]*?aiThoughtContent: nextThoughtContent/
  );
});

test('the UI polls canonical state for lost ownership and never infers streaming from last-message position', () => {
  assert.match(
    messagesContainerSource,
    /currentlyStreamingAIMsgId[\s\S]*?loadChatMessage[\s\S]*?isCanonicalAiGenerationConfirmed\(canonicalMessage\)[\s\S]*?onSetMessageState/
  );
  assert.match(
    messagesContainerSource,
    /loadChatMessage\(\{[\s\S]*?fromWriter: true[\s\S]*?error\?\.status[\s\S]*?=== 404[\s\S]*?onDeleteMessage/
  );
  assert.match(
    chatRequestHelperSource,
    /fromWriter = false[\s\S]*?queryParams\.set\('fromWriter', 'true'\)/
  );
  assert.match(
    textMessageSource,
    /isGenerationConfirmed \|\| isCurrentlyStreaming/
  );
  const compactIndicatorStart = textMessageSource.indexOf(
    'const showCompactIndicator'
  );
  const compactIndicatorEnd = textMessageSource.indexOf(
    'const Prefix',
    compactIndicatorStart
  );
  assert(
    compactIndicatorStart >= 0 && compactIndicatorEnd > compactIndicatorStart
  );
  assert.doesNotMatch(
    textMessageSource.slice(compactIndicatorStart, compactIndicatorEnd),
    /isLastMsg/
  );
  assert.doesNotMatch(
    textMessageSource,
    /showFullIndicator[\s\S]{0,180}isLastMsg/
  );
  assert.match(
    reducerSource,
    /EDIT_MESSAGE[\s\S]*?action\.settings === undefined[\s\S]*?reconcileCanonicalStreamingMessageId/
  );
  assert.match(
    aiSocketSource,
    /handleAIMessageDone\(channelId: number, messageId\?: number\)[\s\S]*?onFinishAIMessage\(\{[\s\S]*?messageId: normalizedMessageId \|\| undefined/
  );
  assert.match(
    reducerSource,
    /FINISH_AI_MESSAGE[\s\S]*?currentlyStreamingAIMsgId[\s\S]*?reconcileCanonicalStreamingMessageId/
  );
  assert.match(
    reducerSource,
    /case 'DELETE_MESSAGE'[\s\S]*?currentlyStreamingAIMsgId: reconcileCanonicalStreamingMessageId/
  );
});

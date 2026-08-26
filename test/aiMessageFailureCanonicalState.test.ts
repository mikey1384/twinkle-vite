import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanonicalAiMessageFailure } from '../src/contexts/Chat/aiMessageFailureState';

test('canonical AI failure settings replace the visible root message state', () => {
  const channel = {
    messagesObj: {
      41: { id: 41, content: '', settings: {} }
    }
  };
  const settings = { hasError: true, errorType: 'general' };
  const nextChannel = applyCanonicalAiMessageFailure({
    channel,
    messageId: 41,
    content: '',
    settings
  });

  assert.notEqual(nextChannel, channel);
  assert.deepEqual(nextChannel.messagesObj[41].settings, settings);
  assert.equal(nextChannel.messagesObj[41].content, '');
  assert.deepEqual(channel.messagesObj[41].settings, {});
});

test('canonical AI terminal state replaces a transient projection on failure', () => {
  const channel = {
    messagesObj: {
      43: { id: 43, content: 'Transient streamed text', settings: {} }
    }
  };
  const nextChannel = applyCanonicalAiMessageFailure({
    channel,
    messageId: 43,
    content: '',
    settings: { hasError: true, errorType: 'general' }
  });

  assert.equal(nextChannel.messagesObj[43].content, '');
  assert.equal(nextChannel.messagesObj[43].settings.hasError, true);
});

test('canonical cancellation preserves only the server-confirmed partial reply', () => {
  const channel = {
    messagesObj: {
      44: { id: 44, content: 'Transient extra bytes', settings: {} }
    }
  };
  const settings = {
    hasError: false,
    aiGenerationStatus: 'cancelled'
  };
  const nextChannel = applyCanonicalAiMessageFailure({
    channel,
    messageId: 44,
    content: 'Confirmed partial reply',
    settings
  });

  assert.equal(nextChannel.messagesObj[44].content, 'Confirmed partial reply');
  assert.deepEqual(nextChannel.messagesObj[44].settings, settings);
});

test('canonical AI failure settings cover subchannel messages without inventing a missing message', () => {
  const channel = {
    messagesObj: {},
    subchannelObj: {
      7: {
        messagesObj: {
          42: { id: 42, content: '' }
        }
      }
    }
  };
  const settings = { hasError: true, errorType: 'moderation' };
  const nextChannel = applyCanonicalAiMessageFailure({
    channel,
    messageId: 42,
    settings
  });

  assert.deepEqual(
    nextChannel.subchannelObj[7].messagesObj[42].settings,
    settings
  );
  assert.equal(
    applyCanonicalAiMessageFailure({
      channel,
      messageId: 999,
      settings
    }),
    channel
  );
});

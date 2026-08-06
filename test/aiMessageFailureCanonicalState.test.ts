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
    settings
  });

  assert.notEqual(nextChannel, channel);
  assert.deepEqual(nextChannel.messagesObj[41].settings, settings);
  assert.deepEqual(channel.messagesObj[41].settings, {});
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

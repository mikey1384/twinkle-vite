import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisibleChatReadMessageId } from '../src/helpers/chatReadCursor';

test('an arriving confirmed message advances the read boundary before local insertion', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: { id: 103, channelId: 7, subchannelId: 0 },
      subchannelId: 0,
      visibleMessageIds: [101, 102],
      visibleMessagesObj: {
        101: { id: 101, channelId: 7, subchannelId: 0 },
        102: { id: 102, channelId: 7, subchannelId: 0 }
      }
    }),
    103
  );
});

test('a delayed confirmed event cannot move an already visible read boundary backward', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: { id: 101, channelId: 7, subchannelId: 0 },
      subchannelId: 0,
      visibleMessageIds: [102, 103],
      visibleMessagesObj: {
        102: { id: 102, channelId: 7, subchannelId: 0 },
        103: { id: 103, channelId: 7, subchannelId: 0 }
      }
    }),
    103
  );
});

test('invalid message ids cannot become a canonical read boundary', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: {
        id: 'not-an-id',
        channelId: 7,
        subchannelId: 0
      },
      subchannelId: 0,
      visibleMessageIds: [undefined, -1, 0]
    }),
    0
  );
});

test('a channel-wide subchannel preview cannot become the Main read boundary', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: { id: 103, channelId: 7, subchannelId: 0 },
      subchannelId: 0,
      visibleMessageIds: [205, 102],
      visibleMessagesObj: {
        102: { id: 102, channelId: 7, subchannelId: 0 },
        205: { id: 205, channelId: 7, subchannelId: 9 }
      }
    }),
    103
  );
});

test('a stale message from another channel cannot become a scoped read boundary', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      subchannelId: 0,
      visibleMessageIds: [205],
      visibleMessagesObj: {
        205: { id: 205, channelId: 8, subchannelId: 0 }
      }
    }),
    0
  );
});

test('an arriving boundary carries canonical scope proof instead of trusting a bare id', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: { id: 205, channelId: 8, subchannelId: 0 },
      subchannelId: 0
    }),
    0
  );
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: { id: 205, channelId: 7, subchannelId: 9 },
      subchannelId: 0
    }),
    0
  );
  assert.equal(
    getVisibleChatReadMessageId({
      channelId: 7,
      confirmedMessage: 205,
      subchannelId: 0
    }),
    0
  );
});

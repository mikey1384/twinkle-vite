import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisibleChatReadMessageId } from '../src/helpers/chatReadCursor';

test('an arriving confirmed message advances the read boundary before local insertion', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      confirmedMessageId: 103,
      visibleMessageIds: [101, 102]
    }),
    103
  );
});

test('a delayed confirmed event cannot move an already visible read boundary backward', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      confirmedMessageId: 101,
      visibleMessageIds: [102, 103]
    }),
    103
  );
});

test('invalid message ids cannot become a canonical read boundary', () => {
  assert.equal(
    getVisibleChatReadMessageId({
      confirmedMessageId: 'not-an-id',
      visibleMessageIds: [undefined, -1, 0]
    }),
    0
  );
});

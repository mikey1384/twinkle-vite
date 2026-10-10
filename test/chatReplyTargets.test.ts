import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHAT_MESSAGE_KINDS,
  CHAT_MESSAGE_KIND_RULES
} from '../src/helpers/chatMessageCapabilities';
import {
  REPLY_TARGET_ENTRIES,
  describeModeration,
  getReplyTargetSummary
} from '../src/containers/Chat/Message/MessageBody/replyTargetSummary';
import { clearDeletedReplyTargets } from '../src/helpers/chatReplyTargetDeletion';

const context = {
  myId: 8,
  usernameOf: (id: number) => ({ 7: 'LG_Twins', 8: 'mikey' })[id]
};

test('every message kind has one quote entry, and it agrees with the reply rule', () => {
  assert.deepEqual(
    Object.keys(REPLY_TARGET_ENTRIES).sort(),
    [...CHAT_MESSAGE_KINDS].sort()
  );
  assert.deepEqual(
    Object.keys(CHAT_MESSAGE_KIND_RULES).sort(),
    [...CHAT_MESSAGE_KINDS].sort()
  );
  for (const kind of CHAT_MESSAGE_KINDS) {
    const replyable = CHAT_MESSAGE_KIND_RULES[kind].interactive;
    assert.equal(
      REPLY_TARGET_ENTRIES[kind] !== 'notReplyable',
      replyable,
      `${kind}: quote entry and reply rule disagree`
    );
  }
});

test('a quoted trade names its id, parties, items and its current status', () => {
  const tradeMessage = {
    id: 1,
    userId: 7,
    username: 'LG_Twins',
    transactionId: 33301,
    transactionDetails: {
      id: 33301,
      type: 'trade',
      from: 7,
      to: 8,
      offer: { coins: 0, cardIds: [11], groupIds: [], buildIds: [] },
      want: { coins: 0, cardIds: [], groupIds: [], buildIds: [21, 22] }
    }
  };
  assert.deepEqual(getReplyTargetSummary(tradeMessage, context), {
    icon: 'exchange-alt',
    label: 'Trade offer #33301',
    detail: 'LG_Twins → you · 1 card ↔ 2 apps'
  });
  // Accepted later (live socket state): the quote stops saying "offer".
  assert.equal(
    getReplyTargetSummary(tradeMessage, {
      ...context,
      tradeOutcome: () => ({ isAccepted: true })
    })?.label,
    'Trade completed #33301'
  );
  // Declined, as hydrated by the API on reload.
  assert.equal(
    getReplyTargetSummary(
      {
        ...tradeMessage,
        transactionDetails: {
          ...tradeMessage.transactionDetails,
          isCancelled: true,
          cancelReason: 'decline'
        }
      },
      context
    )?.label,
    'Offer declined #33301'
  );
});

test('a quoted game result names the winner and never spells out a loss', () => {
  const summary = getReplyTargetSummary(
    { id: 2, userId: 7, isChessMsg: 1, gameWinnerId: 7 },
    context
  );
  assert.equal(summary?.label, 'LG_Twins won the chess match');
  assert.doesNotMatch(JSON.stringify(summary), /lost|fail|in time|miss/i);
  assert.equal(
    getReplyTargetSummary({ id: 3, isChessMsg: 1, isDraw: 1 }, context)?.label,
    'The chess match ended in a draw'
  );
});

test('quoted notices and cards each get a compact summary', () => {
  assert.equal(
    getReplyTargetSummary(
      { id: 4, rootType: 'approval', rootId: 9, isNotification: 1 },
      context
    )?.label,
    'Approval request'
  );
  assert.deepEqual(
    getReplyTargetSummary(
      { id: 5, rootType: 'modification', rootId: 12, isNotification: 1 },
      context
    ),
    { icon: 'user-shield', label: 'Moderator action', moderationId: 12 }
  );
  assert.equal(
    getReplyTargetSummary(
      {
        id: 6,
        rootType: 'meetupTeacherRequest',
        rootId: 3,
        settings: JSON.stringify({
          meetupTeacherRequest: { teacherUsername: 'msKim', crewName: 'Orbit' }
        })
      },
      context
    )?.label,
    'Asked msKim to be the grown-up for Orbit'
  );
  assert.equal(
    getReplyTargetSummary(
      { id: 7, userId: 8, isDrawOffer: 1, isChessMsg: 1 },
      context
    )?.label,
    'You offered a draw'
  );
  // A member's own message is quoted by its text, not a summary.
  assert.equal(getReplyTargetSummary({ id: 8, content: 'hi' }, context), null);
});

test('a quoted moderator notice reads like the notice, clipped', () => {
  assert.equal(
    describeModeration({
      action: 'delete',
      isChat: false,
      author: 'PigBar',
      body: '1111'
    }),
    'Deleted post by PigBar: 1111'
  );
  const long = describeModeration({
    action: 'edit',
    isChat: true,
    author: 'Minecrarft_guy',
    body: 'x'.repeat(200)
  });
  assert.match(long, /^Edited chat message by Minecrarft_guy: x+…$/);
  assert.ok(long.length < 120);
});

test('deleting a message clears the quotes of it in loaded replies', () => {
  const messagesObj: Record<string, any> = {
    10: { id: 10, content: 'secret' },
    11: {
      id: 11,
      targetMessageId: 10,
      targetMessage: { id: 10, content: 'secret' }
    },
    12: { id: 12, targetMessage: { id: 99 } }
  };
  clearDeletedReplyTargets(messagesObj, 10);
  assert.equal(messagesObj[11].targetMessage, null);
  assert.equal(messagesObj[11].targetMessageId, 10);
  assert.deepEqual(messagesObj[12].targetMessage, { id: 99 });
});

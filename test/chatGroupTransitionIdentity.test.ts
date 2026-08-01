import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCanonicalChannelOwnerTransition,
  applyCanonicalGroupInvitation,
  applyCanonicalGroupMemberJoin,
  applyCanonicalGroupMemberDeparture
} from '../src/contexts/Chat/groupTransitionState';
import {
  emitAcceptedChatGroupMembership,
  mergeCanonicalGroupMemberIds,
  mergeCanonicalGroupMembers,
  normalizeClassInviteResponse
} from '../src/helpers/chatGroupMembership';

function baseState() {
  return {
    selectedChannelId: 10,
    channelsObj: {
      10: {
        id: 10,
        creatorId: 1,
        allMemberIds: [1, 2],
        members: [
          { id: 1, username: 'owner' },
          { id: 2, username: 'member' }
        ],
        messageIds: [50],
        messagesObj: {
          50: { id: 50, channelId: 10, content: 'earlier' }
        }
      }
    }
  } as any;
}

test('canonical owner response applies the owner and persisted message once', () => {
  const transition = {
    creatorId: 2,
    newOwner: { id: 2, username: 'member' },
    message: {
      id: 99,
      channelId: 10,
      userId: 1,
      content: 'Made member the new owner of this channel',
      isNotification: true,
      notificationType: 'owner_change'
    }
  };

  const first = applyCanonicalChannelOwnerTransition({
    channel: baseState().channelsObj[10],
    ...transition
  });
  const replay = applyCanonicalChannelOwnerTransition({
    channel: first,
    ...transition
  });

  assert.equal(first.creatorId, 2);
  assert.deepEqual(first.messageIds, [99, 50]);
  assert.equal(first.messagesObj[99].id, 99);
  assert.deepEqual(replay.messageIds, [99, 50]);
});

test('member-left event removes membership without synthesizing a message', () => {
  const next = applyCanonicalGroupMemberDeparture({
    channel: baseState().channelsObj[10],
    userId: 2
  });

  assert.deepEqual(next.allMemberIds, [1]);
  assert.deepEqual(
    next.members.map(({ id }: { id: number }) => id),
    [1]
  );
  assert.deepEqual(next.messageIds, [50]);
  assert.deepEqual(Object.keys(next.messagesObj), ['50']);
});

test('invite response and socket race converge on one message and member', () => {
  const invitation = {
    message: {
      id: 99,
      channelId: 10,
      content: 'invited new-member to this chat group'
    },
    newMembers: [{ id: 3, username: 'new-member' }]
  };
  const fromSocket = applyCanonicalGroupInvitation({
    channel: baseState().channelsObj[10],
    ...invitation
  });
  const afterHttpResponse = applyCanonicalGroupInvitation({
    channel: fromSocket,
    ...invitation
  });

  assert.deepEqual(afterHttpResponse.messageIds, [99, 50]);
  assert.deepEqual(afterHttpResponse.allMemberIds, [1, 2, 3]);
  assert.deepEqual(
    afterHttpResponse.members.map(({ id }: { id: number }) => id),
    [3, 1, 2]
  );
});

test('member-joined event is message-free and idempotent', () => {
  const member = { id: 3, username: 'new-member' };
  const first = applyCanonicalGroupMemberJoin({
    channel: baseState().channelsObj[10],
    member
  });
  const replay = applyCanonicalGroupMemberJoin({ channel: first, member });

  assert.deepEqual(replay.allMemberIds, [1, 2, 3]);
  assert.deepEqual(
    replay.members.map(({ id }: { id: number }) => id),
    [3, 1, 2]
  );
  assert.deepEqual(replay.messageIds, [50]);
  assert.deepEqual(Object.keys(replay.messagesObj), ['50']);
});

test('member event and private join message converge on one member id', () => {
  const member = { id: 3, username: 'new-member' };
  const afterMemberEvent = applyCanonicalGroupMemberJoin({
    channel: baseState().channelsObj[10],
    member
  });
  const afterPrivateJoinMessage = mergeCanonicalGroupMemberIds({
    allMemberIds: afterMemberEvent.allMemberIds,
    members: [member]
  });
  const eventFirstMembers = mergeCanonicalGroupMembers({
    members: afterMemberEvent.members,
    newMembers: [member]
  });
  const messageFirstMembers = applyCanonicalGroupMemberJoin({
    channel: {
      ...baseState().channelsObj[10],
      members: mergeCanonicalGroupMembers({
        members: baseState().channelsObj[10].members,
        newMembers: [member]
      })
    },
    member
  }).members;

  assert.deepEqual(afterPrivateJoinMessage, [1, 2, 3]);
  assert.deepEqual(eventFirstMembers, messageFirstMembers);
});

test('current accept response joins the room without relaying the server message', () => {
  const emissions: Array<{ eventName: string; args: any[] }> = [];
  const response = {
    membershipChanged: true,
    channel: {
      id: 10,
      channelName: 'Group',
      pathId: 10010,
      members: [{ id: 3, username: 'new-member' }]
    },
    joinMessage: { id: 99, channelId: 10, content: 'joined the chat group' }
  };

  emitAcceptedChatGroupMembership({
    response,
    memberId: 3,
    socket: {
      emit(eventName: string, ...args: any[]) {
        emissions.push({ eventName, args });
      }
    }
  });

  assert.deepEqual(emissions, [
    { eventName: 'join_chat_group', args: [10] }
  ]);
});

test('legacy accept response relays its committed join exactly once', () => {
  const emissions: Array<{ eventName: string; args: any[] }> = [];
  const member = { id: 3, username: 'new-member' };
  const response = {
    channel: {
      id: 10,
      channelName: 'Group',
      pathId: 10010,
      members: [member]
    },
    joinMessage: {
      channelId: 10,
      userId: 3,
      content: 'joined the chat group',
      timeStamp: 1000
    },
    messagesObj: {
      99: {
        id: 99,
        channelId: 10,
        userId: 3,
        content: 'joined the chat group',
        timeStamp: 1000
      }
    }
  };

  emitAcceptedChatGroupMembership({
    response,
    memberId: 3,
    socket: {
      emit(eventName: string, ...args: any[]) {
        emissions.push({ eventName, args });
      }
    }
  });

  assert.deepEqual(
    emissions.map(({ eventName }) => eventName),
    ['join_chat_group', 'new_chat_message']
  );
  assert.equal(emissions[1].args[0].message.id, 99);
  assert.deepEqual(emissions[1].args[0].newMembers, [member]);
});

test('class invite normalization relays only older-worker responses', () => {
  const requestedMembers = [{ id: 3, username: 'new-member' }];
  const message = { id: 99, channelId: 10, content: 'invited new-member' };

  const legacy = normalizeClassInviteResponse({
    response: { message },
    requestedMembers
  });
  const current = normalizeClassInviteResponse({
    response: { changed: true, message, newMembers: requestedMembers },
    requestedMembers
  });
  const replay = normalizeClassInviteResponse({
    response: { changed: false, message: null, newMembers: [] },
    requestedMembers
  });

  assert.equal(legacy.relayLegacyMembership, true);
  assert.deepEqual(legacy.newMembers, requestedMembers);
  assert.equal(current.relayLegacyMembership, false);
  assert.equal(current.changed, true);
  assert.equal(replay.relayLegacyMembership, false);
  assert.equal(replay.changed, false);
});

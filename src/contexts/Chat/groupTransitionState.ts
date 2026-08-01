import {
  mergeCanonicalGroupMemberIds,
  mergeCanonicalGroupMembers
} from '~/helpers/chatGroupMembership';

export function applyCanonicalChannelOwnerTransition({
  channel,
  creatorId,
  message,
  newOwner
}: {
  channel: any;
  creatorId: number;
  message?: any;
  newOwner: any;
}) {
  const members = [...(channel.members || [])];
  const existingMemberIndex = members.findIndex(
    (member) => Number(member.id) === Number(newOwner.id)
  );
  if (existingMemberIndex >= 0) {
    members[existingMemberIndex] = {
      ...members[existingMemberIndex],
      ...newOwner
    };
  } else if (newOwner.username) {
    members.unshift(newOwner);
  }

  const allMemberIds = [
    Number(newOwner.id),
    ...(channel.allMemberIds || [])
      .map(Number)
      .filter((memberId: number) => memberId !== Number(newOwner.id))
  ];
  const messageId = message?.id;
  const messageIds = messageId
    ? (channel.messageIds || []).some(
        (existingMessageId: number | string) =>
          String(existingMessageId) === String(messageId)
      )
      ? channel.messageIds
      : [messageId, ...(channel.messageIds || [])]
    : channel.messageIds;

  return {
    ...channel,
    creatorId,
    members,
    allMemberIds,
    messageIds,
    messagesObj: messageId
      ? {
          ...channel.messagesObj,
          [messageId]: {
            ...channel.messagesObj?.[messageId],
            ...message
          }
        }
      : channel.messagesObj
  };
}

export function applyCanonicalGroupMemberDeparture({
  channel,
  userId
}: {
  channel: any;
  userId: number;
}) {
  return {
    ...channel,
    allMemberIds: (channel.allMemberIds || []).filter(
      (memberId: number) => Number(memberId) !== Number(userId)
    ),
    members: (channel.members || []).filter(
      (member: { id: number }) => Number(member.id) !== Number(userId)
    )
  };
}

export function applyCanonicalGroupMemberJoin({
  channel,
  member
}: {
  channel: any;
  member: any;
}) {
  const memberId = Number(member.id);
  const members = mergeCanonicalGroupMembers({
    members: channel.members || [],
    newMembers: [member]
  });

  return {
    ...channel,
    members,
    allMemberIds: mergeCanonicalGroupMemberIds({
      allMemberIds: channel.allMemberIds || [],
      members: [{ id: memberId }]
    })
  };
}

export function applyCanonicalGroupInvitation({
  channel,
  message,
  newMembers
}: {
  channel: any;
  message: any;
  newMembers: any[];
}) {
  const members = mergeCanonicalGroupMembers({
    members: channel.members || [],
    newMembers: newMembers || []
  });
  const allMemberIds = mergeCanonicalGroupMemberIds({
    allMemberIds: channel.allMemberIds || [],
    members: newMembers || []
  });
  const messageId = message?.id;
  const messageIds = messageId
    ? (channel.messageIds || []).some(
        (existingMessageId: number | string) =>
          String(existingMessageId) === String(messageId)
      )
      ? channel.messageIds
      : [messageId, ...(channel.messageIds || [])]
    : channel.messageIds;
  return {
    ...channel,
    members,
    allMemberIds,
    messageIds,
    messagesObj: messageId
      ? {
          ...channel.messagesObj,
          [messageId]: {
            ...channel.messagesObj?.[messageId],
            ...message
          }
        }
      : channel.messagesObj
  };
}

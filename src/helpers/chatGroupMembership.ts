interface ChatGroupMember {
  id: number;
  username?: string;
  profilePicUrl?: string | null;
  [key: string]: any;
}

interface ChatGroupChannel {
  id: number;
  channelName?: string;
  pathId?: number;
  members?: ChatGroupMember[];
  [key: string]: any;
}

interface AcceptedChatGroupResponse {
  channel: ChatGroupChannel;
  joinMessage?: any;
  messagesObj?: Record<string | number, any>;
  membershipChanged?: boolean;
  [key: string]: any;
}

interface ClassInviteResponse {
  changed?: boolean;
  message?: any;
  newMembers?: ChatGroupMember[];
  [key: string]: any;
}

type Emit = (eventName: string, ...args: any[]) => void;

export function mergeCanonicalGroupMemberIds({
  allMemberIds,
  members
}: {
  allMemberIds: Array<number | string>;
  members: Array<{ id: number | string }>;
}) {
  return Array.from(
    new Set([
      ...(allMemberIds || []).map(Number),
      ...(members || []).map(({ id }) => Number(id))
    ])
  );
}

export function mergeCanonicalGroupMembers({
  members,
  newMembers
}: {
  members: Array<{ id: number | string; [key: string]: any }>;
  newMembers: Array<{ id: number | string; [key: string]: any }>;
}) {
  const existingMemberById = new Map(
    (members || []).map((member) => [Number(member.id), member])
  );
  const canonicalNewMembers = Array.from(
    new Map(
      (newMembers || []).map((member) => [Number(member.id), member])
    ).values()
  );
  const newMemberIds = new Set(
    canonicalNewMembers.map((member) => Number(member.id))
  );
  return [
    ...canonicalNewMembers.map((member) => ({
      ...existingMemberById.get(Number(member.id)),
      ...member
    })),
    ...(members || []).filter(
      (member) => !newMemberIds.has(Number(member.id))
    )
  ];
}

export function normalizeClassInviteResponse({
  response,
  requestedMembers
}: {
  response: ClassInviteResponse;
  requestedMembers: ChatGroupMember[];
}) {
  const isLegacyResponse = !Object.prototype.hasOwnProperty.call(
    response,
    'changed'
  );
  const message = response.message || null;
  const newMembers = isLegacyResponse
    ? requestedMembers
    : Array.isArray(response.newMembers)
      ? response.newMembers
      : [];
  const changed = isLegacyResponse ? Boolean(message) : Boolean(response.changed);

  return {
    changed,
    message,
    newMembers,
    relayLegacyMembership: isLegacyResponse && changed
  };
}

export function emitAcceptedChatGroupMembership({
  response,
  memberId,
  fallbackMember,
  socket,
  markLegacyMessageLoaded = false
}: {
  response: AcceptedChatGroupResponse;
  memberId: number;
  fallbackMember?: ChatGroupMember;
  socket: { emit: Emit };
  markLegacyMessageLoaded?: boolean;
}) {
  const channelId = Number(response.channel?.id || 0);
  if (!channelId) return;

  socket.emit('join_chat_group', channelId);

  const isLegacyResponse = !Object.prototype.hasOwnProperty.call(
    response,
    'membershipChanged'
  );
  if (!isLegacyResponse || !response.joinMessage) return;

  const canonicalMember = response.channel.members?.find(
    (member) => Number(member.id) === Number(memberId)
  );
  const member = canonicalMember || fallbackMember || { id: memberId };
  const legacyJoinMessage = getCanonicalLegacyJoinMessage(response);
  socket.emit('new_chat_message', {
    message: markLegacyMessageLoaded
      ? { ...legacyJoinMessage, isLoaded: true }
      : legacyJoinMessage,
    channel: {
      id: response.channel.id,
      channelName: response.channel.channelName,
      pathId: response.channel.pathId
    },
    newMembers: [member]
  });
}

function getCanonicalLegacyJoinMessage(response: AcceptedChatGroupResponse) {
  if (response.joinMessage?.id) return response.joinMessage;

  const canonicalMessage = Object.values(response.messagesObj || {}).find(
    (message) =>
      Number(message?.channelId) === Number(response.joinMessage?.channelId) &&
      Number(message?.userId) === Number(response.joinMessage?.userId) &&
      Number(message?.timeStamp) === Number(response.joinMessage?.timeStamp) &&
      message?.content === response.joinMessage?.content
  );
  return canonicalMessage
    ? { ...response.joinMessage, ...canonicalMessage }
    : response.joinMessage;
}

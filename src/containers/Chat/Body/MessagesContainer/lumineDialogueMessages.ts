export interface LumineChatMessage {
  id?: number | string;
  userId?: number | string;
  channelId?: number | string;
  subjectId?: number | string | null;
  timeStamp?: number;
}

// A pending send has a temporary UUID, not a canonical numeric message ID.
// Read only message metadata; the content of the conversation is irrelevant.
export function latestLumineChatMessage(
  messages: LumineChatMessage[],
  scope: { requesterUserId: number; channelId: number; topicId: number | null },
  after = 0
) {
  let latestId = 0;
  for (const message of messages) {
    const id = Number(message.id);
    if (
      Number.isSafeInteger(id) &&
      id > latestId &&
      Number(message.userId) === scope.requesterUserId &&
      Number(message.channelId) === scope.channelId &&
      Number(message.subjectId || 0) === Number(scope.topicId || 0) &&
      Number(message.timeStamp || 0) > after
    ) {
      latestId = id;
    }
  }
  return latestId;
}

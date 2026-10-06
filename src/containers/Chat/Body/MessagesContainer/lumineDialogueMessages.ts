export interface LumineChatMessage {
  id?: number | string;
  userId?: number | string;
  channelId?: number | string;
  subjectId?: number | string | null;
  timeStamp?: number;
  settings?: unknown;
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

export type LumineJobOutcome = 'completed' | 'failed';

// The persona's result message for a Workshop job (the server posts it when
// Lumine completes or fails the job), if it is in this conversation.
export function findLumineJobOutcome(
  messages: LumineChatMessage[],
  jobId: number
): LumineJobOutcome | null {
  for (const message of messages) {
    let settings: any = message.settings;
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch {
        settings = null;
      }
    }
    const result = settings?.buildSponsorResult;
    if (!result || Number(result.jobId) !== jobId) continue;
    if (result.status === 'completed' || result.status === 'failed') {
      return result.status;
    }
  }
  return null;
}

// Whether a Lumine dialogue belongs to the chat and topic on screen.
export function isDialogueInScope(
  state: { channelId: number; topicId: number | null },
  scope: { channelId: number; topicId: number | null }
) {
  return (
    state.channelId === scope.channelId &&
    Number(state.topicId || 0) === Number(scope.topicId || 0)
  );
}

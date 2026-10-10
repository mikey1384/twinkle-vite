// A reply quoting a message that was just deleted stops showing what the
// deleted message said; it shows the "removed" note a reload would show.
export function clearDeletedReplyTargets(
  messagesObj: Record<string, any>,
  deletedMessageId: number
) {
  for (const [key, message] of Object.entries(messagesObj)) {
    if (
      message?.targetMessage &&
      Number(message.targetMessage.id) === Number(deletedMessageId)
    ) {
      messagesObj[key] = {
        ...message,
        targetMessage: null,
        targetMessageId: Number(deletedMessageId)
      };
    }
  }
  return messagesObj;
}

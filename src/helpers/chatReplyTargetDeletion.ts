// A reply quoting a message that was just deleted stops showing what the
// deleted message said; it shows the "removed" note a reload would show.
export function clearDeletedReplyTargets(
  messagesObj: Record<string, any>,
  deletedMessageId: number
) {
  for (const [key, message] of Object.entries(messagesObj)) {
    messagesObj[key] = clearDeletedReplyTarget(message, deletedMessageId);
  }
  return messagesObj;
}

export function clearDeletedReplyTarget(message: any, deletedMessageId: number): any {
  if (!message?.targetMessage) return message;
  if (Number(message.targetMessage.id) === Number(deletedMessageId)) {
    return { ...message, targetMessage: null, targetMessageId: Number(deletedMessageId) };
  }
  const target = clearDeletedReplyTarget(message.targetMessage, deletedMessageId);
  return target === message.targetMessage ? message : { ...message, targetMessage: target };
}

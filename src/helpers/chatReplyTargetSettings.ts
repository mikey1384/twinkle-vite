function mergeSettings(message: any, settings: Record<string, unknown>) {
  let previous: Record<string, unknown> = {};
  try {
    const value = typeof message.settings === 'string'
      ? JSON.parse(message.settings)
      : message.settings;
    if (value && typeof value === 'object' && !Array.isArray(value)) previous = value;
  } catch {
    previous = {};
  }
  return { ...message, settings: { ...previous, ...settings } };
}

// A card may be visible as the original, in several replies, or as the
// composer's current target. A server-confirmed action updates every copy,
// even when the original message is outside the loaded page.
export function updateChannelMessageSettings(
  channel: any,
  messageId: number,
  settings: Record<string, unknown>
) {
  const id = Number(messageId);
  if (!channel || !id) return channel;

  function updateMessage(message: any, fallbackId?: string): any {
    if (!message) return message;
    let next = Number(message.id || fallbackId || 0) === id ? mergeSettings(message, settings) : message;
    if (message.targetMessage) {
      const target = updateMessage(message.targetMessage);
      if (target !== message.targetMessage) next = { ...next, targetMessage: target };
    }
    return next;
  }

  function updateContainer(container: any) {
    if (!container) return container;
    let changed = false;
    let messagesObj = container.messagesObj;
    for (const [key, message] of Object.entries<any>(container.messagesObj || {})) {
      const next = updateMessage(message, key);
      if (next !== message) {
        if (!changed) messagesObj = { ...messagesObj };
        messagesObj[key] = next;
        changed = true;
      }
    }
    const replyTarget = updateMessage(container.replyTarget);
    if (replyTarget !== container.replyTarget) changed = true;
    return changed ? { ...container, messagesObj, replyTarget } : container;
  }

  const updated = updateContainer(channel);
  let subchannelObj = updated.subchannelObj;
  let subchannelsChanged = false;
  for (const [key, subchannel] of Object.entries<any>(updated.subchannelObj || {})) {
    const next = updateContainer(subchannel);
    if (next !== subchannel) {
      if (!subchannelsChanged) subchannelObj = { ...subchannelObj };
      subchannelObj[key] = next;
      subchannelsChanged = true;
    }
  }
  return subchannelsChanged ? { ...updated, subchannelObj } : updated;
}

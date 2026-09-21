export interface ChatPin {
  id: number;
  messageId: number;
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  pinnedAt: number;
  pinnedBy: number;
  pinnedByUsername: string;
  topicId: number;
  subchannelId: number;
  fileName?: string;
}

export interface ChatPinScope {
  channelId: number;
  subchannelId: number;
  topicId: number;
}

export interface ChatPinSnapshot extends ChatPinScope {
  revision: number;
  canManage: boolean;
  pins: ChatPin[];
  pinnedMessageIds: number[];
  total: number;
  nextCursor: number | null;
}

export interface ChatPinHistory {
  jumpKey?: number;
  messageId: number;
  messages: any[];
  hasOlder: boolean;
  hasNewer: boolean;
}

export function chatPinPreview(pin: Pick<ChatPin, 'content' | 'fileName'>) {
  return (
    pin.content?.trim() ||
    (pin.fileName ? `Attachment: ${pin.fileName}` : 'Message')
  );
}

export function mergePinPage(
  current: ChatPinSnapshot | null,
  incoming: ChatPinSnapshot,
  append = false
) {
  if (current && incoming.revision < current.revision) return current;
  if (!append || !current || incoming.revision !== current.revision)
    return incoming;
  const pins = new Map(
    [...current.pins, ...incoming.pins].map((pin) => [
      Number(pin.messageId),
      pin
    ])
  );
  return {
    ...incoming,
    pins: [...pins.values()]
      .filter((pin) =>
        incoming.pinnedMessageIds.includes(Number(pin.messageId))
      )
      .sort((a, b) => b.id - a.id)
  };
}

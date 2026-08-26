function parseSettings(settings: unknown): Record<string, unknown> {
  if (typeof settings === 'string') {
    try {
      const parsed = JSON.parse(settings);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? (settings as Record<string, unknown>)
    : {};
}

export function getCanonicalAiGenerationStartedAt(message: any) {
  const settings = parseSettings(message?.settings);
  return Math.max(
    0,
    Number(settings.aiGenerationStartedAt) || Number(message?.timeStamp) || 0
  );
}

export function isCanonicalAiGenerationConfirmed(message: any) {
  return parseSettings(message?.settings).aiGenerationStatus === 'generating';
}

function isCanonicalAiGenerationStartReceipt(message: any) {
  if (isCanonicalAiGenerationConfirmed(message)) return true;

  // `new_ai_message_received` is itself the server's canonical generation
  // start receipt. Workers from before the generation-status contract sent
  // the persisted empty assistant row without the new settings marker, so
  // accept that legacy receipt during a rolling API/frontend deployment.
  const settings = parseSettings(message?.settings);
  return (
    !String(message?.content || '').trim() &&
    !String(message?.filePath || '').trim() &&
    settings.hasError !== true &&
    settings.aiGenerationStatus !== 'cancelled'
  );
}

export function isActiveAiStreamMessage({
  currentMessageId,
  messageId
}: {
  currentMessageId?: number | null;
  messageId?: number | null;
}) {
  const normalizedMessageId = Number(messageId || 0);
  return (
    normalizedMessageId > 0 &&
    Number(currentMessageId || 0) === normalizedMessageId
  );
}

export function reconcileCanonicalAiGenerationReceipt({
  currentMessageId,
  message
}: {
  currentMessageId?: number | null;
  message: any;
}) {
  if (!isCanonicalAiGenerationStartReceipt(message)) {
    return currentMessageId ?? null;
  }
  const messageId = Number(message?.id || 0);
  if (messageId <= 0) return currentMessageId ?? null;
  return Math.max(Number(currentMessageId || 0), messageId);
}

export function getCanonicalGeneratingAiMessageId({
  messages,
  assistantUserIds
}: {
  messages: any[];
  assistantUserIds: number[];
}) {
  const normalizedAssistantUserIds = new Set(
    assistantUserIds.map((userId) => Number(userId || 0)).filter(Boolean)
  );
  let latestMessageId: number | null = null;
  for (const message of Array.isArray(messages) ? messages : []) {
    const settings = parseSettings(message?.settings);
    if (
      !normalizedAssistantUserIds.has(Number(message?.userId || 0)) ||
      settings.aiGenerationStatus !== 'generating'
    ) {
      continue;
    }
    const messageId = Number(message?.id || 0);
    if (messageId > Number(latestMessageId || 0)) {
      latestMessageId = messageId;
    }
  }
  return latestMessageId;
}

export function reconcileCanonicalGeneratingAiMessagePage({
  currentMessageId,
  messages,
  assistantUserIds
}: {
  currentMessageId?: number | null;
  messages: any[];
  assistantUserIds: number[];
}) {
  const normalizedCurrentMessageId = Number(currentMessageId || 0);
  const currentMessageIsInPage = messages.some(
    (message) => Number(message?.id || 0) === normalizedCurrentMessageId
  );
  const canonicalGeneratingMessageId = getCanonicalGeneratingAiMessageId({
    messages,
    assistantUserIds
  });
  if (canonicalGeneratingMessageId) {
    return currentMessageIsInPage
      ? canonicalGeneratingMessageId
      : Math.max(normalizedCurrentMessageId, canonicalGeneratingMessageId);
  }
  if (
    normalizedCurrentMessageId > 0 &&
    !currentMessageIsInPage
  ) {
    return normalizedCurrentMessageId;
  }
  return null;
}

export function reconcileCanonicalStreamingMessageId({
  currentMessageId,
  messageId,
  newState,
  messages = [],
  assistantUserIds = []
}: {
  currentMessageId?: number | null;
  messageId: number;
  newState: Record<string, any>;
  messages?: any[];
  assistantUserIds?: number[];
}) {
  if (Number(currentMessageId || 0) !== Number(messageId || 0)) {
    return currentMessageId ?? null;
  }
  if (!Object.prototype.hasOwnProperty.call(newState, 'settings')) {
    return currentMessageId ?? null;
  }
  const settings = parseSettings(newState.settings);
  if (settings.aiGenerationStatus === 'generating') {
    return currentMessageId ?? null;
  }
  return getCanonicalGeneratingAiMessageId({
    messages: messages.map((message) =>
      Number(message?.id || 0) === Number(messageId || 0)
        ? { ...message, ...newState }
        : message
    ),
    assistantUserIds
  });
}

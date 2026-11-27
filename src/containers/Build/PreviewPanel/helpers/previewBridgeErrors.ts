const DECISION_REQUEST_ID_RE =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DECISION_REASON_RE = /^[a-z_]{2,40}$/;

// Twinkle AI is for Twinkle members: a plain ai:decide call is game logic
// (available to guests with no AI banner), while ai:decide-images and other
// AI requests require a Twinkle account.
export function isAiAccountBridgeRequestType(type: unknown): boolean {
  return (
    typeof type === 'string' &&
    ((type.startsWith('ai:') && type !== 'ai:decide') ||
      type === 'characters:chat' ||
      type === 'news:generate' ||
      type === 'content:word-master:korean-definition' ||
      type === 'content:word-master:generate-entry')
  );
}

export function buildPreviewBridgeErrorDetails(
  type: unknown,
  error: any
): Record<string, any> | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const isDecisionRequest = type === 'ai:decide' || type === 'ai:decide-images';
  return {
    ...(typeof error.status === 'number' ? { status: error.status } : {}),
    // handleError reports a request that got no HTTP response as
    // status 500 with isTransportError. Pass the flag on so apps
    // can tell "never reached the server" from a real 500.
    ...(error.isTransportError === true ? { isTransportError: true } : {}),
    ...(typeof error.code === 'string' ? { code: error.code } : {}),
    ...(typeof error.retryable === 'boolean'
      ? { retryable: error.retryable }
      : {}),
    ...(error.retryAfterSeconds != null
      ? { retryAfterSeconds: error.retryAfterSeconds }
      : {}),
    ...(error.writeStatus ? { writeStatus: error.writeStatus } : {}),
    ...(error.aiUsagePolicy ? { aiUsagePolicy: error.aiUsagePolicy } : {}),
    ...(error.mediaEnergy ? { mediaEnergy: error.mediaEnergy } : {}),
    ...(error.details && typeof error.details === 'object'
      ? error.details
      : {}),
    ...(isDecisionRequest &&
    typeof error.requestId === 'string' &&
    DECISION_REQUEST_ID_RE.test(error.requestId)
      ? { requestId: error.requestId }
      : {}),
    ...(isDecisionRequest &&
    typeof error.reason === 'string' &&
    DECISION_REASON_RE.test(error.reason)
      ? { reason: error.reason }
      : {})
  };
}

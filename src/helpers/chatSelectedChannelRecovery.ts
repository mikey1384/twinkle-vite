export const SELECTED_CHANNEL_RECOVERY_FAILURES_BEFORE_REBUILD = 3;

export type SelectedChannelRecoveryFailureReason =
  | 'projection_activity_race'
  | 'request_failure';

export interface CanonicalChatRebuildRequest {
  channelId: number;
  failedAttempts: number;
  reason: SelectedChannelRecoveryFailureReason;
  userId: number;
}

type CanonicalChatRebuildHandler = (
  request: CanonicalChatRebuildRequest
) => boolean;

let canonicalChatRebuildHandler: CanonicalChatRebuildHandler | null = null;

export class ChatProjectionActivityRaceError extends Error {
  constructor() {
    super('Canonical chat activity changed during channel recovery');
    this.name = 'ChatProjectionActivityRaceError';
  }
}

export function shouldEscalateSelectedChannelRecovery(
  failedAttempts: number
) {
  return (
    Number.isSafeInteger(failedAttempts) &&
    failedAttempts >= SELECTED_CHANNEL_RECOVERY_FAILURES_BEFORE_REBUILD
  );
}

export function installCanonicalChatRebuildHandler(
  handler: CanonicalChatRebuildHandler
) {
  canonicalChatRebuildHandler = handler;
  return () => {
    if (canonicalChatRebuildHandler === handler) {
      canonicalChatRebuildHandler = null;
    }
  };
}

export function requestCanonicalChatRebuild(
  request: CanonicalChatRebuildRequest
) {
  return canonicalChatRebuildHandler?.(request) === true;
}

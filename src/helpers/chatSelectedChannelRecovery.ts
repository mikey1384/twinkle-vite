export const SELECTED_CHANNEL_RECOVERY_FAILURES_BEFORE_REBUILD = 3;

export type SelectedChannelRecoveryFailureReason =
  | 'projection_activity_race'
  | 'request_failure';

export interface CanonicalChatRebuildRequest {
  channelId: number;
  failedAttempts: number;
  recoveryId: string;
  reason: SelectedChannelRecoveryFailureReason;
  userId: number;
}

export type TerminalChatRecoveryReason =
  | 'bootstrap_retry_exhausted'
  | 'canonical_rebuild_unavailable'
  // The composer stayed gated past the wall-clock deadline without any
  // recovery loop reporting a terminal result (a bind ack that never comes, a
  // retry timer that cancelled itself, an invalidation cycle). The deadline is
  // the backstop for every cause source reading cannot tell apart.
  | 'recovery_deadline_exceeded';

// How long "Catching up" may block the composer before the member gets the
// last confirmed messages back plus a Retry. Long enough for a slow writer
// bootstrap on a throttled phone, short enough that nobody stares at a pill
// for a minute (subject 36629: "sometimes never finishes").
export const CHAT_CATCH_UP_DEADLINE_MS = 30_000;
// A Retry tap can land while a bootstrap is still in flight or the socket is
// mid-reconnect; the rebuild handler refuses those. Re-ask a few times instead
// of leaving a button that silently does nothing.
export const CHAT_RECOVERY_RETRY_REQUEUE_MS = 1_500;
export const CHAT_RECOVERY_RETRY_REQUEUE_LIMIT = 6;

export interface TerminalChatRecoveryState {
  channelId: number;
  failedAttempts: number;
  occurredAt: number;
  recoveryId: string;
  reason: TerminalChatRecoveryReason;
  userId: number;
}

type CanonicalChatRebuildHandler = (
  request: CanonicalChatRebuildRequest
) => boolean;

let canonicalChatRebuildHandler: CanonicalChatRebuildHandler | null = null;
const terminalChatRecoveryStates = new Map<string, TerminalChatRecoveryState>();
let recoverySequence = 0;
const terminalChatRecoveryListeners = new Set<() => void>();

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

export function nextChatRecoveryId() {
  recoverySequence += 1;
  return `chat-recovery-${Date.now()}-${recoverySequence}`;
}

export function publishTerminalChatRecovery(
  state: TerminalChatRecoveryState
) {
  terminalChatRecoveryStates.set(
    getTerminalChatRecoveryKey(state.userId, state.channelId),
    state
  );
  notifyTerminalChatRecoveryListeners();
}

export function clearTerminalChatRecovery({
  channelId,
  recoveryId,
  userId
}: {
  channelId?: number;
  recoveryId?: string;
  userId?: number;
} = {}) {
  let changed = false;
  for (const [key, state] of terminalChatRecoveryStates) {
    if (
      (channelId !== undefined && state.channelId !== channelId) ||
      (recoveryId !== undefined && state.recoveryId !== recoveryId) ||
      (userId !== undefined && state.userId !== userId)
    ) {
      continue;
    }
    terminalChatRecoveryStates.delete(key);
    changed = true;
  }
  if (changed) notifyTerminalChatRecoveryListeners();
}

export function getTerminalChatRecoveryState({
  channelId,
  userId
}: {
  channelId: number;
  userId: number;
}) {
  return (
    terminalChatRecoveryStates.get(
      getTerminalChatRecoveryKey(userId, channelId)
    ) || null
  );
}

export function subscribeToTerminalChatRecovery(listener: () => void) {
  terminalChatRecoveryListeners.add(listener);
  return () => {
    terminalChatRecoveryListeners.delete(listener);
  };
}

function notifyTerminalChatRecoveryListeners() {
  for (const listener of terminalChatRecoveryListeners) listener();
}

function getTerminalChatRecoveryKey(userId: number, channelId: number) {
  return `${userId}:${channelId}`;
}

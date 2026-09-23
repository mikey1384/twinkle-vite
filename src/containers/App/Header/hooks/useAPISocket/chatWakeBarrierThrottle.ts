// A chat wake barrier re-binds an already-connected socket to re-check its
// rooms after the tab comes back. On a continuous socket nothing is lost while
// the tab is briefly hidden (the transport delivers queued events in order),
// so a device that flips visibility or focus every few seconds must not
// re-bind every time: each bind re-broadcasts presence to everyone.
export const CHAT_WAKE_BARRIER_MIN_INTERVAL_MS = 60_000;
export const CHAT_WAKE_BARRIER_LONG_HIDDEN_MS = 30_000;

export function shouldSkipChatWakeBarrier({
  lastBarrier,
  socketId,
  hiddenForMs,
  now
}: {
  lastBarrier: { socketId: string; at: number } | null;
  socketId: string | null | undefined;
  hiddenForMs: number;
  now: number;
}) {
  return (
    !!lastBarrier &&
    !!socketId &&
    lastBarrier.socketId === socketId &&
    now - lastBarrier.at < CHAT_WAKE_BARRIER_MIN_INTERVAL_MS &&
    hiddenForMs < CHAT_WAKE_BARRIER_LONG_HIDDEN_MS
  );
}

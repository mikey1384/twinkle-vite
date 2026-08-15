const SERVER_DISCONNECT_RECONNECT_MIN_MS = 1_000;
const SERVER_DISCONNECT_RECONNECT_SPREAD_MS = 4_000;
const SOCKET_BIND_RETRY_MAX_MS = 30_000;

export function getServerDisconnectReconnectDelayMs(
  randomValue = Math.random()
) {
  const boundedRandomValue = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1)
    : 0;
  return (
    SERVER_DISCONNECT_RECONNECT_MIN_MS +
    Math.floor(boundedRandomValue * SERVER_DISCONNECT_RECONNECT_SPREAD_MS)
  );
}

export function getSocketBindRetryDelayMs(failureCount: number) {
  const normalizedFailureCount = Number.isFinite(failureCount)
    ? Math.max(0, Math.floor(failureCount))
    : 0;
  return Math.min(
    SOCKET_BIND_RETRY_MAX_MS,
    1_000 * 2 ** Math.min(normalizedFailureCount, 10)
  );
}

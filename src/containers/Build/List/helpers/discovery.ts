const DISCOVERY_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function isBuildDiscoveryCacheCurrent(
  cache:
    | {
        loaded?: boolean;
        userId?: number | null;
        nextDay?: number | null;
      }
    | undefined,
  userId: number | null,
  now = Date.now()
) {
  return Boolean(
    userId &&
    cache?.loaded &&
    cache.userId === userId &&
    (!cache.nextDay || cache.nextDay > now)
  );
}

export function getBuildDiscoveryRefreshDelay(
  nextDay: unknown,
  now = Date.now()
) {
  const resetAt = Number(nextDay);
  if (!Number.isFinite(resetAt) || resetAt <= 0) {
    return DISCOVERY_REFRESH_INTERVAL_MS;
  }
  // A response that crossed midnight is retried promptly, without spinning
  // if the browser's clock is ahead of the server's.
  if (resetAt <= now) return 30 * 1000;
  return Math.max(1000, Math.min(resetAt - now, DISCOVERY_REFRESH_INTERVAL_MS));
}

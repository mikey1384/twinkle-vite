interface BuildContributionLumineFixRecoveryOptions {
  shouldPoll: boolean;
  refreshCanonicalState: () => Promise<void>;
  subscribeToReconnect: (refresh: () => void) => () => void;
  subscribeToVisible: (refresh: () => void) => () => void;
  scheduleRefresh: (refresh: () => void, delayMs: number) => () => void;
  pollIntervalMs?: number;
}

export function startBuildContributionLumineFixRecovery({
  shouldPoll,
  refreshCanonicalState,
  subscribeToReconnect,
  subscribeToVisible,
  scheduleRefresh,
  pollIntervalMs = 5_000
}: BuildContributionLumineFixRecoveryOptions) {
  let stopped = false;
  let refreshInFlight = false;
  let refreshQueued = false;
  let cancelScheduledRefresh: (() => void) | null = null;

  const unsubscribeFromReconnect = subscribeToReconnect(requestRefresh);
  const unsubscribeFromVisible = subscribeToVisible(requestRefresh);
  requestRefresh();

  return function stopRecovery() {
    stopped = true;
    refreshQueued = false;
    clearScheduledRefresh();
    unsubscribeFromReconnect();
    unsubscribeFromVisible();
  };

  function requestRefresh() {
    if (stopped) return;
    if (refreshInFlight) {
      refreshQueued = true;
      return;
    }
    void refresh();
  }

  async function refresh() {
    if (stopped) return;
    refreshInFlight = true;
    clearScheduledRefresh();
    try {
      await refreshCanonicalState();
    } catch {
      // Entry, visibility, and reconnect recovery is best effort. Running
      // states also retry on the normal polling interval.
    } finally {
      refreshInFlight = false;
      if (stopped) return;
      if (refreshQueued) {
        refreshQueued = false;
        requestRefresh();
        return;
      }
      if (shouldPoll) {
        cancelScheduledRefresh = scheduleRefresh(
          requestRefresh,
          pollIntervalMs
        );
      }
    }
  }

  function clearScheduledRefresh() {
    cancelScheduledRefresh?.();
    cancelScheduledRefresh = null;
  }
}

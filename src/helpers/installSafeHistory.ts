// history.replaceState can throw where path changes are restricted: sandboxed
// embeds (e.g. a student's build iframing twin-kle.com inside the Build
// preview) block path/fragment changes on iOS, and Safari rate-limits history
// calls (>100 per 30s). React Router's push() already recovers from this by
// falling back to window.location.assign (so pushState must NOT be wrapped —
// swallowing the error there would defeat that recovery and stall
// navigation), but its replace() has no such fallback and crashes to the
// error boundary. Mirror the router's push recovery for cross-URL replaces,
// and retry same-URL state writes (e.g. clearing one-time route state like
// openPeoplePanel) after the rate-limit window relaxes so canonical history
// state does not silently go stale and replay on refresh.
export default function installSafeHistory() {
  const originalReplaceState = window.history.replaceState.bind(
    window.history
  );
  let writeSequence = 0;
  let retryTimers: ReturnType<typeof setTimeout>[] = [];

  function clearRetries() {
    for (const timer of retryTimers) clearTimeout(timer);
    retryTimers = [];
  }

  window.history.replaceState = (
    ...args: Parameters<History['replaceState']>
  ) => {
    writeSequence += 1;
    // A newer explicit write supersedes any pending retry of an older one.
    clearRetries();
    try {
      originalReplaceState(...args);
    } catch (error) {
      // Serialization bugs should surface to the developer, matching the
      // router's own pushState handling.
      if (error instanceof DOMException && error.name === 'DataCloneError') {
        throw error;
      }
      const requestedUrl = args[2];
      const resolvedUrl = requestedUrl
        ? new URL(String(requestedUrl), window.location.href)
        : null;
      if (resolvedUrl && resolvedUrl.href !== window.location.href) {
        console.warn(
          'history.replaceState was blocked; falling back to a full-page replace.',
          error
        );
        window.location.replace(resolvedUrl.href);
        return;
      }
      // Same-URL state write blocked (Safari rate limit). Retry once shortly
      // and once after the 30s window has fully passed; skip if a newer
      // history write or a navigation happened in the meantime.
      console.warn(
        'history.replaceState was blocked; will retry the state update.',
        error
      );
      const failedSequence = writeSequence;
      const hrefAtFailure = window.location.href;
      function attemptRetry() {
        if (writeSequence !== failedSequence) return;
        if (window.location.href !== hrefAtFailure) return;
        try {
          originalReplaceState(...args);
          clearRetries();
        } catch {
          // Still blocked; a later scheduled retry (if any) will try again.
        }
      }
      retryTimers = [
        setTimeout(attemptRetry, 2000),
        setTimeout(attemptRetry, 31000)
      ];
    }
  };
}

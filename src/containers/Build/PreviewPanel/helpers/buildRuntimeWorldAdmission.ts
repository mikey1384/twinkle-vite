const HIGH_FREQUENCY_WORLD_SOCKET_EVENTS = new Set([
  'build_app_world_send',
  'build_app_world_update_presence'
]);

// The website socket admits 30 public events/second with a 60-event burst.
// Build frames share that socket with chat, presence, and every other website
// feature, so keep realtime world traffic below the global ceiling and leave
// explicit headroom for the host. This is an isolation boundary for an
// untrusted iframe; the server guard remains the authoritative abuse boundary.
export const BUILD_RUNTIME_WORLD_EVENTS_PER_SECOND = 20;
export const BUILD_RUNTIME_WORLD_EVENT_BURST = 30;

export function createBuildRuntimeWorldAdmission({
  now = Date.now,
  eventsPerSecond = BUILD_RUNTIME_WORLD_EVENTS_PER_SECOND,
  burst = BUILD_RUNTIME_WORLD_EVENT_BURST
}: {
  now?: () => number;
  eventsPerSecond?: number;
  burst?: number;
} = {}) {
  let availableTokens = burst;
  let lastRefillAt = now();

  return {
    admit(eventName: string) {
      if (!HIGH_FREQUENCY_WORLD_SOCKET_EVENTS.has(eventName)) {
        return { admitted: true, retryAfterMs: 0 };
      }

      const currentTime = Math.max(lastRefillAt, now());
      const elapsedMs = currentTime - lastRefillAt;
      availableTokens = Math.min(
        burst,
        availableTokens + (elapsedMs * eventsPerSecond) / 1000
      );
      lastRefillAt = currentTime;
      if (availableTokens < 1) {
        return {
          admitted: false,
          retryAfterMs: Math.max(
            1,
            Math.ceil(((1 - availableTokens) * 1000) / eventsPerSecond)
          )
        };
      }

      availableTokens -= 1;
      return { admitted: true, retryAfterMs: 0 };
    }
  };
}

// BuildRuntimeKeepAliveHost deliberately keeps multiple Build apps mounted in
// one page. Every PreviewPanel still emits through the same website socket, so
// their realtime traffic must share one page-wide budget rather than receiving
// a fresh allowance per mounted app.
export const buildRuntimeWorldAdmission =
  createBuildRuntimeWorldAdmission();

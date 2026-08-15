const CONFIRMED_REACHABLE_OVERRIDE_MS = 30_000;

let lastConfirmedReachableAt: number | null = null;

export function markBrowserNetworkReachable(now = Date.now()) {
  lastConfirmedReachableAt = now;
}

export function markBrowserNetworkOffline() {
  lastConfirmedReachableAt = null;
}

export function browserReportsOffline(now = Date.now()) {
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    return false;
  }
  // navigator.onLine is a hint, not a source of truth. A canonical request
  // that just succeeded is stronger evidence that Safari's cached offline bit
  // is stale. Keep that override short-lived so a later missed offline event
  // cannot sustain background retry traffic indefinitely.
  return !(
    lastConfirmedReachableAt !== null &&
    now - lastConfirmedReachableAt <= CONFIRMED_REACHABLE_OVERRIDE_MS
  );
}

export function resetBrowserNetworkForTests() {
  lastConfirmedReachableAt = null;
}

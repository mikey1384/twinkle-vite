const defaultSuppressionDurationMs = 1200;
const scrollAnchorRestoreCancelEventName =
  'twinkle-scroll-anchor-restore-cancel';

let scrollAnchorSaveSuppressedUntil = 0;
let scrollAnchorRestoreSuppressedUntil = 0;

export function cancelScrollAnchorRestores() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(scrollAnchorRestoreCancelEventName));
}

export function addScrollAnchorRestoreCancelListener(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const eventListener = () => listener();
  window.addEventListener(scrollAnchorRestoreCancelEventName, eventListener);
  return () =>
    window.removeEventListener(scrollAnchorRestoreCancelEventName, eventListener);
}

export function suppressScrollAnchorSaves(
  durationMs = defaultSuppressionDurationMs
) {
  scrollAnchorSaveSuppressedUntil = Math.max(
    scrollAnchorSaveSuppressedUntil,
    Date.now() + durationMs
  );
}

export function suppressScrollAnchorRestores(
  durationMs = defaultSuppressionDurationMs
) {
  scrollAnchorRestoreSuppressedUntil = Math.max(
    scrollAnchorRestoreSuppressedUntil,
    Date.now() + durationMs
  );
}

export function scrollAnchorSavesAreSuppressed() {
  return Date.now() < scrollAnchorSaveSuppressedUntil;
}

export function scrollAnchorRestoresAreSuppressed() {
  return Date.now() < scrollAnchorRestoreSuppressedUntil;
}

const defaultSuppressionDurationMs = 1200;
const scrollAnchorRestoreCancelEventName =
  'twinkle-scroll-anchor-restore-cancel';
const scrollAnchorTopResetEventName = 'twinkle-scroll-anchor-top-reset';
const scrollAnchorExternalSaveEventName = 'twinkle-scroll-anchor-external-save';

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

export function requestActiveScrollAnchorTopReset() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(scrollAnchorTopResetEventName));
}

export function addScrollAnchorTopResetListener(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const eventListener = () => listener();
  window.addEventListener(scrollAnchorTopResetEventName, eventListener);
  return () =>
    window.removeEventListener(scrollAnchorTopResetEventName, eventListener);
}

// An external anchor write (saveScrollAnchorForElement) has no restore in
// flight, so the hook instance currently mounted for that key must mark the
// new signature as settled or its natural scroll saves freeze until remount.
// An event (not module state) so the exemption dies with the instance: a
// remounted hook must still treat that same saved anchor as a pending restore
// and block saves until it lands.
export function notifyScrollAnchorExternalSave(anchorKey: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(scrollAnchorExternalSaveEventName, { detail: anchorKey })
  );
}

export function addScrollAnchorExternalSaveListener(
  listener: (anchorKey: string) => void
) {
  if (typeof window === 'undefined') return () => {};
  const eventListener = (event: Event) =>
    listener((event as CustomEvent<string>).detail);
  window.addEventListener(scrollAnchorExternalSaveEventName, eventListener);
  return () =>
    window.removeEventListener(
      scrollAnchorExternalSaveEventName,
      eventListener
    );
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

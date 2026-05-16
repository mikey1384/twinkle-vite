const defaultSuppressionDurationMs = 1200;

let scrollAnchorSaveSuppressedUntil = 0;
let scrollAnchorRestoreSuppressedUntil = 0;

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

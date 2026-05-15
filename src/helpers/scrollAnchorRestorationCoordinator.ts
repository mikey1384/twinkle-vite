const defaultSuppressionDurationMs = 1200;

let scrollAnchorSaveSuppressedUntil = 0;

export function suppressScrollAnchorSaves(
  durationMs = defaultSuppressionDurationMs
) {
  scrollAnchorSaveSuppressedUntil = Math.max(
    scrollAnchorSaveSuppressedUntil,
    Date.now() + durationMs
  );
}

export function scrollAnchorSavesAreSuppressed() {
  return Date.now() < scrollAnchorSaveSuppressedUntil;
}

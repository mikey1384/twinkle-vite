// Pure helpers for lazy-chunk recovery (lazyImportHelpers.ts, ErrorBoundary),
// kept dependency-free so they can be tested directly.

export const LAZY_IMPORT_RELOAD_PARAM = '_twinkleLazyImportReload';
// Keep in sync with twinkle-api helpers/errorReporting.ts: a report carrying
// it passes the server's lazy-chunk suppression.
export const LAZY_CHUNK_UNRECOVERABLE_MARKER = '[lazy-chunk-unrecoverable]';
const RECENT_RELOAD_MS = 60 * 1000;
// how long after its recovery reload a still-broken chunk counts as
// unrecoverable (an old bookmarked param must not trigger that report)
const RECOVERY_RELOAD_WINDOW_MS = 10 * 60 * 1000;

// A lazy chunk that arrived cut off (a dropped connection mid-download, seen
// from a Naver in-app browser on iPhone, 10-20) fails to parse instead of
// failing to fetch. Safari: "Unexpected end of script"; Chrome: "Unexpected
// end of input"; Firefox: "expected expression, got end of script". The
// browser keeps the failed module for the page's life, so retrying cannot fix
// it; a reload can, without any new deploy.
export function isTruncatedScriptError(error: unknown) {
  const name = (error as Error | null)?.name;
  if (typeof name === 'string' && name && name !== 'SyntaxError') return false;
  const message = String((error as Error)?.message || error || '');
  return (
    message.includes('Unexpected end of script') ||
    message.includes('Unexpected end of input') ||
    message.includes('got end of script')
  );
}

function readLazyImportReloadAt(href: string) {
  try {
    const at = Number(new URL(href).searchParams.get(LAZY_IMPORT_RELOAD_PARAM));
    return Number.isFinite(at) && at > 0 ? at : 0;
  } catch {
    return 0;
  }
}

// The page was itself opened by a lazy-chunk reload in the last minute. The
// reload param stays in the URL, so this holds even in a webview whose
// sessionStorage does not survive the reload: no reload loop either way. A
// future timestamp (another device's clock, a clock set back) does not count.
export function hasRecentLazyImportReload(href: string, now = Date.now()) {
  const at = readLazyImportReloadAt(href);
  const age = now - at;
  return at > 0 && age >= 0 && age < RECENT_RELOAD_MS;
}

// The page was opened by a lazy-chunk recovery reload a few minutes ago at
// most, so a chunk still failing now did not recover.
export function wasOpenedByLazyImportReload(href: string, now = Date.now()) {
  const at = readLazyImportReloadAt(href);
  const age = now - at;
  return at > 0 && age >= 0 && age < RECOVERY_RELOAD_WINDOW_MS;
}

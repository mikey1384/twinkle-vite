// Pure helpers for lazy-chunk recovery (lazyImportHelpers.ts, ErrorBoundary),
// kept dependency-free so they can be tested directly.

export const LAZY_IMPORT_RELOAD_PARAM = '_twinkleLazyImportReload';
// Keep in sync with twinkle-api helpers/errorReporting.ts: a report carrying
// it passes the server's lazy-chunk suppression.
export const LAZY_CHUNK_UNRECOVERABLE_MARKER = '[lazy-chunk-unrecoverable]';
const RECENT_RELOAD_MS = 60 * 1000;

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

// The page was itself opened by a lazy-chunk reload in the last minute. The
// reload param stays in the URL, so this holds even in a webview whose
// sessionStorage does not survive the reload: no reload loop either way.
export function hasRecentLazyImportReload(href: string, now = Date.now()) {
  try {
    const at = Number(new URL(href).searchParams.get(LAZY_IMPORT_RELOAD_PARAM));
    return Number.isFinite(at) && at > 0 && now - at < RECENT_RELOAD_MS;
  } catch {
    return false;
  }
}

// The page already reloaded once for a lazy chunk (any time this session).
export function wasOpenedByLazyImportReload(href: string) {
  try {
    return new URL(href).searchParams.has(LAZY_IMPORT_RELOAD_PARAM);
  } catch {
    return false;
  }
}

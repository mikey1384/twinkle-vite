// The capture id is an opaque route identifier, not an authorization check.
// The API supplies it only for Lumine's read-only view_preview host; ordinary
// thumbnails and published Build routes retain their interactive sockets.
export function normalizeLuminePreviewCaptureId(value: string | null) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return /^[0-9a-f]{32}$/.test(normalized) ? normalized : null;
}

export function isLuminePreviewCaptureLocation(location: {
  pathname: string;
  search: string;
}) {
  if (!/^\/app-capture\/[^/]+\/?$/i.test(location.pathname)) return false;
  return Boolean(
    normalizeLuminePreviewCaptureId(
      new URLSearchParams(location.search).get('lumineCaptureId')
    )
  );
}

// This only avoids attempting an interactive socket with a credential the
// server already refuses. It is not authentication or an authorization check.
// Keep the capture isolated even if its page navigates away before closing.
export function isLuminePreviewCaptureCredential(token: string | null) {
  if (!token || token.length > 8192 || typeof atob !== 'function') return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.capture === 'lumine-preview';
  } catch {
    return false;
  }
}

// Whether a capture page keeps the app's saves in its throwaway store
// (PreviewPanel/helpers/previewCaptureScratch.ts) instead of sending them to
// the API: every Lumine capture, and any capture whose credential is the
// read-only pass (a thumbnail), because the API refuses that pass all writes.
// Like the checks above this is not authorization: the API enforces the pass.
export function shouldUseCaptureScratch({
  lumineCaptureId,
  authToken
}: {
  lumineCaptureId: string | null;
  authToken: string | null;
}) {
  return Boolean(lumineCaptureId) || isLuminePreviewCaptureCredential(authToken);
}

// A capture page receives its credential in the address fragment
// (#authToken=...) before anything is stored. A thumbnail capture has no
// capture id in its address, so without this the socket would connect once,
// as a guest, before the pass is stored.
function captureAddressCarriesPass(location: {
  pathname: string;
  hash?: string;
}) {
  if (!/^\/app-capture\/[^/]+\/?$/i.test(location.pathname)) return false;
  const hash = String(location.hash || '').replace(/^#/, '');
  if (!hash) return false;
  return isLuminePreviewCaptureCredential(
    new URLSearchParams(hash).get('authToken')
  );
}

export function isLuminePreviewCaptureContext(
  location: { pathname: string; search: string; hash?: string },
  token: string | null
) {
  return (
    isLuminePreviewCaptureLocation(location) ||
    isLuminePreviewCaptureCredential(token) ||
    captureAddressCarriesPass(location)
  );
}

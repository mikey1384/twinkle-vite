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

export function isLuminePreviewCaptureContext(
  location: { pathname: string; search: string },
  token: string | null
) {
  return (
    isLuminePreviewCaptureLocation(location) ||
    isLuminePreviewCaptureCredential(token)
  );
}

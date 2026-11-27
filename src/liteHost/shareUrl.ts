// Share-link and deep-link URL helpers for Lumine apps running on their own
// address (<slug>.lumine.app or a custom domain; audit G9).
// On twin-kle.com, app share URLs are https://www.twin-kle.com/app/<id>[/<path>].
// On a standalone app's own address, share URLs use that address directly
// (https://<slug>.lumine.app[/<path>] or https://<domain>[/<path>]), never
// twin-kle.com.

export function resolveAppBridgeUrl({
  origin,
  buildId,
  standalone
}: {
  origin: string;
  buildId: number;
  standalone: boolean;
}) {
  const base = String(origin || '').replace(/\/+$/, '');
  if (!base) return '';
  return standalone ? base : `${base}/app/${buildId}`;
}

export function resolveStandaloneShareUrl(href: string) {
  try {
    const url = new URL(href);
    url.hash = '';
    return url.toString();
  } catch {
    return String(href || '').split('#')[0];
  }
}

export function resolveStandaloneDeepLinkTarget(pathname: string) {
  const raw = String(pathname || '').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!raw || raw.startsWith('_lumine/')) return null;
  let path = raw;
  try {
    path = decodeURIComponent(raw).trim();
  } catch {
    path = raw.trim();
  }
  if (!path) return null;
  return {
    source: 'deepLink' as const,
    target: { path }
  };
}

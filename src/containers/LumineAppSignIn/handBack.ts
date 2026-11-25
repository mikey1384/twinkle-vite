// Where a "Sign in with Twinkle" code may go: only to the app's own address.
// Origins are compared after parsing (scheme, host and port), never as string
// prefixes, so https://app.lumine.app.evil.example and
// https://app.lumine.app@evil.example are refused. URLs with credentials are
// refused outright.

export function parsedOrigin(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin.toLowerCase();
  } catch {
    return '';
  }
}

// `candidate` as a URL if it is on exactly `expectedOrigin` (no fragment,
// no credentials); otherwise null.
export function sameOriginUrl(candidate: string, expectedOrigin: string) {
  const origin = parsedOrigin(expectedOrigin);
  if (!origin || !candidate) return null;
  try {
    const url = new URL(candidate);
    if (url.username || url.password) return null;
    if (url.origin.toLowerCase() !== origin) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

// The redirect target for a code. Built only from what the API's authorize
// step returned (its normalized origin and the return URL it bound the code
// to), and only if that still matches the origin this page was opened for.
export function codeRedirectTarget({
  requestedOrigin,
  apiOrigin,
  apiReturnUrl
}: {
  requestedOrigin: string;
  apiOrigin: string;
  apiReturnUrl: string;
}) {
  const origin = parsedOrigin(apiOrigin);
  if (!origin || origin !== parsedOrigin(requestedOrigin)) return null;
  return sameOriginUrl(apiReturnUrl || `${origin}/`, origin);
}

// Cancel (no code): back to the app's return URL if it is on the app's own
// origin, else the origin's root; nowhere if the origin itself is invalid.
export function cancelRedirectTarget({ origin, returnUrl }: { origin: string; returnUrl: string }) {
  const normalized = parsedOrigin(origin);
  if (!normalized) return null;
  return sameOriginUrl(returnUrl, normalized) || new URL('/', normalized);
}

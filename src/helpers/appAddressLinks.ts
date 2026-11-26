// Owner links into the app-address checkout (Stripe's success and cancel
// return, ?domainOrder=…, and the wand's ?appAddress=…) are built by the API
// as /app/<id>?…, which is the app's public runtime. The checkout is its own
// page (/build/<id>/domain), so those links go there with their query kept.
// Links already in Stripe sessions and chat cards keep working.
const OWNER_INTENT_KEYS = ['domainOrder', 'appAddress'];

export function appAddressIntentPath(pathname: string, search: string, hash = ''): string | null {
  const match = /^\/app\/(\d+)\/?$/.exec(String(pathname || ''));
  if (!match) return null;
  const params = new URLSearchParams(search || '');
  if (!OWNER_INTENT_KEYS.some((key) => params.has(key))) return null;
  return `/build/${match[1]}/domain${search || ''}${hash || ''}`;
}

// The checkout pages (the owner's /build/<id>/domain and the parent's
// /domain/parent) have their own header with the Twinkle logo and the way
// back, so the site's header (top on desktop, bottom nav on phones) is
// hidden there: no second logo, no nav over the checkout's buttons.
export function isCheckoutPagePath(pathname: string) {
  return /^\/build\/\d+\/domain\/?$/.test(String(pathname || '')) || /^\/domain\/parent\/?$/.test(String(pathname || ''));
}

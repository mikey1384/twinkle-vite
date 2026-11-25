import URL from '~/constants/URL';
import { cloudFrontURL, S3URL } from '~/constants/defaultValues';
import { FILE_HOSTS } from './pdfAttachment';
import { getBuildPreviewOrigin } from './buildPreviewOriginHelpers';

// Hosts Twinkle itself serves, which the posted-link guard never checks
// (helpers/postedLinkGuard.ts, review S1): they are never a member-chosen
// destination, and their links often have their own handlers (the in-app PDF
// viewer for attachments) that a held tap would skip. Taken from the config
// that already names them:
// - the API (constants/URL) and the file hosts (cloudFrontURL, S3URL,
//   pdfAttachment FILE_HOSTS);
// - the Build app preview origin (buildPreviewOriginHelpers);
// - the site's own domains and their subdomains: twin-kle.com and
//   twinkle.network (the internal-link rule, stringHelpers
//   processInternalLink), lumine.network (siteBrand isLumineHost) and
//   lumine.app (the default app preview origin's domain).
const SITE_DOMAINS = ['twin-kle.com', 'twinkle.network', 'lumine.network', 'lumine.app'];

function hostOf(value: string) {
  try {
    const host = new globalThis.URL(value).hostname.toLowerCase();
    return host && !host.startsWith('undefined.') ? host : '';
  } catch {
    return '';
  }
}

let exactHosts: Set<string> | null = null;
function ownedExactHosts() {
  if (!exactHosts) {
    exactHosts = new Set(
      [URL, cloudFrontURL, S3URL, getBuildPreviewOrigin() || '']
        .map(hostOf)
        .concat([...FILE_HOSTS].map((host) => host.toLowerCase()))
        .filter(Boolean)
    );
  }
  return exactHosts;
}

export function isTwinkleOwnedHost(host: string) {
  const normalized = String(host || '').toLowerCase().replace(/\.+$/, '');
  if (!normalized) return false;
  if (ownedExactHosts().has(normalized)) return true;
  return SITE_DOMAINS.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`)
  );
}

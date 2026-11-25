import { pageLinkBlocklist } from './pageLinkBlocklist';
import { createPostedLinkGuard, openCheckedOutsideLink } from './postedLinkGuard';
import { isTwinkleOwnedHost } from './twinkleOwnedHosts';

// The page's one posted-link guard (helpers/postedLinkGuard.ts), on the
// page's one blocked-site list, skipping Twinkle's own hosts. Mounted by
// components/PostedLinkGuard; profile quick links call openOutsideLink.
export const postedLinkGuard = createPostedLinkGuard({
  blocklist: pageLinkBlocklist,
  openUrl: (href, newTab) => openCheckedOutsideLink(href, newTab),
  pageUrl: () => window.location.href,
  isOwnedHost: isTwinkleOwnedHost
});

export function openOutsideLink(href: string, options?: { newTab?: boolean }) {
  postedLinkGuard.open(href, options);
}

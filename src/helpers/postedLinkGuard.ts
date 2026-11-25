import type { LinkBlocklistAnswer } from './linkBlocklistClient';

// Twinkle's blocked-site list on posted links (Mikey 11-25): posts,
// subjects, comments, chat messages, bios, profile links and link previews.
// One click guard for the whole page (components/PostedLinkGuard listens on
// window in the capture phase, so it runs before any link's own handler,
// whatever renders the link): a tap on a link to another site whose host is
// on the list does not leave Twinkle, and the page shows "This site is
// blocked on Twinkle." Links opened from script (profile quick links) go
// through `open`. Twinkle's own hosts (the API, file hosts, app previews,
// the site's domains: helpers/twinkleOwnedHosts.ts) are never checked.
//
// The list is the page's one copy (helpers/pageLinkBlocklist.ts):
// - any list in hand decides the tap at once, inside it, whatever its age,
//   and a refresh starts in the background when it is older than
//   POSTED_LINK_REFRESH_MS (the page also refreshes on every press, on tab
//   return and on a timer, so the copy is normally under 8 minutes old). An
//   allowed link is left alone and opens exactly as before. A refused (4xx)
//   refresh keeps the older list: nothing on a page can force one (review
//   S3; the app sheet keeps its stricter rule);
// - only when no list has loaded on this page yet (its first moment) is the
//   tap held, for at most POSTED_LINK_WAIT_MS; then a 4xx refuses ("Couldn't
//   check this site"), and a network error, timeout or 5xx opens the link
//   unchecked.
// POSTED_LINK_WAIT_MS is 650 ms: a held tap opens its tab from a later task,
// and iPhone Safari allows that only within about a second of the tap, so
// the wait leaves room for the open itself (review B1). Playwright does not
// enforce that window; it needs a real iPhone (HANDOFF).
export const POSTED_LINK_WAIT_MS = 650;
export const POSTED_LINK_REFRESH_MS = 8 * 60_000;
export const POSTED_LINK_COUNT_CAP = 50;

export type PostedLinkNoticeKind = 'blocked' | 'unchecked';
export interface PostedLinkNotice {
  kind: PostedLinkNoticeKind;
  url: string;
}
export interface OutsideLink {
  url: URL;
  newTab: boolean;
}
type Counts = Partial<Record<PostedLinkNoticeKind, number>>;

interface LinkBlocklistLike {
  match: (host: string) => 'blocked' | 'allowed' | null;
  check: (host: string, wait?: number) => Promise<LinkBlocklistAnswer>;
  refresh: (olderThanMs: number) => void;
}

interface NodeLike {
  tagName?: string;
  parentNode?: NodeLike | null;
  baseURI?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
  hasAttribute?: (name: string) => boolean;
}

interface ClickLike {
  type: string;
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
  target?: unknown;
  composedPath?: () => unknown[];
  preventDefault: () => void;
  stopPropagation: () => void;
}

// Links the page opens itself after its own check (the app sheet's Open,
// and this guard's held taps). A WeakSet, not an attribute, so posted
// HTML can never mark its own link as checked.
const checkedLinks = new WeakSet<object>();
export function markCheckedOutsideLink(link: object) {
  checkedLinks.add(link);
}

function linkFrom(event: ClickLike): NodeLike | null {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  const nodes: NodeLike[] = [];
  if (path.length) nodes.push(...(path as NodeLike[]));
  else {
    let node = event.target as NodeLike | null | undefined;
    while (node) {
      nodes.push(node);
      node = node.parentNode;
    }
  }
  for (const node of nodes) {
    const tag = String(node?.tagName || '').toLowerCase();
    if ((tag === 'a' || tag === 'area') && typeof node.getAttribute === 'function') {
      const href = node.getAttribute('href') ?? node.getAttribute('xlink:href');
      if (href !== null && href !== undefined) return node;
    }
  }
  return null;
}

/** The outside http(s) link this click would follow, or null for anything else. */
export function findOutsideLink(
  event: ClickLike,
  pageUrl: string,
  isOwnedHost: (host: string) => boolean = () => false
): OutsideLink | null {
  if (event.defaultPrevented) return null;
  if (event.type === 'click' && (event.button ?? 0) !== 0) return null;
  if (event.type === 'auxclick' && event.button !== 1) return null;
  const link = linkFrom(event);
  if (!link || checkedLinks.has(link)) return null;
  if (link.hasAttribute?.('download') || link.isContentEditable) return null;
  const href = link.getAttribute?.('href') ?? link.getAttribute?.('xlink:href') ?? '';
  let url: URL;
  let page: URL;
  try {
    page = new URL(pageUrl);
    url = new URL(String(href).trim(), link.baseURI || pageUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.origin === page.origin || isOwnedHost(url.hostname)) return null;
  const target = String(link.getAttribute?.('target') || '').trim().toLowerCase();
  const newTab =
    event.type === 'auxclick' ||
    Boolean(event.metaKey || event.ctrlKey || event.shiftKey) ||
    (!!target && !['_self', '_top', '_parent'].includes(target));
  return { url, newTab };
}

// A link with target _blank and rel noopener noreferrer: no referrer, no
// window.opener, and the form iPhone Safari opens in a new tab.
export function openCheckedOutsideLink(href: string, newTab: boolean, doc: Document = document) {
  if (!newTab) {
    doc.defaultView?.location.assign(href);
    return;
  }
  const link = doc.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.referrerPolicy = 'no-referrer';
  link.style.display = 'none';
  markCheckedOutsideLink(link);
  doc.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}

export function createPostedLinkGuard({
  blocklist,
  openUrl,
  pageUrl,
  isOwnedHost = () => false,
  waitMs = POSTED_LINK_WAIT_MS
}: {
  blocklist: LinkBlocklistLike;
  openUrl: (href: string, newTab: boolean) => void;
  pageUrl: () => string;
  isOwnedHost?: (host: string) => boolean;
  waitMs?: number;
}) {
  const listeners = new Set<(notice: PostedLinkNotice) => void>();
  let counts: Counts = {};
  // one held tap at a time: a second tap while the list loads is dropped,
  // so a double tap never opens two tabs
  let holding = false;

  function report(kind: PostedLinkNoticeKind, url: string) {
    counts[kind] = Math.min(POSTED_LINK_COUNT_CAP, (counts[kind] || 0) + 1);
    for (const listener of [...listeners]) listener({ kind, url });
  }

  function decided(answer: LinkBlocklistAnswer, link: OutsideLink) {
    if (answer === 'blocked') return report('blocked', link.url.href);
    if (answer === 'refused') return report('unchecked', link.url.href);
    openUrl(link.url.href, link.newTab);
  }

  async function hold(link: OutsideLink) {
    holding = true;
    try {
      decided(await blocklist.check(link.url.hostname, waitMs), link);
    } finally {
      holding = false;
    }
  }

  // true when the guard took the tap (blocked, or held for the list)
  function take(link: OutsideLink, stop: () => void, openWhenAllowed: boolean) {
    const answer = blocklist.match(link.url.hostname);
    blocklist.refresh(POSTED_LINK_REFRESH_MS);
    if (answer === 'blocked') {
      stop();
      report('blocked', link.url.href);
      return true;
    }
    if (answer === 'allowed') {
      if (openWhenAllowed) openUrl(link.url.href, link.newTab);
      return false;
    }
    // no list has loaded on this page yet
    stop();
    if (!holding) void hold(link);
    return true;
  }

  return {
    /** For the page's click listener (capture phase). */
    handleClick(event: ClickLike) {
      const link = findOutsideLink(event, pageUrl(), isOwnedHost);
      if (!link) return false;
      return take(
        link,
        () => {
          event.preventDefault();
          event.stopPropagation();
        },
        false
      );
    },
    /** Opens an outside link from script (in a tap), checked the same way. */
    open(href: string, { newTab = true }: { newTab?: boolean } = {}) {
      let url: URL;
      try {
        url = new URL(href, pageUrl());
      } catch {
        return;
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      if (isOwnedHost(url.hostname)) {
        openUrl(url.href, newTab);
        return;
      }
      take({ url, newTab }, () => null, true);
    },
    onNotice(listener: (notice: PostedLinkNotice) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** The counts since the last call (each capped), for telemetry. */
    takeCounts(): Counts {
      const taken = counts;
      counts = {};
      return taken;
    }
  };
}

/**
 * Whether a link preview (title, description, thumbnail) is hidden: its
 * site is on the list in hand. Before any list loads, or with no list after
 * a failed load, previews show (a preview is not navigation, and its tap is
 * still guarded; review S3). A bare "example.com" counts as https.
 */
export function linkPreviewHidden(
  url: string | null | undefined,
  blocklist: Pick<LinkBlocklistLike, 'match'>
) {
  const raw = String(url || '').trim();
  if (!raw) return false;
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return blocklist.match(parsed.hostname) === 'blocked';
  } catch {
    return false;
  }
}

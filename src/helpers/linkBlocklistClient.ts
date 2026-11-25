// Twinkle's blocked-site list on the page (Mikey 11-25; twinkle-api
// helpers/linkBlocklist.ts, managed with `lumine admin link-block`). The
// page downloads the whole list (GET /build/link-blocklist, at most 5,000
// hosts) and matches links here, with the server's rule: a listed host
// covers its subdomains. There is no request per link, so an app cannot use
// up a limit to switch the list off, and a school sharing one address never
// hits one (review R2-B1).
//
// What a check answers:
// - 'blocked' / 'allowed': matched against a list loaded in the last
//   LIST_FRESH_MS, or against one that loads within the wait;
// - 'refused': the server answered the list request with a 4xx, which never
//   means "unknown": the link is not opened;
// - 'unknown': only a real network error, a timeout or a 5xx, with no list
//   ever loaded. The sheet then shows as usual: it still names the real site
//   and needs the viewer's tap. An older list is used when there is one.
// One copy per page (helpers/pageLinkBlocklist.ts) serves the app link
// sheet and posted links (helpers/postedLinkGuard.ts). Posted links use
// `match` (any list in hand, decided inside the tap) and `refresh` (keep the
// copy from going stale); the app sheet uses `check`.
export const LINK_BLOCKLIST_FRESH_MS = 10 * 60_000;
export const LINK_BLOCKLIST_RETRY_MS = 10_000;
export const LINK_BLOCKLIST_WAIT_MS = 4_000;

export type LinkBlocklistAnswer = 'blocked' | 'allowed' | 'refused' | 'unknown';

/** The host as the list stores it: lower case, no trailing dot. */
export function normalizeLinkHostForMatch(host: string) {
  return String(host || '').trim().toLowerCase().replace(/\.+$/, '');
}

/** The listed entry that covers this host (itself or a parent domain), or null. */
export function matchBlockedLinkHost(host: string, blocked: Set<string>) {
  const normalized = normalizeLinkHostForMatch(host);
  if (!normalized) return null;
  if (normalized.startsWith('[') || /^\d+(\.\d+){3}$/.test(normalized)) {
    return blocked.has(normalized) ? normalized : null;
  }
  const labels = normalized.split('.');
  for (let index = 0; index < labels.length; index += 1) {
    const candidate = labels.slice(index).join('.');
    if (blocked.has(candidate)) return candidate;
  }
  return null;
}

function errorStatus(error: any) {
  const status = Number(error?.status ?? error?.response?.status ?? 0);
  return Number.isFinite(status) ? status : 0;
}

export function createLinkBlocklistClient({
  fetchList,
  now = () => Date.now(),
  waitMs = LINK_BLOCKLIST_WAIT_MS
}: {
  // resolves { hosts }, or throws an error carrying the HTTP status
  fetchList: () => Promise<{ hosts?: unknown }>;
  now?: () => number;
  waitMs?: number;
}) {
  let hosts: Set<string> | null = null;
  let loadedAt = 0;
  let failedAt = 0;
  let refused = false;
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function load() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const data = await fetchList();
        const list = Array.isArray(data?.hosts) ? data.hosts : [];
        hosts = new Set(
          list.slice(0, 5000).map((host) => normalizeLinkHostForMatch(String(host))).filter(Boolean)
        );
        loadedAt = now();
        failedAt = 0;
        refused = false;
      } catch (error) {
        const status = errorStatus(error);
        failedAt = now();
        refused = status >= 400 && status < 500;
      } finally {
        loading = null;
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch {
            // a listener never stops the others
          }
        }
      }
    })();
    return loading;
  }

  function answerFrom(host: string): LinkBlocklistAnswer {
    if (hosts && now() - loadedAt < LINK_BLOCKLIST_FRESH_MS) {
      return matchBlockedLinkHost(host, hosts) ? 'blocked' : 'allowed';
    }
    if (refused) return 'refused';
    if (hosts) return matchBlockedLinkHost(host, hosts) ? 'blocked' : 'allowed';
    return 'unknown';
  }

  return {
    /**
     * Posted links (helpers/postedLinkGuard.ts): the answer from any list in
     * hand, whatever its age and even after a refused refresh, or null when
     * no list has loaded on this page yet. Nothing on a page can make the
     * list slow or refused on purpose, so an older list is good enough there
     * (Mikey's rule via the coordinator, review S3); the app sheet keeps the
     * stricter `check`.
     */
    match(host: string): 'blocked' | 'allowed' | null {
      if (!hosts) return null;
      return matchBlockedLinkHost(host, hosts) ? 'blocked' : 'allowed';
    },
    /**
     * Load the list again when the copy in hand is older than `olderThanMs`
     * (or there is none), unless a load is running or just failed. Cheap to
     * call on every press: it does nothing otherwise.
     */
    refresh(olderThanMs: number) {
      if (hosts && now() - loadedAt < olderThanMs) return;
      if (failedAt && now() - failedAt < LINK_BLOCKLIST_RETRY_MS) return;
      void load();
    },
    /** Called after every load finishes (loaded or failed). */
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Start loading early (when an app opens), so a tap rarely waits. */
    preload() {
      if (hosts && now() - loadedAt < LINK_BLOCKLIST_FRESH_MS) return;
      if (failedAt && now() - failedAt < LINK_BLOCKLIST_RETRY_MS) return;
      void load();
    },
    // `wait`: how long a tap may wait for a list that is still loading
    async check(host: string, wait = waitMs): Promise<LinkBlocklistAnswer> {
      const fresh = hosts && now() - loadedAt < LINK_BLOCKLIST_FRESH_MS;
      if (!fresh && !(failedAt && now() - failedAt < LINK_BLOCKLIST_RETRY_MS)) {
        // wait briefly for the list; a slow list never holds the tap forever
        let timer: ReturnType<typeof setTimeout> | undefined;
        await Promise.race([
          load(),
          new Promise<void>((resolve) => {
            timer = setTimeout(resolve, wait);
          })
        ]);
        if (timer) clearTimeout(timer);
      }
      return answerFrom(host);
    }
  };
}

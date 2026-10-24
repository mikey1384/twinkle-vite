import { previousPageDied } from '~/helpers/pageDeathTracker';

// After the browser kills or discards the tab (pageDeathTracker), the home feed
// comes back where the viewer was instead of at the top (10-25: Mikey lost his
// place 55,000 px down the feed when Safari reloaded the tab). The loaded
// feed pages and the saved scroll anchor are kept in sessionStorage, which
// survives those reloads in the same tab. A normal reload or a new visit still
// starts fresh: this is used only when the previous page died.
//
// Only the default view (Recommended, all, newest first) is kept: it is what a
// fresh load shows anyway, so restoring it changes nothing but the position.

const FEED_KEY = 'twinkle:home-feed-lifeline';
const ANCHOR_KEY = 'twinkle:home-feed-lifeline-anchor';
const MAX_AGE_MS = 3 * 60 * 60 * 1000;
// sessionStorage holds about 5 MB per site; leave room for everything else.
const MAX_CHARS = 2_500_000;
export const HOME_FEED_LIFELINE_ANCHOR_KEY = 'recommended:all:desc';

export interface HomeFeedLifelinePage {
  feeds: any[];
  loadMoreButton: boolean;
  feedPaginationCursor: unknown;
}

export interface HomeFeedLifelineAnchor {
  anchorKey: string;
  primaryId?: string;
  secondaryId?: string;
  contentKey?: string;
  offset: number;
  scrollTop: number;
}

let taken = false;

function write(key: string, value: unknown) {
  try {
    const text = JSON.stringify(value);
    if (text.length > MAX_CHARS) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, text);
  } catch {
    // full or blocked storage: the next reload just starts at the top
  }
}

function read<T>(key: string): T | null {
  try {
    const text = sessionStorage.getItem(key);
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

export function saveHomeFeedLifeline(userId: number | null, page: HomeFeedLifelinePage) {
  write(FEED_KEY, { userId: Number(userId) || 0, savedAt: Date.now(), page });
}

export function saveHomeFeedLifelineAnchor(
  userId: number | null,
  anchor: HomeFeedLifelineAnchor | null
) {
  if (!anchor) return;
  write(ANCHOR_KEY, { userId: Number(userId) || 0, savedAt: Date.now(), anchor });
}

/**
 * The saved feed and anchor, once per page load, and only when the previous
 * page in this tab died. Null otherwise.
 */
export function takeHomeFeedLifeline(userId: number | null): {
  page: HomeFeedLifelinePage;
  anchor: HomeFeedLifelineAnchor | null;
} | null {
  if (taken) return null;
  taken = true;
  if (!previousPageDied()) return null;
  const saved = read<{ userId: number; savedAt: number; page: HomeFeedLifelinePage }>(FEED_KEY);
  const anchor = read<{ userId: number; savedAt: number; anchor: HomeFeedLifelineAnchor }>(ANCHOR_KEY);
  const viewer = Number(userId) || 0;
  if (
    !saved ||
    saved.userId !== viewer ||
    !(Date.now() - saved.savedAt < MAX_AGE_MS) ||
    !Array.isArray(saved.page?.feeds) ||
    saved.page.feeds.length === 0
  ) {
    return null;
  }
  return {
    page: saved.page,
    anchor:
      anchor && anchor.userId === viewer && anchor.anchor?.anchorKey === HOME_FEED_LIFELINE_ANCHOR_KEY
        ? anchor.anchor
        : null
  };
}

import { createLinkBlocklistClient } from './linkBlocklistClient';

// The page's one copy of Twinkle's blocked-site list
// (helpers/linkBlocklistClient.ts), shared by the app link sheet
// (components/Build/AppLink) and posted links (helpers/postedLinkGuard.ts),
// so a page downloads the list once however many places check it.
// The download goes through the website's request helper
// (requestHelpers.loadLinkBlocklist), handed in by whichever component
// mounted last; until one has, a check counts as "no answer" (status 0),
// never as a refusal.
type FetchList = () => Promise<{ hosts?: unknown }>;
let fetchList: FetchList | null = null;

export function setLinkBlocklistFetcher(fetcher: FetchList | null | undefined) {
  if (fetcher) fetchList = fetcher;
}

export const pageLinkBlocklist = createLinkBlocklistClient({
  fetchList: () => {
    if (!fetchList) {
      return Promise.reject(Object.assign(new Error('unavailable'), { status: 0 }));
    }
    return fetchList();
  }
});

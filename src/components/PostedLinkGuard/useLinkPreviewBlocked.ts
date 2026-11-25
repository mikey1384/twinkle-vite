import { useEffect, useReducer } from 'react';
import { pageLinkBlocklist } from '~/helpers/pageLinkBlocklist';
import { linkPreviewHidden, POSTED_LINK_REFRESH_MS } from '~/helpers/postedLinkGuard';

// Whether a link preview (title, description, thumbnail) should be hidden
// because its site is on Twinkle's blocked-site list. Re-checks whenever
// the page's list loads. Until a list has loaded, the preview shows as
// usual; a blocked site's preview then disappears.
export default function useLinkPreviewBlocked(url?: string | null) {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (!url) return;
    const stop = pageLinkBlocklist.subscribe(rerender);
    pageLinkBlocklist.refresh(POSTED_LINK_REFRESH_MS);
    return stop;
  }, [url]);
  return linkPreviewHidden(url, pageLinkBlocklist);
}

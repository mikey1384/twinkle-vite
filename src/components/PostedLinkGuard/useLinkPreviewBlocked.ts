import { useEffect, useReducer } from 'react';
import { pageLinkBlocklist } from '~/helpers/pageLinkBlocklist';
import { linkPreviewHidden } from '~/helpers/postedLinkGuard';

// Whether a link preview (title, description, thumbnail) should be hidden:
// 'blocked' (its site is on Twinkle's blocked-site list), 'unchecked' (the
// server refused the list), or false. Re-checks whenever
// the page's list loads. Until the first load has finished either way, the
// preview shows as usual; a blocked site's preview then disappears.
export default function useLinkPreviewBlocked(url?: string | null) {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (!url) return;
    const stop = pageLinkBlocklist.subscribe(rerender);
    pageLinkBlocklist.preload();
    return stop;
  }, [url]);
  return linkPreviewHidden(url, pageLinkBlocklist);
}

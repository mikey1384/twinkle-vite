import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '~/contexts';

// Tabs store only a path, so an app tab's cover is looked up when the strip
// renders: pins made before this existed get their cover too, and a creator's
// new cover shows up without anyone re-pinning. One request covers every app
// tab; answers are kept for the page's life and refreshed when they get old.
const FRESH_FOR_MS = 10 * 60 * 1000;
// '' records "this app has no cover" so it is not asked for again right away.
const cache = new Map<string, { url: string; at: number }>();

export default function useBuildAppTabThumbnails(buildAppIds: string[]) {
  const loadBuildTabThumbnails = useAppContext(
    (v) => v.requestHelpers.loadBuildTabThumbnails
  );
  const idsKey = useMemo(
    () => [...new Set(buildAppIds)].sort().join(','),
    [buildAppIds]
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    const ids = idsKey.split(',');
    void refresh();
    // A tab strip can stay open for days; re-check while it does.
    const timer = setInterval(() => void refresh(), FRESH_FOR_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };

    async function refresh() {
      const now = Date.now();
      const wanted = ids.filter((id) => {
        const hit = cache.get(id);
        return !hit || now - hit.at >= FRESH_FOR_MS;
      });
      if (!wanted.length) return;
      try {
        const data = await loadBuildTabThumbnails(wanted);
        const thumbnails = data?.thumbnails;
        if (!thumbnails || typeof thumbnails !== 'object') return;
        for (const id of wanted) {
          const url = thumbnails[id];
          cache.set(id, {
            url: typeof url === 'string' ? url : '',
            at: Date.now()
          });
        }
        if (!cancelled) setVersion((version) => version + 1);
      } catch {
        // The rocket icon stays; the next refresh tries again.
      }
    }
    // loadBuildTabThumbnails is a stable request helper — excluded per repo rule
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // A new object only when the tab set or the answers change, so the strip's
  // memoized descriptors are not rebuilt on every header render.
  return useMemo(() => {
    const thumbnails: Record<string, string> = {};
    for (const id of idsKey ? idsKey.split(',') : []) {
      const url = cache.get(id)?.url;
      if (url) thumbnails[id] = url;
    }
    return thumbnails;
    // version is the cache's change signal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, version]);
}

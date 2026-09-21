import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { BuildAppReference } from '../../helpers/appReferences';

export default function useReferenceAppSearch(buildId: number) {
  const loadBuildChatReferenceApps = useAppContext(
    (v) => v.requestHelpers.loadBuildChatReferenceApps
  );
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState<BuildAppReference[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestVersionRef = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const version = ++requestVersionRef.current;
    setApps([]);
    setCursor(null);
    setError('');
    setLoading(true);
    setLoadingMore(false);
    loadingMoreRef.current = false;
    const timer = window.setTimeout(
      () => {
        void loadPage(null, version);
      },
      search.trim() ? 250 : 0
    );
    return () => {
      window.clearTimeout(timer);
      requestVersionRef.current += 1;
    };
    // Request helpers are stable context actions; only the search scope
    // should restart the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, search]);

  return {
    search,
    apps,
    cursor,
    loading,
    loadingMore,
    error,
    changeSearch,
    loadMore,
    retry
  };

  function changeSearch(value: string) {
    if (value === search) return;
    // Invalidate immediately, before React commits the new search effect.
    requestVersionRef.current += 1;
    setSearch(value);
    setApps([]);
    setCursor(null);
    setLoading(true);
    setError('');
  }

  async function loadPage(pageCursor: string | null, version: number) {
    try {
      const result = await loadBuildChatReferenceApps({
        buildId,
        search: search.trim(),
        cursor: pageCursor || undefined,
        limit: 20
      });
      if (version !== requestVersionRef.current) return;
      if (!Array.isArray(result?.apps))
        throw new Error('Could not load your apps.');
      setApps((previous) => {
        const byId = new Map<number, BuildAppReference>();
        for (const app of [...(pageCursor ? previous : []), ...result.apps])
          byId.set(app.id, app);
        return [...byId.values()];
      });
      setCursor(result.cursor || null);
      setError('');
    } catch {
      if (version !== requestVersionRef.current) return;
      setError(
        pageCursor
          ? 'Could not load more apps. Try again.'
          : 'Could not load your apps. Try again.'
      );
    } finally {
      if (version === requestVersionRef.current) {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }

  function loadMore() {
    if (!cursor || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError('');
    void loadPage(cursor, requestVersionRef.current);
  }

  function retry() {
    if (loading || loadingMoreRef.current) return;
    if (cursor) return loadMore();
    setLoading(true);
    setError('');
    void loadPage(null, requestVersionRef.current);
  }
}

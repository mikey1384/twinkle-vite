import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { AIImageCollection } from '~/helpers/aiImageHistory';

// The member's collections for the image maker's collection bar. The last
// list the server sent is kept for the session, so reopening the image maker
// shows the chips at once; every open still asks the server and shows what
// it answers (the Collections window reports its canonical list here too).
const cache = new Map<number, AIImageCollection[]>();

export default function useAIImageCollections(userId?: number | null) {
  const loadAIImageCollections = useAppContext(
    (v) => v.requestHelpers.loadAIImageCollections
  );
  const [collections, setCollectionsState] = useState<
    AIImageCollection[] | null
  >(() => (userId ? cache.get(userId) || null : null));

  const setCollections = useCallback(
    (next: AIImageCollection[]) => {
      if (userId) cache.set(userId, next);
      setCollectionsState(next);
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    setCollectionsState(cache.get(userId) || null);
    loadAIImageCollections()
      .then((data: { collections: AIImageCollection[] }) => {
        if (ignore) return;
        const list = data?.collections || [];
        cache.set(userId, list);
        setCollectionsState(list);
      })
      .catch((error: unknown) => {
        // the bar falls back to its plain Collections button
        console.error('Failed to load image collections:', error);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { collections, setCollections };
}

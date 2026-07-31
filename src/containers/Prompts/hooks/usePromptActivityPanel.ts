import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { PromptActivityItem } from '../PromptActivityPanel';

interface PromptActivityFeedState {
  activities: PromptActivityItem[];
  error: string;
  loadMoreToken: string | null;
  loadedAt: number;
  userId: number | null;
}

const promptActivityCacheFreshMs = 45_000;

function createEmptyPromptActivityFeed(
  userId: number | null = null
): PromptActivityFeedState {
  return {
    activities: [],
    error: '',
    loadMoreToken: null,
    loadedAt: 0,
    userId
  };
}

export default function usePromptActivityPanel({
  userId
}: {
  userId: number | null;
}) {
  const loadSharedPromptActivity = useAppContext(
    (v) => v.requestHelpers.loadSharedPromptActivity
  );
  const [feed, setFeed] = useState(createEmptyPromptActivityFeed);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadRef = useRef(0);
  const feedMatchesUser = feed.userId === userId;
  const visibleFeed = feedMatchesUser
    ? feed
    : createEmptyPromptActivityFeed(userId);
  const cacheFresh =
    feedMatchesUser &&
    feed.loadedAt > 0 &&
    Date.now() - feed.loadedAt < promptActivityCacheFreshMs;

  useEffect(() => {
    if (!userId) {
      loadRef.current += 1;
      setFeed(createEmptyPromptActivityFeed());
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    if (cacheFresh) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    void loadActivity({ requestUserId: userId });
    return () => {
      loadRef.current += 1;
    };
    // loadSharedPromptActivity is a stable request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheFresh, userId]);

  return {
    panelProps: {
      activities: visibleFeed.activities,
      currentUserId: userId || 0,
      error: visibleFeed.error,
      hasMore: Boolean(visibleFeed.loadMoreToken),
      loading,
      loadingMore,
      onLoadMore: handleLoadMore,
      onRefresh: handleRefresh
    },
    refresh: handleRefresh
  };

  function handleRefresh() {
    if (!userId) return;
    void loadActivity({ requestUserId: userId, showLoading: true });
  }

  async function handleLoadMore() {
    const cursor = feedMatchesUser ? feed.loadMoreToken : null;
    if (!userId || !cursor || loading || loadingMore) return;
    const requestUserId = userId;
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    setLoadingMore(true);
    try {
      const data = await loadSharedPromptActivity({
        cursor,
        limit: 12
      });
      if (loadRef.current !== loadId) return;
      const nextActivities = Array.isArray(data?.activities)
        ? (data.activities as PromptActivityItem[])
        : [];
      setFeed((currentFeed) => {
        if (currentFeed.userId !== requestUserId) {
          return currentFeed;
        }
        return {
          activities: mergePromptActivities(
            currentFeed.activities,
            nextActivities
          ),
          error: '',
          loadMoreToken:
            typeof data?.loadMoreToken === 'string'
              ? data.loadMoreToken
              : null,
          loadedAt: Date.now(),
          userId: requestUserId
        };
      });
    } catch (error) {
      console.error('Failed to load more AI prompt activity:', error);
    } finally {
      if (loadRef.current === loadId) {
        setLoadingMore(false);
      }
    }
  }

  async function loadActivity({
    requestUserId,
    showLoading = !feedMatchesUser || feed.loadedAt === 0
  }: {
    requestUserId: number;
    showLoading?: boolean;
  }) {
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    setLoading(showLoading);
    setLoadingMore(false);
    try {
      const data = await loadSharedPromptActivity({ limit: 12 });
      if (loadRef.current !== loadId) return;
      setFeed({
        activities: Array.isArray(data?.activities) ? data.activities : [],
        error: '',
        loadMoreToken:
          typeof data?.loadMoreToken === 'string'
            ? data.loadMoreToken
            : null,
        loadedAt: Date.now(),
        userId: requestUserId
      });
    } catch (error: any) {
      if (loadRef.current !== loadId) return;
      setFeed((currentFeed) => ({
        ...(currentFeed.userId === requestUserId
          ? currentFeed
          : createEmptyPromptActivityFeed(requestUserId)),
        error:
          error?.response?.data?.error ||
          error?.message ||
          'AI prompt activity could not load.',
        loadedAt: Date.now(),
        userId: requestUserId
      }));
    } finally {
      if (loadRef.current === loadId) {
        setLoading(false);
      }
    }
  }
}

function mergePromptActivities(
  current: PromptActivityItem[],
  incoming: PromptActivityItem[]
) {
  const byId = new Map<string, PromptActivityItem>();
  for (const activity of [...current, ...incoming]) {
    byId.set(activity.id, activity);
  }
  return Array.from(byId.values());
}

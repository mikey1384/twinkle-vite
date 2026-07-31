import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import type {
  PromptActivityItem,
  PromptActivityScope
} from '../PromptActivityPanel';

interface PromptActivityFeedState {
  activities: PromptActivityItem[];
  error: string;
  loadMoreToken: string | null;
  loadedAt: number;
}

const promptActivityCacheFreshMs = 45_000;

function createEmptyPromptActivityFeed(): PromptActivityFeedState {
  return {
    activities: [],
    error: '',
    loadMoreToken: null,
    loadedAt: 0
  };
}

function createEmptyPromptActivityFeeds(): Record<
  PromptActivityScope,
  PromptActivityFeedState
> {
  return {
    all: createEmptyPromptActivityFeed(),
    mine: createEmptyPromptActivityFeed(),
    community: createEmptyPromptActivityFeed()
  };
}

export default function usePromptActivityPanel({
  color,
  userId
}: {
  color?: string;
  userId: number | null;
}) {
  const loadSharedPromptActivity = useAppContext(
    (v) => v.requestHelpers.loadSharedPromptActivity
  );
  const [activeScope, setActiveScope] =
    useState<PromptActivityScope>('all');
  const [feeds, setFeeds] = useState(createEmptyPromptActivityFeeds);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadRef = useRef(0);
  const activeFeed = feeds[activeScope];
  const cacheFresh =
    activeFeed.loadedAt > 0 &&
    Date.now() - activeFeed.loadedAt < promptActivityCacheFreshMs;

  useEffect(() => {
    if (!userId) {
      setFeeds(createEmptyPromptActivityFeeds());
      setLoading(false);
      setLoadingMore(false);
      setActiveScope('all');
      return;
    }
    if (cacheFresh) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    void loadActivity({ scope: activeScope });
    return () => {
      loadRef.current += 1;
    };
    // loadSharedPromptActivity is a stable request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope, cacheFresh, userId]);

  return {
    panelProps: {
      activeScope,
      activities: activeFeed.activities,
      color,
      currentUserId: userId || 0,
      error: activeFeed.error,
      hasMore: Boolean(activeFeed.loadMoreToken),
      loading,
      loadingMore,
      onLoadMore: handleLoadMore,
      onRefresh: handleRefresh,
      onScopeChange: handleScopeChange
    },
    refresh: handleRefresh
  };

  function handleScopeChange(scope: PromptActivityScope) {
    if (scope === activeScope) {
      void loadActivity({ scope, showLoading: true });
      return;
    }
    setLoadingMore(false);
    setActiveScope(scope);
  }

  function handleRefresh() {
    void loadActivity({ scope: activeScope, showLoading: true });
  }

  async function handleLoadMore() {
    const cursor = feeds[activeScope].loadMoreToken;
    if (!userId || !cursor || loading || loadingMore) return;
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    setLoadingMore(true);
    try {
      const data = await loadSharedPromptActivity({
        cursor,
        limit: 12,
        scope: activeScope
      });
      if (loadRef.current !== loadId) return;
      const nextActivities = Array.isArray(data?.activities)
        ? (data.activities as PromptActivityItem[])
        : [];
      setFeeds((currentFeeds) => ({
        ...currentFeeds,
        [activeScope]: {
          activities: mergePromptActivities(
            currentFeeds[activeScope].activities,
            nextActivities
          ),
          error: '',
          loadMoreToken:
            typeof data?.loadMoreToken === 'string'
              ? data.loadMoreToken
              : null,
          loadedAt: Date.now()
        }
      }));
    } catch (error) {
      console.error('Failed to load more AI prompt activity:', error);
    } finally {
      if (loadRef.current === loadId) {
        setLoadingMore(false);
      }
    }
  }

  async function loadActivity({
    scope,
    showLoading = feeds[scope].loadedAt === 0
  }: {
    scope: PromptActivityScope;
    showLoading?: boolean;
  }) {
    if (!userId) return;
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    setLoading(showLoading);
    setLoadingMore(false);
    try {
      const data = await loadSharedPromptActivity({
        limit: 12,
        scope
      });
      if (loadRef.current !== loadId) return;
      setFeeds((currentFeeds) => ({
        ...currentFeeds,
        [scope]: {
          activities: Array.isArray(data?.activities)
            ? data.activities
            : [],
          error: '',
          loadMoreToken:
            typeof data?.loadMoreToken === 'string'
              ? data.loadMoreToken
              : null,
          loadedAt: Date.now()
        }
      }));
    } catch (error: any) {
      if (loadRef.current !== loadId) return;
      setFeeds((currentFeeds) => ({
        ...currentFeeds,
        [scope]: {
          ...currentFeeds[scope],
          error:
            error?.response?.data?.error ||
            error?.message ||
            'AI prompt activity could not load.',
          loadedAt: Date.now()
        }
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

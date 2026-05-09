import { useEffect, useRef, useState } from 'react';
import type { ActivityItem } from '../../ActivityPanel';
import {
  useAppContext,
  useBuildContext
} from '~/contexts';
import type {
  BuildActivitySubtab,
  BuildActivityTab
} from '~/contexts/Build/reducer';
import {
  compareBuildActivityPositions,
  getBuildActivityFeedState,
  getBuildActivityFeedSubtab,
  getBuildActivityLatestPosition,
  getBuildActivityRequestKind,
  getBuildActivityViewedPosition,
  getEmptyBuildActivityPosition,
  getLoadMoreToken,
  isValidBuildActivityPosition,
  normalizeBuildActivitySubtab,
  normalizeBuildActivityTab
} from '../helpers';
import { buildActivityCacheFreshMs } from '../constants/layout';
import type { BuildActivityPosition } from '../types';

export default function useActivityPanel({
  buildStudio,
  color,
  normalizedUserId
}: {
  buildStudio: any;
  color?: string;
  normalizedUserId: number | null;
}) {
  const loadBuildActivity = useAppContext(
    (v) => v.requestHelpers.loadBuildActivity
  );
  const updateBuildActivityViewed = useAppContext(
    (v) => v.requestHelpers.updateBuildActivityViewed
  );
  const onSetBuildStudioActivityFilter = useBuildContext(
    (v) => v.actions.onSetBuildStudioActivityFilter
  );
  const onSetBuildStudioActivityItems = useBuildContext(
    (v) => v.actions.onSetBuildStudioActivityItems
  );
  const onAppendBuildStudioActivityItems = useBuildContext(
    (v) => v.actions.onAppendBuildStudioActivityItems
  );
  const onSetBuildStudioActivityViewed = useBuildContext(
    (v) => v.actions.onSetBuildStudioActivityViewed
  );

  const activeTab = normalizeBuildActivityTab(
    buildStudio?.activityPanel?.activeTab
  );
  const rawActiveSubtab = normalizeBuildActivitySubtab(
    buildStudio?.activityPanel?.activeSubtab
  );
  const activeSubtab = getBuildActivityFeedSubtab(activeTab, rawActiveSubtab);
  const activeFeedState = getBuildActivityFeedState({
    buildStudio,
    activeTab,
    activeSubtab
  });
  const loadedForCurrentUser = Boolean(
    normalizedUserId &&
      activeFeedState.userId === normalizedUserId &&
      activeFeedState.loaded
  );
  const cacheFreshForCurrentUser = Boolean(
    loadedForCurrentUser &&
      Date.now() - Number(activeFeedState.loadedAt || 0) <
        buildActivityCacheFreshMs
  );
  const activities = loadedForCurrentUser
    ? ((activeFeedState.activities || []) as ActivityItem[])
    : [];
  const cursor = loadedForCurrentUser ? activeFeedState.loadMoreToken : null;
  const allFeedState = getBuildActivityFeedState({
    buildStudio,
    activeTab: 'all',
    activeSubtab: 'all'
  });
  const allLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      allFeedState.userId === normalizedUserId &&
      allFeedState.loaded
  );
  const allActivities = allLoadedForCurrentUser
    ? ((allFeedState.activities || []) as ActivityItem[])
    : [];
  const allLatestPosition = getBuildActivityLatestPosition(allActivities);
  const allLastViewedPosition = allLoadedForCurrentUser
    ? getBuildActivityViewedPosition(allFeedState)
    : getEmptyBuildActivityPosition();
  const allCacheFreshForCurrentUser = Boolean(
    allLoadedForCurrentUser &&
      Date.now() - Number(allFeedState.loadedAt || 0) <
        buildActivityCacheFreshMs
  );
  const hasNewActivity =
    compareBuildActivityPositions(
      allLatestPosition,
      allLastViewedPosition
    ) > 0;

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const [error, setError] = useState('');
  const loadRef = useRef(0);
  const allLoadRef = useRef(0);

  useEffect(() => {
    if (!normalizedUserId) {
      setLoading(false);
      setLoadingMore(false);
      setSilentRefreshing(false);
      setError('');
      onSetBuildStudioActivityFilter({
        activityTab: 'all',
        activitySubtab: 'all'
      });
      return;
    }
    if (cacheFreshForCurrentUser) {
      setLoading(false);
      setLoadingMore(false);
      setSilentRefreshing(false);
      setError('');
      return;
    }
    void loadItems({
      showError: !loadedForCurrentUser,
      showLoading: !loadedForCurrentUser,
      subtab: activeSubtab,
      tab: activeTab
    });

    return () => {
      loadRef.current += 1;
    };
    // loadBuildActivity and context actions are stable request/action helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    activeTab,
    activeSubtab,
    loadedForCurrentUser,
    cacheFreshForCurrentUser
  ]);

  useEffect(() => {
    if (!normalizedUserId || activeTab === 'all') return;
    if (allCacheFreshForCurrentUser) return;
    void loadAllItems();

    return () => {
      allLoadRef.current += 1;
    };
    // loadBuildActivity and context actions are stable request/action helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId, activeTab, allCacheFreshForCurrentUser]);

  const panelProps = {
    activeSubtab,
    activeTab,
    activities,
    color,
    currentUserId: normalizedUserId || 0,
    error,
    hasMore: Boolean(cursor),
    loading,
    loadingMore,
    onLoadMore: handleLoadMore,
    onRefresh: handleRefresh,
    onSubtabChange: handleSubtabChange,
    onTabChange: handleTabChange
  };

  return {
    hasNewActivity,
    onMobileOpen: handleMobileOpen,
    panelProps
  };

  async function loadItems({
    showError = true,
    showLoading = true,
    subtab = activeSubtab,
    tab = activeTab
  }: {
    showError?: boolean;
    showLoading?: boolean;
    subtab?: BuildActivitySubtab;
    tab?: BuildActivityTab;
  } = {}) {
    if (!normalizedUserId) return;
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    setLoading(showLoading);
    setLoadingMore(false);
    setSilentRefreshing(!showLoading);
    if (showError) setError('');
    try {
      const data = await loadBuildActivity({
        kind: getBuildActivityRequestKind(tab, subtab),
        limit: 12,
        scope: tab
      });
      if (loadRef.current === loadId) {
        const nextActivities = Array.isArray(data?.activities)
          ? data.activities
          : [];
        onSetBuildStudioActivityItems({
          activities: nextActivities,
          activityLoadedAt: Date.now(),
          activitySubtab: getBuildActivityFeedSubtab(tab, subtab),
          activityTab: tab,
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
        if (tab === 'all') {
          void markPositionViewed(
            getBuildActivityLatestPosition(nextActivities as ActivityItem[])
          );
        }
        setError('');
      }
    } catch (err: any) {
      console.error('Failed to load build activity:', err);
      if (loadRef.current === loadId && showError) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Build activity could not load.'
        );
      }
    } finally {
      if (loadRef.current === loadId) {
        setLoading(false);
        setSilentRefreshing(false);
      }
    }
  }

  async function loadAllItems() {
    if (!normalizedUserId) return;
    const loadId = allLoadRef.current + 1;
    allLoadRef.current = loadId;
    try {
      const data = await loadBuildActivity({
        kind: 'all',
        limit: 12,
        scope: 'all'
      });
      if (allLoadRef.current === loadId) {
        onSetBuildStudioActivityItems({
          activities: data?.activities || [],
          activityLoadedAt: Date.now(),
          activitySubtab: 'all',
          activityTab: 'all',
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
      }
    } catch (err) {
      console.error('Failed to load all build activity:', err);
    }
  }

  function handleRefresh() {
    void loadItems({
      showError: true,
      showLoading: true
    });
  }

  async function markPositionViewed(position: BuildActivityPosition) {
    if (!normalizedUserId || !isValidBuildActivityPosition(position)) {
      return;
    }
    try {
      const data = await updateBuildActivityViewed({
        lastViewedAllActivityAt: position.timeStamp,
        lastViewedAllActivitySourceRank: position.sourceRank,
        lastViewedAllActivitySortId: position.sortId
      });
      onSetBuildStudioActivityViewed({
        lastViewedAllActivityAt:
          data?.lastViewedAllActivityAt || position.timeStamp,
        lastViewedAllActivitySourceRank:
          data?.lastViewedAllActivitySourceRank || position.sourceRank,
        lastViewedAllActivitySortId:
          data?.lastViewedAllActivitySortId || position.sortId,
        userId: normalizedUserId
      });
    } catch (err) {
      console.error('Failed to mark build activity viewed:', err);
    }
  }

  async function markViewed() {
    return markPositionViewed(allLatestPosition);
  }

  function handleMobileOpen() {
    if (hasNewActivity && activeTab !== 'all') {
      onSetBuildStudioActivityFilter({
        activityTab: 'all',
        activitySubtab: 'all'
      });
    }
    void markViewed();
  }

  function handleTabChange(tab: BuildActivityTab) {
    if (tab === 'all') {
      void markViewed();
    }
    if (tab !== activeTab) {
      onSetBuildStudioActivityFilter({
        activityTab: tab,
        activitySubtab: getBuildActivityFeedSubtab(tab, activeSubtab)
      });
    }
  }

  function handleSubtabChange(subtab: Exclude<BuildActivitySubtab, 'all'>) {
    if (subtab !== activeSubtab) {
      onSetBuildStudioActivityFilter({ activitySubtab: subtab });
    }
  }

  async function handleLoadMore() {
    if (
      !normalizedUserId ||
      !cursor ||
      loading ||
      loadingMore ||
      silentRefreshing
    ) {
      return;
    }
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    setLoadingMore(true);
    setError('');
    try {
      const data = await loadBuildActivity({
        cursor,
        kind: getBuildActivityRequestKind(activeTab, activeSubtab),
        limit: 12,
        scope: activeTab
      });
      if (loadRef.current === loadId) {
        onAppendBuildStudioActivityItems({
          activities: data?.activities || [],
          activityLoadedAt: Date.now(),
          activitySubtab: getBuildActivityFeedSubtab(activeTab, activeSubtab),
          activityTab: activeTab,
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
      }
    } catch (err: any) {
      console.error('Failed to load more build activity:', err);
    } finally {
      if (loadRef.current === loadId) {
        setLoadingMore(false);
      }
    }
  }
}

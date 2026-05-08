import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import type { BuildFavoriteChange } from '~/containers/Build/shared/components/FavoriteButton';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import type { BuildProjectListItemData } from '~/containers/Build/shared/components/ProjectListItem';
import TabFilter from '../TabFilter';
import type { ActivityItem } from '../ActivityPanel';
import { BUILD_TRENDING_SHOWCASE_VIEW_SOURCE } from '../runtimeViewSources';
import {
  useAppContext,
  useBuildContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  type BuildActivitySubtab,
  type BuildActivityTab,
  type BuildStudioBrowseMode
} from '~/contexts/Build/reducer';

import {
  buildMatchesSearchQuery,
  compareBuildActivityPositions,
  createEmptyBrowseState,
  deriveBuildTitle,
  getBuildActivityFeedState,
  getBuildActivityFeedSubtab,
  getBuildActivityLatestPosition,
  getBuildActivityRequestKind,
  getBuildActivityViewedPosition,
  getBuildListBrowseMode,
  getBuildListBrowseTab,
  getEmptyBuildActivityPosition,
  getLoadMoreToken,
  getPublicBuildScope,
  getPublicBuildSort,
  isPublicBrowseTab,
  isValidBuildActivityPosition,
  normalizeBuildActivitySubtab,
  normalizeBuildActivityTab,
  normalizeBuildListSearchQuery,
  normalizeBuildListTab,
  normalizeBuildQuickAccessMode,
  normalizeQuickAccessBuilds,
  normalizeQuickAccessCursor,
  normalizeTodayTopViewedBuild,
  shouldExcludeMineFromPublicBrowse
} from './domain';
import {
  BuildQuickAccessStrip,
  QUICK_ACCESS_MODAL_PAGE_SIZE
} from './QuickAccess';
import ActivityPanels from './ActivityPanels';
import Hero from './Hero';
import Overlays from './Overlays';
import RequestQueue from './RequestQueue';
import Results from './Results';
import Search from './Search';
import type {
  BuildActivityPosition,
  BuildListTab,
  BuildQuickAccessMode,
  PublicBuildScope,
  PublicBuildSort,
  QuickAccessBuild,
  TodayTopViewedBuild
} from './types';
import {
  buildBrowseModeTabs,
  buildBrowseTabs,
  buildListTabs
} from './tabs';
import {
  buildActivityCacheFreshMs,
  buildActivityRailBreakpoint,
  buildActivityRailWidth,
  buildPageTopGap,
  logoBlueOpenAppButtonStyle,
  mobileBottomNavClearance
} from './layout';

const pageClass = css`
  width: 100%;
  max-width: calc(980px + 1.5rem + ${buildActivityRailWidth} + 4rem);
  box-sizing: border-box;
  margin: ${buildPageTopGap} auto 0;
  padding: 0 2rem 3rem;
  @media (max-width: ${buildActivityRailBreakpoint}) {
    max-width: 980px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem ${mobileBottomNavClearance};
  }
`;

const buildStudioLayoutClass = css`
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 980px) ${buildActivityRailWidth};
  justify-content: center;
  align-items: start;
  gap: 1.5rem;

  @media (max-width: ${buildActivityRailBreakpoint}) {
    display: block;
  }
`;

const buildStudioMainClass = css`
  min-width: 0;
`;

const browseModeFilterWrapClass = css`
  margin-bottom: 1rem;
`;

export default function BuildList() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const buildQuickAccessMode = useKeyContext(
    (v) => v.myState.buildQuickAccessMode
  );
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const loadCollaboratingBuilds = useAppContext(
    (v) => v.requestHelpers.loadCollaboratingBuilds
  );
  const loadPublicBuilds = useAppContext(
    (v) => v.requestHelpers.loadPublicBuilds
  );
  const loadBuildActivity = useAppContext(
    (v) => v.requestHelpers.loadBuildActivity
  );
  const updateBuildActivityViewed = useAppContext(
    (v) => v.requestHelpers.updateBuildActivityViewed
  );
  const loadTodayTopViewedBuild = useAppContext(
    (v) => v.requestHelpers.loadTodayTopViewedBuild
  );
  const loadRecentlyUsedBuilds = useAppContext(
    (v) => v.requestHelpers.loadRecentlyUsedBuilds
  );
  const loadFavoriteBuilds = useAppContext(
    (v) => v.requestHelpers.loadFavoriteBuilds
  );
  const setBuildQuickAccessMode = useAppContext(
    (v) => v.requestHelpers.setBuildQuickAccessMode
  );
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const onChangeBuildQuickAccessMode = useAppContext(
    (v) => v.user.actions.onChangeBuildQuickAccessMode
  );
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const deleteBuild = useAppContext((v) => v.requestHelpers.deleteBuild);
  const buildStudio = useBuildContext((v) => v.state.buildStudio);
  const onSetBuildStudioActiveTab = useBuildContext(
    (v) => v.actions.onSetBuildStudioActiveTab
  );
  const onSetBuildStudioMyBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioMyBuilds
  );
  const onPatchBuildStudioMyBuild = useBuildContext(
    (v) => v.actions.onPatchBuildStudioMyBuild
  );
  const onRemoveBuildStudioMyBuild = useBuildContext(
    (v) => v.actions.onRemoveBuildStudioMyBuild
  );
  const onSetBuildStudioBrowseMode = useBuildContext(
    (v) => v.actions.onSetBuildStudioBrowseMode
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
  const onSetBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioBrowseBuilds
  );
  const onAppendBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onAppendBuildStudioBrowseBuilds
  );

  const normalizedUserId = Number(userId || 0) || null;
  const activeTab = normalizeBuildListTab(buildStudio?.activeTab);
  const activeBrowseTab = getBuildListBrowseTab(activeTab);
  const activeBrowseState =
    buildStudio?.browse?.[activeBrowseTab] || createEmptyBrowseState();
  const activeBrowseMode = getBuildListBrowseMode({
    activeTab,
    buildStudio
  });
  const quickAccessMode = normalizeBuildQuickAccessMode(buildQuickAccessMode);
  const [buildSearchInput, setBuildSearchInput] = useState('');
  const [buildSearchQuery, setBuildSearchQuery] = useState('');
  const buildActivityActiveTab = normalizeBuildActivityTab(
    buildStudio?.activityPanel?.activeTab
  );
  const rawBuildActivityActiveSubtab = normalizeBuildActivitySubtab(
    buildStudio?.activityPanel?.activeSubtab
  );
  const buildActivityActiveSubtab = getBuildActivityFeedSubtab(
    buildActivityActiveTab,
    rawBuildActivityActiveSubtab
  );
  const activeBuildActivityFeedState = getBuildActivityFeedState({
    buildStudio,
    activeTab: buildActivityActiveTab,
    activeSubtab: buildActivityActiveSubtab
  });
  const buildActivityLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    activeBuildActivityFeedState.userId === normalizedUserId &&
    activeBuildActivityFeedState.loaded
  );
  const buildActivityCacheFreshForCurrentUser = Boolean(
    buildActivityLoadedForCurrentUser &&
    Date.now() - Number(activeBuildActivityFeedState.loadedAt || 0) <
      buildActivityCacheFreshMs
  );
  const buildActivityItems = buildActivityLoadedForCurrentUser
    ? ((activeBuildActivityFeedState.activities || []) as ActivityItem[])
    : [];
  const buildActivityCursor = buildActivityLoadedForCurrentUser
    ? activeBuildActivityFeedState.loadMoreToken
    : null;
  const allBuildActivityFeedState = getBuildActivityFeedState({
    buildStudio,
    activeTab: 'all',
    activeSubtab: 'all'
  });
  const allBuildActivityLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    allBuildActivityFeedState.userId === normalizedUserId &&
    allBuildActivityFeedState.loaded
  );
  const allBuildActivityItems = allBuildActivityLoadedForCurrentUser
    ? ((allBuildActivityFeedState.activities || []) as ActivityItem[])
    : [];
  const allBuildActivityLatestPosition = getBuildActivityLatestPosition(
    allBuildActivityItems
  );
  const allBuildActivityLastViewedPosition =
    allBuildActivityLoadedForCurrentUser
      ? getBuildActivityViewedPosition(allBuildActivityFeedState)
      : getEmptyBuildActivityPosition();
  const allBuildActivityCacheFreshForCurrentUser = Boolean(
    allBuildActivityLoadedForCurrentUser &&
    Date.now() - Number(allBuildActivityFeedState.loadedAt || 0) <
      buildActivityCacheFreshMs
  );
  const hasNewBuildActivity =
    compareBuildActivityPositions(
      allBuildActivityLatestPosition,
      allBuildActivityLastViewedPosition
    ) > 0;
  const collaboratingBrowseState =
    buildStudio?.browse?.collaborating || createEmptyBrowseState();
  const activeBrowseLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    activeBrowseState.userId === normalizedUserId &&
    activeBrowseState.browseMode === activeBrowseMode &&
    activeBrowseState.searchQuery === buildSearchQuery &&
    activeBrowseState.loaded
  );
  const collaboratingLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    collaboratingBrowseState.userId === normalizedUserId &&
    collaboratingBrowseState.searchQuery === '' &&
    collaboratingBrowseState.loaded
  );
  const collaboratingBuildCount = collaboratingLoadedForCurrentUser
    ? collaboratingBrowseState.builds.length
    : 0;
  const visibleBuildListTabs = buildListTabs.filter(
    (tab) =>
      tab.value !== 'collaborating' ||
      activeTab === 'collaborating' ||
      collaboratingBuildCount > 0
  );
  const buildStudioMyBuildsUserId =
    Number(buildStudio?.myBuildsUserId || 0) || null;
  const myBuildsLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    buildStudioMyBuildsUserId === normalizedUserId &&
    buildStudio?.myBuildsLoaded
  );
  const builds =
    myBuildsLoadedForCurrentUser && Array.isArray(buildStudio?.myBuilds)
      ? (buildStudio.myBuilds as BuildProjectListItemData[])
      : [];
  const isBuildSearchActive = buildSearchQuery.length > 0;
  const displayedMyBuilds = isBuildSearchActive
    ? builds.filter((build) => buildMatchesSearchQuery(build, buildSearchQuery))
    : builds;
  const browseBuilds =
    activeTab === 'mine' || !activeBrowseLoadedForCurrentUser
      ? []
      : ((activeBrowseState.builds || []) as BuildProjectListItemData[]);
  const browseLoadMoreButton =
    activeTab === 'mine' || !activeBrowseLoadedForCurrentUser
      ? null
      : activeBrowseState.loadMoreToken;
  const activeBrowseLoaded =
    activeTab === 'mine' ? true : activeBrowseLoadedForCurrentUser;
  const activeTabRef = useRef<BuildListTab>(activeTab);
  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [editingBuild, setEditingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [deletingBuild, setDeletingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState<number | null>(
    null
  );
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [creatingFromPrompt, setCreatingFromPrompt] = useState(false);
  const [buildActivityLoading, setBuildActivityLoading] = useState(false);
  const [buildActivityLoadingMore, setBuildActivityLoadingMore] =
    useState(false);
  const [buildActivitySilentRefreshing, setBuildActivitySilentRefreshing] =
    useState(false);
  const [buildActivityError, setBuildActivityError] = useState('');
  const [todayTopViewedBuild, setTodayTopViewedBuild] =
    useState<TodayTopViewedBuild | null>(null);
  const [recentlyUsedBuilds, setRecentlyUsedBuilds] = useState<
    QuickAccessBuild[]
  >([]);
  const [favoriteBuilds, setFavoriteBuilds] = useState<QuickAccessBuild[]>([]);
  const [recentlyUsedCursor, setRecentlyUsedCursor] = useState<string | null>(
    null
  );
  const [favoriteBuildsCursor, setFavoriteBuildsCursor] = useState<
    string | null
  >(null);
  const [quickAccessLoading, setQuickAccessLoading] = useState(false);
  const [quickAccessLoadingMore, setQuickAccessLoadingMore] = useState(false);
  const [quickAccessError, setQuickAccessError] = useState('');
  const [quickAccessModalMode, setQuickAccessModalMode] =
    useState<BuildQuickAccessMode | null>(null);
  const [quickAccessModalPage, setQuickAccessModalPage] = useState(0);
  const buildActivityLoadRef = useRef(0);
  const allBuildActivityLoadRef = useRef(0);
  const quickAccessLoadRef = useRef(0);
  const buildsWithPendingRequests = builds
    .filter((build) => Number(build.pendingCollaborationRequestCount || 0) > 0)
    .sort(
      (a, b) =>
        Number(b.latestPendingCollaborationRequestAt || 0) -
        Number(a.latestPendingCollaborationRequestAt || 0)
    );
  const totalPendingCollaborationRequests = buildsWithPendingRequests.reduce(
    (total, build) =>
      total + Number(build.pendingCollaborationRequestCount || 0),
    0
  );
  const activeTabConfig =
    visibleBuildListTabs.find((tab) => tab.value === activeTab) ||
    visibleBuildListTabs[0];
  const isMyBuildsTab = activeTab === 'mine';
  const activeQuickAccessBuilds =
    quickAccessMode === 'favorites' ? favoriteBuilds : recentlyUsedBuilds;
  const activeQuickAccessCursor =
    quickAccessMode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
  const quickAccessModalBuilds =
    quickAccessModalMode === 'favorites' ? favoriteBuilds : recentlyUsedBuilds;
  const quickAccessModalCursor =
    quickAccessModalMode === 'favorites'
      ? favoriteBuildsCursor
      : recentlyUsedCursor;
  const quickAccessOpenButtonStyle =
    profileTheme === 'gold' ? logoBlueOpenAppButtonStyle : undefined;

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    setEditingBuild(null);
    setDeletingBuild(null);
    setForkHistoryBuildId(null);
  }, [normalizedUserId]);

  useEffect(() => {
    const nextSearchQuery = normalizeBuildListSearchQuery(buildSearchInput);
    const timeoutId = window.setTimeout(() => {
      setBuildSearchQuery((currentSearchQuery) =>
        currentSearchQuery === nextSearchQuery
          ? currentSearchQuery
          : nextSearchQuery
      );
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [buildSearchInput]);

  useEffect(() => {
    if (!normalizedUserId) {
      setTodayTopViewedBuild(null);
      return;
    }
    let canceled = false;
    handleLoadTodayTopViewedBuild();

    async function handleLoadTodayTopViewedBuild() {
      try {
        const data = await loadTodayTopViewedBuild();
        if (canceled) return;
        setTodayTopViewedBuild(normalizeTodayTopViewedBuild(data?.build));
      } catch (error) {
        console.error('Failed to load today top viewed build:', error);
        if (!canceled) {
          setTodayTopViewedBuild(null);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // loadTodayTopViewedBuild is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  useEffect(() => {
    setRecentlyUsedBuilds([]);
    setFavoriteBuilds([]);
    setRecentlyUsedCursor(null);
    setFavoriteBuildsCursor(null);
    setQuickAccessModalMode(null);
    setQuickAccessModalPage(0);
    setQuickAccessLoading(false);
    setQuickAccessLoadingMore(false);
    setQuickAccessError('');
    if (!normalizedUserId) {
      return;
    }
    void loadBuildQuickAccess();

    return () => {
      quickAccessLoadRef.current += 1;
    };
    // loadRecentlyUsedBuilds and loadFavoriteBuilds are stable request helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  useEffect(() => {
    if (!quickAccessModalMode) return;
    const pageCount = Math.max(
      1,
      Math.ceil(quickAccessModalBuilds.length / QUICK_ACCESS_MODAL_PAGE_SIZE)
    );
    setQuickAccessModalPage((page) => Math.min(page, pageCount - 1));
  }, [quickAccessModalBuilds.length, quickAccessModalMode]);

  useEffect(() => {
    if (!normalizedUserId) {
      setLoading(false);
      return;
    }
    let canceled = false;
    setLoading(
      activeTabRef.current === 'mine' && !myBuildsLoadedForCurrentUser
    );
    handleLoad();

    async function handleLoad() {
      try {
        const data = await loadMyBuilds();
        if (!canceled) {
          onSetBuildStudioMyBuilds({
            builds: data?.builds || [],
            userId: normalizedUserId
          });
        }
      } catch (error) {
        console.error('Failed to load builds:', error);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, numNewNotis]);

  useEffect(() => {
    if (!normalizedUserId) return;
    let canceled = false;
    handleLoadCollaboratingBuilds();

    async function handleLoadCollaboratingBuilds() {
      try {
        const data = await loadCollaboratingBuilds();
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: 'collaborating',
            builds: data?.builds || [],
            loadMoreToken: getLoadMoreToken(data),
            browseMode: 'recent',
            searchQuery: '',
            userId: normalizedUserId
          });
        }
      } catch (error) {
        console.error('Failed to load collaborating builds:', error);
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: 'collaborating',
            builds: [],
            loadMoreToken: null,
            browseMode: 'recent',
            searchQuery: '',
            userId: normalizedUserId
          });
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, numNewNotis]);

  useEffect(() => {
    if (activeTab !== 'collaborating') return;
    if (buildSearchQuery) return;
    if (!collaboratingLoadedForCurrentUser) return;
    if (collaboratingBuildCount > 0) return;
    onSetBuildStudioActiveTab('mine');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    buildSearchQuery,
    collaboratingLoadedForCurrentUser,
    collaboratingBuildCount
  ]);

  useEffect(() => {
    if (!normalizedUserId) {
      setBuildActivityLoading(false);
      setBuildActivityLoadingMore(false);
      setBuildActivitySilentRefreshing(false);
      setBuildActivityError('');
      onSetBuildStudioActivityFilter({
        activityTab: 'all',
        activitySubtab: 'all'
      });
      return;
    }
    if (buildActivityCacheFreshForCurrentUser) {
      setBuildActivityLoading(false);
      setBuildActivityLoadingMore(false);
      setBuildActivitySilentRefreshing(false);
      setBuildActivityError('');
      return;
    }
    void loadBuildActivityItems({
      showError: !buildActivityLoadedForCurrentUser,
      showLoading: !buildActivityLoadedForCurrentUser,
      subtab: buildActivityActiveSubtab,
      tab: buildActivityActiveTab
    });

    return () => {
      buildActivityLoadRef.current += 1;
    };
    // loadBuildActivity is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    buildActivityActiveTab,
    buildActivityActiveSubtab,
    buildActivityLoadedForCurrentUser,
    buildActivityCacheFreshForCurrentUser
  ]);

  useEffect(() => {
    if (!normalizedUserId || buildActivityActiveTab === 'all') return;
    if (allBuildActivityCacheFreshForCurrentUser) return;
    void loadAllBuildActivityItems();

    return () => {
      allBuildActivityLoadRef.current += 1;
    };
    // loadBuildActivity is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    buildActivityActiveTab,
    allBuildActivityCacheFreshForCurrentUser
  ]);

  useEffect(() => {
    if (!userId || activeTab === 'mine') {
      setBrowseLoading(false);
      return;
    }
    if (activeBrowseLoaded) {
      setBrowseLoading(false);
      return;
    }
    let canceled = false;

    handleLoadBrowseBuilds();

    async function handleLoadBrowseBuilds() {
      setBrowseLoading(true);
      try {
        const data =
          activeTab === 'collaborating'
            ? await loadCollaboratingBuilds({
                search: buildSearchQuery || undefined
              })
            : await loadPublicBuilds({
                sort: getPublicBuildSort(activeTab, activeBrowseMode),
                scope: getPublicBuildScope(activeTab),
                excludeMine: shouldExcludeMineFromPublicBrowse(
                  activeTab,
                  activeBrowseMode
                ),
                search: buildSearchQuery || undefined
              });
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: activeTab,
            builds: data?.builds || [],
            loadMoreToken: getLoadMoreToken(data),
            browseMode: activeBrowseMode,
            searchQuery: buildSearchQuery,
            userId: normalizedUserId
          });
        }
      } catch (error) {
        console.error('Failed to load public builds:', error);
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: activeTab,
            builds: [],
            loadMoreToken: null,
            browseMode: activeBrowseMode,
            searchQuery: buildSearchQuery,
            userId: normalizedUserId
          });
        }
      } finally {
        if (!canceled) {
          setBrowseLoading(false);
        }
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    activeTab,
    activeBrowseMode,
    activeBrowseLoaded,
    buildSearchQuery
  ]);

  if (!userId) {
    return (
      <LoggedOutPrompt
        title="Build apps with AI"
        body={
          <>
            Let <strong>Lumine, your AI app-building assistant</strong>, turn
            your idea into a working app and help you refine it. When you are
            ready, you can publish it so other Twinkle users can use it, and
            even people outside the website.
          </>
        }
      />
    );
  }

  if (loading && isMyBuildsTab) {
    return <Loading />;
  }

  const buildActivityPanelProps = {
    activeSubtab: buildActivityActiveSubtab,
    activeTab: buildActivityActiveTab,
    activities: buildActivityItems,
    color: profileTheme,
    currentUserId: normalizedUserId || 0,
    error: buildActivityError,
    hasMore: Boolean(buildActivityCursor),
    loading: buildActivityLoading,
    loadingMore: buildActivityLoadingMore,
    onLoadMore: handleLoadMoreBuildActivity,
    onRefresh: handleRefreshBuildActivity,
    onSubtabChange: handleBuildActivitySubtabChange,
    onTabChange: handleBuildActivityTabChange
  };

  return (
    <div className={pageClass}>
      <div className={buildStudioLayoutClass}>
        <main className={buildStudioMainClass}>
          <BuildQuickAccessStrip
            activeMode={quickAccessMode}
            builds={activeQuickAccessBuilds}
            color={profileTheme}
            error={quickAccessError}
            hasMore={Boolean(activeQuickAccessCursor)}
            loading={quickAccessLoading}
            openButtonStyle={quickAccessOpenButtonStyle}
            onModeChange={handleQuickAccessModeChange}
            onOpenBuild={handleOpenQuickAccessBuild}
            onShowMore={handleShowMoreQuickAccess}
            onFavoriteChange={handleBuildFavoriteChange}
            onFavoriteError={handleBuildFavoriteError}
            onFavoriteStart={handleBuildFavoriteStart}
          />

          <Hero
            topViewedBuild={todayTopViewedBuild}
            onFavoriteChange={handleBuildFavoriteChange}
            onFavoriteError={handleBuildFavoriteError}
            onFavoriteStart={handleBuildFavoriteStart}
            onNewBuild={() => navigate('/build/new')}
            onOpenTopViewedBuild={handleOpenTodayTopViewedBuild}
          />

          <TabFilter
            activeTab={activeTab}
            color={profileTheme}
            onChange={handleTabChange}
            tabs={visibleBuildListTabs}
          />

          {isPublicBrowseTab(activeTab) ? (
            <div className={browseModeFilterWrapClass}>
              <TabFilter
                activeTab={activeBrowseMode}
                color={profileTheme}
                density="compact"
                onChange={handleBrowseModeChange}
                tabs={buildBrowseModeTabs}
              />
            </div>
          ) : null}

          <Search
            value={buildSearchInput}
            onChange={setBuildSearchInput}
            onClear={() => {
              setBuildSearchInput('');
              setBuildSearchQuery('');
            }}
          />

          <ActivityPanels
            {...buildActivityPanelProps}
            hasNewActivity={hasNewBuildActivity}
            onMobileOpen={handleBuildActivityMobileOpen}
            variant="mobile"
          />

          {isMyBuildsTab ? (
            <RequestQueue
              builds={buildsWithPendingRequests}
              totalCount={totalPendingCollaborationRequests}
              onOpenBuildRequests={handleOpenBuildRequests}
            />
          ) : null}

          <Results
            activeTab={activeTab}
            activeTabLabel={activeTabConfig.label}
            browseBuilds={browseBuilds}
            browseHasMore={Boolean(browseLoadMoreButton)}
            browseLoading={browseLoading}
            browseLoadingMore={browseLoadingMore}
            builds={builds}
            color={profileTheme}
            displayedMyBuilds={displayedMyBuilds}
            isBuildSearchActive={isBuildSearchActive}
            isMyBuildsTab={isMyBuildsTab}
            promptInput={promptInput}
            searchQuery={buildSearchQuery}
            creatingFromPrompt={creatingFromPrompt}
            runtimeBackTo={`${location.pathname}${location.search}${location.hash}`}
            onAddDescription={setEditingBuild}
            onDelete={setDeletingBuild}
            onFavoriteChange={handleBuildFavoriteChange}
            onFavoriteError={handleBuildFavoriteError}
            onFavoriteStart={handleBuildFavoriteStart}
            onLoadMoreBrowseBuilds={handleLoadMoreBrowseBuilds}
            onOpenForkHistory={setForkHistoryBuildId}
            onPromptInputChange={setPromptInput}
            onStartFromPrompt={handleStartFromPrompt}
          />
        </main>
        <ActivityPanels {...buildActivityPanelProps} variant="rail" />
      </div>
      <Overlays
        deleting={deleting}
        deletingBuild={deletingBuild}
        editingBuild={editingBuild}
        forkHistoryBuildId={forkHistoryBuildId}
        quickAccessLoadingMore={quickAccessLoadingMore}
        quickAccessModalBuilds={quickAccessModalBuilds}
        quickAccessModalCursor={quickAccessModalCursor}
        quickAccessModalMode={quickAccessModalMode}
        quickAccessModalPage={quickAccessModalPage}
        quickAccessOpenButtonStyle={quickAccessOpenButtonStyle}
        savingMetadata={savingMetadata}
        onCloseDelete={() => (deleting ? null : setDeletingBuild(null))}
        onCloseEdit={() => (savingMetadata ? null : setEditingBuild(null))}
        onCloseForkHistory={() => setForkHistoryBuildId(null)}
        onCloseQuickAccess={handleCloseQuickAccessModal}
        onDeleteBuild={handleDeleteBuild}
        onFavoriteChange={handleBuildFavoriteChange}
        onFavoriteError={handleBuildFavoriteError}
        onFavoriteStart={handleBuildFavoriteStart}
        onNextQuickAccessPage={handleNextQuickAccessModalPage}
        onOpenQuickAccessBuild={handleOpenQuickAccessBuild}
        onPreviousQuickAccessPage={handlePreviousQuickAccessModalPage}
        onSubmitMetadata={handleSubmitMetadata}
      />
    </div>
  );

  async function loadBuildQuickAccess({ showLoading = true } = {}) {
    if (!normalizedUserId) return;
    const loadId = quickAccessLoadRef.current + 1;
    quickAccessLoadRef.current = loadId;
    if (showLoading) {
      setQuickAccessLoading(true);
    }
    setQuickAccessError('');
    try {
      const [recentResult, favoriteResult] = await Promise.all([
        loadRecentlyUsedBuilds({ limit: QUICK_ACCESS_MODAL_PAGE_SIZE }),
        loadFavoriteBuilds({ limit: QUICK_ACCESS_MODAL_PAGE_SIZE })
      ]);
      if (quickAccessLoadRef.current !== loadId) return;
      setRecentlyUsedBuilds(normalizeQuickAccessBuilds(recentResult?.builds));
      setFavoriteBuilds(normalizeQuickAccessBuilds(favoriteResult?.builds));
      setRecentlyUsedCursor(normalizeQuickAccessCursor(recentResult?.cursor));
      setFavoriteBuildsCursor(
        normalizeQuickAccessCursor(favoriteResult?.cursor)
      );
    } catch (error: any) {
      console.error('Failed to load build quick access:', error);
      if (quickAccessLoadRef.current === loadId) {
        setQuickAccessError(
          error?.response?.data?.error ||
            error?.message ||
            'Quick access could not load.'
        );
      }
    } finally {
      if (quickAccessLoadRef.current === loadId) {
        setQuickAccessLoading(false);
      }
    }
  }

  function handleOpenQuickAccessBuild(build: QuickAccessBuild) {
    const buildId = Number(build.id || 0);
    if (!buildId) return;
    navigate(`/app/${buildId}`, {
      state: {
        runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
        runtimeBackLabel: 'Back to Build Studio'
      }
    });
  }

  function handleShowMoreQuickAccess() {
    setQuickAccessModalMode(quickAccessMode);
    setQuickAccessModalPage(0);
  }

  function handleCloseQuickAccessModal() {
    setQuickAccessModalMode(null);
    setQuickAccessModalPage(0);
  }

  function handlePreviousQuickAccessModalPage() {
    setQuickAccessModalPage((page) => Math.max(0, page - 1));
  }

  function handleNextQuickAccessModalPage() {
    if (!quickAccessModalMode) return;
    const nextPageStart =
      (quickAccessModalPage + 1) * QUICK_ACCESS_MODAL_PAGE_SIZE;
    if (nextPageStart < quickAccessModalBuilds.length) {
      setQuickAccessModalPage((page) => page + 1);
      return;
    }
    if (!quickAccessModalCursor || quickAccessLoadingMore) return;
    void loadMoreQuickAccessBuilds(quickAccessModalMode);
  }

  async function loadMoreQuickAccessBuilds(mode: BuildQuickAccessMode) {
    const cursor =
      mode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
    if (!cursor) return;
    setQuickAccessLoadingMore(true);
    setQuickAccessError('');
    try {
      const result =
        mode === 'favorites'
          ? await loadFavoriteBuilds({
              cursor,
              limit: QUICK_ACCESS_MODAL_PAGE_SIZE
            })
          : await loadRecentlyUsedBuilds({
              cursor,
              limit: QUICK_ACCESS_MODAL_PAGE_SIZE
            });
      const nextBuilds = normalizeQuickAccessBuilds(result?.builds);
      appendQuickAccessBuilds(mode, nextBuilds);
      setQuickAccessCursor(mode, normalizeQuickAccessCursor(result?.cursor));
      if (nextBuilds.length > 0) {
        setQuickAccessModalPage((page) => page + 1);
      }
    } catch (error: any) {
      console.error('Failed to load more quick access builds:', error);
      setQuickAccessError(
        error?.response?.data?.error ||
          error?.message ||
          'More quick access builds could not load.'
      );
    } finally {
      setQuickAccessLoadingMore(false);
    }
  }

  function appendQuickAccessBuilds(
    mode: BuildQuickAccessMode,
    nextBuilds: QuickAccessBuild[]
  ) {
    if (nextBuilds.length === 0) return;
    const appendUnique = (items: QuickAccessBuild[]) => {
      const seenIds = new Set(items.map((item) => Number(item.id)));
      return items.concat(
        nextBuilds.filter((build) => {
          const buildId = Number(build.id);
          if (!buildId || seenIds.has(buildId)) return false;
          seenIds.add(buildId);
          return true;
        })
      );
    };
    if (mode === 'favorites') {
      setFavoriteBuilds(appendUnique);
      return;
    }
    setRecentlyUsedBuilds(appendUnique);
  }

  function setQuickAccessCursor(
    mode: BuildQuickAccessMode,
    cursor: string | null
  ) {
    if (mode === 'favorites') {
      setFavoriteBuildsCursor(cursor);
      return;
    }
    setRecentlyUsedCursor(cursor);
  }

  function handleBuildFavoriteStart() {
    setQuickAccessError('');
  }

  function handleBuildFavoriteChange(
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) {
    patchBuildFavoriteState({
      build,
      buildId: change.buildId,
      favoritedAt: change.favoritedAt,
      isFavorited: change.isFavorited
    });
  }

  function handleBuildFavoriteError(
    _build: BuildProjectListItemData,
    error: any
  ) {
    console.error('Failed to update build favorite:', error);
    setQuickAccessError(
      error?.response?.data?.error ||
        error?.message ||
        'Favorite could not be updated.'
    );
    void loadBuildQuickAccess({ showLoading: false });
  }

  function patchBuildFavoriteState({
    build,
    buildId,
    favoritedAt,
    isFavorited
  }: {
    build: BuildProjectListItemData;
    buildId: number;
    favoritedAt: number | null;
    isFavorited: boolean;
  }) {
    const patchProjectBuild = (
      item: BuildProjectListItemData
    ): BuildProjectListItemData =>
      Number(item.id) === buildId
        ? { ...item, favoritedAt, isFavorited }
        : item;
    const patchBuild = (item: QuickAccessBuild): QuickAccessBuild =>
      Number(item.id) === buildId
        ? { ...item, favoritedAt, isFavorited }
        : item;
    setRecentlyUsedBuilds((items) => items.map(patchBuild));
    setFavoriteBuilds((items) => {
      if (!isFavorited) {
        return items.filter((item) => Number(item.id) !== buildId);
      }
      const nextBuild: QuickAccessBuild = {
        ...build,
        favoritedAt,
        isFavorited: true
      };
      return [
        nextBuild,
        ...items.filter((item) => Number(item.id) !== buildId).map(patchBuild)
      ];
    });
    setTodayTopViewedBuild((currentBuild) =>
      currentBuild && Number(currentBuild.id) === buildId
        ? { ...currentBuild, favoritedAt, isFavorited }
        : currentBuild
    );
    onPatchBuildStudioMyBuild({
      build: {
        ...build,
        favoritedAt,
        isFavorited
      },
      userId: normalizedUserId
    });
    buildBrowseTabs.forEach((tab) => {
      const browseState = buildStudio?.browse?.[tab];
      if (
        !browseState?.loaded ||
        browseState.userId !== normalizedUserId ||
        !Array.isArray(browseState.builds)
      ) {
        return;
      }
      const cachedBuilds = browseState.builds as BuildProjectListItemData[];
      if (!cachedBuilds.some((item) => Number(item.id) === buildId)) {
        return;
      }
      onSetBuildStudioBrowseBuilds({
        tab,
        builds: cachedBuilds.map(patchProjectBuild),
        loadMoreToken: browseState.loadMoreToken,
        browseMode: browseState.browseMode,
        searchQuery: browseState.searchQuery,
        userId: normalizedUserId
      });
    });
  }

  async function loadBuildActivityItems({
    showError = true,
    showLoading = true,
    subtab = buildActivityActiveSubtab,
    tab = buildActivityActiveTab
  }: {
    showError?: boolean;
    showLoading?: boolean;
    subtab?: BuildActivitySubtab;
    tab?: BuildActivityTab;
  } = {}) {
    if (!normalizedUserId) return;
    const loadId = buildActivityLoadRef.current + 1;
    buildActivityLoadRef.current = loadId;
    setBuildActivityLoading(showLoading);
    setBuildActivityLoadingMore(false);
    setBuildActivitySilentRefreshing(!showLoading);
    if (showError) setBuildActivityError('');
    try {
      const data = await loadBuildActivity({
        kind: getBuildActivityRequestKind(tab, subtab),
        limit: 12,
        scope: tab
      });
      if (buildActivityLoadRef.current === loadId) {
        const activities = Array.isArray(data?.activities)
          ? data.activities
          : [];
        onSetBuildStudioActivityItems({
          activities,
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
          void markBuildActivityPositionViewed(
            getBuildActivityLatestPosition(activities as ActivityItem[])
          );
        }
        setBuildActivityError('');
      }
    } catch (error: any) {
      console.error('Failed to load build activity:', error);
      if (buildActivityLoadRef.current === loadId && showError) {
        setBuildActivityError(
          error?.response?.data?.error ||
            error?.message ||
            'Build activity could not load.'
        );
      }
    } finally {
      if (buildActivityLoadRef.current === loadId) {
        setBuildActivityLoading(false);
        setBuildActivitySilentRefreshing(false);
      }
    }
  }

  async function loadAllBuildActivityItems() {
    if (!normalizedUserId) return;
    const loadId = allBuildActivityLoadRef.current + 1;
    allBuildActivityLoadRef.current = loadId;
    try {
      const data = await loadBuildActivity({
        kind: 'all',
        limit: 12,
        scope: 'all'
      });
      if (allBuildActivityLoadRef.current === loadId) {
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
    } catch (error) {
      console.error('Failed to load all build activity:', error);
    }
  }

  function handleRefreshBuildActivity() {
    void loadBuildActivityItems({
      showError: true,
      showLoading: true
    });
  }

  async function markBuildActivityPositionViewed(
    position: BuildActivityPosition
  ) {
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
    } catch (error) {
      console.error('Failed to mark build activity viewed:', error);
    }
  }

  async function markBuildActivityViewed() {
    return markBuildActivityPositionViewed(allBuildActivityLatestPosition);
  }

  function handleBuildActivityMobileOpen() {
    if (hasNewBuildActivity && buildActivityActiveTab !== 'all') {
      onSetBuildStudioActivityFilter({
        activityTab: 'all',
        activitySubtab: 'all'
      });
    }
    void markBuildActivityViewed();
  }

  function handleOpenTodayTopViewedBuild(build: TodayTopViewedBuild) {
    navigate(
      `/app/${build.id}?viewSource=${BUILD_TRENDING_SHOWCASE_VIEW_SOURCE}`,
      {
        state: {
          runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
          runtimeBackLabel: 'Back to Build Studio'
        }
      }
    );
  }

  function handleBuildActivityTabChange(tab: BuildActivityTab) {
    if (tab === 'all') {
      void markBuildActivityViewed();
    }
    if (tab !== buildActivityActiveTab) {
      onSetBuildStudioActivityFilter({
        activityTab: tab,
        activitySubtab: getBuildActivityFeedSubtab(
          tab,
          buildActivityActiveSubtab
        )
      });
    }
  }

  function handleBuildActivitySubtabChange(
    subtab: Exclude<BuildActivitySubtab, 'all'>
  ) {
    if (subtab !== buildActivityActiveSubtab) {
      onSetBuildStudioActivityFilter({ activitySubtab: subtab });
    }
  }

  async function handleLoadMoreBuildActivity() {
    if (
      !normalizedUserId ||
      !buildActivityCursor ||
      buildActivityLoading ||
      buildActivityLoadingMore ||
      buildActivitySilentRefreshing
    ) {
      return;
    }
    const loadId = buildActivityLoadRef.current + 1;
    buildActivityLoadRef.current = loadId;
    setBuildActivityLoadingMore(true);
    setBuildActivityError('');
    try {
      const data = await loadBuildActivity({
        cursor: buildActivityCursor,
        kind: getBuildActivityRequestKind(
          buildActivityActiveTab,
          buildActivityActiveSubtab
        ),
        limit: 12,
        scope: buildActivityActiveTab
      });
      if (buildActivityLoadRef.current === loadId) {
        onAppendBuildStudioActivityItems({
          activities: data?.activities || [],
          activityLoadedAt: Date.now(),
          activitySubtab: getBuildActivityFeedSubtab(
            buildActivityActiveTab,
            buildActivityActiveSubtab
          ),
          activityTab: buildActivityActiveTab,
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
      }
    } catch (error: any) {
      console.error('Failed to load more build activity:', error);
    } finally {
      if (buildActivityLoadRef.current === loadId) {
        setBuildActivityLoadingMore(false);
      }
    }
  }

  async function handleStartFromPrompt() {
    if (!promptInput.trim() || creatingFromPrompt) return;
    const prompt = promptInput.trim();
    setCreatingFromPrompt(true);
    try {
      const title = deriveBuildTitle(prompt);
      const { build } = await createBuild({ title });
      if (build?.id) {
        navigate(`/build/${build.id}`, {
          state: { initialPrompt: prompt }
        });
      }
    } catch (error) {
      console.error('Failed to start build from prompt:', error);
    }
    setCreatingFromPrompt(false);
  }

  async function handleSubmitMetadata({
    title,
    description
  }: {
    title: string;
    description: string;
  }) {
    if (!editingBuild || savingMetadata) return;
    setSavingMetadata(true);
    try {
      const result = await updateBuildMetadata({
        buildId: editingBuild.id,
        title,
        description
      });
      if (result?.success && result?.build) {
        onPatchBuildStudioMyBuild({
          build: result.build,
          userId: normalizedUserId
        });
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to update build metadata:', error);
    } finally {
      setSavingMetadata(false);
    }
  }

  async function handleDeleteBuild(confirmTitle: string) {
    if (!deletingBuild || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteBuild({
        buildId: deletingBuild.id,
        confirmTitle
      });
      if (result?.success) {
        const deletedBuildId = Number(deletingBuild.id);
        onRemoveBuildStudioMyBuild({
          buildId: deletingBuild.id,
          userId: normalizedUserId
        });
        setRecentlyUsedBuilds((builds) =>
          builds.filter((build) => Number(build.id) !== deletedBuildId)
        );
        setFavoriteBuilds((builds) =>
          builds.filter((build) => Number(build.id) !== deletedBuildId)
        );
        setTodayTopViewedBuild((build) =>
          build && Number(build.id) === deletedBuildId ? null : build
        );
        setDeletingBuild(null);
      }
    } catch (error) {
      console.error('Failed to delete build:', error);
    } finally {
      setDeleting(false);
    }
  }

  function handleTabChange(tab: BuildListTab) {
    if (tab !== activeTab) {
      onSetBuildStudioActiveTab(tab);
    }
  }

  function handleBrowseModeChange(browseMode: BuildStudioBrowseMode) {
    if (!isPublicBrowseTab(activeTab) || browseMode === activeBrowseMode) {
      return;
    }
    onSetBuildStudioBrowseMode({ tab: activeTab, browseMode });
  }

  async function handleQuickAccessModeChange(mode: BuildQuickAccessMode) {
    if (mode === quickAccessMode) {
      return;
    }
    onChangeBuildQuickAccessMode(mode);
    try {
      await setBuildQuickAccessMode(mode);
    } catch (error) {
      console.error('Failed to save build quick access preference:', error);
    }
  }

  async function handleLoadMoreBrowseBuilds() {
    if (browseLoadingMore || !browseLoadMoreButton || activeTab === 'mine') {
      return;
    }
    setBrowseLoadingMore(true);
    try {
      const data =
        activeTab === 'collaborating'
          ? await loadCollaboratingBuilds({
              cursor: browseLoadMoreButton,
              search: buildSearchQuery || undefined
            })
          : await loadPublicBuilds(
              buildPublicLoadMoreParams(
                activeTab,
                activeBrowseMode,
                browseLoadMoreButton,
                buildSearchQuery
              )
            );
      onAppendBuildStudioBrowseBuilds({
        tab: activeTab,
        builds: data?.builds || [],
        loadMoreToken: getLoadMoreToken(data),
        browseMode: activeBrowseMode,
        searchQuery: buildSearchQuery,
        userId: normalizedUserId
      });
    } catch (error) {
      console.error('Failed to load more builds:', error);
    } finally {
      setBrowseLoadingMore(false);
    }
  }

  function buildPublicLoadMoreParams(
    tab: BuildListTab,
    browseMode: BuildStudioBrowseMode,
    loadMoreToken: string,
    searchQuery: string
  ): {
    sort: PublicBuildSort;
    scope: PublicBuildScope;
    excludeMine: boolean;
    cursor?: string;
    lastId?: number;
    search?: string;
  } {
    const loadMoreParams: {
      sort: PublicBuildSort;
      scope: PublicBuildScope;
      excludeMine: boolean;
      cursor?: string;
      lastId?: number;
      search?: string;
    } = {
      sort: getPublicBuildSort(tab, browseMode),
      scope: getPublicBuildScope(tab),
      excludeMine: shouldExcludeMineFromPublicBrowse(tab, browseMode)
    };
    if (searchQuery) {
      loadMoreParams.search = searchQuery;
    }
    if (/^\d+$/.test(loadMoreToken)) {
      loadMoreParams.lastId = Number(loadMoreToken);
    } else {
      loadMoreParams.cursor = loadMoreToken;
    }
    return loadMoreParams;
  }

  function handleOpenBuildRequests(build: BuildProjectListItemData) {
    navigate(`/build/${build.id}`, {
      state: {
        openPeoplePanel: true
      }
    });
  }
}

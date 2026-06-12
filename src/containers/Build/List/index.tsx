import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import type {
  BuildProjectListItemData,
  BuildTag
} from '~/components/Build/ProjectListItem';
import TabFilter from '../TabFilter';
import {
  useAppContext,
  useBuildContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  type BuildStudioBrowseMode
} from '~/contexts/Build/reducer';

import {
  buildMatchesSearchQuery,
  createEmptyBrowseState,
  deriveBuildTitle,
  getBuildListBrowseMode,
  getBuildListBrowseTab,
  getLoadMoreToken,
  getPublicBuildScope,
  getPublicBuildSort,
  isPublicBrowseTab,
  normalizeBuildListBrowseMode,
  normalizeBuildListSearchQuery,
  normalizeBuildListTab,
  shouldExcludeMineFromPublicBrowse
} from './helpers';
import { BuildQuickAccessStrip } from './QuickAccess';
import ActivityPanels from './ActivityPanels';
import Hero from './Hero';
import Overlays from './Overlays';
import RequestQueue from './RequestQueue';
import Results from './Results';
import Search from './Search';
import SearchResults from './SearchResults';
import useActivityPanel from './hooks/useActivityPanel';
import useGlobalBuildSearch from './hooks/useGlobalBuildSearch';
import useQuickAccess from './hooks/useQuickAccess';
import type {
  BuildListTab,
  PublicBuildScope,
  PublicBuildSort
} from './types';
import {
  buildBrowseModeTabs,
  buildListTabs
} from './constants/tabs';
import { getBuildListTabPath } from './helpers/url';
import {
  buildActivityRailBreakpoint,
  buildActivityRailWidth,
  buildPageTopGap,
  mobileBottomNavClearance
} from './constants/layout';

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

export default function BuildList({
  tab: urlTab,
  browseMode: urlBrowseMode
}: {
  tab?: BuildListTab;
  browseMode?: BuildStudioBrowseMode;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activityRailVisible, setActivityRailVisible] = useState(
    getIsActivityRailVisible
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const buildQuickAccessMode = useKeyContext(
    (v) => v.myState.buildQuickAccessMode
  );
  const persistedBuildStudioState = useKeyContext(
    (v) => v.myState.state?.buildStudio
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
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const deleteBuild = useAppContext((v) => v.requestHelpers.deleteBuild);
  const updateBuildStudioState = useAppContext(
    (v) => v.requestHelpers.updateBuildStudioState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
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
  const onSetBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioBrowseBuilds
  );
  const onAppendBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onAppendBuildStudioBrowseBuilds
  );

  const normalizedUserId = Number(userId || 0) || null;
  const activeTab = urlTab ?? normalizeBuildListTab(buildStudio?.activeTab);
  const activeBrowseTab = getBuildListBrowseTab(activeTab);
  const activeBrowseState =
    buildStudio?.browse?.[activeBrowseTab] || createEmptyBrowseState();
  const activeBrowseMode =
    urlBrowseMode && isPublicBrowseTab(activeTab)
      ? urlBrowseMode
      : getBuildListBrowseMode({
          activeTab,
          buildStudio
        });
  const hasCanonicalListUrl = Boolean(
    urlTab && (!isPublicBrowseTab(urlTab) || urlBrowseMode)
  );
  const persistedBuildStudioStateKey = getPersistedBuildStudioStateKey(
    persistedBuildStudioState
  );
  // Search state is mirrored into the URL (?q=...&owner=...&sort=...) so a
  // copied link reproduces the exact search; read it back on mount.
  const [initialBuildSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const query = normalizeBuildListSearchQuery(params.get('q') || '');
    const owner = normalizeBuildSearchOwner(params.get('owner'));
    const sortParam = params.get('sort');
    // sort only means something attached to a search; honoring it alone would
    // leave a hidden non-default sort that contaminates the next search
    const sort: PublicBuildSort =
      (query || owner) && (sortParam === 'popular' || sortParam === 'forks')
        ? sortParam
        : 'recent';
    return { query, owner, sort };
  });
  const [buildSearchInput, setBuildSearchInput] = useState(
    initialBuildSearch.query
  );
  const [buildSearchQuery, setBuildSearchQuery] = useState(
    initialBuildSearch.query
  );
  const [buildSearchOwner, setBuildSearchOwner] = useState(
    initialBuildSearch.owner
  );
  const [buildSearchSort, setBuildSearchSort] = useState<PublicBuildSort>(
    initialBuildSearch.sort
  );
  const collaboratingBrowseState =
    buildStudio?.browse?.collaborating || createEmptyBrowseState();
  const collaboratingCacheRefreshKey =
    getCollaboratingBuildsCacheRefreshKey(numNewNotis);
  const collaboratingCacheGeneration = getBuildStudioBrowseCacheGeneration(
    collaboratingBrowseState.cacheGeneration
  );
  const activeBrowseLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    activeBrowseState.userId === normalizedUserId &&
    activeBrowseState.browseMode === activeBrowseMode &&
    activeBrowseState.searchQuery === '' &&
    activeBrowseState.loaded
  );
  const collaboratingLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    collaboratingBrowseState.userId === normalizedUserId &&
    collaboratingBrowseState.searchQuery === '' &&
    collaboratingBrowseState.loaded
  );
  const collaboratingCacheFreshForCurrentUser = Boolean(
    collaboratingLoadedForCurrentUser &&
      collaboratingBrowseState.cacheRefreshKey === collaboratingCacheRefreshKey
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
  const isBuildSearchActive =
    buildSearchQuery.length > 0 || buildSearchOwner.length > 0;
  // Owner mode shows the owner's PUBLIC builds only (the Community section);
  // the viewer's own builds — including private ones — must not leak in.
  const displayedMyBuilds = buildSearchOwner
    ? []
    : isBuildSearchActive
      ? builds.filter((build) =>
          buildMatchesSearchQuery(build, buildSearchQuery)
        )
      : builds;
  const {
    loadingMorePublic: searchLoadingMorePublic,
    loadingMoreTeam: searchLoadingMoreTeam,
    publicBuilds: searchPublicBuilds,
    publicHasMore: searchPublicHasMore,
    searching,
    teamBuilds: searchTeamBuilds,
    teamHasMore: searchTeamHasMore,
    onLoadMorePublic: handleLoadMoreSearchPublicBuilds,
    onLoadMoreTeam: handleLoadMoreSearchTeamBuilds
  } = useGlobalBuildSearch({
    searchQuery: buildSearchQuery,
    sort: buildSearchSort,
    owner: buildSearchOwner,
    userId: normalizedUserId
  });
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
  const buildStudioHydrationKeyRef = useRef('');
  const buildStudioPreferenceSaveIdRef = useRef(0);
  const buildStudioPreferenceSaveQueueRef = useRef<Promise<void>>(
    Promise.resolve()
  );
  const tabChangeInitialScrollRef = useRef(false);
  const listInitialScrollRef = useRef<HTMLDivElement | null>(null);
  const [myBuildsLoading, setMyBuildsLoading] = useState(true);
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
  const browsePending = !isMyBuildsTab && !activeBrowseLoaded;
  const {
    activeBuilds: activeQuickAccessBuilds,
    activeCursor: activeQuickAccessCursor,
    error: quickAccessError,
    loading: quickAccessLoading,
    loadingMore: quickAccessLoadingMore,
    modalBuilds: quickAccessModalBuilds,
    modalCursor: quickAccessModalCursor,
    modalMode: quickAccessModalMode,
    modalPage: quickAccessModalPage,
    onBuildDeleted: handleQuickAccessBuildDeleted,
    onBuildFavoriteChange: handleBuildFavoriteChange,
    onBuildFavoriteError: handleBuildFavoriteError,
    onBuildFavoriteStart: handleBuildFavoriteStart,
    onCloseModal: handleCloseQuickAccessModal,
    onModeChange: handleQuickAccessModeChange,
    onNextModalPage: handleNextQuickAccessModalPage,
    onOpenBuild: handleOpenQuickAccessBuild,
    onOpenTodayTopViewedBuild: handleOpenTodayTopViewedBuild,
    onPreviousModalPage: handlePreviousQuickAccessModalPage,
    onShowMore: handleShowMoreQuickAccess,
    openButtonStyle: quickAccessOpenButtonStyle,
    quickAccessMode,
    todayTopViewedBuild
  } = useQuickAccess({
    buildQuickAccessMode,
    buildStudio,
    normalizedUserId,
    onPatchBuildStudioMyBuild,
    onSetBuildStudioBrowseBuilds,
    profileTheme
  });

  const {
    hasNewActivity: hasNewBuildActivity,
    onMobileClose: handleBuildActivityMobileClose,
    onMobileOpen: handleBuildActivityMobileOpen,
    panelProps: buildActivityPanelProps
  } = useActivityPanel({
    autoMarkActivityViewed: activityRailVisible,
    buildStudio,
    color: profileTheme,
    normalizedUserId
  });

  useEffect(() => {
    function handleResize() {
      setActivityRailVisible(getIsActivityRailVisible());
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!normalizedUserId || !persistedBuildStudioStateKey) return;
    const hydrationKey = `${normalizedUserId}:${persistedBuildStudioStateKey}`;
    if (buildStudioHydrationKeyRef.current === hydrationKey) return;
    buildStudioHydrationKeyRef.current = hydrationKey;

    const nextActiveTab = normalizeBuildListTab(
      persistedBuildStudioState?.activeTab
    );
    const nextCommunityBrowseMode = normalizeBuildListBrowseMode(
      persistedBuildStudioState?.browseModes?.community
    );
    const nextOpenSourceBrowseMode = normalizeBuildListBrowseMode(
      persistedBuildStudioState?.browseModes?.open_source
    );

    if (activeTabRef.current !== nextActiveTab) {
      onSetBuildStudioActiveTab(nextActiveTab);
    }
    if (
      getBuildListBrowseMode({ activeTab: 'community', buildStudio }) !==
      nextCommunityBrowseMode
    ) {
      onSetBuildStudioBrowseMode({
        tab: 'community',
        browseMode: nextCommunityBrowseMode
      });
    }
    if (
      getBuildListBrowseMode({ activeTab: 'open_source', buildStudio }) !==
      nextOpenSourceBrowseMode
    ) {
      onSetBuildStudioBrowseMode({
        tab: 'open_source',
        browseMode: nextOpenSourceBrowseMode
      });
    }
    // Context actions and request helpers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId, persistedBuildStudioStateKey]);

  useEffect(() => {
    if (hasCanonicalListUrl || !normalizedUserId || !sessionLoaded) return;
    // Resolve from the server-persisted preference, not context: on cold
    // loads this effect runs before the hydration effect's context update
    // is visible.
    const targetTab =
      urlTab ?? normalizeBuildListTab(persistedBuildStudioState?.activeTab);
    const targetBrowseMode = isPublicBrowseTab(targetTab)
      ? normalizeBuildListBrowseMode(
          persistedBuildStudioState?.browseModes?.[
            targetTab as 'community' | 'open_source'
          ]
        )
      : undefined;
    navigate(
      `${getBuildListTabPath(targetTab, targetBrowseMode)}${location.search}${
        location.hash
      }`,
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasCanonicalListUrl,
    normalizedUserId,
    sessionLoaded,
    urlTab,
    persistedBuildStudioStateKey,
    location.pathname
  ]);

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

  // Resync state from the URL when location.search changes while this
  // instance stays mounted (back/forward, in-app navigation to a shared
  // search link). No-ops when URL and state already agree, so it cannot
  // loop with the state->URL mirror effect below.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = normalizeBuildListSearchQuery(params.get('q') || '');
    const urlOwner = normalizeBuildSearchOwner(params.get('owner'));
    const sortParam = params.get('sort');
    const urlSort: PublicBuildSort =
      (urlQuery || urlOwner) &&
      (sortParam === 'popular' || sortParam === 'forks')
        ? sortParam
        : 'recent';
    const expectedUrlSort =
      (buildSearchQuery || buildSearchOwner) && buildSearchSort !== 'recent'
        ? buildSearchSort
        : 'recent';
    if (
      urlQuery === buildSearchQuery &&
      urlOwner === buildSearchOwner &&
      urlSort === expectedUrlSort
    ) {
      return;
    }
    setBuildSearchInput(urlQuery);
    setBuildSearchQuery(urlQuery);
    setBuildSearchOwner(urlOwner);
    setBuildSearchSort(urlSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Mirror the (debounced) search into the URL so the address bar is always
  // shareable. Replace navigation: typing should not spam browser history.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') || '';
    const urlOwner = params.get('owner') || '';
    const urlSort = params.get('sort') || '';
    const nextSort =
      (buildSearchQuery || buildSearchOwner) && buildSearchSort !== 'recent'
        ? buildSearchSort
        : '';
    if (
      urlQuery === buildSearchQuery &&
      urlOwner === buildSearchOwner &&
      urlSort === nextSort
    ) {
      return;
    }
    if (buildSearchQuery) {
      params.set('q', buildSearchQuery);
    } else {
      params.delete('q');
    }
    if (buildSearchOwner) {
      params.set('owner', buildSearchOwner);
    } else {
      params.delete('owner');
    }
    if (nextSort) {
      params.set('sort', nextSort);
    } else {
      params.delete('sort');
    }
    const nextSearch = params.toString();
    navigate(
      `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${
        location.hash
      }`,
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildSearchQuery, buildSearchOwner, buildSearchSort]);

  useEffect(() => {
    if (!normalizedUserId) {
      setMyBuildsLoading(false);
      return;
    }
    let canceled = false;
    setMyBuildsLoading(!myBuildsLoadedForCurrentUser);
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
          setMyBuildsLoading(false);
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
    if (collaboratingCacheFreshForCurrentUser) return;
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
            cacheRefreshKey: collaboratingCacheRefreshKey,
            cacheGeneration: collaboratingCacheGeneration,
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
            cacheRefreshKey: collaboratingCacheRefreshKey,
            cacheGeneration: collaboratingCacheGeneration,
            userId: normalizedUserId
          });
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    collaboratingCacheFreshForCurrentUser,
    collaboratingCacheRefreshKey,
    collaboratingCacheGeneration
  ]);

  useEffect(() => {
    if (activeTab !== 'collaborating') return;
    // covers owner-only searches too: redirecting would drop the search params
    if (isBuildSearchActive) return;
    if (!collaboratingLoadedForCurrentUser) return;
    if (collaboratingBuildCount > 0) return;
    onSetBuildStudioActiveTab('mine');
    navigate(getBuildListTabPath('mine'), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    isBuildSearchActive,
    collaboratingLoadedForCurrentUser,
    collaboratingBuildCount
  ]);

  useEffect(() => {
    if (!userId || activeTab === 'mine' || isBuildSearchActive) {
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
            ? await loadCollaboratingBuilds()
            : await loadPublicBuilds({
                sort: getPublicBuildSort(activeTab, activeBrowseMode),
                scope: getPublicBuildScope(activeTab),
                excludeMine: shouldExcludeMineFromPublicBrowse(
                  activeTab,
                  activeBrowseMode
                )
              });
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: activeTab,
            builds: data?.builds || [],
            loadMoreToken: getLoadMoreToken(data),
            browseMode: activeBrowseMode,
            searchQuery: '',
            cacheRefreshKey:
              activeTab === 'collaborating'
                ? collaboratingCacheRefreshKey
                : undefined,
            cacheGeneration:
              activeTab === 'collaborating'
                ? collaboratingCacheGeneration
                : undefined,
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
            searchQuery: '',
            cacheRefreshKey:
              activeTab === 'collaborating'
                ? collaboratingCacheRefreshKey
                : undefined,
            cacheGeneration:
              activeTab === 'collaborating'
                ? collaboratingCacheGeneration
                : undefined,
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
    isBuildSearchActive
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

          <div
            ref={listInitialScrollRef}
            data-scroll-initial-target="build-list"
          >
            <Search
              value={buildSearchInput}
              sort={buildSearchSort}
              sortShown={isBuildSearchActive}
              ownerFilter={buildSearchOwner}
              onChange={setBuildSearchInput}
              onClear={handleClearBuildSearch}
              onClearOwner={handleClearBuildSearchOwner}
              onSortChange={setBuildSearchSort}
            />

            {!isBuildSearchActive ? (
              <TabFilter
                activeTab={activeTab}
                color={profileTheme}
                onChange={handleTabChange}
                tabs={visibleBuildListTabs}
              />
            ) : null}

            {!isBuildSearchActive && isPublicBrowseTab(activeTab) ? (
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

            <ActivityPanels
              {...buildActivityPanelProps}
              hasNewActivity={hasNewBuildActivity}
              onMobileClose={handleBuildActivityMobileClose}
              onMobileOpen={handleBuildActivityMobileOpen}
              variant="mobile"
            />

            {!isBuildSearchActive && isMyBuildsTab ? (
              <RequestQueue
                builds={buildsWithPendingRequests}
                totalCount={totalPendingCollaborationRequests}
                onOpenBuildRequests={handleOpenBuildRequests}
              />
            ) : null}

            {isBuildSearchActive ? (
              <SearchResults
                color={profileTheme}
                loadingMorePublic={searchLoadingMorePublic}
                loadingMoreTeam={searchLoadingMoreTeam}
                myBuilds={displayedMyBuilds}
                publicBuilds={searchPublicBuilds}
                publicHasMore={searchPublicHasMore}
                runtimeBackTo={`${location.pathname}${location.search}${location.hash}`}
                searching={searching}
                searchQuery={buildSearchQuery}
                teamBuilds={searchTeamBuilds}
                teamHasMore={searchTeamHasMore}
                onAddDescription={setEditingBuild}
                onDelete={setDeletingBuild}
                onFavoriteChange={handleBuildFavoriteChange}
                onFavoriteError={handleBuildFavoriteError}
                onFavoriteStart={handleBuildFavoriteStart}
                onLoadMorePublic={handleLoadMoreSearchPublicBuilds}
                onLoadMoreTeam={handleLoadMoreSearchTeamBuilds}
                onOpenForkHistory={setForkHistoryBuildId}
                onTagClick={handleBuildTagClick}
              />
            ) : (
              <Results
              activeTab={activeTab}
              activeTabLabel={activeTabConfig.label}
              anchorKey={getBuildListScrollPositionPathname(activeTab)}
              initialScrollToList={tabChangeInitialScrollRef.current}
              initialScrollTargetRef={listInitialScrollRef}
              browseBuilds={browseBuilds}
              browseHasMore={Boolean(browseLoadMoreButton)}
              browseLoading={browseLoading || browsePending}
              browseLoadingMore={browseLoadingMore}
              builds={builds}
              color={profileTheme}
              displayedMyBuilds={displayedMyBuilds}
              isBuildSearchActive={isBuildSearchActive}
              isMyBuildsTab={isMyBuildsTab}
              myBuildsLoading={
                myBuildsLoading && !myBuildsLoadedForCurrentUser
              }
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
              onTagClick={handleBuildTagClick}
            />
            )}
          </div>
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
        handleQuickAccessBuildDeleted(deletedBuildId);
        setDeletingBuild(null);
      }
    } catch (error) {
      console.error('Failed to delete build:', error);
    } finally {
      setDeleting(false);
    }
  }

  // Clears the text query only; the owner chip has its own dedicated clear.
  // With an owner active, clearing the text should land on all of that
  // user's builds, not exit the owner's list.
  function handleClearBuildSearch() {
    setBuildSearchInput('');
    setBuildSearchQuery('');
    if (!buildSearchOwner) {
      setBuildSearchSort('recent');
    }
  }

  function handleClearBuildSearchOwner() {
    setBuildSearchOwner('');
    if (!buildSearchQuery) {
      setBuildSearchSort('recent');
    }
  }

  function handleBuildTagClick(tag: BuildTag) {
    setBuildSearchInput(tag.label);
    setBuildSearchQuery(normalizeBuildListSearchQuery(tag.label));
  }

  function handleTabChange(tab: BuildListTab) {
    if (tab !== activeTab) {
      tabChangeInitialScrollRef.current = true;
      onSetBuildStudioActiveTab(tab);
      navigate(
        getBuildListTabPath(
          tab,
          isPublicBrowseTab(tab)
            ? getBuildListBrowseMode({ activeTab: tab, buildStudio })
            : undefined
        )
      );
      void persistBuildStudioState({ activeTab: tab });
    }
  }

  function handleBrowseModeChange(browseMode: BuildStudioBrowseMode) {
    if (!isPublicBrowseTab(activeTab) || browseMode === activeBrowseMode) {
      return;
    }
    onSetBuildStudioBrowseMode({ tab: activeTab, browseMode });
    navigate(getBuildListTabPath(activeTab, browseMode));
    void persistBuildStudioState({
      browseMode,
      browseModeTab: activeTab
    });
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
              cursor: browseLoadMoreButton
            })
          : await loadPublicBuilds(
              buildPublicLoadMoreParams(
                activeTab,
                activeBrowseMode,
                browseLoadMoreButton
              )
            );
      onAppendBuildStudioBrowseBuilds({
        tab: activeTab,
        builds: data?.builds || [],
        loadMoreToken: getLoadMoreToken(data),
        browseMode: activeBrowseMode,
        searchQuery: '',
        cacheGeneration:
          activeTab === 'collaborating'
            ? collaboratingCacheGeneration
            : undefined,
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
    loadMoreToken: string
  ): {
    sort: PublicBuildSort;
    scope: PublicBuildScope;
    excludeMine: boolean;
    cursor?: string;
    lastId?: number;
  } {
    const loadMoreParams: {
      sort: PublicBuildSort;
      scope: PublicBuildScope;
      excludeMine: boolean;
      cursor?: string;
      lastId?: number;
    } = {
      sort: getPublicBuildSort(tab, browseMode),
      scope: getPublicBuildScope(tab),
      excludeMine: shouldExcludeMineFromPublicBrowse(tab, browseMode)
    };
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

  async function persistBuildStudioState({
    activeTab: nextActiveTab = activeTab,
    browseMode,
    browseModeTab
  }: {
    activeTab?: BuildListTab;
    browseMode?: BuildStudioBrowseMode;
    browseModeTab?: BuildListTab;
  }) {
    if (!normalizedUserId) return;
    const nextBuildStudioState = getSerializableBuildStudioState({
      activeTab: nextActiveTab,
      browseMode,
      browseModeTab,
      buildStudio
    });
    const saveId = buildStudioPreferenceSaveIdRef.current + 1;
    buildStudioPreferenceSaveIdRef.current = saveId;
    const savePreference = async () => {
      try {
        const data = await updateBuildStudioState(nextBuildStudioState);
        if (saveId !== buildStudioPreferenceSaveIdRef.current) return;
        if (data?.state) {
          onSetUserState({
            userId: normalizedUserId,
            newState: { state: data.state }
          });
        }
      } catch (error) {
        console.error('Failed to save Build Studio view preference:', error);
      }
    };
    const savePromise = buildStudioPreferenceSaveQueueRef.current.then(
      savePreference,
      savePreference
    );
    buildStudioPreferenceSaveQueueRef.current = savePromise;
    await savePromise;
  }

}

function normalizeBuildSearchOwner(value: string | null) {
  return String(value || '')
    .trim()
    .slice(0, 64);
}

function getIsActivityRailVisible() {
  if (typeof window === 'undefined') return false;
  const breakpoint = Number.parseInt(buildActivityRailBreakpoint, 10);
  if (!Number.isFinite(breakpoint)) return true;
  return window.innerWidth > breakpoint;
}

function getBuildListScrollPositionPathname(tab: BuildListTab) {
  return `/build:${tab}`;
}

function getCollaboratingBuildsCacheRefreshKey(numNewNotis: unknown) {
  const refreshKey = Math.floor(Number(numNewNotis) || 0);
  if (!Number.isFinite(refreshKey)) return 0;
  return Math.max(0, refreshKey);
}

function getBuildStudioBrowseCacheGeneration(value: unknown) {
  const generation = Math.floor(Number(value) || 0);
  if (!Number.isFinite(generation)) return 0;
  return Math.max(0, generation);
}

function getPersistedBuildStudioStateKey(value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return JSON.stringify({
    activeTab: normalizeBuildListTab(value.activeTab),
    browseModes: {
      community: normalizeBuildListBrowseMode(value.browseModes?.community),
      open_source: normalizeBuildListBrowseMode(value.browseModes?.open_source)
    }
  });
}

function getSerializableBuildStudioState({
  activeTab,
  browseMode,
  browseModeTab,
  buildStudio
}: {
  activeTab: BuildListTab;
  browseMode?: BuildStudioBrowseMode;
  browseModeTab?: BuildListTab;
  buildStudio: any;
}) {
  const communityBrowseMode =
    browseModeTab === 'community' && browseMode
      ? browseMode
      : getBuildListBrowseMode({ activeTab: 'community', buildStudio });
  const openSourceBrowseMode =
    browseModeTab === 'open_source' && browseMode
      ? browseMode
      : getBuildListBrowseMode({ activeTab: 'open_source', buildStudio });
  return {
    activeTab: normalizeBuildListTab(activeTab),
    browseModes: {
      community: communityBrowseMode,
      open_source: openSourceBrowseMode
    }
  };
}

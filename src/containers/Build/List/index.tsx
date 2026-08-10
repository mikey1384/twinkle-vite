import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Toast from '~/components/Toast';
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
import { type BuildStudioBrowseMode } from '~/contexts/Build/reducer';

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
  parseBuildListTab
} from './helpers';
import { BuildQuickAccessStrip } from './QuickAccess';
import ActivityPanels from './ActivityPanels';
import Hero from './Hero';
import LoggedOutCommunity from './LoggedOutCommunity';
import Overlays from './Overlays';
import RequestQueue from './RequestQueue';
import Results from './Results';
import Search from './Search';
import SearchResults from './SearchResults';
import useActivityPanel from './hooks/useActivityPanel';
import useGlobalBuildSearch from './hooks/useGlobalBuildSearch';
import useQuickAccess from './hooks/useQuickAccess';
import type { BuildListTab, PublicBuildScope, PublicBuildSort } from './types';
import { buildBrowseModeTabs, buildListTabs } from './constants/tabs';
import { getBuildListTabPath } from './helpers/url';
import {
  getIsBuildActivityRailVisible,
  studioLayoutClass,
  studioMainClass,
  studioPageClass
} from './StudioLayout';
import SectionSwitcher from '../SectionSwitcher';
import {
  enqueueBuildStudioPreferenceSave,
  getBuildStudioPreferencesKey
} from '../studioPreferences';

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
  const [sayHiContinueBuild, setSayHiContinueBuild] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [activityRailVisible, setActivityRailVisible] = useState(
    getIsBuildActivityRailVisible
  );

  useEffect(() => {
    const leaveMessage = (
      location.state as { buildTeamLeaveMessage?: string } | null
    )?.buildTeamLeaveMessage;
    if (!leaveMessage) return;
    setToastMessage(leaveMessage);
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
  const userId = useKeyContext((v) => v.myState.userId);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const sessionStateArrived = useAppContext(
    (v) => v.user.state.myState.state !== undefined
  );
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
  const updateBuildStudioState = useAppContext(
    (v) => v.requestHelpers.updateBuildStudioState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const buildStudio = useBuildContext((v) => v.state.buildStudio);
  const onSetBuildStudioActiveTab = useBuildContext(
    (v) => v.actions.onSetBuildStudioActiveTab
  );
  const onSetBuildStudioSection = useBuildContext(
    (v) => v.actions.onSetBuildStudioSection
  );
  const onInvalidateBuildStudioBrowseTab = useBuildContext(
    (v) => v.actions.onInvalidateBuildStudioBrowseTab
  );
  const onSetBuildStudioMyBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioMyBuilds
  );
  const onPatchBuildStudioMyBuild = useBuildContext(
    (v) => v.actions.onPatchBuildStudioMyBuild
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
  const activeScrollAnchorKey = getBuildListScrollPositionPathname(
    activeTab,
    activeBrowseMode
  );
  const hasCanonicalListUrl = Boolean(
    urlTab && (!isPublicBrowseTab(urlTab) || urlBrowseMode)
  );
  const persistedBuildStudioStateKey = getBuildStudioPreferencesKey(
    persistedBuildStudioState
  );
  const persistedActiveTab = parseBuildListTab(
    persistedBuildStudioState?.activeTab
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
  // Every browse tab carries a cache generation, and the reducer drops any write whose
  // generation no longer matches. Sending it back for public tabs too — not just
  // collaborating — is what lets those tabs be invalidated and reloaded at all: without it
  // the refetch's result is rejected and the tab stays permanently unloaded.
  const activeBrowseCacheGeneration = getBuildStudioBrowseCacheGeneration(
    activeBrowseState.cacheGeneration
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
  // Wordle skip-shield deep link: land the player straight in a Lumine chat
  // with zero extra taps — their most recent workspace when they have one,
  // otherwise the one-field New Build page. The param rides along so the
  // workspace shows the say-hi nudge on the chat box.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('sayHi') !== 'lumine') return;
    if (!normalizedUserId) return;
    if (!myBuildsLoadedForCurrentUser) return;
    // "Actual build" means it has code: someone with only empty shells is
    // still a first-timer and goes straight to the one-field New page. With
    // a real build, they choose — continue it, or start fresh.
    const latestActualBuild = builds.find(
      (build) =>
        Number(build?.userId || 0) === normalizedUserId && build?.hasCode
    );
    if (latestActualBuild?.id) {
      setSayHiContinueBuild({
        id: Number(latestActualBuild.id),
        title: String(latestActualBuild.title || 'your app')
      });
    } else {
      navigate('/build/new?sayHi=lumine', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, myBuildsLoadedForCurrentUser, normalizedUserId]);

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
    resultsAreCurrent: searchResultsAreCurrent,
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
  const initialScrollAnchorKeyRef = useRef('');
  const listInitialScrollRef = useRef<HTMLDivElement | null>(null);
  const [myBuildsLoading, setMyBuildsLoading] = useState(true);
  // Bumped when the user re-selects the My Builds tab they are already on, so the loader below
  // refetches. My Builds has no cached `loaded` flag to invalidate the way browse tabs do.
  const [myBuildsReloadKey, setMyBuildsReloadKey] = useState(0);
  const [confirmedMyBuildOwnership, setConfirmedMyBuildOwnership] = useState<{
    userId: number;
    buildCount: number;
  } | null>(null);
  const confirmedMyBuildCount =
    confirmedMyBuildOwnership?.userId === normalizedUserId
      ? confirmedMyBuildOwnership.buildCount
      : null;
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [editingBuild, setEditingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState<number | null>(
    null
  );
  const [savingMetadata, setSavingMetadata] = useState(false);
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
    savingMode: quickAccessSavingMode,
    modalBuilds: quickAccessModalBuilds,
    modalCursor: quickAccessModalCursor,
    modalMode: quickAccessModalMode,
    onBuildFavoriteChange: handleBuildFavoriteChange,
    onBuildFavoriteError: handleBuildFavoriteError,
    onBuildFavoriteStart: handleBuildFavoriteStart,
    onCloseModal: handleCloseQuickAccessModal,
    onLoadMoreModalBuilds: handleLoadMoreQuickAccessModalBuilds,
    onModeChange: handleQuickAccessModeChange,
    onOpenBuild: handleOpenQuickAccessBuild,
    onOpenTodayTopViewedBuild: handleOpenTodayTopViewedBuild,
    onShowMore: handleShowMoreQuickAccess,
    openButtonStyle: quickAccessOpenButtonStyle,
    quickAccessMode,
    todayTopViewedBuild,
    todayTopViewedPending
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
      setActivityRailVisible(getIsBuildActivityRailVisible());
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
    const nextSection =
      persistedBuildStudioState?.section === 'prompts' ? 'prompts' : 'apps';
    const nextCommunityBrowseMode = normalizeBuildListBrowseMode(
      persistedBuildStudioState?.browseModes?.community
    );
    const nextOpenSourceBrowseMode = normalizeBuildListBrowseMode(
      persistedBuildStudioState?.browseModes?.open_source
    );

    if (activeTabRef.current !== nextActiveTab) {
      onSetBuildStudioActiveTab(nextActiveTab);
    }
    if (buildStudio.section !== nextSection) {
      onSetBuildStudioSection(nextSection);
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
    if (
      !normalizedUserId ||
      !sessionLoaded ||
      persistedBuildStudioState?.section !== 'prompts'
    ) {
      return;
    }
    void persistBuildStudioState({ section: 'apps' });
    // Request helpers and context actions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId, sessionLoaded, persistedBuildStudioStateKey]);

  useEffect(() => {
    if (hasCanonicalListUrl || !normalizedUserId || !sessionLoaded) return;
    // An explicit saved tab means the user has used the Build tabs before and
    // remains authoritative. Only first-time users need the owned-build check,
    // and that decision waits for the canonical My Builds response.
    if (!urlTab && !persistedActiveTab && confirmedMyBuildCount == null) {
      return;
    }
    // Resolve from the server-persisted preference, not context: on cold
    // loads this effect runs before the hydration effect's context update
    // is visible.
    const targetTab =
      urlTab ??
      persistedActiveTab ??
      (Number(confirmedMyBuildCount) > 0 ? 'mine' : 'community');
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
    persistedActiveTab,
    confirmedMyBuildCount,
    location.pathname
  ]);

  useEffect(() => {
    setEditingBuild(null);
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
      setConfirmedMyBuildOwnership(null);
      return;
    }
    const currentUserId = normalizedUserId;
    let canceled = false;
    setConfirmedMyBuildOwnership(null);
    setMyBuildsLoading(!myBuildsLoadedForCurrentUser);
    handleLoad();

    async function handleLoad() {
      try {
        const data = await loadMyBuilds();
        if (!canceled) {
          const canonicalBuilds = Array.isArray(data?.builds)
            ? data.builds
            : [];
          onSetBuildStudioMyBuilds({
            builds: canonicalBuilds,
            userId: currentUserId
          });
          setConfirmedMyBuildOwnership({
            userId: currentUserId,
            buildCount: canonicalBuilds.length
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
  }, [userId, numNewNotis, myBuildsReloadKey]);

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
                scope: getPublicBuildScope(activeTab)
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
            cacheGeneration: activeBrowseCacheGeneration,
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
            cacheGeneration: activeBrowseCacheGeneration,
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
    activeBrowseCacheGeneration,
    isBuildSearchActive
  ]);

  if (!userId) {
    // Logged-out visitors may browse the Community tab only. The default
    // /build route also lands here so the Build nav item shows public builds
    // rather than a bare login wall.
    if (urlTab === undefined || urlTab === 'community') {
      return (
        <LoggedOutCommunity
          browseMode={normalizeBuildListBrowseMode(urlBrowseMode)}
        />
      );
    }
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
    <div className={studioPageClass}>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      <div className={studioLayoutClass}>
        <main className={studioMainClass}>
          <SectionSwitcher
            activeSection="apps"
            color={profileTheme}
            onChange={(section) => {
              if (section === 'prompts') {
                navigate('/prompts');
              }
            }}
          />

          <BuildQuickAccessStrip
            activeMode={quickAccessMode}
            builds={activeQuickAccessBuilds}
            color={profileTheme}
            error={quickAccessError}
            hasMore={Boolean(activeQuickAccessCursor)}
            loading={quickAccessLoading}
            savingMode={quickAccessSavingMode}
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
            topViewedPending={todayTopViewedPending}
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
                anchorKey={`/build:search:${buildSearchOwner}:${buildSearchSort}:${buildSearchQuery}`}
                resultsAreCurrent={searchResultsAreCurrent}
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
                anchorKey={activeScrollAnchorKey}
                initialScrollToList={
                  initialScrollAnchorKeyRef.current === activeScrollAnchorKey
                }
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
                showBrowseRanks={
                  isPublicBrowseTab(activeTab) &&
                  activeBrowseMode === 'leaderboard'
                }
                creatingFromPrompt={creatingFromPrompt}
                runtimeBackTo={`${location.pathname}${location.search}${location.hash}`}
                onAddDescription={setEditingBuild}
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
        editingBuild={editingBuild}
        forkHistoryBuildId={forkHistoryBuildId}
        quickAccessError={quickAccessError}
        quickAccessLoadingMore={quickAccessLoadingMore}
        quickAccessModalBuilds={quickAccessModalBuilds}
        quickAccessModalCursor={quickAccessModalCursor}
        quickAccessModalMode={quickAccessModalMode}
        quickAccessOpenButtonStyle={quickAccessOpenButtonStyle}
        savingMetadata={savingMetadata}
        onCloseEdit={() => (savingMetadata ? null : setEditingBuild(null))}
        onCloseForkHistory={() => setForkHistoryBuildId(null)}
        onCloseQuickAccess={handleCloseQuickAccessModal}
        onFavoriteChange={handleBuildFavoriteChange}
        onFavoriteError={handleBuildFavoriteError}
        onFavoriteStart={handleBuildFavoriteStart}
        onLoadMoreQuickAccess={handleLoadMoreQuickAccessModalBuilds}
        onOpenQuickAccessBuild={handleOpenQuickAccessBuild}
        onSubmitMetadata={handleSubmitMetadata}
      />
      {sayHiContinueBuild && (
        <Modal
          modalKey="LumineSayHiChooser"
          isOpen={true}
          onClose={handleCloseSayHiChooser}
          size="sm"
          hasHeader
          title="Build with Lumine 🤖"
        >
          <main
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1.2rem;
              padding: 0.5rem 0.5rem 1.5rem 0.5rem;
              font-size: 1.3rem;
              line-height: 1.55;
            `}
          >
            <p>
              Start something brand new, or keep building{' '}
              <b>{sayHiContinueBuild.title}</b> — Lumine is ready either way.
            </p>
            <Button
              color="logoBlue"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setSayHiContinueBuild(null);
                navigate('/build/new?sayHi=lumine', { replace: true });
              }}
            >
              Make a new app <Icon icon="arrow-right" />
            </Button>
            <Button
              color="green"
              variant="outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                const buildId = sayHiContinueBuild.id;
                setSayHiContinueBuild(null);
                navigate(`/build/${buildId}?sayHi=lumine`, { replace: true });
              }}
            >
              Continue “{sayHiContinueBuild.title}”
            </Button>
          </main>
        </Modal>
      )}
    </div>
  );

  function handleCloseSayHiChooser() {
    setSayHiContinueBuild(null);
    navigate('/build', { replace: true });
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

  // Re-selecting the tab you are already on is a refresh request. Each feed is refreshed through
  // its own canonical loader — browse tabs by dropping the cached `loaded` flag so the load
  // effect refetches, My Builds by bumping its reload key — so the list that comes back is
  // always server truth rather than anything synthesized here.
  function handleRefreshActiveTab() {
    if (activeTab === 'mine') {
      setMyBuildsReloadKey((key) => key + 1);
      return;
    }
    onInvalidateBuildStudioBrowseTab({
      tab: activeTab,
      userId: normalizedUserId
    });
  }

  function handleTabChange(tab: BuildListTab) {
    if (tab === activeTab) {
      handleRefreshActiveTab();
      return;
    }
    const nextBrowseMode = isPublicBrowseTab(tab)
      ? getBuildListBrowseMode({ activeTab: tab, buildStudio })
      : undefined;
    initialScrollAnchorKeyRef.current = getBuildListScrollPositionPathname(
      tab,
      nextBrowseMode
    );
    navigate(getBuildListTabPath(tab, nextBrowseMode));
    void persistBuildStudioState({ activeTab: tab });
  }

  function handleBrowseModeChange(browseMode: BuildStudioBrowseMode) {
    if (!isPublicBrowseTab(activeTab)) {
      return;
    }
    if (browseMode === activeBrowseMode) {
      handleRefreshActiveTab();
      return;
    }
    initialScrollAnchorKeyRef.current = getBuildListScrollPositionPathname(
      activeTab,
      browseMode
    );
    navigate(getBuildListTabPath(activeTab, browseMode));
    void persistBuildStudioState({
      activeTab,
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
        cacheGeneration: activeBrowseCacheGeneration,
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
    cursor?: string;
    lastId?: number;
  } {
    const loadMoreParams: {
      sort: PublicBuildSort;
      scope: PublicBuildScope;
      cursor?: string;
      lastId?: number;
    } = {
      sort: getPublicBuildSort(tab, browseMode),
      scope: getPublicBuildScope(tab)
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
    activeTab: nextActiveTab,
    browseMode,
    browseModeTab,
    section
  }: {
    activeTab?: BuildListTab;
    browseMode?: BuildStudioBrowseMode;
    browseModeTab?: BuildListTab;
    section?: 'apps' | 'prompts';
  }) {
    if (!normalizedUserId || !sessionStateArrived) return;
    const browseModes =
      browseMode && browseModeTab === 'community'
        ? { community: browseMode }
        : browseMode && browseModeTab === 'open_source'
          ? { open_source: browseMode }
          : undefined;
    await enqueueBuildStudioPreferenceSave({
      current: persistedBuildStudioState || buildStudio,
      patch: {
        activeTab: nextActiveTab,
        browseModes,
        section
      },
      save: updateBuildStudioState,
      scope: normalizedUserId,
      onConfirmed: (data) => {
        if (data?.state) {
          onSetUserState({
            userId: normalizedUserId,
            newState: { state: data.state }
          });
        }
      },
      onError: (error) => {
        console.error('Failed to save Build Studio view preference:', error);
      }
    });
  }
}

function normalizeBuildSearchOwner(value: string | null) {
  return String(value || '')
    .trim()
    .slice(0, 64);
}

function getBuildListScrollPositionPathname(
  tab: BuildListTab,
  browseMode?: BuildStudioBrowseMode
) {
  if (isPublicBrowseTab(tab)) {
    return `/build:${tab}:${normalizeBuildListBrowseMode(browseMode)}`;
  }
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

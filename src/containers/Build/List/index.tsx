import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import type { BuildProjectListItemData } from '~/domains/Build/shared/components/ProjectListItem';
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
  normalizeBuildListSearchQuery,
  normalizeBuildListTab,
  shouldExcludeMineFromPublicBrowse
} from './domain';
import { BuildQuickAccessStrip } from './QuickAccess';
import ActivityPanels from './ActivityPanels';
import Hero from './Hero';
import Overlays from './Overlays';
import RequestQueue from './RequestQueue';
import Results from './Results';
import Search from './Search';
import useActivityPanel from './hooks/useActivityPanel';
import useQuickAccess from './hooks/useQuickAccess';
import type {
  BuildListTab,
  PublicBuildScope,
  PublicBuildSort
} from './types';
import {
  buildBrowseModeTabs,
  buildListTabs
} from './tabs';
import {
  buildActivityRailBreakpoint,
  buildActivityRailWidth,
  buildPageTopGap,
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
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
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
  const [buildSearchInput, setBuildSearchInput] = useState('');
  const [buildSearchQuery, setBuildSearchQuery] = useState('');
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
    onMobileOpen: handleBuildActivityMobileOpen,
    panelProps: buildActivityPanelProps
  } = useActivityPanel({
    buildStudio,
    color: profileTheme,
    normalizedUserId
  });

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

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useBuildContext
} from '~/contexts';
import { BUILD_TRENDING_SHOWCASE_VIEW_SOURCE } from '../../constants/runtimeViewSources';
import {
  getCollaboratingBuildListItemTargetPath,
  normalizeBuildQuickAccessMode,
  normalizeQuickAccessBuilds,
  normalizeQuickAccessCursor,
  normalizeTodayTopViewedBuild
} from '../helpers';
import {
  BuildQuickAccessMode,
  QuickAccessBuild,
  TodayTopViewedBuild
} from '../types';
import { buildBrowseTabs } from '../constants/tabs';
import { QUICK_ACCESS_FETCH_LIMIT } from '../QuickAccess';
import { logoBlueOpenAppButtonStyle } from '../constants/layout';

export default function useQuickAccess({
  buildQuickAccessMode,
  buildStudio,
  normalizedUserId,
  onPatchBuildStudioMyBuild,
  onSetBuildStudioBrowseBuilds,
  profileTheme
}: {
  buildQuickAccessMode: string | null | undefined;
  buildStudio: any;
  normalizedUserId: number | null;
  onPatchBuildStudioMyBuild: (payload: {
    build: BuildProjectListItemData;
    userId: number | null;
  }) => void;
  onSetBuildStudioBrowseBuilds: (payload: {
    tab: any;
    builds: BuildProjectListItemData[];
    loadMoreToken: string | null;
    browseMode: any;
    searchQuery: string;
    userId: number | null;
  }) => void;
  profileTheme?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
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
  const onChangeBuildQuickAccessMode = useAppContext(
    (v) => v.user.actions.onChangeBuildQuickAccessMode
  );
  const quickAccessCache = useBuildContext(
    (v) => v.state.buildStudio.quickAccess
  );
  const onSetBuildStudioTodayTopViewedBuild = useBuildContext(
    (v) => v.actions.onSetBuildStudioTodayTopViewedBuild
  );
  const onSetBuildStudioQuickAccessBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioQuickAccessBuilds
  );
  const onAppendBuildStudioQuickAccessBuilds = useBuildContext(
    (v) => v.actions.onAppendBuildStudioQuickAccessBuilds
  );
  const onRemoveBuildStudioQuickAccessBuilds = useBuildContext(
    (v) => v.actions.onRemoveBuildStudioQuickAccessBuilds
  );
  const onPatchBuildStudioQuickAccessFavorite = useBuildContext(
    (v) => v.actions.onPatchBuildStudioQuickAccessFavorite
  );

  const quickAccessMode = normalizeBuildQuickAccessMode(buildQuickAccessMode);
  const recentQuickAccessState = quickAccessCache?.recent;
  const favoriteQuickAccessState = quickAccessCache?.favorites;
  const todayTopViewedState = quickAccessCache?.todayTopViewed;
  const recentLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      recentQuickAccessState?.loaded &&
      recentQuickAccessState.userId === normalizedUserId
  );
  const favoritesLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      favoriteQuickAccessState?.loaded &&
      favoriteQuickAccessState.userId === normalizedUserId
  );
  const todayTopViewedLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      todayTopViewedState?.loaded &&
      todayTopViewedState.userId === normalizedUserId
  );
  const recentlyUsedBuilds = recentLoadedForCurrentUser
    ? ((recentQuickAccessState?.builds || []) as QuickAccessBuild[])
    : [];
  const favoriteBuilds = favoritesLoadedForCurrentUser
    ? ((favoriteQuickAccessState?.builds || []) as QuickAccessBuild[])
    : [];
  const todayTopViewedBuild = todayTopViewedLoadedForCurrentUser
    ? ((todayTopViewedState?.build || null) as TodayTopViewedBuild | null)
    : null;
  const recentlyUsedCursor = recentLoadedForCurrentUser
    ? recentQuickAccessState?.cursor || null
    : null;
  const favoriteBuildsCursor = favoritesLoadedForCurrentUser
    ? favoriteQuickAccessState?.cursor || null
    : null;
  const quickAccessLoadedForCurrentUser =
    recentLoadedForCurrentUser && favoritesLoadedForCurrentUser;
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<BuildQuickAccessMode | null>(null);
  const [todayTopViewedFailedUserId, setTodayTopViewedFailedUserId] =
    useState<number | null>(null);
  const loadRef = useRef(0);
  const todayTopViewedLoadRef = useRef(0);
  const todayTopViewedPending = Boolean(
    normalizedUserId &&
      !todayTopViewedLoadedForCurrentUser &&
      todayTopViewedFailedUserId !== normalizedUserId
  );
  const activeBuilds =
    quickAccessMode === 'favorites' ? favoriteBuilds : recentlyUsedBuilds;
  const activeCursor =
    quickAccessMode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
  const modalBuilds =
    modalMode === 'favorites' ? favoriteBuilds : recentlyUsedBuilds;
  const modalCursor =
    modalMode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
  const openButtonStyle =
    profileTheme === 'gold' ? logoBlueOpenAppButtonStyle : undefined;

  useEffect(() => {
    if (!normalizedUserId) return;
    const loadId = todayTopViewedLoadRef.current + 1;
    todayTopViewedLoadRef.current = loadId;
    setTodayTopViewedFailedUserId(null);
    handleLoadTodayTopViewedBuild();

    async function handleLoadTodayTopViewedBuild() {
      try {
        const data = await loadTodayTopViewedBuild();
        if (todayTopViewedLoadRef.current !== loadId) return;
        setTodayTopViewedFailedUserId(null);
        onSetBuildStudioTodayTopViewedBuild({
          build: normalizeTodayTopViewedBuild(data?.build),
          userId: normalizedUserId
        });
      } catch (err) {
        console.error('Failed to load today top viewed build:', err);
        if (todayTopViewedLoadRef.current === loadId) {
          setTodayTopViewedFailedUserId(normalizedUserId);
        }
      }
    }

    return () => {
      todayTopViewedLoadRef.current += 1;
    };
    // loadTodayTopViewedBuild and context actions are stable helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  useEffect(() => {
    setModalMode(null);
    setLoading(false);
    setLoadingMore(false);
    setError('');
    if (!normalizedUserId) {
      return;
    }
    void loadQuickAccess({ showLoading: !quickAccessLoadedForCurrentUser });

    return () => {
      loadRef.current += 1;
    };
    // Request helpers, context actions, and the initial cache snapshot are stable for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  useEffect(() => {
    if (!normalizedUserId) return;
    socket.on('build_deleted', handleSocketBuildDeleted);
    return () => {
      socket.off('build_deleted', handleSocketBuildDeleted);
    };

    function handleSocketBuildDeleted({
      buildIds
    }: {
      buildIds?: number[];
    }) {
      const deletedBuildIds = new Set(
        (Array.isArray(buildIds) ? buildIds : [])
          .map((buildId) => Number(buildId || 0))
          .filter((buildId) => buildId > 0)
      );
      if (deletedBuildIds.size === 0) return;
      onRemoveBuildStudioQuickAccessBuilds({
        buildIds: [...deletedBuildIds],
        userId: normalizedUserId
      });
    }
    // onRemoveBuildStudioQuickAccessBuilds is a stable context action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  return {
    activeBuilds,
    activeCursor,
    error,
    loading,
    loadingMore,
    savingMode,
    modalBuilds,
    modalCursor,
    modalMode,
    onBuildDeleted: handleBuildDeleted,
    onBuildFavoriteChange: handleBuildFavoriteChange,
    onBuildFavoriteError: handleBuildFavoriteError,
    onBuildFavoriteStart: handleBuildFavoriteStart,
    onCloseModal: handleCloseModal,
    onLoadMoreModalBuilds: handleLoadMoreModalBuilds,
    onModeChange: handleModeChange,
    onOpenBuild: handleOpenBuild,
    onOpenTodayTopViewedBuild: handleOpenTodayTopViewedBuild,
    onShowMore: handleShowMore,
    openButtonStyle,
    quickAccessMode,
    todayTopViewedBuild,
    todayTopViewedPending
  };

  async function loadQuickAccess({ showLoading = true } = {}) {
    if (!normalizedUserId) return;
    const loadId = loadRef.current + 1;
    loadRef.current = loadId;
    if (showLoading) {
      setLoading(true);
    }
    setError('');
    try {
      const [recentResult, favoriteResult] = await Promise.all([
        loadRecentlyUsedBuilds({ limit: QUICK_ACCESS_FETCH_LIMIT }),
        loadFavoriteBuilds({ limit: QUICK_ACCESS_FETCH_LIMIT })
      ]);
      if (loadRef.current !== loadId) return;
      onSetBuildStudioQuickAccessBuilds({
        quickAccessMode: 'recent',
        builds: normalizeQuickAccessBuilds(recentResult?.builds),
        cursor: normalizeQuickAccessCursor(recentResult?.cursor),
        userId: normalizedUserId
      });
      onSetBuildStudioQuickAccessBuilds({
        quickAccessMode: 'favorites',
        builds: normalizeQuickAccessBuilds(favoriteResult?.builds),
        cursor: normalizeQuickAccessCursor(favoriteResult?.cursor),
        userId: normalizedUserId
      });
    } catch (err: any) {
      console.error('Failed to load build quick access:', err);
      if (loadRef.current === loadId) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Quick access could not load.'
        );
      }
    } finally {
      if (loadRef.current === loadId) {
        setLoading(false);
      }
    }
  }

  function handleOpenBuild(build: QuickAccessBuild) {
    const buildId = Number(build.id || 0);
    if (!buildId) return;
    navigate(getCollaboratingBuildListItemTargetPath(build), {
      state: {
        runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
        runtimeBackLabel: 'Back to Build Studio'
      }
    });
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

  function handleShowMore() {
    setModalMode(quickAccessMode);
  }

  function handleCloseModal() {
    setModalMode(null);
  }

  function handleLoadMoreModalBuilds() {
    if (!modalMode || !modalCursor || loadingMore) return;
    void loadMoreBuilds(modalMode);
  }

  async function loadMoreBuilds(mode: BuildQuickAccessMode) {
    const cursor =
      mode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
    if (!cursor) return;
    setLoadingMore(true);
    setError('');
    try {
      const result =
        mode === 'favorites'
          ? await loadFavoriteBuilds({
              cursor,
              limit: QUICK_ACCESS_FETCH_LIMIT
            })
          : await loadRecentlyUsedBuilds({
              cursor,
              limit: QUICK_ACCESS_FETCH_LIMIT
            });
      onAppendBuildStudioQuickAccessBuilds({
        quickAccessMode: mode,
        builds: normalizeQuickAccessBuilds(result?.builds),
        cursor: normalizeQuickAccessCursor(result?.cursor),
        userId: normalizedUserId
      });
    } catch (err: any) {
      console.error('Failed to load more quick access builds:', err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'More quick access builds could not load.'
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function handleBuildFavoriteStart() {
    setError('');
  }

  function handleBuildDeleted(buildId: number) {
    onRemoveBuildStudioQuickAccessBuilds({
      buildId,
      userId: normalizedUserId
    });
  }

  function handleBuildFavoriteChange(
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) {
    patchFavoriteState({
      build,
      buildId: change.buildId,
      favoriteActivityAt: change.favoriteActivityAt,
      favoritedAt: change.favoritedAt,
      isFavorited: change.isFavorited
    });
  }

  function handleBuildFavoriteError(
    _build: BuildProjectListItemData,
    err: any
  ) {
    console.error('Failed to update build favorite:', err);
    setError(
      err?.response?.data?.error ||
        err?.message ||
        'Favorite could not be updated.'
    );
    void loadQuickAccess({ showLoading: false });
  }

  function patchFavoriteState({
    build,
    buildId,
    favoriteActivityAt,
    favoritedAt,
    isFavorited
  }: {
    build: BuildProjectListItemData;
    buildId: number;
    favoriteActivityAt: number | null;
    favoritedAt: number | null;
    isFavorited: boolean;
  }) {
    const nextFavoriteActivityAt = isFavorited
      ? favoriteActivityAt || favoritedAt
      : null;
    const patchProjectBuild = (
      item: BuildProjectListItemData
    ): BuildProjectListItemData =>
      Number(item.id) === buildId
        ? {
            ...item,
            favoriteActivityAt: nextFavoriteActivityAt,
            favoritedAt,
            isFavorited
          }
        : item;
    onPatchBuildStudioQuickAccessFavorite({
      build: {
        ...build,
        favoriteActivityAt: nextFavoriteActivityAt,
        favoritedAt,
        isFavorited
      },
      buildId,
      favoriteActivityAt: nextFavoriteActivityAt,
      favoritedAt,
      isFavorited,
      userId: normalizedUserId
    });
    onPatchBuildStudioMyBuild({
      build: {
        ...build,
        favoriteActivityAt: nextFavoriteActivityAt,
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

  async function handleModeChange(mode: BuildQuickAccessMode) {
    if (savingMode) {
      return;
    }
    // Re-selecting the mode you are already on refreshes the list. The saved preference is
    // already correct, so there is nothing to write back — only the feed needs refetching.
    if (mode === quickAccessMode) {
      void loadQuickAccess({ showLoading: true });
      return;
    }
    setSavingMode(true);
    try {
      const data = await setBuildQuickAccessMode(mode);
      const confirmedMode =
        data?.buildQuickAccessMode === 'favorites' ? 'favorites' : 'recent';
      // Update shared user state only from the server-confirmed value.
      onChangeBuildQuickAccessMode(confirmedMode);
    } catch (err) {
      console.error('Failed to save build quick access preference:', err);
    } finally {
      setSavingMode(false);
    }
  }
}

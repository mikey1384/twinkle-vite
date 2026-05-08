import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { BuildFavoriteChange } from '~/domains/Build/shared/components/FavoriteButton';
import type { BuildProjectListItemData } from '~/domains/Build/shared/components/ProjectListItem';
import {
  useAppContext
} from '~/contexts';
import { BUILD_TRENDING_SHOWCASE_VIEW_SOURCE } from '../../runtimeViewSources';
import {
  normalizeBuildQuickAccessMode,
  normalizeQuickAccessBuilds,
  normalizeQuickAccessCursor,
  normalizeTodayTopViewedBuild
} from '../domain';
import {
  BuildQuickAccessMode,
  QuickAccessBuild,
  TodayTopViewedBuild
} from '../types';
import { buildBrowseTabs } from '../tabs';
import { QUICK_ACCESS_MODAL_PAGE_SIZE } from '../QuickAccess';
import { logoBlueOpenAppButtonStyle } from '../layout';

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

  const quickAccessMode = normalizeBuildQuickAccessMode(buildQuickAccessMode);
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
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<BuildQuickAccessMode | null>(null);
  const [modalPage, setModalPage] = useState(0);
  const loadRef = useRef(0);
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
      } catch (err) {
        console.error('Failed to load today top viewed build:', err);
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
    setModalMode(null);
    setModalPage(0);
    setLoading(false);
    setLoadingMore(false);
    setError('');
    if (!normalizedUserId) {
      return;
    }
    void loadQuickAccess();

    return () => {
      loadRef.current += 1;
    };
    // loadRecentlyUsedBuilds and loadFavoriteBuilds are stable request helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  useEffect(() => {
    if (!modalMode) return;
    const pageCount = Math.max(
      1,
      Math.ceil(modalBuilds.length / QUICK_ACCESS_MODAL_PAGE_SIZE)
    );
    setModalPage((page) => Math.min(page, pageCount - 1));
  }, [modalBuilds.length, modalMode]);

  return {
    activeBuilds,
    activeCursor,
    error,
    loading,
    loadingMore,
    modalBuilds,
    modalCursor,
    modalMode,
    modalPage,
    onBuildDeleted: handleBuildDeleted,
    onBuildFavoriteChange: handleBuildFavoriteChange,
    onBuildFavoriteError: handleBuildFavoriteError,
    onBuildFavoriteStart: handleBuildFavoriteStart,
    onCloseModal: handleCloseModal,
    onModeChange: handleModeChange,
    onNextModalPage: handleNextModalPage,
    onOpenBuild: handleOpenBuild,
    onOpenTodayTopViewedBuild: handleOpenTodayTopViewedBuild,
    onPreviousModalPage: handlePreviousModalPage,
    onShowMore: handleShowMore,
    openButtonStyle,
    quickAccessMode,
    todayTopViewedBuild
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
        loadRecentlyUsedBuilds({ limit: QUICK_ACCESS_MODAL_PAGE_SIZE }),
        loadFavoriteBuilds({ limit: QUICK_ACCESS_MODAL_PAGE_SIZE })
      ]);
      if (loadRef.current !== loadId) return;
      setRecentlyUsedBuilds(normalizeQuickAccessBuilds(recentResult?.builds));
      setFavoriteBuilds(normalizeQuickAccessBuilds(favoriteResult?.builds));
      setRecentlyUsedCursor(normalizeQuickAccessCursor(recentResult?.cursor));
      setFavoriteBuildsCursor(
        normalizeQuickAccessCursor(favoriteResult?.cursor)
      );
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
    navigate(`/app/${buildId}`, {
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
    setModalPage(0);
  }

  function handleCloseModal() {
    setModalMode(null);
    setModalPage(0);
  }

  function handlePreviousModalPage() {
    setModalPage((page) => Math.max(0, page - 1));
  }

  function handleNextModalPage() {
    if (!modalMode) return;
    const nextPageStart = (modalPage + 1) * QUICK_ACCESS_MODAL_PAGE_SIZE;
    if (nextPageStart < modalBuilds.length) {
      setModalPage((page) => page + 1);
      return;
    }
    if (!modalCursor || loadingMore) return;
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
              limit: QUICK_ACCESS_MODAL_PAGE_SIZE
            })
          : await loadRecentlyUsedBuilds({
              cursor,
              limit: QUICK_ACCESS_MODAL_PAGE_SIZE
            });
      const nextBuilds = normalizeQuickAccessBuilds(result?.builds);
      appendBuilds(mode, nextBuilds);
      setCursor(mode, normalizeQuickAccessCursor(result?.cursor));
      if (nextBuilds.length > 0) {
        setModalPage((page) => page + 1);
      }
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

  function appendBuilds(
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

  function setCursor(mode: BuildQuickAccessMode, cursor: string | null) {
    if (mode === 'favorites') {
      setFavoriteBuildsCursor(cursor);
      return;
    }
    setRecentlyUsedCursor(cursor);
  }

  function handleBuildFavoriteStart() {
    setError('');
  }

  function handleBuildDeleted(buildId: number) {
    setRecentlyUsedBuilds((builds) =>
      builds.filter((build) => Number(build.id) !== buildId)
    );
    setFavoriteBuilds((builds) =>
      builds.filter((build) => Number(build.id) !== buildId)
    );
    setTodayTopViewedBuild((build) =>
      build && Number(build.id) === buildId ? null : build
    );
  }

  function handleBuildFavoriteChange(
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) {
    patchFavoriteState({
      build,
      buildId: change.buildId,
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

  async function handleModeChange(mode: BuildQuickAccessMode) {
    if (mode === quickAccessMode) {
      return;
    }
    onChangeBuildQuickAccessMode(mode);
    try {
      await setBuildQuickAccessMode(mode);
    } catch (err) {
      console.error('Failed to save build quick access preference:', err);
    }
  }
}

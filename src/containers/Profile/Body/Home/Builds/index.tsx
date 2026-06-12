import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProjectListItem, {
  BuildProjectListItemData
} from '~/components/Build/ProjectListItem';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import ForkHistoryModal from '~/components/Modals/BuildForkHistoryModal';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { useProfileState } from '~/helpers/hooks';
import DescriptionModal from '~/components/Modals/BuildDescriptionModal';
import SelectPinnedBuildsModal from './SelectPinnedBuildsModal';
import ReorderPinnedBuildsModal from './ReorderPinnedBuildsModal';
import { Link, useLocation } from 'react-router-dom';

const panelTitle = 'Builds';
const defaultVisibleBuildCount = 3;
const maxPinnedProfileBuilds = 10;
const pinBuildsLabel = 'Pin Builds';
const reorderBuildsLabel = 'Reorder';
const emptyOwnLabel = 'Pin your favorite public builds to show them here';
const emptyVisitorLabel = 'No featured builds yet';

export default function Builds({
  profile,
  selectedTheme
}: {
  profile: { id: number; username: string; state?: any };
  selectedTheme: string;
}) {
  const location = useLocation();
  const myId = useKeyContext((v) => v.myState.userId);
  const myUsername = useKeyContext((v) => v.myState.username);
  const viewerId = Number(myId) > 0 ? Number(myId) : 0;
  const isOwnProfile =
    (myUsername && myUsername === profile.username) ||
    (viewerId > 0 && viewerId === Number(profile.id));
  const { pinnedBuilds: cachedPinnedBuilds } = useProfileState(
    profile.username
  );
  const loadPinnedBuildsOnProfile = useAppContext(
    (v) => v.requestHelpers.loadPinnedBuildsOnProfile
  );
  const pinBuildsOnProfile = useAppContext(
    (v) => v.requestHelpers.pinBuildsOnProfile
  );
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadPinnedBuilds = useProfileContext(
    (v) => v.actions.onLoadPinnedBuilds
  );
  const onSetPinnedBuilds = useProfileContext(
    (v) => v.actions.onSetPinnedBuilds
  );
  const onSetPinnedBuildsExpanded = useProfileContext(
    (v) => v.actions.onSetPinnedBuildsExpanded
  );
  const [loading, setLoading] = useState(true);
  const [displayedBuilds, setDisplayedBuilds] = useState<
    BuildProjectListItemData[]
  >([]);
  const displayedBuildsRef = useRef<BuildProjectListItemData[]>([]);
  const [editingBuild, setEditingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [reorderModalShown, setReorderModalShown] = useState(false);
  const isExpanded = Boolean(cachedPinnedBuilds?.expanded);
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState<number | null>(
    null
  );

  const buildRuntimeNavigationState = {
    runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
    runtimeBackLabel: isOwnProfile
      ? 'Back to your profile'
      : `Back to ${profile.username}'s profile`
  };

  const pinnedBuildIds = useMemo(() => {
    const ids = profile?.state?.profile?.pinnedBuildIds;
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [profile?.state?.profile?.pinnedBuildIds]);
  const pinnedBuildIdsKey = useMemo(
    () => pinnedBuildIds.join(','),
    [pinnedBuildIds]
  );
  const cachedBuilds = useMemo(() => {
    const builds = cachedPinnedBuilds?.builds;
    return Array.isArray(builds) ? builds : [];
  }, [cachedPinnedBuilds?.builds]);
  const cachedIsTopBuilds = Boolean(cachedPinnedBuilds?.isTopBuilds);
  const cachedFavoriteViewerId =
    Number(cachedPinnedBuilds?.favoriteViewerId) > 0
      ? Number(cachedPinnedBuilds?.favoriteViewerId)
      : 0;
  const cachedPinnedBuildIdsKey = useMemo(
    () =>
      cachedBuilds
        .map((build) => Number(build?.id) || 0)
        .filter((id) => id > 0)
        .join(','),
    [cachedBuilds]
  );
  const hasCachedPinnedBuilds =
    Boolean(cachedPinnedBuilds?.loaded) &&
    cachedFavoriteViewerId === viewerId &&
    ((cachedIsTopBuilds && pinnedBuildIds.length === 0) ||
      (!cachedIsTopBuilds && cachedPinnedBuildIdsKey === pinnedBuildIdsKey));
  const shownBuilds = useMemo(() => {
    return isExpanded
      ? displayedBuilds
      : displayedBuilds.slice(0, defaultVisibleBuildCount);
  }, [displayedBuilds, isExpanded]);
  const displayedBuildIds = useMemo(() => {
    return displayedBuilds
      .map((build) => Number(build?.id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [displayedBuilds]);
  const pinnedBuildCount = cachedIsTopBuilds
    ? 0
    : pinnedBuildIds.length || displayedBuilds.length;
  const buttonLabel = `${pinBuildsLabel} (${pinnedBuildCount}/${maxPinnedProfileBuilds})`;
  const reorderButtonShown =
    !cachedIsTopBuilds &&
    pinnedBuildIds.length > 1 &&
    displayedBuildIds.length > 1;

  useEffect(() => {
    setForkHistoryBuildId(null);
    setReorderModalShown(false);
  }, [profile.id]);

  useEffect(() => {
    displayedBuildsRef.current = displayedBuilds;
  }, [displayedBuilds]);

  useEffect(() => {
    if (hasCachedPinnedBuilds) {
      setDisplayedBuilds(cachedBuilds);
      setLoading(false);
      return;
    }
    setDisplayedBuilds([]);
  }, [cachedBuilds, hasCachedPinnedBuilds]);

  useEffect(() => {
    let canceled = false;
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    void loadPinnedBuilds();

    async function loadPinnedBuilds() {
      setLoading(!hasCachedPinnedBuilds);
      try {
        const data = await loadPinnedBuildsOnProfile(profile.id);
        if (canceled) return;
        if (!Array.isArray(data?.buildIds) || !Array.isArray(data?.builds)) {
          throw new Error(
            'Pinned builds response did not include canonical data'
          );
        }
        const nextBuilds = data.builds as BuildProjectListItemData[];
        const isTopBuilds = Boolean(data?.isTopBuilds);
        const nextBuildIds = normalizeBuildIds(data.buildIds);
        setDisplayedBuilds(nextBuilds);
        onLoadPinnedBuilds({
          username: profile.username,
          builds: nextBuilds,
          isTopBuilds,
          favoriteViewerId: viewerId
        });
        const nextPinnedBuildIds = isTopBuilds ? [] : nextBuildIds;
        if (nextPinnedBuildIds.join(',') !== pinnedBuildIdsKey) {
          const nextState = {
            ...(profile.state || {}),
            profile: {
              ...(profile.state?.profile || {}),
              pinnedBuildIds: nextPinnedBuildIds
            }
          };
          onSetUserState({
            userId: profile.id,
            newState: { state: nextState }
          });
        }
      } catch (error) {
        console.error('Failed to load pinned builds on profile:', error);
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
  }, [
    hasCachedPinnedBuilds,
    pinnedBuildIdsKey,
    profile.id,
    profile.username,
    viewerId
  ]);

  if (!loading && !isOwnProfile && displayedBuilds.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Builds">
      <SectionPanel
        elevated
        title={panelTitle}
        loaded={!loading}
        customColorTheme={selectedTheme}
        loadMoreButtonShown={
          !isExpanded && displayedBuilds.length > defaultVisibleBuildCount
        }
        onLoadMore={() =>
          onSetPinnedBuildsExpanded({
            username: profile.username,
            expanded: true
          })
        }
        button={
          isOwnProfile ? (
            <div
              className={css`
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                justify-content: flex-end;
              `}
            >
              <Button
                color="darkerGray"
                variant="solid"
                tone="raised"
                onClick={() => setSelectModalShown(true)}
              >
                <Icon icon={['fas', 'thumbtack']} />
                <span style={{ marginLeft: '0.7rem' }}>{buttonLabel}</span>
              </Button>
              {reorderButtonShown ? (
                <Button
                  color="darkerGray"
                  variant="solid"
                  tone="raised"
                  onClick={() => setReorderModalShown(true)}
                >
                  <Icon icon="sort" />
                  <span style={{ marginLeft: '0.7rem' }}>
                    {reorderBuildsLabel}
                  </span>
                </Button>
              ) : null}
            </div>
          ) : null
        }
        isEmpty={displayedBuilds.length === 0}
        emptyMessage={isOwnProfile ? emptyOwnLabel : emptyVisitorLabel}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {shownBuilds.map((build) => (
            <div
              key={build.id}
              data-scroll-anchor-id={`profile-build:${build.id}`}
              data-scroll-anchor-secondary-id={String(build.id)}
              data-scroll-anchor-content-key={`build:${build.id}`}
            >
              <ProjectListItem
                build={build}
                to={`/app/${build.id}`}
                navigationState={buildRuntimeNavigationState}
                isOwner={isOwnProfile}
                themeName={selectedTheme}
                showFavoriteAction
                onFavoriteChange={handleBuildFavoriteChange}
                onFavoriteError={handleBuildFavoriteError}
                onAddDescription={isOwnProfile ? setEditingBuild : undefined}
                onOpenForkHistory={setForkHistoryBuildId}
              />
            </div>
          ))}
          {/* Build Studio is auth-gated (LoggedOutPrompt), so the link is a
              dead end for logged-out visitors */}
          {viewerId > 0 && displayedBuilds.length > 0 ? (
            <div
              className={css`
                display: flex;
                justify-content: center;
                margin-top: 0.5rem;
              `}
            >
              <Link
                to={`/build?owner=${encodeURIComponent(profile.username)}`}
                className={css`
                  font-size: 1.3rem;
                  font-weight: 700;
                `}
              >
                See all builds by {profile.username}
              </Link>
            </div>
          ) : null}
        </div>
      </SectionPanel>
      {selectModalShown && (
        <SelectPinnedBuildsModal
          currentlySelectedBuildIds={pinnedBuildIds}
          onHide={() => setSelectModalShown(false)}
          onSubmit={handlePinBuilds}
        />
      )}
      {reorderModalShown && (
        <ReorderPinnedBuildsModal
          builds={displayedBuilds}
          initialBuildIds={displayedBuildIds}
          onHide={() => setReorderModalShown(false)}
          onSubmit={handleReorderPinnedBuilds}
        />
      )}
      {editingBuild && (
        <DescriptionModal
          initialTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingMetadata}
          onHide={() => (savingMetadata ? null : setEditingBuild(null))}
          onSubmit={handleSubmitMetadata}
        />
      )}
      {forkHistoryBuildId ? (
        <ForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={() => setForkHistoryBuildId(null)}
        />
      ) : null}
    </ErrorBoundary>
  );

  async function handlePinBuilds(buildIds: number[]) {
    try {
      const data = await pinBuildsOnProfile({ buildIds });
      applyPinnedBuildsPayload(data);
      onSetPinnedBuildsExpanded({
        username: profile.username,
        expanded: false
      });
      setSelectModalShown(false);
    } catch (error) {
      console.error('Failed to pin builds on profile:', error);
    }
  }

  async function handleReorderPinnedBuilds(buildIds: number[]) {
    try {
      const data = await pinBuildsOnProfile({ buildIds });
      applyPinnedBuildsPayload(data);
      setReorderModalShown(false);
    } catch (error) {
      console.error('Failed to reorder pinned builds on profile:', error);
    }
  }

  function applyPinnedBuildsPayload(data: {
    buildIds?: unknown;
    builds?: unknown;
  }) {
    if (!Array.isArray(data?.buildIds) || !Array.isArray(data?.builds)) {
      throw new Error('Pinned builds response did not include canonical data');
    }
    const nextBuildIds = normalizeBuildIds(data.buildIds);
    const nextBuilds = data.builds as BuildProjectListItemData[];
    const nextState = {
      ...(profile.state || {}),
      profile: {
        ...(profile.state?.profile || {}),
        pinnedBuildIds: nextBuildIds
      }
    };
    onSetUserState({
      userId: profile.id,
      newState: { state: nextState }
    });
    onSetPinnedBuilds({
      username: profile.username,
      builds: nextBuilds,
      isTopBuilds: false,
      favoriteViewerId: viewerId
    });
    setDisplayedBuilds(nextBuilds);
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
        const nextBuilds = displayedBuilds.map((build) =>
          build.id === editingBuild.id ? { ...build, ...result.build } : build
        );
        setDisplayedBuilds(nextBuilds);
        onSetPinnedBuilds({
          username: profile.username,
          builds: nextBuilds,
          isTopBuilds: cachedIsTopBuilds,
          favoriteViewerId: viewerId
        });
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to update build metadata:', error);
    } finally {
      setSavingMetadata(false);
    }
  }

  function handleBuildFavoriteChange(
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) {
    const buildId = Number(build.id) || change.buildId;
    const nextBuilds = displayedBuildsRef.current.map((displayedBuild) =>
      Number(displayedBuild.id) === buildId
        ? {
            ...displayedBuild,
            isFavorited: change.isFavorited,
            favoritedAt: change.favoritedAt
        }
        : displayedBuild
    );
    displayedBuildsRef.current = nextBuilds;
    setDisplayedBuilds(nextBuilds);
    onSetPinnedBuilds({
      username: profile.username,
      builds: nextBuilds,
      isTopBuilds: cachedIsTopBuilds,
      favoriteViewerId: viewerId
    });
  }

  function handleBuildFavoriteError(
    build: BuildProjectListItemData,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) {
    console.error(
      `Failed to update favorite for profile build ${
        Number(build.id) || params.buildId
      }:`,
      error
    );
  }
}

function normalizeBuildIds(buildIds: unknown) {
  if (!Array.isArray(buildIds)) return [];
  return buildIds
    .map((buildId) => Number(buildId))
    .filter((buildId) => Number.isFinite(buildId) && buildId > 0);
}

import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import BuildProjectListItem, {
  BuildProjectListItemData
} from '~/components/BuildProjectListItem';
import BuildForkHistoryModal from '~/components/BuildForkHistoryModal';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { useProfileState } from '~/helpers/hooks';
import BuildDescriptionModal from '~/containers/Build/BuildDescriptionModal';
import SelectPinnedBuildsModal from './SelectPinnedBuildsModal';
import { useLocation } from 'react-router-dom';

const panelTitle = 'Builds';
const defaultVisibleBuildCount = 3;
const maxPinnedProfileBuilds = 10;
const pinBuildsLabel = 'Pin Builds';
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
  const isOwnProfile =
    (myUsername && myUsername === profile.username) ||
    (Number(myId) > 0 && Number(myId) === Number(profile.id));
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
  const [loading, setLoading] = useState(true);
  const [displayedBuilds, setDisplayedBuilds] = useState<
    BuildProjectListItemData[]
  >([]);
  const [editingBuild, setEditingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    ((cachedIsTopBuilds && pinnedBuildIds.length === 0) ||
      (!cachedIsTopBuilds && cachedPinnedBuildIdsKey === pinnedBuildIdsKey));
  const shownBuilds = useMemo(() => {
    return isExpanded
      ? displayedBuilds
      : displayedBuilds.slice(0, defaultVisibleBuildCount);
  }, [displayedBuilds, isExpanded]);
  const pinnedBuildCount = cachedIsTopBuilds
    ? 0
    : pinnedBuildIds.length || displayedBuilds.length;
  const buttonLabel = `${pinBuildsLabel} (${pinnedBuildCount}/${maxPinnedProfileBuilds})`;

  useEffect(() => {
    setIsExpanded(false);
    setForkHistoryBuildId(null);
  }, [profile.id]);

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
        const nextBuilds = Array.isArray(data?.builds) ? data.builds : [];
        const isTopBuilds = Boolean(data?.isTopBuilds);
        const nextBuildIds = Array.isArray(data?.buildIds)
          ? data.buildIds
          : nextBuilds
              .map((build: BuildProjectListItemData) => Number(build?.id))
              .filter((id: number) => Number.isFinite(id) && id > 0);
        setDisplayedBuilds(nextBuilds);
        onLoadPinnedBuilds({
          username: profile.username,
          builds: nextBuilds,
          isTopBuilds
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
  }, [hasCachedPinnedBuilds, pinnedBuildIdsKey, profile.id, profile.username]);

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
        onLoadMore={() => setIsExpanded(true)}
        button={
          isOwnProfile ? (
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              onClick={() => setSelectModalShown(true)}
            >
              <Icon icon={['fas', 'thumbtack']} />
              <span style={{ marginLeft: '0.7rem' }}>{buttonLabel}</span>
            </Button>
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
            <BuildProjectListItem
              key={build.id}
              build={build}
              to={`/app/${build.id}`}
              navigationState={buildRuntimeNavigationState}
              isOwner={isOwnProfile}
              themeName={selectedTheme}
              onAddDescription={isOwnProfile ? setEditingBuild : undefined}
              onOpenForkHistory={setForkHistoryBuildId}
            />
          ))}
        </div>
      </SectionPanel>
      {selectModalShown && (
        <SelectPinnedBuildsModal
          currentlySelectedBuildIds={pinnedBuildIds}
          onHide={() => setSelectModalShown(false)}
          onSubmit={handlePinBuilds}
        />
      )}
      {editingBuild && (
        <BuildDescriptionModal
          initialTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingMetadata}
          onHide={() => (savingMetadata ? null : setEditingBuild(null))}
          onSubmit={handleSubmitMetadata}
        />
      )}
      {forkHistoryBuildId ? (
        <BuildForkHistoryModal
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
      const nextBuildIds = Array.isArray(data?.buildIds)
        ? data.buildIds
        : buildIds;
      const nextBuilds = Array.isArray(data?.builds) ? data.builds : [];
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
        isTopBuilds: false
      });
      setDisplayedBuilds(nextBuilds);
      setIsExpanded(false);
      setSelectModalShown(false);
    } catch (error) {
      console.error('Failed to pin builds on profile:', error);
    }
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
          isTopBuilds: cachedIsTopBuilds
        });
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to update build metadata:', error);
    } finally {
      setSavingMetadata(false);
    }
  }
}

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import BuildProjectListItem, {
  BuildProjectListItemData
} from '~/components/BuildProjectListItem';
import { useAppContext, useKeyContext } from '~/contexts';
import BuildDescriptionModal from '~/containers/Build/BuildDescriptionModal';
import { css } from '@emotion/css';

const panelTitle = 'Builds';
const previewLimit = 3;
const emptyOwnLabel = 'Publish a build to show it on your profile';
const emptyVisitorLabel = 'No public builds yet';

export default function Builds({
  profile,
  selectedTheme
}: {
  profile: { id: number; username: string };
  selectedTheme: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const loadUserBuilds = useAppContext((v) => v.requestHelpers.loadUserBuilds);
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const myId = useKeyContext((v) => v.myState.userId);
  const myUsername = useKeyContext((v) => v.myState.username);
  const [builds, setBuilds] = useState<BuildProjectListItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreButton, setLoadMoreButton] = useState<number | null>(null);
  const [editingBuild, setEditingBuild] = useState<BuildProjectListItemData | null>(
    null
  );
  const [savingDescription, setSavingDescription] = useState(false);
  const isOwnProfile =
    (myUsername && myUsername === profile.username) ||
    (Number(myId) > 0 && Number(myId) === Number(profile.id));
  const buildRuntimeNavigationState = {
    runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
    runtimeBackLabel: isOwnProfile
      ? 'Back to your profile'
      : `Back to ${profile.username}'s profile`
  };

  useEffect(() => {
    init();

    async function init() {
      setLoading(true);
      try {
        const data = await loadUserBuilds({
          userId: profile.id,
          limit: previewLimit
        });
        setBuilds(data?.builds || []);
        setLoadMoreButton(Number(data?.loadMoreButton) || null);
      } catch (error) {
        console.error('Failed to load profile builds:', error);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  if (!loading && !isOwnProfile && builds.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Builds">
      <SectionPanel
        elevated
        title={panelTitle}
        loaded={!loading}
        customColorTheme={selectedTheme}
        loadMoreButtonShown={!!loadMoreButton}
        onLoadMore={handleShowMore}
        isEmpty={builds.length === 0}
        emptyMessage={isOwnProfile ? emptyOwnLabel : emptyVisitorLabel}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {builds.map((build) => (
            <BuildProjectListItem
              key={build.id}
              build={build}
              to={`/app/${build.id}`}
              navigationState={buildRuntimeNavigationState}
              isOwner={isOwnProfile}
              onAddDescription={isOwnProfile ? setEditingBuild : undefined}
            />
          ))}
        </div>
      </SectionPanel>
      {editingBuild && (
        <BuildDescriptionModal
          buildTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingDescription}
          onHide={() => (savingDescription ? null : setEditingBuild(null))}
          onSubmit={handleSubmitDescription}
        />
      )}
    </ErrorBoundary>
  );

  function handleShowMore() {
    navigate(`/users/${profile.username}/builds`);
  }

  async function handleSubmitDescription(description: string) {
    if (!editingBuild || savingDescription) return;
    setSavingDescription(true);
    try {
      const result = await updateBuildMetadata({
        buildId: editingBuild.id,
        description
      });
      if (result?.success && result?.build) {
        setBuilds((prev) =>
          prev.map((build) =>
            build.id === editingBuild.id ? { ...build, ...result.build } : build
          )
        );
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to update build description:', error);
    } finally {
      setSavingDescription(false);
    }
  }
}

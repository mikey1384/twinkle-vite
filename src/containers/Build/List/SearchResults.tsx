import React from 'react';
import { css } from '@emotion/css';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import ProjectListItem, {
  type BuildProjectListItemData,
  type BuildTag
} from '~/components/Build/ProjectListItem';
import { borderRadius } from '~/constants/css';
import {
  canOpenBuildListItemRuntime,
  getCollaboratingBuildListItemTargetPath
} from './helpers';

const sectionClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  & + & {
    margin-top: 2rem;
  }
`;

const sectionTitleClass = css`
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--chat-text);
`;

const emptyStateClass = css`
  padding: 2.2rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fafbff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const emptyTitleClass = css`
  margin: 0;
  font-size: 2rem;
  color: var(--chat-text);
  font-weight: 900;
  line-height: 1.1;
`;

const emptyBodyClass = css`
  margin: 0;
  font-size: 1.25rem;
  color: var(--chat-text);
  opacity: 0.86;
  line-height: 1.5;
`;

const loadMoreWrapClass = css`
  display: flex;
  justify-content: center;
`;

export default function SearchResults({
  color,
  loadingMorePublic,
  loadingMoreTeam,
  myBuilds,
  publicBuilds,
  publicHasMore,
  runtimeBackTo,
  searching,
  searchQuery,
  teamBuilds,
  teamHasMore,
  onAddDescription,
  onDelete,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onLoadMorePublic,
  onLoadMoreTeam,
  onOpenForkHistory,
  onTagClick
}: {
  color?: string;
  loadingMorePublic: boolean;
  loadingMoreTeam: boolean;
  myBuilds: BuildProjectListItemData[];
  publicBuilds: BuildProjectListItemData[];
  publicHasMore: boolean;
  runtimeBackTo: string;
  searching: boolean;
  searchQuery: string;
  teamBuilds: BuildProjectListItemData[];
  teamHasMore: boolean;
  onAddDescription: (build: BuildProjectListItemData) => void;
  onDelete: (build: BuildProjectListItemData) => void;
  onFavoriteChange: (
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) => void;
  onFavoriteError: (
    build: BuildProjectListItemData,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onFavoriteStart: (
    build: BuildProjectListItemData,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onLoadMorePublic: () => void;
  onLoadMoreTeam: () => void;
  onOpenForkHistory: (buildId: number) => void;
  onTagClick: (tag: BuildTag) => void;
}) {
  // My-builds results may include ids that also exist in the team/public
  // sections (e.g. own public builds when excludeMine fails open); dedupe so
  // a build never appears twice in the unified view.
  const myBuildIds = new Set(myBuilds.map((build) => Number(build.id)));
  const displayedTeamBuilds = teamBuilds.filter(
    (build) => !myBuildIds.has(Number(build.id))
  );
  const teamBuildIds = new Set(
    displayedTeamBuilds.map((build) => Number(build.id))
  );
  const displayedPublicBuilds = publicBuilds.filter(
    (build) =>
      !myBuildIds.has(Number(build.id)) && !teamBuildIds.has(Number(build.id))
  );
  // A page can dedupe away entirely while the API still has more results;
  // the load-more affordance must stay reachable in that case.
  const teamSectionShown = displayedTeamBuilds.length > 0 || teamHasMore;
  const publicSectionShown = displayedPublicBuilds.length > 0 || publicHasMore;
  const hasAnyResults =
    myBuilds.length > 0 || teamSectionShown || publicSectionShown;

  if (searching && !hasAnyResults) {
    return <Loading text="Searching apps..." />;
  }

  if (!hasAnyResults) {
    return (
      <div className={emptyStateClass}>
        <h2 className={emptyTitleClass}>No Matching Apps</h2>
        <p className={emptyBodyClass}>
          Nothing matches <strong>{searchQuery}</strong>. Try another title,
          creator name, or app type.
        </p>
      </div>
    );
  }

  return (
    <div>
      {myBuilds.length > 0 ? (
        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>Your Builds</h3>
          {myBuilds.map((build) => (
            <ProjectListItem
              key={build.id}
              build={build}
              isOwner
              to={`/app/${build.id}`}
              navigationState={{
                runtimeBackTo,
                runtimeBackLabel: 'Back to Build Studio'
              }}
              showFavoriteAction
              onAddDescription={onAddDescription}
              onDelete={onDelete}
              onFavoriteChange={onFavoriteChange}
              onFavoriteError={onFavoriteError}
              onFavoriteStart={onFavoriteStart}
              onOpenForkHistory={onOpenForkHistory}
              onTagClick={onTagClick}
            />
          ))}
        </section>
      ) : null}
      {teamSectionShown ? (
        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>Team Builds</h3>
          {displayedTeamBuilds.map((build) => {
            const canOpenRuntime = canOpenBuildListItemRuntime(build);
            const navigationState = canOpenRuntime
              ? {
                  runtimeBackTo,
                  runtimeBackLabel: 'Back to Build Studio'
                }
              : { openPeoplePanel: true };
            return (
              <ProjectListItem
                key={build.id}
                build={build}
                to={getCollaboratingBuildListItemTargetPath(build)}
                navigationState={navigationState}
                primaryActionLabel="Open workspace"
                primaryActionIcon="wrench"
                primaryActionTo={`/build/${build.id}`}
                primaryActionNavigationState={{ openPeoplePanel: true }}
                showCollaborationRequestAction={false}
                showFavoriteAction
                showOpenAppAction={canOpenRuntime}
                onFavoriteChange={onFavoriteChange}
                onFavoriteError={onFavoriteError}
                onFavoriteStart={onFavoriteStart}
                onOpenForkHistory={onOpenForkHistory}
                onTagClick={onTagClick}
              />
            );
          })}
          {teamHasMore ? (
            <div className={loadMoreWrapClass}>
              <LoadMoreButton
                loading={loadingMoreTeam}
                onClick={onLoadMoreTeam}
                color={color}
              />
            </div>
          ) : null}
        </section>
      ) : null}
      {publicSectionShown ? (
        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>Community</h3>
          {displayedPublicBuilds.map((build) => (
            <ProjectListItem
              key={build.id}
              build={build}
              to={`/app/${build.id}`}
              navigationState={{
                runtimeBackTo,
                runtimeBackLabel: 'Back to Build Studio'
              }}
              updatedAtSource="publicVersion"
              showFavoriteAction
              onFavoriteChange={onFavoriteChange}
              onFavoriteError={onFavoriteError}
              onFavoriteStart={onFavoriteStart}
              onOpenForkHistory={onOpenForkHistory}
              onTagClick={onTagClick}
            />
          ))}
          {publicHasMore ? (
            <div className={loadMoreWrapClass}>
              <LoadMoreButton
                loading={loadingMorePublic}
                onClick={onLoadMorePublic}
                color={color}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

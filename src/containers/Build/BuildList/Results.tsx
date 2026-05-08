import React from 'react';
import { css } from '@emotion/css';
import type { BuildFavoriteChange } from '~/containers/Build/shared/components/FavoriteButton';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import ProjectListItem, {
  type BuildProjectListItemData
} from '~/containers/Build/shared/components/ProjectListItem';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { getBrowseEmptyCopy } from './domain';
import type { BuildListTab } from './types';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const buildGridClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  font-family: ${displayFontFamily};
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

const emptyInputWrapClass = css`
  display: flex;
  gap: 0.7rem;
  align-items: center;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.65rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const promptInputClass = css`
  flex: 1;
  min-width: 0;
  height: 48px;
  border: 1px solid rgba(65, 140, 235, 0.3);
  border-radius: 12px;
  padding: 0 0.95rem;
  font-size: 1.1rem;
  background: #fff;
  &:focus {
    outline: none;
    border-color: #418ceb;
    box-shadow: 0 0 0 2px rgba(65, 140, 235, 0.12);
  }
`;

const loadMoreWrapClass = css`
  margin-top: 1.6rem;
  display: flex;
  justify-content: center;
`;

export default function Results({
  activeTab,
  activeTabLabel,
  browseBuilds,
  browseHasMore,
  browseLoading,
  browseLoadingMore,
  builds,
  color,
  displayedMyBuilds,
  isBuildSearchActive,
  isMyBuildsTab,
  promptInput,
  searchQuery,
  creatingFromPrompt,
  runtimeBackTo,
  onAddDescription,
  onDelete,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onLoadMoreBrowseBuilds,
  onOpenForkHistory,
  onPromptInputChange,
  onStartFromPrompt
}: {
  activeTab: BuildListTab;
  activeTabLabel: string;
  browseBuilds: BuildProjectListItemData[];
  browseHasMore: boolean;
  browseLoading: boolean;
  browseLoadingMore: boolean;
  builds: BuildProjectListItemData[];
  color?: string;
  displayedMyBuilds: BuildProjectListItemData[];
  isBuildSearchActive: boolean;
  isMyBuildsTab: boolean;
  promptInput: string;
  searchQuery: string;
  creatingFromPrompt: boolean;
  runtimeBackTo: string;
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
  onLoadMoreBrowseBuilds: () => void;
  onOpenForkHistory: (buildId: number) => void;
  onPromptInputChange: (value: string) => void;
  onStartFromPrompt: () => void;
}) {
  if (isMyBuildsTab) {
    if (builds.length === 0 && !isBuildSearchActive) {
      return (
        <div className={emptyStateClass}>
          <h2 className={emptyTitleClass}>Make Your First App</h2>
          <p className={emptyBodyClass}>
            Tell AI what you want to make, like a game, quiz, or helper app. It
            will start building right away.
          </p>
          <div className={emptyInputWrapClass}>
            <input
              value={promptInput}
              onChange={(e) => onPromptInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onStartFromPrompt();
                }
              }}
              placeholder='Try: "Build a daily reflection app with streaks and friend feed"'
              className={promptInputClass}
            />
            <GameCTAButton
              variant="success"
              size="lg"
              shiny
              loading={creatingFromPrompt}
              disabled={!promptInput.trim() || creatingFromPrompt}
              onClick={onStartFromPrompt}
            >
              {creatingFromPrompt ? 'Starting...' : 'Start Building'}
            </GameCTAButton>
          </div>
        </div>
      );
    }
    if (displayedMyBuilds.length === 0) {
      return <SearchEmptyState query={searchQuery} />;
    }
    return (
      <div className={buildGridClass}>
        {displayedMyBuilds.map((build) => (
          <ProjectListItem
            key={build.id}
            build={build}
            isOwner
            onAddDescription={onAddDescription}
            onDelete={onDelete}
            showFavoriteAction
            onFavoriteChange={onFavoriteChange}
            onFavoriteError={onFavoriteError}
            onFavoriteStart={onFavoriteStart}
            onOpenForkHistory={onOpenForkHistory}
          />
        ))}
      </div>
    );
  }

  if (browseLoading) {
    return <Loading />;
  }
  if (browseBuilds.length === 0) {
    if (isBuildSearchActive) {
      return <SearchEmptyState query={searchQuery} />;
    }
    return (
      <div className={emptyStateClass}>
        <h2 className={emptyTitleClass}>No {activeTabLabel} Builds Yet</h2>
        <p className={emptyBodyClass}>{getBrowseEmptyCopy(activeTab)}</p>
      </div>
    );
  }
  return (
    <>
      <div className={buildGridClass}>
        {browseBuilds.map((build) => (
          <ProjectListItem
            key={build.id}
            build={build}
            to={activeTab === 'collaborating' ? `/build/${build.id}` : `/app/${build.id}`}
            navigationState={{
              ...(activeTab === 'collaborating'
                ? { openPeoplePanel: true }
                : {
                    runtimeBackTo,
                    runtimeBackLabel: 'Back to Build Studio'
                  })
            }}
            primaryActionLabel={
              activeTab === 'collaborating' ? 'Work together' : undefined
            }
            primaryActionIcon={activeTab === 'collaborating' ? 'users' : undefined}
            showCollaborationRequestAction={activeTab !== 'collaborating'}
            showFavoriteAction
            onFavoriteChange={onFavoriteChange}
            onFavoriteError={onFavoriteError}
            onFavoriteStart={onFavoriteStart}
            onOpenForkHistory={onOpenForkHistory}
          />
        ))}
      </div>
      {browseHasMore ? (
        <div className={loadMoreWrapClass}>
          <LoadMoreButton
            loading={browseLoadingMore}
            onClick={onLoadMoreBrowseBuilds}
            color={color}
          />
        </div>
      ) : null}
    </>
  );
}

function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className={emptyStateClass}>
      <h2 className={emptyTitleClass}>No Matching Builds</h2>
      <p className={emptyBodyClass}>
        No builds here match <strong>{query}</strong>. Try another title or
        description.
      </p>
    </div>
  );
}

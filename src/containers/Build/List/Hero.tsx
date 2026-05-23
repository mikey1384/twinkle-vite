import React from 'react';
import { css } from '@emotion/css';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import { BuildMiniCard } from '~/components/Build/Cards';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import { mobileMaxWidth } from '~/constants/css';
import type { TodayTopViewedBuild } from './types';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const heroClass = css`
  position: relative;
  padding: 2.2rem;
  border-radius: 22px;
  background: #fff;
  border: 1px solid var(--ui-border);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem;
  }
`;

const heroShellClass = css`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;
  align-items: center;

  &.has-top-app {
    grid-template-columns: minmax(0, 0.85fr) minmax(20rem, 1.15fr);
  }

  @media (max-width: ${mobileMaxWidth}) {
    &.has-top-app {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

const heroContentClass = css`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const heroBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.14);
  color: #1d4ed8;
  border: 1px solid rgba(65, 140, 235, 0.28);
  font-weight: 900;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: ${displayFontFamily};
`;

const heroTitleClass = css`
  margin: 0;
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--chat-text);
  letter-spacing: 0.02em;
  font-family: ${displayFontFamily};
  line-height: 1.1;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.3rem;
  }
`;

const heroBodyClass = css`
  margin: 0;
  font-size: 1.35rem;
  color: var(--chat-text);
  opacity: 0.86;
  max-width: 38rem;
  line-height: 1.5;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

const topViewedShowcaseClass = css`
  min-width: 0;
  padding-left: 1.6rem;
  border-left: 1px solid rgba(65, 140, 235, 0.18);

  @media (max-width: ${mobileMaxWidth}) {
    padding-left: 0;
    padding-top: 1rem;
    border-left: 0;
    border-top: 1px solid rgba(65, 140, 235, 0.18);
  }
`;

export default function Hero({
  topViewedBuild,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onNewBuild,
  onOpenTopViewedBuild
}: {
  topViewedBuild: TodayTopViewedBuild | null;
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
  onNewBuild: () => void;
  onOpenTopViewedBuild: (build: TodayTopViewedBuild) => void;
}) {
  return (
    <section className={heroClass}>
      <div
        className={`${heroShellClass}${topViewedBuild ? ' has-top-app' : ''}`}
      >
        <div className={heroContentClass}>
          <div className={heroBadgeClass}>
            <Icon icon="rocket-launch" />
            Build Studio
          </div>
          <h1 className={heroTitleClass}>Build Studio</h1>
          <p className={heroBodyClass}>
            Create apps, review requests, and find projects to join or fork.
          </p>
          <div>
            <GameCTAButton
              variant="gold"
              size="lg"
              shiny
              onClick={onNewBuild}
            >
              New Build
            </GameCTAButton>
          </div>
        </div>
        {topViewedBuild ? (
          <TodayTopViewedShowcase
            build={topViewedBuild}
            onFavoriteChange={onFavoriteChange}
            onFavoriteError={onFavoriteError}
            onFavoriteStart={onFavoriteStart}
            onOpen={onOpenTopViewedBuild}
          />
        ) : null}
      </div>
    </section>
  );
}

function TodayTopViewedShowcase({
  build,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpen
}: {
  build: TodayTopViewedBuild;
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
  onOpen: (build: TodayTopViewedBuild) => void;
}) {
  return (
    <aside className={topViewedShowcaseClass} aria-label="Trending app today">
      <BuildMiniCard
        build={build}
        showActions
        showFavoriteAction
        onFavoriteChange={onFavoriteChange}
        onFavoriteError={onFavoriteError}
        onFavoriteStart={onFavoriteStart}
        onOpen={onOpen}
      />
    </aside>
  );
}

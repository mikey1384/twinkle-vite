import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import { BuildThumbCard } from '~/components/Build/Cards';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import { mobileMaxWidth } from '~/constants/css';
import TabFilter from '../TabFilter';
import { formatQuickAccessRelativeTime } from './helpers';
import type { BuildQuickAccessMode, QuickAccessBuild } from './types';

export const QUICK_ACCESS_MODAL_PAGE_SIZE = 12;

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const quickAccessDesktopStripLimit = 5;
const quickAccessCompactStripLimit = 3;
const quickAccessCompactMaxWidth = '980px';

const buildQuickAccessTabs: Array<{
  value: BuildQuickAccessMode;
  label: string;
  icon: string;
}> = [
  { value: 'recent', label: 'Recent', icon: 'clock-rotate-left' },
  { value: 'favorites', label: 'Favorites', icon: 'star' }
];

const quickAccessSectionClass = css`
  margin: 0 0 1.6rem;
`;

const quickAccessHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;

  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const quickAccessTitleClass = css`
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--chat-text);
  font-size: 1.3rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
`;

const quickAccessFilterWrapClass = css`
  min-width: 16rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
  }
`;

const quickAccessHeaderActionsClass = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-left: auto;

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    justify-content: space-between;
  }
`;

const quickAccessMoreButtonClass = css`
  height: 2.75rem;
  padding: 0 1rem;
  border: 1px solid var(--ui-border, rgba(65, 140, 235, 0.24));
  border-radius: 999px;
  background: #fff;
  color: var(--theme-bg, #1d4ed8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.08);

  &:hover {
    background: var(--theme-hover-bg, rgba(65, 140, 235, 0.08));
    color: var(--theme-text, #fff);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-bg, #418ceb);
    outline-offset: 2px;
  }
`;

const quickAccessEmptyClass = css`
  padding: 1rem;
  border: 1px dashed var(--ui-border, rgba(65, 140, 235, 0.28));
  border-radius: 8px;
  background: rgba(248, 251, 255, 0.72);
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.72;
`;

const quickAccessCardGridClass = css`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: ${quickAccessCompactMaxWidth}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
`;

const quickAccessModalContentClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const quickAccessModalGridClass = css`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
`;

const quickAccessModalPagerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.2rem;
`;

const quickAccessPagerButtonClass = css`
  height: 2.45rem;
  padding: 0 0.85rem;
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: 8px;
  background: #fff;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: default;
    color: #94a3b8;
    background: #f8fafc;
  }
`;

const quickAccessPagerStatusClass = css`
  color: var(--chat-text);
  font-size: 1rem;
  font-weight: 900;
  opacity: 0.72;
`;

const quickAccessErrorClass = css`
  margin-top: 0.65rem;
  color: #be123c;
  font-size: 1rem;
  font-weight: 800;
`;

function getQuickAccessStripLimit() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return quickAccessDesktopStripLimit;
  }
  return window.matchMedia(`(max-width: ${quickAccessCompactMaxWidth})`).matches
    ? quickAccessCompactStripLimit
    : quickAccessDesktopStripLimit;
}

export function BuildQuickAccessStrip({
  activeMode,
  builds,
  color,
  error,
  hasMore,
  loading,
  openButtonStyle,
  onModeChange,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpenBuild,
  onShowMore
}: {
  activeMode: BuildQuickAccessMode;
  builds: QuickAccessBuild[];
  color?: string;
  error: string;
  hasMore: boolean;
  loading: boolean;
  openButtonStyle?: React.CSSProperties;
  onModeChange: (mode: BuildQuickAccessMode) => void;
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
  onOpenBuild: (build: QuickAccessBuild) => void;
  onShowMore: () => void;
}) {
  const emptyText =
    activeMode === 'favorites'
      ? 'No favorite builds yet.'
      : 'No recently used builds yet.';
  const [stripLimit, setStripLimit] = useState(getQuickAccessStripLimit);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQueryList = window.matchMedia(
      `(max-width: ${quickAccessCompactMaxWidth})`
    );
    function handleMediaQueryChange() {
      setStripLimit(
        mediaQueryList.matches
          ? quickAccessCompactStripLimit
          : quickAccessDesktopStripLimit
      );
    }
    handleMediaQueryChange();
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleMediaQueryChange);
      return () => {
        mediaQueryList.removeEventListener('change', handleMediaQueryChange);
      };
    }
    if (typeof mediaQueryList.addListener === 'function') {
      mediaQueryList.addListener(handleMediaQueryChange);
      return () => {
        mediaQueryList.removeListener(handleMediaQueryChange);
      };
    }
    mediaQueryList.onchange = handleMediaQueryChange;
    return () => {
      mediaQueryList.onchange = null;
    };
  }, []);
  const visibleBuilds = builds.slice(0, stripLimit);
  const moreButtonShown = builds.length > visibleBuilds.length || hasMore;
  return (
    <section className={quickAccessSectionClass}>
      <div className={quickAccessHeaderClass}>
        <h2 className={quickAccessTitleClass}>
          <Icon icon="bolt" />
          Quick Access
        </h2>
        <div className={quickAccessHeaderActionsClass}>
          <div className={quickAccessFilterWrapClass}>
            <TabFilter
              activeTab={activeMode}
              color={color}
              density="mini"
              onChange={onModeChange}
              tabs={buildQuickAccessTabs}
            />
          </div>
          {moreButtonShown ? (
            <button
              type="button"
              className={quickAccessMoreButtonClass}
              onClick={onShowMore}
            >
              More
              <Icon icon="chevron-right" />
            </button>
          ) : null}
        </div>
      </div>
      {loading && builds.length === 0 ? (
        <div className={quickAccessEmptyClass}>
          <Icon icon="spinner" pulse /> Loading
        </div>
      ) : builds.length === 0 ? (
        <div className={quickAccessEmptyClass}>{error || emptyText}</div>
      ) : (
        <div className={quickAccessCardGridClass}>
          {visibleBuilds.map((build) => (
            <BuildQuickAccessCard
              key={build.id}
              build={build}
              mode={activeMode}
              onFavoriteChange={onFavoriteChange}
              onFavoriteError={onFavoriteError}
              onFavoriteStart={onFavoriteStart}
              onOpen={onOpenBuild}
              openButtonStyle={openButtonStyle}
            />
          ))}
        </div>
      )}
      {error && builds.length > 0 ? (
        <div className={quickAccessErrorClass}>{error}</div>
      ) : null}
    </section>
  );
}

function BuildQuickAccessCard({
  build,
  mode,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpen,
  openButtonStyle
}: {
  build: QuickAccessBuild;
  mode: BuildQuickAccessMode;
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
  onOpen: (build: QuickAccessBuild) => void;
  openButtonStyle?: React.CSSProperties;
}) {
  const favoriteActivityAt = build.favoriteActivityAt || build.favoritedAt;
  const favoriteActivityIsUse =
    Boolean(build.favoriteActivityAt) &&
    Number(build.favoriteActivityAt || 0) > Number(build.favoritedAt || 0);
  const timestamp =
    mode === 'favorites' ? favoriteActivityAt : build.lastUsedAt;
  const timestampLabel =
    mode === 'favorites'
      ? `${favoriteActivityIsUse ? 'Used' : 'Favorited'} ${formatQuickAccessRelativeTime(
          timestamp
        )}`
      : `Used ${formatQuickAccessRelativeTime(timestamp)}`;
  return (
    <BuildThumbCard
      build={build}
      metaIcon={mode === 'favorites' && !favoriteActivityIsUse ? 'star' : 'clock'}
      metaLabel={timestampLabel}
      openButtonStyle={openButtonStyle}
      onFavoriteChange={onFavoriteChange}
      onFavoriteError={onFavoriteError}
      onFavoriteStart={onFavoriteStart}
      onOpen={onOpen}
    />
  );
}

export function BuildQuickAccessModal({
  builds,
  cursor,
  loadingMore,
  mode,
  openButtonStyle,
  page,
  onClose,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onNextPage,
  onOpenBuild,
  onPreviousPage
}: {
  builds: QuickAccessBuild[];
  cursor: string | null;
  loadingMore: boolean;
  mode: BuildQuickAccessMode;
  openButtonStyle?: React.CSSProperties;
  page: number;
  onClose: () => void;
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
  onNextPage: () => void;
  onOpenBuild: (build: QuickAccessBuild) => void;
  onPreviousPage: () => void;
}) {
  const title = mode === 'favorites' ? 'Favorite Builds' : 'Recently Used';
  const pageCount = Math.max(
    1,
    Math.ceil(builds.length / QUICK_ACCESS_MODAL_PAGE_SIZE)
  );
  const pageStart = page * QUICK_ACCESS_MODAL_PAGE_SIZE;
  const visibleBuilds = builds.slice(
    pageStart,
    pageStart + QUICK_ACCESS_MODAL_PAGE_SIZE
  );
  const canGoNext = page < pageCount - 1 || Boolean(cursor);
  return (
    <Modal
      isOpen
      modalKey="BuildQuickAccessModal"
      size="xl"
      title={title}
      onClose={onClose}
    >
      <div className={quickAccessModalContentClass}>
        {visibleBuilds.length > 0 ? (
          <div className={quickAccessModalGridClass}>
            {visibleBuilds.map((build) => (
              <BuildQuickAccessCard
                key={build.id}
                build={build}
                mode={mode}
                onFavoriteChange={onFavoriteChange}
                onFavoriteError={onFavoriteError}
                onFavoriteStart={onFavoriteStart}
                onOpen={onOpenBuild}
                openButtonStyle={openButtonStyle}
              />
            ))}
          </div>
        ) : (
          <div className={quickAccessEmptyClass}>
            {mode === 'favorites'
              ? 'No favorite builds yet.'
              : 'No recently used builds yet.'}
          </div>
        )}
        <div className={quickAccessModalPagerClass}>
          <button
            type="button"
            className={quickAccessPagerButtonClass}
            disabled={page <= 0 || loadingMore}
            onClick={onPreviousPage}
          >
            <Icon icon="chevron-left" />
            Previous
          </button>
          <span className={quickAccessPagerStatusClass}>Page {page + 1}</span>
          <button
            type="button"
            className={quickAccessPagerButtonClass}
            disabled={!canGoNext || loadingMore}
            onClick={onNextPage}
          >
            {loadingMore ? (
              <>
                <Icon icon="spinner" pulse />
                Loading
              </>
            ) : (
              <>
                Next
                <Icon icon="chevron-right" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

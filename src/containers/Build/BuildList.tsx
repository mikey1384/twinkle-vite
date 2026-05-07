import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import Icon from '~/components/Icon';
import BuildFavoriteButton, {
  type BuildFavoriteChange
} from '~/components/Buttons/BuildFavoriteButton';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import UsernameText from '~/components/Texts/UsernameText';
import BuildProjectListItem, {
  BuildProjectListItemData
} from '~/components/BuildProjectListItem';
import BuildPreviewFrame from '~/components/BuildPreviewFrame';
import BuildForkHistoryModal from '~/components/BuildForkHistoryModal';
import BuildDescriptionModal from './BuildDescriptionModal';
import BuildDeleteModal from './BuildDeleteModal';
import BuildTabFilter from './BuildTabFilter';
import BuildActivityPanel, {
  type BuildActivityItem
} from './BuildActivityPanel';
import { BUILD_TRENDING_SHOWCASE_VIEW_SOURCE } from './runtimeViewSources';
import {
  useAppContext,
  useBuildContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import {
  type BuildActivitySubtab,
  type BuildActivityTab,
  type BuildStudioActivityFeedState,
  type BuildStudioBrowseMode,
  type BuildStudioTab
} from '~/contexts/Build/reducer';
import type { User } from '~/types';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const inheritedUsernameTextStyle: React.CSSProperties = {
  color: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit'
};
const logoBlueOpenAppButtonStyle = {
  ['--build-open-app-bg' as const]: Color.logoBlue(),
  ['--build-open-app-hover-bg' as const]: Color.darkBlue(),
  ['--build-open-app-border' as const]: Color.darkBlue(0.82),
  ['--build-open-app-focus' as const]: Color.logoBlue(0.9)
} as React.CSSProperties;

type BuildListTab = BuildStudioTab;
type BuildBrowseTab = Exclude<BuildListTab, 'mine'>;
type PublicBuildScope = 'all' | 'open_source';
type PublicBuildSort = 'recent' | 'popular' | 'forks';
type TodayTopViewedBuild = BuildProjectListItemData & {
  todayViewCount?: number;
  todayFavoriteCount?: number;
  todayTrendingWeight?: number;
};
type BuildQuickAccessMode = 'recent' | 'favorites';
type QuickAccessBuild = BuildProjectListItemData & {
  favoritedAt?: number | null;
  isFavorited?: boolean;
  lastUsedAt?: number | null;
};
interface BuildActivityPosition {
  timeStamp: number;
  sourceRank: number;
  sortId: number;
}
const buildActivityRailBreakpoint = '1180px';
const buildActivityRailWidth = '30rem';
const buildActivityCacheFreshMs = 60 * 1000;
const quickAccessDesktopStripLimit = 5;
const quickAccessCompactStripLimit = 3;
const quickAccessCompactMaxWidth = '980px';
const quickAccessModalPageSize = 12;
const buildPageTopGap = '2rem';
const desktopHeaderHeight = '4.5rem';
const buildActivityPanelInitialViewportTop = `calc(
  ${desktopHeaderHeight} + ${buildPageTopGap}
)`;
const mobileBottomNavClearance =
  'calc(var(--mobile-nav-height, 7rem) + env(safe-area-inset-bottom, 0px) + 2rem)';

const buildListTabs: Array<{
  value: BuildListTab;
  label: string;
  icon: string;
}> = [
  { value: 'mine', label: 'My Builds', icon: 'rocket-launch' },
  { value: 'collaborating', label: 'Team Builds', icon: 'users' },
  { value: 'community', label: 'Community', icon: 'users' },
  { value: 'open_source', label: 'Open Source', icon: 'code-branch' }
];

const buildBrowseTabs: BuildBrowseTab[] = [
  'collaborating',
  'community',
  'open_source'
];

const buildBrowseModeTabs: Array<{
  value: BuildStudioBrowseMode;
  label: string;
  icon: string;
}> = [
  { value: 'recent', label: 'Recent', icon: 'clock' },
  { value: 'leaderboard', label: 'Leaderboard', icon: 'trophy' }
];

const buildQuickAccessTabs: Array<{
  value: BuildQuickAccessMode;
  label: string;
  icon: string;
}> = [
  { value: 'recent', label: 'Recent', icon: 'clock-rotate-left' },
  { value: 'favorites', label: 'Favorites', icon: 'star' }
];

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

const buildActivityRailClass = css`
  --build-activity-rail-top: ${buildPageTopGap};
  --build-activity-panel-top-offset: ${buildActivityPanelInitialViewportTop};
  --build-activity-rail-bottom-gap: ${buildPageTopGap};
  position: sticky;
  top: var(--build-activity-rail-top);
  width: 100%;
  z-index: 12;

  @media (max-width: ${buildActivityRailBreakpoint}) {
    display: none;
  }
`;

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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
  gap: 1.2rem;
  align-items: center;
  padding-left: 1.6rem;
  border-left: 1px solid rgba(65, 140, 235, 0.18);

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 0.82fr) minmax(8.5rem, 1.18fr);
    gap: 0.85rem;
    padding-left: 0;
    padding-top: 1rem;
    border-left: 0;
    border-top: 1px solid rgba(65, 140, 235, 0.18);
  }
`;

const topViewedCopyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;

const topViewedKickerClass = css`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.45rem;
  padding: 0.36rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 213, 100, 0.22);
  border: 1px solid rgba(245, 190, 70, 0.55);
  color: #9a5c00;
  font-size: 1.1rem;
  font-weight: 900;
  font-family: ${displayFontFamily};

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.32rem 0.58rem;
    font-size: 1rem;
  }
`;

const topViewedTitleClass = css`
  margin: 0;
  color: var(--chat-text);
  font-size: 1.65rem;
  font-weight: 900;
  line-height: 1.1;
  font-family: ${displayFontFamily};
  overflow-wrap: anywhere;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

const topViewedMetaClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 0.9rem;
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.76;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
  }
`;

const topViewedActionRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const topViewedPreviewClass = css`
  width: 100%;
  aspect-ratio: 16 / 10;
  min-height: 11rem;

  @media (max-width: ${mobileMaxWidth}) {
    aspect-ratio: 16 / 9;
    min-height: 0;
  }
`;

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

const quickAccessCardClass = css`
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ui-border, rgba(65, 140, 235, 0.24));
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;

  @media (max-width: 620px) {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.07);
  }
`;

const quickAccessCardPreviewButtonClass = css`
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--theme-bg, #418ceb);
    outline-offset: -2px;
  }
`;

const quickAccessCardPreviewClass = css`
  width: 100%;
  aspect-ratio: 16 / 10;
  min-height: 0;
  border: 0;
  border-radius: 0;

  @media (max-width: 620px) {
    aspect-ratio: 16 / 8;
  }
`;

const quickAccessCardBodyClass = css`
  min-width: 0;
  padding: 0.7rem 0.75rem 0.78rem;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;

  @media (max-width: 620px) {
    padding: 0.45rem 0.5rem 0.5rem;
    gap: 0.25rem;
  }
`;

const quickAccessCardTitleButtonClass = css`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--chat-text);
  cursor: pointer;
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  text-align: left;
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.15;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  @media (max-width: 620px) {
    font-size: 1.2rem;
    -webkit-line-clamp: 1;
  }

  &:hover {
    color: var(--theme-bg, #1d4ed8);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-bg, #418ceb);
    outline-offset: 2px;
  }
`;

const quickAccessCardMetaClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.74;

  @media (max-width: 620px) {
    gap: 0.15rem;
  }

  span {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const quickAccessCardFooterClass = css`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  @media (max-width: 620px) {
    gap: 0.25rem;
  }
`;

const quickAccessCardOpenButtonClass = css`
  height: 2.1rem;
  min-width: 0;
  padding: 0 0.62rem;
  border: 1px solid
    var(--build-open-app-border, var(--ui-border, rgba(65, 140, 235, 0.32)));
  border-radius: 7px;
  background: var(--build-open-app-bg, var(--theme-bg, #418ceb));
  color: var(--theme-text, #fff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;

  @media (max-width: 620px) {
    width: 2.1rem;
    padding: 0;
  }

  &:hover {
    background: var(--build-open-app-hover-bg, var(--theme-hover-bg, #1d4ed8));
  }

  &:focus-visible {
    outline: 2px solid var(--build-open-app-focus, var(--theme-bg, #93c5fd));
    outline-offset: 2px;
  }
`;

const quickAccessCardOpenTextClass = css`
  @media (max-width: 620px) {
    display: none;
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

const buildGridClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const browseModeFilterWrapClass = css`
  margin-bottom: 1rem;
`;

const buildSearchWrapClass = css`
  margin: 0 0 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const buildSearchFieldClass = css`
  position: relative;
  flex: 1;
  min-width: 0;
  color: var(--chat-text);

  > svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #418ceb;
    font-size: 1.2rem;
    pointer-events: none;
  }
`;

const buildSearchInputClass = css`
  width: 100%;
  height: 3.45rem;
  box-sizing: border-box;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: var(--chat-text);
  font-size: 1.15rem;
  font-weight: 700;
  padding: 0 3rem 0 3rem;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &::placeholder {
    color: rgba(55, 65, 81, 0.55);
    font-weight: 700;
  }

  &:focus {
    border-color: #418ceb;
    box-shadow: 0 0 0 3px rgba(65, 140, 235, 0.14);
  }
`;

const buildSearchClearButtonClass = css`
  position: absolute;
  right: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(55, 65, 81, 0.08);
  color: rgba(31, 41, 55, 0.76);
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;

  &:hover,
  &:focus-visible {
    background: rgba(65, 140, 235, 0.16);
    color: #1d4ed8;
    outline: none;
  }
`;

const requestQueueClass = css`
  margin: -0.8rem 0 1.4rem;
  padding: 1rem;
  border-radius: ${borderRadius};
  border: 1px solid rgba(236, 72, 153, 0.22);
  background: #fff7fb;
  box-shadow: 0 4px 14px rgba(190, 24, 93, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const requestQueueHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const requestQueueTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--chat-text);
  font-size: 1.25rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
`;

const requestQueueCountClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  background: rgba(236, 72, 153, 0.12);
  border: 1px solid rgba(236, 72, 153, 0.28);
  color: #be185d;
  font-size: 1.1rem;
  font-weight: 900;
`;

const requestQueueRowsClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const requestQueueRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(236, 72, 153, 0.16);
  background: rgba(255, 255, 255, 0.78);
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const requestQueueBuildClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const requestQueueBuildTitleClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const requestQueueMetaClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 1.1rem;
  font-weight: 700;
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

const loadMoreWrapClass = css`
  margin-top: 1.6rem;
  display: flex;
  justify-content: center;
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
  const loadBuildActivity = useAppContext(
    (v) => v.requestHelpers.loadBuildActivity
  );
  const updateBuildActivityViewed = useAppContext(
    (v) => v.requestHelpers.updateBuildActivityViewed
  );
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
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const onChangeBuildQuickAccessMode = useAppContext(
    (v) => v.user.actions.onChangeBuildQuickAccessMode
  );
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
  const onSetBuildStudioActivityFilter = useBuildContext(
    (v) => v.actions.onSetBuildStudioActivityFilter
  );
  const onSetBuildStudioActivityItems = useBuildContext(
    (v) => v.actions.onSetBuildStudioActivityItems
  );
  const onAppendBuildStudioActivityItems = useBuildContext(
    (v) => v.actions.onAppendBuildStudioActivityItems
  );
  const onSetBuildStudioActivityViewed = useBuildContext(
    (v) => v.actions.onSetBuildStudioActivityViewed
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
  const quickAccessMode = normalizeBuildQuickAccessMode(buildQuickAccessMode);
  const [buildSearchInput, setBuildSearchInput] = useState('');
  const [buildSearchQuery, setBuildSearchQuery] = useState('');
  const buildActivityActiveTab = normalizeBuildActivityTab(
    buildStudio?.activityPanel?.activeTab
  );
  const rawBuildActivityActiveSubtab = normalizeBuildActivitySubtab(
    buildStudio?.activityPanel?.activeSubtab
  );
  const buildActivityActiveSubtab = getBuildActivityFeedSubtab(
    buildActivityActiveTab,
    rawBuildActivityActiveSubtab
  );
  const activeBuildActivityFeedState = getBuildActivityFeedState({
    buildStudio,
    activeTab: buildActivityActiveTab,
    activeSubtab: buildActivityActiveSubtab
  });
  const buildActivityLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    activeBuildActivityFeedState.userId === normalizedUserId &&
    activeBuildActivityFeedState.loaded
  );
  const buildActivityCacheFreshForCurrentUser = Boolean(
    buildActivityLoadedForCurrentUser &&
    Date.now() - Number(activeBuildActivityFeedState.loadedAt || 0) <
      buildActivityCacheFreshMs
  );
  const buildActivityItems = buildActivityLoadedForCurrentUser
    ? ((activeBuildActivityFeedState.activities || []) as BuildActivityItem[])
    : [];
  const buildActivityCursor = buildActivityLoadedForCurrentUser
    ? activeBuildActivityFeedState.loadMoreToken
    : null;
  const allBuildActivityFeedState = getBuildActivityFeedState({
    buildStudio,
    activeTab: 'all',
    activeSubtab: 'all'
  });
  const allBuildActivityLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    allBuildActivityFeedState.userId === normalizedUserId &&
    allBuildActivityFeedState.loaded
  );
  const allBuildActivityItems = allBuildActivityLoadedForCurrentUser
    ? ((allBuildActivityFeedState.activities || []) as BuildActivityItem[])
    : [];
  const allBuildActivityLatestPosition = getBuildActivityLatestPosition(
    allBuildActivityItems
  );
  const allBuildActivityLastViewedPosition =
    allBuildActivityLoadedForCurrentUser
      ? getBuildActivityViewedPosition(allBuildActivityFeedState)
      : getEmptyBuildActivityPosition();
  const allBuildActivityCacheFreshForCurrentUser = Boolean(
    allBuildActivityLoadedForCurrentUser &&
    Date.now() - Number(allBuildActivityFeedState.loadedAt || 0) <
      buildActivityCacheFreshMs
  );
  const hasNewBuildActivity =
    compareBuildActivityPositions(
      allBuildActivityLatestPosition,
      allBuildActivityLastViewedPosition
    ) > 0;
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
  const [buildActivityLoading, setBuildActivityLoading] = useState(false);
  const [buildActivityLoadingMore, setBuildActivityLoadingMore] =
    useState(false);
  const [buildActivitySilentRefreshing, setBuildActivitySilentRefreshing] =
    useState(false);
  const [buildActivityError, setBuildActivityError] = useState('');
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
  const [quickAccessLoading, setQuickAccessLoading] = useState(false);
  const [quickAccessLoadingMore, setQuickAccessLoadingMore] = useState(false);
  const [quickAccessError, setQuickAccessError] = useState('');
  const [quickAccessModalMode, setQuickAccessModalMode] =
    useState<BuildQuickAccessMode | null>(null);
  const [quickAccessModalPage, setQuickAccessModalPage] = useState(0);
  const buildActivityLoadRef = useRef(0);
  const allBuildActivityLoadRef = useRef(0);
  const quickAccessLoadRef = useRef(0);
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
  const activeQuickAccessBuilds =
    quickAccessMode === 'favorites' ? favoriteBuilds : recentlyUsedBuilds;
  const activeQuickAccessCursor =
    quickAccessMode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
  const quickAccessModalBuilds =
    quickAccessModalMode === 'favorites' ? favoriteBuilds : recentlyUsedBuilds;
  const quickAccessModalCursor =
    quickAccessModalMode === 'favorites'
      ? favoriteBuildsCursor
      : recentlyUsedCursor;
  const quickAccessOpenButtonStyle =
    profileTheme === 'gold' ? logoBlueOpenAppButtonStyle : undefined;

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
      } catch (error) {
        console.error('Failed to load today top viewed build:', error);
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
    setQuickAccessModalMode(null);
    setQuickAccessModalPage(0);
    setQuickAccessLoading(false);
    setQuickAccessLoadingMore(false);
    setQuickAccessError('');
    if (!normalizedUserId) {
      return;
    }
    void loadBuildQuickAccess();

    return () => {
      quickAccessLoadRef.current += 1;
    };
    // loadRecentlyUsedBuilds and loadFavoriteBuilds are stable request helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId]);

  useEffect(() => {
    if (!quickAccessModalMode) return;
    const pageCount = Math.max(
      1,
      Math.ceil(quickAccessModalBuilds.length / quickAccessModalPageSize)
    );
    setQuickAccessModalPage((page) => Math.min(page, pageCount - 1));
  }, [quickAccessModalBuilds.length, quickAccessModalMode]);

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
    if (!normalizedUserId) {
      setBuildActivityLoading(false);
      setBuildActivityLoadingMore(false);
      setBuildActivitySilentRefreshing(false);
      setBuildActivityError('');
      onSetBuildStudioActivityFilter({
        activityTab: 'all',
        activitySubtab: 'all'
      });
      return;
    }
    if (buildActivityCacheFreshForCurrentUser) {
      setBuildActivityLoading(false);
      setBuildActivityLoadingMore(false);
      setBuildActivitySilentRefreshing(false);
      setBuildActivityError('');
      return;
    }
    void loadBuildActivityItems({
      showError: !buildActivityLoadedForCurrentUser,
      showLoading: !buildActivityLoadedForCurrentUser,
      subtab: buildActivityActiveSubtab,
      tab: buildActivityActiveTab
    });

    return () => {
      buildActivityLoadRef.current += 1;
    };
    // loadBuildActivity is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    buildActivityActiveTab,
    buildActivityActiveSubtab,
    buildActivityLoadedForCurrentUser,
    buildActivityCacheFreshForCurrentUser
  ]);

  useEffect(() => {
    if (!normalizedUserId || buildActivityActiveTab === 'all') return;
    if (allBuildActivityCacheFreshForCurrentUser) return;
    void loadAllBuildActivityItems();

    return () => {
      allBuildActivityLoadRef.current += 1;
    };
    // loadBuildActivity is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    buildActivityActiveTab,
    allBuildActivityCacheFreshForCurrentUser
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

          <section className={heroClass}>
            <div
              className={`${heroShellClass}${
                todayTopViewedBuild ? ' has-top-app' : ''
              }`}
            >
              <div className={heroContentClass}>
                <div className={heroBadgeClass}>
                  <Icon icon="rocket-launch" />
                  Build Studio
                </div>
                <h1 className={heroTitleClass}>Build Studio</h1>
                <p className={heroBodyClass}>
                  Create apps, review requests, and find projects to join or
                  fork.
                </p>
                <div>
                  <GameCTAButton
                    variant="gold"
                    size="lg"
                    shiny
                    onClick={() => navigate('/build/new')}
                  >
                    New Build
                  </GameCTAButton>
                </div>
              </div>
              {todayTopViewedBuild ? (
                <TodayTopViewedShowcase
                  build={todayTopViewedBuild}
                  onFavoriteChange={handleBuildFavoriteChange}
                  onFavoriteError={handleBuildFavoriteError}
                  onFavoriteStart={handleBuildFavoriteStart}
                  onOpen={handleOpenTodayTopViewedBuild}
                />
              ) : null}
            </div>
          </section>

          <BuildTabFilter
            activeTab={activeTab}
            color={profileTheme}
            onChange={handleTabChange}
            tabs={visibleBuildListTabs}
          />

          {isPublicBrowseTab(activeTab) ? (
            <div className={browseModeFilterWrapClass}>
              <BuildTabFilter
                activeTab={activeBrowseMode}
                color={profileTheme}
                density="compact"
                onChange={handleBrowseModeChange}
                tabs={buildBrowseModeTabs}
              />
            </div>
          ) : null}

          <div className={buildSearchWrapClass}>
            <label className={buildSearchFieldClass}>
              <Icon icon="search" />
              <input
                aria-label="Search builds"
                className={buildSearchInputClass}
                value={buildSearchInput}
                onChange={(event) => setBuildSearchInput(event.target.value)}
                placeholder="Search builds"
              />
              {buildSearchInput ? (
                <button
                  type="button"
                  className={buildSearchClearButtonClass}
                  aria-label="Clear build search"
                  onClick={() => {
                    setBuildSearchInput('');
                    setBuildSearchQuery('');
                  }}
                >
                  <Icon icon="times" />
                </button>
              ) : null}
            </label>
          </div>

          <BuildActivityPanel
            activeSubtab={buildActivityActiveSubtab}
            activeTab={buildActivityActiveTab}
            activities={buildActivityItems}
            color={profileTheme}
            currentUserId={normalizedUserId || 0}
            error={buildActivityError}
            hasNewActivity={hasNewBuildActivity}
            hasMore={Boolean(buildActivityCursor)}
            loading={buildActivityLoading}
            loadingMore={buildActivityLoadingMore}
            onLoadMore={handleLoadMoreBuildActivity}
            onMobileOpen={handleBuildActivityMobileOpen}
            onRefresh={handleRefreshBuildActivity}
            onSubtabChange={handleBuildActivitySubtabChange}
            onTabChange={handleBuildActivityTabChange}
            variant="mobile"
          />

          {isMyBuildsTab && totalPendingCollaborationRequests > 0 ? (
            <section className={requestQueueClass}>
              <div className={requestQueueHeaderClass}>
                <div className={requestQueueTitleClass}>
                  <Icon icon="comments" />
                  Join requests
                </div>
                <div className={requestQueueCountClass}>
                  <Icon icon="exclamation-circle" />
                  {totalPendingCollaborationRequests === 1
                    ? '1 pending'
                    : `${totalPendingCollaborationRequests} pending`}
                </div>
              </div>
              <div className={requestQueueRowsClass}>
                {buildsWithPendingRequests.map((build) => {
                  const requestCount = Number(
                    build.pendingCollaborationRequestCount || 0
                  );
                  return (
                    <div key={build.id} className={requestQueueRowClass}>
                      <div className={requestQueueBuildClass}>
                        <div className={requestQueueBuildTitleClass}>
                          {build.title || 'Untitled Build'}
                        </div>
                        <div className={requestQueueMetaClass}>
                          {requestCount === 1
                            ? '1 person asked to join'
                            : `${requestCount} people asked to join`}
                        </div>
                      </div>
                      <GameCTAButton
                        variant="pink"
                        size="sm"
                        icon="comments"
                        onClick={() => handleOpenBuildRequests(build)}
                      >
                        Review
                      </GameCTAButton>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {isMyBuildsTab ? (
            builds.length === 0 && !isBuildSearchActive ? (
              <div className={emptyStateClass}>
                <h2 className={emptyTitleClass}>Make Your First App</h2>
                <p className={emptyBodyClass}>
                  Tell AI what you want to make, like a game, quiz, or helper
                  app. It will start building right away.
                </p>
                <div className={emptyInputWrapClass}>
                  <input
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleStartFromPrompt();
                      }
                    }}
                    placeholder='Try: "Build a daily reflection app with streaks and friend feed"'
                    className={css`
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
                    `}
                  />
                  <GameCTAButton
                    variant="success"
                    size="lg"
                    shiny
                    loading={creatingFromPrompt}
                    disabled={!promptInput.trim() || creatingFromPrompt}
                    onClick={handleStartFromPrompt}
                  >
                    {creatingFromPrompt ? 'Starting...' : 'Start Building'}
                  </GameCTAButton>
                </div>
              </div>
            ) : displayedMyBuilds.length === 0 ? (
              <BuildSearchEmptyState query={buildSearchQuery} />
            ) : (
              <div className={buildGridClass}>
                {displayedMyBuilds.map((build) => (
                  <BuildProjectListItem
                    key={build.id}
                    build={build}
                    isOwner
                    onAddDescription={setEditingBuild}
                    onDelete={setDeletingBuild}
                    showFavoriteAction
                    onFavoriteChange={handleBuildFavoriteChange}
                    onFavoriteError={handleBuildFavoriteError}
                    onFavoriteStart={handleBuildFavoriteStart}
                    onOpenForkHistory={setForkHistoryBuildId}
                  />
                ))}
              </div>
            )
          ) : browseLoading ? (
            <Loading />
          ) : browseBuilds.length === 0 ? (
            isBuildSearchActive ? (
              <BuildSearchEmptyState query={buildSearchQuery} />
            ) : (
              <div className={emptyStateClass}>
                <h2 className={emptyTitleClass}>
                  No {activeTabConfig.label} Builds Yet
                </h2>
                <p className={emptyBodyClass}>
                  {getBrowseEmptyCopy(activeTab)}
                </p>
              </div>
            )
          ) : (
            <>
              <div className={buildGridClass}>
                {browseBuilds.map((build) => (
                  <BuildProjectListItem
                    key={build.id}
                    build={build}
                    to={
                      activeTab === 'collaborating'
                        ? `/build/${build.id}`
                        : `/app/${build.id}`
                    }
                    navigationState={{
                      ...(activeTab === 'collaborating'
                        ? { openPeoplePanel: true }
                        : {
                            runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
                            runtimeBackLabel: 'Back to Build Studio'
                          })
                    }}
                    primaryActionLabel={
                      activeTab === 'collaborating'
                        ? 'Work together'
                        : undefined
                    }
                    primaryActionIcon={
                      activeTab === 'collaborating' ? 'users' : undefined
                    }
                    showCollaborationRequestAction={
                      activeTab !== 'collaborating'
                    }
                    showFavoriteAction
                    onFavoriteChange={handleBuildFavoriteChange}
                    onFavoriteError={handleBuildFavoriteError}
                    onFavoriteStart={handleBuildFavoriteStart}
                    onOpenForkHistory={setForkHistoryBuildId}
                  />
                ))}
              </div>
              {browseLoadMoreButton ? (
                <div className={loadMoreWrapClass}>
                  <LoadMoreButton
                    loading={browseLoadingMore}
                    onClick={handleLoadMoreBrowseBuilds}
                    color={profileTheme}
                  />
                </div>
              ) : null}
            </>
          )}
        </main>
        <aside className={buildActivityRailClass}>
          <BuildActivityPanel
            activeSubtab={buildActivityActiveSubtab}
            activeTab={buildActivityActiveTab}
            activities={buildActivityItems}
            color={profileTheme}
            currentUserId={normalizedUserId || 0}
            error={buildActivityError}
            hasMore={Boolean(buildActivityCursor)}
            loading={buildActivityLoading}
            loadingMore={buildActivityLoadingMore}
            onLoadMore={handleLoadMoreBuildActivity}
            onRefresh={handleRefreshBuildActivity}
            onSubtabChange={handleBuildActivitySubtabChange}
            onTabChange={handleBuildActivityTabChange}
            variant="rail"
          />
        </aside>
      </div>
      {editingBuild && (
        <BuildDescriptionModal
          initialTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingMetadata}
          onHide={() => (savingMetadata ? null : setEditingBuild(null))}
          onSubmit={handleSubmitMetadata}
        />
      )}
      {deletingBuild && (
        <BuildDeleteModal
          buildTitle={deletingBuild.title}
          loading={deleting}
          onHide={() => (deleting ? null : setDeletingBuild(null))}
          onSubmit={handleDeleteBuild}
        />
      )}
      {forkHistoryBuildId ? (
        <BuildForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={() => setForkHistoryBuildId(null)}
        />
      ) : null}
      {quickAccessModalMode ? (
        <BuildQuickAccessModal
          builds={quickAccessModalBuilds}
          cursor={quickAccessModalCursor}
          loadingMore={quickAccessLoadingMore}
          mode={quickAccessModalMode}
          openButtonStyle={quickAccessOpenButtonStyle}
          page={quickAccessModalPage}
          onClose={handleCloseQuickAccessModal}
          onNextPage={handleNextQuickAccessModalPage}
          onOpenBuild={handleOpenQuickAccessBuild}
          onPreviousPage={handlePreviousQuickAccessModalPage}
          onFavoriteChange={handleBuildFavoriteChange}
          onFavoriteError={handleBuildFavoriteError}
          onFavoriteStart={handleBuildFavoriteStart}
        />
      ) : null}
    </div>
  );

  async function loadBuildQuickAccess({ showLoading = true } = {}) {
    if (!normalizedUserId) return;
    const loadId = quickAccessLoadRef.current + 1;
    quickAccessLoadRef.current = loadId;
    if (showLoading) {
      setQuickAccessLoading(true);
    }
    setQuickAccessError('');
    try {
      const [recentResult, favoriteResult] = await Promise.all([
        loadRecentlyUsedBuilds({ limit: quickAccessModalPageSize }),
        loadFavoriteBuilds({ limit: quickAccessModalPageSize })
      ]);
      if (quickAccessLoadRef.current !== loadId) return;
      setRecentlyUsedBuilds(normalizeQuickAccessBuilds(recentResult?.builds));
      setFavoriteBuilds(normalizeQuickAccessBuilds(favoriteResult?.builds));
      setRecentlyUsedCursor(normalizeQuickAccessCursor(recentResult?.cursor));
      setFavoriteBuildsCursor(
        normalizeQuickAccessCursor(favoriteResult?.cursor)
      );
    } catch (error: any) {
      console.error('Failed to load build quick access:', error);
      if (quickAccessLoadRef.current === loadId) {
        setQuickAccessError(
          error?.response?.data?.error ||
            error?.message ||
            'Quick access could not load.'
        );
      }
    } finally {
      if (quickAccessLoadRef.current === loadId) {
        setQuickAccessLoading(false);
      }
    }
  }

  function handleOpenQuickAccessBuild(build: QuickAccessBuild) {
    const buildId = Number(build.id || 0);
    if (!buildId) return;
    navigate(`/app/${buildId}`, {
      state: {
        runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
        runtimeBackLabel: 'Back to Build Studio'
      }
    });
  }

  function handleShowMoreQuickAccess() {
    setQuickAccessModalMode(quickAccessMode);
    setQuickAccessModalPage(0);
  }

  function handleCloseQuickAccessModal() {
    setQuickAccessModalMode(null);
    setQuickAccessModalPage(0);
  }

  function handlePreviousQuickAccessModalPage() {
    setQuickAccessModalPage((page) => Math.max(0, page - 1));
  }

  function handleNextQuickAccessModalPage() {
    if (!quickAccessModalMode) return;
    const nextPageStart = (quickAccessModalPage + 1) * quickAccessModalPageSize;
    if (nextPageStart < quickAccessModalBuilds.length) {
      setQuickAccessModalPage((page) => page + 1);
      return;
    }
    if (!quickAccessModalCursor || quickAccessLoadingMore) return;
    void loadMoreQuickAccessBuilds(quickAccessModalMode);
  }

  async function loadMoreQuickAccessBuilds(mode: BuildQuickAccessMode) {
    const cursor =
      mode === 'favorites' ? favoriteBuildsCursor : recentlyUsedCursor;
    if (!cursor) return;
    setQuickAccessLoadingMore(true);
    setQuickAccessError('');
    try {
      const result =
        mode === 'favorites'
          ? await loadFavoriteBuilds({
              cursor,
              limit: quickAccessModalPageSize
            })
          : await loadRecentlyUsedBuilds({
              cursor,
              limit: quickAccessModalPageSize
            });
      const nextBuilds = normalizeQuickAccessBuilds(result?.builds);
      appendQuickAccessBuilds(mode, nextBuilds);
      setQuickAccessCursor(mode, normalizeQuickAccessCursor(result?.cursor));
      if (nextBuilds.length > 0) {
        setQuickAccessModalPage((page) => page + 1);
      }
    } catch (error: any) {
      console.error('Failed to load more quick access builds:', error);
      setQuickAccessError(
        error?.response?.data?.error ||
          error?.message ||
          'More quick access builds could not load.'
      );
    } finally {
      setQuickAccessLoadingMore(false);
    }
  }

  function appendQuickAccessBuilds(
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

  function setQuickAccessCursor(
    mode: BuildQuickAccessMode,
    cursor: string | null
  ) {
    if (mode === 'favorites') {
      setFavoriteBuildsCursor(cursor);
      return;
    }
    setRecentlyUsedCursor(cursor);
  }

  function handleBuildFavoriteStart() {
    setQuickAccessError('');
  }

  function handleBuildFavoriteChange(
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) {
    patchBuildFavoriteState({
      build,
      buildId: change.buildId,
      favoritedAt: change.favoritedAt,
      isFavorited: change.isFavorited
    });
  }

  function handleBuildFavoriteError(
    _build: BuildProjectListItemData,
    error: any
  ) {
    console.error('Failed to update build favorite:', error);
    setQuickAccessError(
      error?.response?.data?.error ||
        error?.message ||
        'Favorite could not be updated.'
    );
    void loadBuildQuickAccess({ showLoading: false });
  }

  function patchBuildFavoriteState({
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

  async function loadBuildActivityItems({
    showError = true,
    showLoading = true,
    subtab = buildActivityActiveSubtab,
    tab = buildActivityActiveTab
  }: {
    showError?: boolean;
    showLoading?: boolean;
    subtab?: BuildActivitySubtab;
    tab?: BuildActivityTab;
  } = {}) {
    if (!normalizedUserId) return;
    const loadId = buildActivityLoadRef.current + 1;
    buildActivityLoadRef.current = loadId;
    setBuildActivityLoading(showLoading);
    setBuildActivityLoadingMore(false);
    setBuildActivitySilentRefreshing(!showLoading);
    if (showError) setBuildActivityError('');
    try {
      const data = await loadBuildActivity({
        kind: getBuildActivityRequestKind(tab, subtab),
        limit: 12,
        scope: tab
      });
      if (buildActivityLoadRef.current === loadId) {
        const activities = Array.isArray(data?.activities)
          ? data.activities
          : [];
        onSetBuildStudioActivityItems({
          activities,
          activityLoadedAt: Date.now(),
          activitySubtab: getBuildActivityFeedSubtab(tab, subtab),
          activityTab: tab,
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
        if (tab === 'all') {
          void markBuildActivityPositionViewed(
            getBuildActivityLatestPosition(activities as BuildActivityItem[])
          );
        }
        setBuildActivityError('');
      }
    } catch (error: any) {
      console.error('Failed to load build activity:', error);
      if (buildActivityLoadRef.current === loadId && showError) {
        setBuildActivityError(
          error?.response?.data?.error ||
            error?.message ||
            'Build activity could not load.'
        );
      }
    } finally {
      if (buildActivityLoadRef.current === loadId) {
        setBuildActivityLoading(false);
        setBuildActivitySilentRefreshing(false);
      }
    }
  }

  async function loadAllBuildActivityItems() {
    if (!normalizedUserId) return;
    const loadId = allBuildActivityLoadRef.current + 1;
    allBuildActivityLoadRef.current = loadId;
    try {
      const data = await loadBuildActivity({
        kind: 'all',
        limit: 12,
        scope: 'all'
      });
      if (allBuildActivityLoadRef.current === loadId) {
        onSetBuildStudioActivityItems({
          activities: data?.activities || [],
          activityLoadedAt: Date.now(),
          activitySubtab: 'all',
          activityTab: 'all',
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
      }
    } catch (error) {
      console.error('Failed to load all build activity:', error);
    }
  }

  function handleRefreshBuildActivity() {
    void loadBuildActivityItems({
      showError: true,
      showLoading: true
    });
  }

  async function markBuildActivityPositionViewed(
    position: BuildActivityPosition
  ) {
    if (!normalizedUserId || !isValidBuildActivityPosition(position)) {
      return;
    }
    try {
      const data = await updateBuildActivityViewed({
        lastViewedAllActivityAt: position.timeStamp,
        lastViewedAllActivitySourceRank: position.sourceRank,
        lastViewedAllActivitySortId: position.sortId
      });
      onSetBuildStudioActivityViewed({
        lastViewedAllActivityAt:
          data?.lastViewedAllActivityAt || position.timeStamp,
        lastViewedAllActivitySourceRank:
          data?.lastViewedAllActivitySourceRank || position.sourceRank,
        lastViewedAllActivitySortId:
          data?.lastViewedAllActivitySortId || position.sortId,
        userId: normalizedUserId
      });
    } catch (error) {
      console.error('Failed to mark build activity viewed:', error);
    }
  }

  async function markBuildActivityViewed() {
    return markBuildActivityPositionViewed(allBuildActivityLatestPosition);
  }

  function handleBuildActivityMobileOpen() {
    if (hasNewBuildActivity && buildActivityActiveTab !== 'all') {
      onSetBuildStudioActivityFilter({
        activityTab: 'all',
        activitySubtab: 'all'
      });
    }
    void markBuildActivityViewed();
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

  function handleBuildActivityTabChange(tab: BuildActivityTab) {
    if (tab === 'all') {
      void markBuildActivityViewed();
    }
    if (tab !== buildActivityActiveTab) {
      onSetBuildStudioActivityFilter({
        activityTab: tab,
        activitySubtab: getBuildActivityFeedSubtab(
          tab,
          buildActivityActiveSubtab
        )
      });
    }
  }

  function handleBuildActivitySubtabChange(
    subtab: Exclude<BuildActivitySubtab, 'all'>
  ) {
    if (subtab !== buildActivityActiveSubtab) {
      onSetBuildStudioActivityFilter({ activitySubtab: subtab });
    }
  }

  async function handleLoadMoreBuildActivity() {
    if (
      !normalizedUserId ||
      !buildActivityCursor ||
      buildActivityLoading ||
      buildActivityLoadingMore ||
      buildActivitySilentRefreshing
    ) {
      return;
    }
    const loadId = buildActivityLoadRef.current + 1;
    buildActivityLoadRef.current = loadId;
    setBuildActivityLoadingMore(true);
    setBuildActivityError('');
    try {
      const data = await loadBuildActivity({
        cursor: buildActivityCursor,
        kind: getBuildActivityRequestKind(
          buildActivityActiveTab,
          buildActivityActiveSubtab
        ),
        limit: 12,
        scope: buildActivityActiveTab
      });
      if (buildActivityLoadRef.current === loadId) {
        onAppendBuildStudioActivityItems({
          activities: data?.activities || [],
          activityLoadedAt: Date.now(),
          activitySubtab: getBuildActivityFeedSubtab(
            buildActivityActiveTab,
            buildActivityActiveSubtab
          ),
          activityTab: buildActivityActiveTab,
          lastViewedAllActivityAt: data?.lastViewedAllActivityAt,
          lastViewedAllActivitySourceRank:
            data?.lastViewedAllActivitySourceRank,
          lastViewedAllActivitySortId: data?.lastViewedAllActivitySortId,
          loadMoreToken: getLoadMoreToken(data),
          userId: normalizedUserId
        });
      }
    } catch (error: any) {
      console.error('Failed to load more build activity:', error);
    } finally {
      if (buildActivityLoadRef.current === loadId) {
        setBuildActivityLoadingMore(false);
      }
    }
  }

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
        setRecentlyUsedBuilds((builds) =>
          builds.filter((build) => Number(build.id) !== deletedBuildId)
        );
        setFavoriteBuilds((builds) =>
          builds.filter((build) => Number(build.id) !== deletedBuildId)
        );
        setTodayTopViewedBuild((build) =>
          build && Number(build.id) === deletedBuildId ? null : build
        );
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

  async function handleQuickAccessModeChange(mode: BuildQuickAccessMode) {
    if (mode === quickAccessMode) {
      return;
    }
    onChangeBuildQuickAccessMode(mode);
    try {
      await setBuildQuickAccessMode(mode);
    } catch (error) {
      console.error('Failed to save build quick access preference:', error);
    }
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

function BuildSearchEmptyState({ query }: { query: string }) {
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

function getQuickAccessStripLimit() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return quickAccessDesktopStripLimit;
  }
  return window.matchMedia(`(max-width: ${quickAccessCompactMaxWidth})`).matches
    ? quickAccessCompactStripLimit
    : quickAccessDesktopStripLimit;
}

function BuildQuickAccessStrip({
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
            <BuildTabFilter
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
        <div
          className={css`
            margin-top: 0.65rem;
            color: #be123c;
            font-size: 1rem;
            font-weight: 800;
          `}
        >
          {error}
        </div>
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
  const title = build.title || 'Untitled Build';
  const isFavorited = Boolean(build.isFavorited);
  const timestamp = mode === 'favorites' ? build.favoritedAt : build.lastUsedAt;
  const timestampLabel =
    mode === 'favorites'
      ? `Favorited ${formatQuickAccessRelativeTime(timestamp)}`
      : `Used ${formatQuickAccessRelativeTime(timestamp)}`;
  return (
    <article className={quickAccessCardClass}>
      <button
        type="button"
        className={quickAccessCardPreviewButtonClass}
        onClick={() => onOpen(build)}
        aria-label={`Open ${title}`}
      >
        <BuildPreviewFrame
          className={quickAccessCardPreviewClass}
          thumbnailUrl={build.thumbnailUrl}
          alt={`${title} screenshot`}
          ariaLabel={`${title} preview`}
        />
      </button>
      <div className={quickAccessCardBodyClass}>
        <button
          type="button"
          className={quickAccessCardTitleButtonClass}
          onClick={() => onOpen(build)}
        >
          {title}
        </button>
        <div className={quickAccessCardMetaClass}>
          {build.username ? (
            <span>
              <Icon icon="user" />
              by{' '}
              <UsernameText
                color="inherit"
                textStyle={inheritedUsernameTextStyle}
                user={getBuildUsernameUser(build)}
              />
            </span>
          ) : null}
          <span>
            <Icon icon={mode === 'favorites' ? 'star' : 'clock'} />
            {timestampLabel}
          </span>
        </div>
        <div className={quickAccessCardFooterClass}>
          <button
            type="button"
            className={quickAccessCardOpenButtonClass}
            style={openButtonStyle}
            onClick={() => onOpen(build)}
          >
            <Icon icon="external-link-alt" />
            <span className={quickAccessCardOpenTextClass}>Open</span>
          </button>
          <BuildFavoriteButton
            buildId={Number(build.id)}
            favorited={isFavorited}
            size="sm"
            onChange={(change) => onFavoriteChange(build, change)}
            onError={(error, params) => onFavoriteError(build, error, params)}
            onStart={(params) => onFavoriteStart(build, params)}
          />
        </div>
      </div>
    </article>
  );
}

function BuildQuickAccessModal({
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
    Math.ceil(builds.length / quickAccessModalPageSize)
  );
  const pageStart = page * quickAccessModalPageSize;
  const visibleBuilds = builds.slice(
    pageStart,
    pageStart + quickAccessModalPageSize
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

function getPublicBuildScope(tab: BuildListTab): PublicBuildScope {
  if (tab === 'open_source') return 'open_source';
  return 'all';
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
  const displayTitle = build.title || 'Untitled Build';
  const isFavorited = Boolean(build.isFavorited);
  return (
    <aside className={topViewedShowcaseClass} aria-label="Trending app today">
      <div className={topViewedCopyClass}>
        <div className={topViewedKickerClass}>
          <Icon icon="eye" />
          Trending today
        </div>
        <h2 className={topViewedTitleClass}>{displayTitle}</h2>
        <div className={topViewedMetaClass}>
          {build.username ? (
            <span>
              <Icon icon="user" />
              by{' '}
              <UsernameText
                color="inherit"
                textStyle={inheritedUsernameTextStyle}
                user={getBuildUsernameUser(build)}
              />
            </span>
          ) : null}
        </div>
        <div className={topViewedActionRowClass}>
          <GameCTAButton
            variant="logoBlue"
            size="md"
            icon="external-link-alt"
            onClick={() => onOpen(build)}
          >
            Open app
          </GameCTAButton>
          <BuildFavoriteButton
            buildId={Number(build.id)}
            favorited={isFavorited}
            size="pill"
            onChange={(change) => onFavoriteChange(build, change)}
            onError={(error, params) => onFavoriteError(build, error, params)}
            onStart={(params) => onFavoriteStart(build, params)}
          />
        </div>
      </div>
      <BuildPreviewFrame
        className={topViewedPreviewClass}
        thumbnailUrl={build.thumbnailUrl}
        alt={`${displayTitle} screenshot`}
        ariaLabel={`${displayTitle} preview`}
      />
    </aside>
  );
}

function getPublicBuildSort(
  tab: BuildListTab,
  browseMode: BuildStudioBrowseMode
): PublicBuildSort {
  if (browseMode !== 'leaderboard') return 'recent';
  if (tab === 'open_source') return 'forks';
  return 'popular';
}

function getBuildListBrowseMode({
  activeTab,
  buildStudio
}: {
  activeTab: BuildListTab;
  buildStudio?: {
    browseModes?: Partial<
      Record<'community' | 'open_source', BuildStudioBrowseMode | string | null>
    >;
  } | null;
}): BuildStudioBrowseMode {
  if (activeTab === 'open_source') {
    return normalizeBuildListBrowseMode(buildStudio?.browseModes?.open_source);
  }
  if (activeTab === 'community') {
    return normalizeBuildListBrowseMode(buildStudio?.browseModes?.community);
  }
  return 'recent';
}

function normalizeBuildListBrowseMode(
  value?: string | null
): BuildStudioBrowseMode {
  return value === 'leaderboard' ? 'leaderboard' : 'recent';
}

function normalizeBuildQuickAccessMode(
  value?: string | null
): BuildQuickAccessMode {
  return value === 'favorites' ? 'favorites' : 'recent';
}

function normalizeBuildActivityTab(value?: string | null): BuildActivityTab {
  if (value === 'all') return 'all';
  if (value === 'mine' || value === 'collaborating') return value;
  return 'all';
}

function normalizeBuildActivitySubtab(
  value?: string | null
): BuildActivitySubtab {
  if (value === 'all') return 'all';
  return value === 'branch_updates' ? 'branch_updates' : 'notifications';
}

function getBuildActivityFeedSubtab(
  tab: BuildActivityTab,
  subtab: BuildActivitySubtab
): BuildActivitySubtab {
  if (tab === 'all') return 'all';
  return subtab === 'branch_updates' ? 'branch_updates' : 'notifications';
}

function getBuildActivityRequestKind(
  tab: BuildActivityTab,
  subtab: BuildActivitySubtab
): 'all' | 'notifications' | 'branch_updates' {
  if (tab === 'all') return 'all';
  return subtab === 'branch_updates' ? 'branch_updates' : 'notifications';
}

function normalizeBuildActivityTimeStamp(value: unknown) {
  const timeStamp = Math.floor(Number(value) || 0);
  if (!Number.isFinite(timeStamp)) return 0;
  return Math.max(0, timeStamp);
}

function normalizeBuildActivityPositiveInteger(value: unknown) {
  const normalized = Math.floor(Number(value) || 0);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, normalized);
}

function getEmptyBuildActivityPosition(): BuildActivityPosition {
  return {
    timeStamp: 0,
    sourceRank: 0,
    sortId: 0
  };
}

function getBuildActivityPosition({
  sourceRank,
  sortId,
  timeStamp
}: {
  sourceRank?: unknown;
  sortId?: unknown;
  timeStamp?: unknown;
}): BuildActivityPosition {
  return {
    timeStamp: normalizeBuildActivityTimeStamp(timeStamp),
    sourceRank: normalizeBuildActivityPositiveInteger(sourceRank),
    sortId: normalizeBuildActivityPositiveInteger(sortId)
  };
}

function compareBuildActivityPositions(
  a: BuildActivityPosition,
  b: BuildActivityPosition
) {
  return (
    a.timeStamp - b.timeStamp ||
    a.sourceRank - b.sourceRank ||
    a.sortId - b.sortId
  );
}

function isValidBuildActivityPosition(position: BuildActivityPosition) {
  return (
    position.timeStamp > 0 && position.sourceRank > 0 && position.sortId > 0
  );
}

function getBuildActivityViewedPosition(feed: BuildStudioActivityFeedState) {
  return getBuildActivityPosition({
    timeStamp: feed.lastViewedAllActivityAt,
    sourceRank: feed.lastViewedAllActivitySourceRank,
    sortId: feed.lastViewedAllActivitySortId
  });
}

function getBuildActivityLatestPosition(activities: BuildActivityItem[]) {
  return activities.reduce((latestPosition, activity) => {
    const activityPosition = getBuildActivityPosition({
      timeStamp: activity.timeStamp,
      sourceRank: activity.activitySourceRank,
      sortId: activity.activitySortId
    });
    return compareBuildActivityPositions(activityPosition, latestPosition) > 0
      ? activityPosition
      : latestPosition;
  }, getEmptyBuildActivityPosition());
}

function isPublicBrowseTab(tab: BuildListTab) {
  return tab === 'community' || tab === 'open_source';
}

function shouldExcludeMineFromPublicBrowse(
  tab: BuildListTab,
  browseMode: BuildStudioBrowseMode
) {
  return tab === 'community' && browseMode !== 'leaderboard';
}

function getBuildListBrowseTab(tab: BuildListTab) {
  if (tab === 'collaborating') return 'collaborating';
  if (tab === 'open_source') return 'open_source';
  return 'community';
}

function normalizeBuildListTab(value?: string | null): BuildListTab {
  if (
    value === 'collaborating' ||
    value === 'community' ||
    value === 'open_source'
  ) {
    return value;
  }
  return 'mine';
}

function normalizeBuildListSearchQuery(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function buildMatchesSearchQuery(
  build: BuildProjectListItemData,
  searchQuery: string
) {
  const normalizedSearchQuery =
    normalizeBuildListSearchQuery(searchQuery).toLowerCase();
  if (!normalizedSearchQuery) return true;
  const searchTokens = normalizedSearchQuery.split(' ').filter(Boolean);
  const searchableText = [
    build.title,
    build.description,
    build.username,
    build.rootBuildTitle,
    build.rootBuildUsername
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return searchTokens.every((token) => searchableText.includes(token));
}

function createEmptyBrowseState() {
  return {
    builds: [],
    loadMoreToken: null,
    loaded: false,
    browseMode: 'recent' as BuildStudioBrowseMode,
    searchQuery: '',
    userId: null
  };
}

function createEmptyBuildActivityFeedState(): BuildStudioActivityFeedState {
  return {
    activities: [],
    loadMoreToken: null,
    loaded: false,
    userId: null,
    loadedAt: 0,
    lastViewedAllActivityAt: 0,
    lastViewedAllActivitySourceRank: 0,
    lastViewedAllActivitySortId: 0
  };
}

function getBuildActivityFeedState({
  buildStudio,
  activeTab,
  activeSubtab
}: {
  buildStudio?: {
    activityFeeds?: Partial<
      Record<
        BuildActivityTab,
        Partial<Record<BuildActivitySubtab, BuildStudioActivityFeedState>>
      >
    >;
  } | null;
  activeTab: BuildActivityTab;
  activeSubtab: BuildActivitySubtab;
}) {
  return (
    buildStudio?.activityFeeds?.[activeTab]?.[activeSubtab] ||
    createEmptyBuildActivityFeedState()
  );
}

function getLoadMoreToken(data: any) {
  if (data?.cursor != null) return String(data.cursor);
  if (data?.loadMoreButton != null) return String(data.loadMoreButton);
  return null;
}

function normalizeTodayTopViewedBuild(build: any): TodayTopViewedBuild | null {
  const buildId = Number(build?.id || 0);
  const todayViewCount = normalizeNonNegativeInteger(build?.todayViewCount);
  const todayFavoriteCount = normalizeNonNegativeInteger(
    build?.todayFavoriteCount
  );
  const todayTrendingWeight = normalizeNonNegativeInteger(
    build?.todayTrendingWeight
  );
  if (
    !buildId ||
    (todayViewCount <= 0 &&
      todayFavoriteCount <= 0 &&
      todayTrendingWeight <= 0)
  ) {
    return null;
  }
  return {
    ...build,
    id: buildId,
    todayViewCount,
    todayFavoriteCount,
    todayTrendingWeight
  };
}

function normalizeQuickAccessBuilds(builds: any): QuickAccessBuild[] {
  if (!Array.isArray(builds)) return [];
  return builds
    .map((build): QuickAccessBuild | null => {
      const buildId = Number(build?.id || 0);
      if (!buildId) return null;
      return {
        ...build,
        id: buildId,
        favoritedAt: normalizeOptionalTimestamp(build?.favoritedAt),
        isFavorited: Boolean(build?.isFavorited),
        lastUsedAt: normalizeOptionalTimestamp(build?.lastUsedAt)
      };
    })
    .filter((build): build is QuickAccessBuild => Boolean(build));
}

function normalizeQuickAccessCursor(cursor: unknown) {
  const normalizedCursor = String(cursor || '').trim();
  return normalizedCursor || null;
}

function normalizeOptionalTimestamp(value: unknown) {
  const timestamp = Math.floor(Number(value) || 0);
  return timestamp > 0 ? timestamp : null;
}

function normalizeNonNegativeInteger(value: unknown) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function formatQuickAccessRelativeTime(timestamp?: number | null) {
  if (!timestamp) return 'recently';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function getBuildUsernameUser(
  build: Pick<BuildProjectListItemData, 'profilePicUrl' | 'userId' | 'username'>
): User {
  return {
    id: Number(build.userId || 0),
    profilePicUrl: build.profilePicUrl || '',
    username: build.username || ''
  };
}

function getBrowseEmptyCopy(tab: BuildListTab) {
  if (tab === 'collaborating') {
    return 'Builds where you are on the team will show up here after an invitation or join request is accepted.';
  }
  if (tab === 'open_source') {
    return 'No public open-source builds have been published yet.';
  }
  return 'No community builds have been published yet.';
}

function deriveBuildTitle(prompt: string) {
  const cleaned = (prompt || '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/-{2,}/g, '-')
    .trim();
  if (!cleaned) return 'New Build';
  const words = cleaned.split(' ').slice(0, 6).join(' ');
  return words.length > 70 ? `${words.slice(0, 67)}...` : words;
}

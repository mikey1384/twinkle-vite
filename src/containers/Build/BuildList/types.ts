import type { BuildProjectListItemData } from '~/containers/Build/shared/components/ProjectListItem';
import type { BuildStudioTab } from '~/contexts/Build/reducer';

export type BuildListTab = BuildStudioTab;
export type BuildBrowseTab = Exclude<BuildListTab, 'mine'>;
export type PublicBuildScope = 'all' | 'open_source';
export type PublicBuildSort = 'recent' | 'popular' | 'forks';
export type TodayTopViewedBuild = BuildProjectListItemData & {
  todayViewCount?: number;
  todayFavoriteCount?: number;
  todayTrendingWeight?: number;
};
export type BuildQuickAccessMode = 'recent' | 'favorites';
export type QuickAccessBuild = BuildProjectListItemData & {
  favoritedAt?: number | null;
  isFavorited?: boolean;
  lastUsedAt?: number | null;
};
export interface BuildActivityPosition {
  timeStamp: number;
  sourceRank: number;
  sortId: number;
}

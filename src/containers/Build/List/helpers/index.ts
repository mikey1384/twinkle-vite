import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import type {
  BuildActivitySubtab,
  BuildActivityTab,
  BuildStudioActivityFeedState,
  BuildStudioBrowseMode
} from '~/contexts/Build/reducer';
import type { ActivityItem } from '../../ActivityPanel';
import type {
  BuildActivityPosition,
  BuildListTab,
  BuildQuickAccessMode,
  PublicBuildScope,
  PublicBuildSort,
  QuickAccessBuild,
  TodayTopViewedBuild
} from '../types';

export function getPublicBuildScope(tab: BuildListTab): PublicBuildScope {
  if (tab === 'open_source') return 'open_source';
  return 'all';
}

export function getPublicBuildSort(
  tab: BuildListTab,
  browseMode: BuildStudioBrowseMode
): PublicBuildSort {
  if (browseMode !== 'leaderboard') return 'recent';
  if (tab === 'open_source') return 'forks';
  return 'popular';
}

export function getBuildListBrowseMode({
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

export function normalizeBuildListBrowseMode(
  value?: string | null
): BuildStudioBrowseMode {
  return value === 'leaderboard' ? 'leaderboard' : 'recent';
}

export function normalizeBuildQuickAccessMode(
  value?: string | null
): BuildQuickAccessMode {
  return value === 'favorites' ? 'favorites' : 'recent';
}

export function normalizeBuildActivityTab(value?: string | null): BuildActivityTab {
  if (value === 'all') return 'all';
  if (value === 'mine' || value === 'collaborating') return value;
  return 'all';
}

export function normalizeBuildActivitySubtab(
  value?: string | null
): BuildActivitySubtab {
  if (value === 'all') return 'all';
  return value === 'branch_updates' ? 'branch_updates' : 'notifications';
}

export function getBuildActivityFeedSubtab(
  tab: BuildActivityTab,
  subtab: BuildActivitySubtab
): BuildActivitySubtab {
  if (tab === 'all') return 'all';
  return subtab === 'branch_updates' ? 'branch_updates' : 'notifications';
}

export function getBuildActivityRequestKind(
  tab: BuildActivityTab,
  subtab: BuildActivitySubtab
): 'all' | 'notifications' | 'branch_updates' {
  if (tab === 'all') return 'all';
  return subtab === 'branch_updates' ? 'branch_updates' : 'notifications';
}

export function normalizeBuildActivityTimeStamp(value: unknown) {
  const timeStamp = Math.floor(Number(value) || 0);
  if (!Number.isFinite(timeStamp)) return 0;
  return Math.max(0, timeStamp);
}

export function normalizeBuildActivityPositiveInteger(value: unknown) {
  const normalized = Math.floor(Number(value) || 0);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, normalized);
}

export function getEmptyBuildActivityPosition(): BuildActivityPosition {
  return {
    timeStamp: 0,
    sourceRank: 0,
    sortId: 0
  };
}

export function getBuildActivityPosition({
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

export function compareBuildActivityPositions(
  a: BuildActivityPosition,
  b: BuildActivityPosition
) {
  return (
    a.timeStamp - b.timeStamp ||
    a.sourceRank - b.sourceRank ||
    a.sortId - b.sortId
  );
}

export function isValidBuildActivityPosition(position: BuildActivityPosition) {
  return (
    position.timeStamp > 0 && position.sourceRank > 0 && position.sortId > 0
  );
}

export function getBuildActivityViewedPosition(feed: BuildStudioActivityFeedState) {
  return getBuildActivityPosition({
    timeStamp: feed.lastViewedAllActivityAt,
    sourceRank: feed.lastViewedAllActivitySourceRank,
    sortId: feed.lastViewedAllActivitySortId
  });
}

export function getBuildActivityLatestPosition(activities: ActivityItem[]) {
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

export function getCappedNewBuildActivityCount({
  activities,
  cap = 10,
  lastViewedPosition
}: {
  activities: ActivityItem[];
  cap?: number;
  lastViewedPosition: BuildActivityPosition;
}) {
  const cappedLimit = Math.max(0, Math.floor(Number(cap) || 0));
  if (!cappedLimit) return 0;

  let count = 0;
  for (const activity of activities) {
    const activityPosition = getBuildActivityPosition({
      timeStamp: activity.timeStamp,
      sourceRank: activity.activitySourceRank,
      sortId: activity.activitySortId
    });
    if (compareBuildActivityPositions(activityPosition, lastViewedPosition) <= 0) {
      continue;
    }
    count += 1;
    if (count >= cappedLimit) return cappedLimit;
  }
  return count;
}

export function getBuildActivityMobileTriggerLabel(newActivityCount: number) {
  const count = Math.max(0, Math.floor(Number(newActivityCount) || 0));
  if (!count) return 'Build Activity';
  if (count >= 10) return '10+ new notifications';
  return `${count} new notification${count === 1 ? '' : 's'}`;
}

export function isPublicBrowseTab(tab: BuildListTab) {
  return tab === 'community' || tab === 'open_source';
}

export function shouldExcludeMineFromPublicBrowse(
  tab: BuildListTab,
  browseMode: BuildStudioBrowseMode
) {
  return tab === 'community' && browseMode !== 'leaderboard';
}

export function getBuildListBrowseTab(tab: BuildListTab) {
  if (tab === 'collaborating') return 'collaborating';
  if (tab === 'open_source') return 'open_source';
  return 'community';
}

export function normalizeBuildListTab(value?: string | null): BuildListTab {
  if (
    value === 'collaborating' ||
    value === 'community' ||
    value === 'open_source'
  ) {
    return value;
  }
  return 'mine';
}

export function normalizeBuildListSearchQuery(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export function buildMatchesSearchQuery(
  build: BuildProjectListItemData,
  searchQuery: string
) {
  const normalizedSearchQuery =
    normalizeBuildListSearchQuery(searchQuery).toLowerCase();
  if (!normalizedSearchQuery) return true;
  const searchTokens = normalizedSearchQuery.split(' ').filter(Boolean);
  const tags = Array.isArray(build.tags) ? build.tags : [];
  const searchableText = [
    build.title,
    build.description,
    build.username,
    build.rootBuildTitle,
    build.rootBuildUsername,
    ...tags.flatMap((tag) => [tag?.slug, tag?.label])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return searchTokens.every((token) => searchableText.includes(token));
}

export function createEmptyBrowseState() {
  return {
    builds: [],
    loadMoreToken: null,
    loaded: false,
    browseMode: 'recent' as BuildStudioBrowseMode,
    searchQuery: '',
    userId: null,
    cacheRefreshKey: 0,
    cacheGeneration: 0
  };
}

export function createEmptyBuildActivityFeedState(): BuildStudioActivityFeedState {
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

export function getBuildActivityFeedState({
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

export function getLoadMoreToken(data: any) {
  if (data?.cursor != null) return String(data.cursor);
  if (data?.loadMoreButton != null) return String(data.loadMoreButton);
  return null;
}

export function normalizeTodayTopViewedBuild(build: any): TodayTopViewedBuild | null {
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

export function normalizeQuickAccessBuilds(builds: any): QuickAccessBuild[] {
  if (!Array.isArray(builds)) return [];
  return builds
    .map((build): QuickAccessBuild | null => {
      const buildId = Number(build?.id || 0);
      if (!buildId) return null;
      return {
        ...build,
        id: buildId,
        favoritedAt: normalizeOptionalTimestamp(build?.favoritedAt),
        favoriteActivityAt: normalizeOptionalTimestamp(
          build?.favoriteActivityAt
        ),
        isFavorited: Boolean(build?.isFavorited),
        lastUsedAt: normalizeOptionalTimestamp(build?.lastUsedAt)
      };
    })
    .filter((build): build is QuickAccessBuild => Boolean(build));
}

export function normalizeQuickAccessCursor(cursor: unknown) {
  const normalizedCursor = String(cursor || '').trim();
  return normalizedCursor || null;
}

export function normalizeOptionalTimestamp(value: unknown) {
  const timestamp = Math.floor(Number(value) || 0);
  return timestamp > 0 ? timestamp : null;
}

export function normalizeNonNegativeInteger(value: unknown) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function formatQuickAccessRelativeTime(timestamp?: number | null) {
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

export function getBrowseEmptyCopy(tab: BuildListTab) {
  if (tab === 'collaborating') {
    return 'Builds where you are on the team will show up here after an invitation or join request is accepted.';
  }
  if (tab === 'open_source') {
    return 'No public open-source builds have been published yet.';
  }
  return 'No community builds have been published yet.';
}

export function deriveBuildTitle(prompt: string) {
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

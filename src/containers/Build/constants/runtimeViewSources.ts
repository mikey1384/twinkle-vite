export const BUILD_TRENDING_SHOWCASE_VIEW_SOURCE = 'build_trending_showcase';
export const BUILD_TODAY_TOP_VIEW_SOURCE = 'build_today_top';
// Earn → Bounties play buttons (10-08): not counted as organic players
export const BUILD_EARN_BOUNTIES_VIEW_SOURCE = 'earn_bounties';

export function normalizeBuildRuntimeViewSource(source: unknown) {
  return source === BUILD_TRENDING_SHOWCASE_VIEW_SOURCE ||
    source === BUILD_TODAY_TOP_VIEW_SOURCE ||
    source === BUILD_EARN_BOUNTIES_VIEW_SOURCE
    ? source
    : '';
}

export const BUILD_TRENDING_SHOWCASE_VIEW_SOURCE =
  'build_trending_showcase';
export const BUILD_TODAY_TOP_VIEW_SOURCE = 'build_today_top';

export function normalizeBuildRuntimeViewSource(source: unknown) {
  return source === BUILD_TRENDING_SHOWCASE_VIEW_SOURCE ||
    source === BUILD_TODAY_TOP_VIEW_SOURCE
    ? source
    : '';
}

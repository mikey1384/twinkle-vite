import { addCommasToNumber } from '~/helpers/stringHelpers';

export type ViewCountUnit = 'views' | 'visits';
export type ViewCountFallbackMode = 'missing' | 'max';

export function normalizeViewCount(
  count?: number | string | null,
  fallbackCount?: number | string | null,
  fallbackMode: ViewCountFallbackMode = 'missing'
) {
  if (fallbackMode === 'max') {
    return Math.max(
      Math.max(0, Math.floor(Number(count) || 0)),
      Math.max(0, Math.floor(Number(fallbackCount) || 0))
    );
  }
  const rawCount =
    typeof count === 'undefined' || count === null ? fallbackCount : count;
  return Math.max(0, Math.floor(Number(rawCount) || 0));
}

// Number and unit word are kept separate so a caller that can't afford the
// word (the build runtime toolbar on a phone) can hide just that half without
// re-deriving the pluralization.
export function getViewCountParts(count: number, unit: ViewCountUnit = 'views') {
  if (unit === 'visits' && count <= 0) {
    return { value: 'No visits yet', unitLabel: '' };
  }
  const singular = unit === 'visits' ? 'visit' : 'view';
  return {
    value: addCommasToNumber(count),
    unitLabel: count === 1 ? singular : `${singular}s`
  };
}

export function getViewCountLabel(count: number, unit: ViewCountUnit = 'views') {
  const { value, unitLabel } = getViewCountParts(count, unit);
  return unitLabel ? `${value} ${unitLabel}` : value;
}

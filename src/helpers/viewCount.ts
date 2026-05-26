import { addCommasToNumber, formatVisitLabel } from '~/helpers/stringHelpers';

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

export function getViewCountLabel(count: number, unit: ViewCountUnit = 'views') {
  if (unit === 'visits') {
    return formatVisitLabel(count);
  }
  return `${addCommasToNumber(count)} view${count === 1 ? '' : 's'}`;
}

import React from 'react';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import {
  getViewCountLabel,
  getViewCountParts,
  normalizeViewCount,
  type ViewCountFallbackMode,
  type ViewCountUnit
} from '~/helpers/viewCount';

type ViewCountVariant = 'inline' | 'feedAction';

export default function ViewCount({
  className,
  count,
  fallbackCount,
  fallbackMode = 'missing',
  iconClassName,
  label = 'Views',
  minimumCount = -1,
  showIcon = true,
  unit = 'views',
  unitClassName,
  valueClassName,
  variant = 'inline'
}: {
  className?: string;
  count?: number | string | null;
  fallbackCount?: number | string | null;
  fallbackMode?: ViewCountFallbackMode;
  iconClassName?: string;
  label?: string;
  minimumCount?: number;
  showIcon?: boolean;
  unit?: ViewCountUnit;
  // Styles the unit word on its own so a cramped caller can drop it and keep
  // the number whole instead of clipping the label mid-letter.
  unitClassName?: string;
  valueClassName?: string;
  variant?: ViewCountVariant;
}) {
  const normalizedCount = normalizeViewCount(count, fallbackCount, fallbackMode);
  if (normalizedCount <= minimumCount) return null;

  if (variant === 'feedAction') {
    return (
      <span className={className} aria-label={getViewCountLabel(normalizedCount)}>
        {showIcon && (
          <span className={iconClassName}>
            <Icon icon="eye" />
          </span>
        )}
        <strong>{label}</strong>
        <em className={valueClassName}>
          {addCommasToNumber(normalizedCount)}
        </em>
      </span>
    );
  }

  if (unitClassName) {
    const { value, unitLabel } = getViewCountParts(normalizedCount, unit);
    return (
      <span
        className={className}
        aria-label={getViewCountLabel(normalizedCount, unit)}
      >
        {showIcon && <Icon icon="eye" />}
        <span className={valueClassName}>{value}</span>
        {unitLabel ? <span className={unitClassName}>{unitLabel}</span> : null}
      </span>
    );
  }

  return (
    <span
      className={className}
      aria-label={getViewCountLabel(normalizedCount, unit)}
    >
      {showIcon && (
        <>
          <Icon icon="eye" />{' '}
        </>
      )}
      {getViewCountLabel(normalizedCount, unit)}
    </span>
  );
}

import React from 'react';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import {
  getViewCountLabel,
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

import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import XPAndStreakDisplay from '~/components/XPAndStreakDisplay';

const minorWords = new Set(['and', 'or', 'the', 'a', 'an']);

const rootClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8rem;
`;

const compactRootClass = css`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.2rem;
  overflow: hidden;
`;

const masterpieceBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid ${Color.gold()};
  border-radius: 1rem;
  background: linear-gradient(135deg, ${Color.gold()}20, ${Color.orange()}20);
  color: ${Color.gold()};
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
`;

const compactMasterpieceBadgeClass = css`
  min-height: 2rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 800;
`;

const refinedBadgeClass = css`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: ${Color.darkerGray()};
  font-size: 1.2rem;
  line-height: 1.15;
  white-space: nowrap;
`;

const refinedIconClass = css`
  color: ${Color.logoBlue()};
`;

export default function DailyReflectionMetaBadges({
  className,
  density = 'full',
  grade,
  isRefined,
  masterpieceType,
  streak,
  style,
  xpAwarded
}: {
  className?: string;
  density?: 'compact' | 'full';
  grade?: string | null;
  isRefined?: boolean;
  masterpieceType?: string | null;
  streak?: number | null;
  style?: React.CSSProperties;
  xpAwarded?: number | null;
}) {
  const masterpieceLabel = getDailyReflectionMasterpieceLabel({
    grade,
    masterpieceType
  });
  const showProgress = Boolean(
    (typeof xpAwarded === 'number' && xpAwarded > 0) ||
    (typeof streak === 'number' && streak > 0)
  );

  if (!masterpieceLabel && !isRefined && !showProgress) {
    return null;
  }

  const isCompact = density === 'compact';
  const rootClassName = [
    rootClass,
    isCompact ? compactRootClass : '',
    masterpieceLabel ? 'daily-reflection-meta-badges--has-masterpiece' : '',
    showProgress ? 'daily-reflection-meta-badges--has-progress' : '',
    isRefined ? 'daily-reflection-meta-badges--has-refined' : '',
    className || ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName} style={style}>
      {masterpieceLabel ? (
        <span
          className={`${masterpieceBadgeClass} daily-reflection-meta-badges__masterpiece ${
            isCompact ? compactMasterpieceBadgeClass : ''
          }`}
        >
          <span>★</span>
          <span className="daily-reflection-meta-badges__masterpiece-label">
            {masterpieceLabel}
          </span>
        </span>
      ) : null}
      {showProgress ? (
        <XPAndStreakDisplay
          className="daily-reflection-meta-badges__progress"
          xpAwarded={Number(xpAwarded) || 0}
          streak={Number(streak) || 0}
          style={{ marginTop: 0 }}
        />
      ) : null}
      {isRefined ? (
        <span
          className={`${refinedBadgeClass} daily-reflection-meta-badges__refined`}
        >
          <span className={refinedIconClass}>✨</span>
          <span style={{ fontStyle: 'italic' }}>AI-polished</span>
        </span>
      ) : null}
    </div>
  );
}

export function getDailyReflectionMasterpieceLabel({
  grade,
  masterpieceType
}: {
  grade?: string | null;
  masterpieceType?: string | null;
}) {
  if (grade !== 'Masterpiece') return '';
  if (!masterpieceType) return 'Masterpiece';
  return `Masterpiece (${formatDailyReflectionMasterpieceType(
    masterpieceType
  )})`;
}

export function formatDailyReflectionMasterpieceType(masterpieceType: string) {
  return masterpieceType
    .replace(/_/g, ' ')
    .split(' ')
    .map((word, index) =>
      minorWords.has(word) && index > 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

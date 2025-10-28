import React from 'react';
import { css } from '@emotion/css';

export default function RankBadge({
  rank,
  className,
  style
}: {
  rank?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const numericRank = typeof rank === 'number' ? rank : Number(rank);
  const resolvedRank = Number.isFinite(numericRank) ? numericRank : 0;
  const digitCount =
    resolvedRank > 0 ? String(Math.floor(Math.abs(resolvedRank))).length : 0;
  const fontScale = getFontScale(digitCount);

  return (
    <span
      className={`${badgeCss(resolvedRank)} ${className || ''}`}
      style={style}
    >
      <span
        className={rankTextCss}
        style={{
          fontSize: `${fontScale}em`
        }}
      >
        {rank ? `#${rank}` : '--'}
      </span>
    </span>
  );
}

const badgeCss = (rank: number) => css`
  min-width: 2.35em;
  height: 1.6em;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  font-weight: 800;
  /* inherit so external font-size scales the badge */
  font-size: inherit;
  color: ${rank === 1
    ? '#b45309'
    : rank === 2
    ? '#fff'
    : rank === 3
    ? '#9a3412'
    : '#475569'};
  background: ${rank === 1
    ? '#fef3c7'
    : rank === 2
    ? '#737373'
    : rank === 3
    ? '#ffedd5'
    : '#f1f5f9'};

  /* Keep proportions consistent across breakpoints by inheriting font-size */
`;

const rankTextCss = css`
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  transition: font-size 0.15s ease-in-out;
`;

function getFontScale(digitCount: number) {
  if (digitCount <= 0) return 1;
  if (digitCount === 1) return 1.12;
  if (digitCount === 2) return 1.05;
  if (digitCount === 3) return 1;
  if (digitCount === 4) return 0.93;
  if (digitCount === 5) return 0.88;
  if (digitCount === 6) return 0.84;
  return 0.8;
}

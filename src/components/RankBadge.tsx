import React from 'react';
import { css } from '@emotion/css';
import { getRankFontScale } from '~/helpers/rankHelpers';

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
  const fontScale = getRankFontScale(digitCount);

  return (
    <span
      className={`${badgeCss(resolvedRank)} ${className || ''}`}
      style={style}
    >
      <span
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
`;

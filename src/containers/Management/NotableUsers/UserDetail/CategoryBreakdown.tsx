import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  formatNumber,
  getWidthPercent
} from '../../AiCosts/helpers/formatters';
import { barRowClass, barsClass } from '../../AiCosts/styles';

export default function CategoryBreakdown({
  rows
}: {
  rows: Array<{ category: string; total: number }>;
}) {
  if (!rows || rows.length === 0) {
    return (
      <p
        className={css`
          color: ${Color.gray()};
          font-size: 1.4rem;
        `}
      >
        No XP earned in this range.
      </p>
    );
  }
  const maxValue = Math.max(...rows.map((r) => r.total), 1);
  return (
    <div className={barsClass}>
      {rows.map((row) => (
        <div className={barRowClass} key={row.category}>
          <div>
            <strong>{row.category}</strong>
          </div>
          <div className="bar-track">
            <div style={{ width: `${getWidthPercent(row.total, maxValue)}%` }} />
          </div>
          <div>{formatNumber(row.total)}</div>
        </div>
      ))}
    </div>
  );
}

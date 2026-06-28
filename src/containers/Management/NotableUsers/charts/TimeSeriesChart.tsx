import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

// Only `bucket` is structurally required; each series reads its own numeric key
// off the row at runtime (recharts looks up dataKey by string).
export interface TimeSeriesPoint {
  bucket: string;
}

export interface TimeSeriesSeries {
  key: string;
  name: string;
  color: string;
}

export default function TimeSeriesChart({
  title,
  data,
  series,
  height = '24rem'
}: {
  title?: string;
  data: TimeSeriesPoint[];
  series: TimeSeriesSeries[];
  height?: string;
}) {
  const showLegend = series.length > 1;
  const chartData = useMemo(() => data || [], [data]);

  return (
    <div style={{ width: '100%' }}>
      {title ? (
        <p
          className={css`
            font-weight: bold;
            font-size: 1.7rem;
            margin: 0 0 1rem 0;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
        >
          {title}
        </p>
      ) : null}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} minTickGap={16} />
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              tickFormatter={formatAxis}
              width={48}
            />
            <Tooltip formatter={(value: any) => addCommasToNumber(value)} />
            {showLegend ? <Legend wrapperStyle={{ fontSize: '1.2rem' }} /> : null}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  function formatAxis(value: number) {
    if (Math.abs(value) >= 1_000_000) return value / 1_000_000 + 'M';
    if (Math.abs(value) >= 1000) return value / 1000 + 'k';
    return String(value);
  }
}

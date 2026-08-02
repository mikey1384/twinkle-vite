import React, { useMemo, useState } from 'react';
import { DataTable } from './DataTable';
import {
  formatBillingPolicy,
  formatCacheHitRate,
  formatNumber,
  formatProviderModel,
  formatProviderName,
  formatUsd,
  numberValue
} from './helpers/formatters';
import { Panel } from './Panel';
import { rangeClass } from './styles';
import { AiCostReport, AiCostRow, DataTableColumn } from './types';

type BreakdownReport = Pick<
  AiCostReport,
  | 'byProviderModel'
  | 'bySurface'
  | 'byOperation'
  | 'byBillingPolicy'
  | 'breakdownKeys'
>;

type BreakdownDimension = 'model' | 'surface' | 'operation' | 'policy';

const DIMENSIONS: { value: BreakdownDimension; label: string }[] = [
  { value: 'model', label: 'Model' },
  { value: 'surface', label: 'Surface' },
  { value: 'operation', label: 'Operation' },
  { value: 'policy', label: 'Policy' }
];

// Totals move with traffic, so they cannot tell you whether a change helped.
// Per-event averages can, which is why every dimension carries them.
//
// Ordered by what you came here to read. Nine columns cannot fit a narrow
// viewport, so the ones that clip off the right edge should be the derivable
// and contextual ones — not the averages this view exists for.
const UNIT_ECONOMICS_COLUMNS: DataTableColumn[] = [
  {
    key: 'avgCostUsd',
    label: 'Cost / req',
    align: 'right',
    render: formatUsd
  },
  {
    key: 'avgInputTokens',
    label: 'In / req',
    align: 'right',
    render: formatNumber
  },
  {
    key: 'avgOutputTokens',
    label: 'Out / req',
    align: 'right',
    render: formatNumber
  },
  {
    key: 'requestCount',
    label: 'Requests',
    align: 'right',
    render: formatNumber
  },
  {
    key: 'estimatedCostUsd',
    label: 'Total cost',
    align: 'right',
    render: formatUsd
  },
  {
    key: 'cachedInputTokens',
    label: 'Cache',
    align: 'right',
    render: (_value, row) => formatCacheHitRate(row)
  }
];

// One column per grouping key, looked up by the key itself. The backend ships
// the keys it grouped on, so a new grouping key shows up here automatically
// instead of collapsing into indistinguishable rows.
const COLUMN_BY_KEY: Record<string, DataTableColumn> = {
  provider: {
    key: 'provider',
    label: 'Provider',
    render: (value, row) => formatProviderName(value, row)
  },
  model: {
    key: 'model',
    label: 'Model',
    render: (value, row) => formatProviderModel(value, row)
  },
  surface: { key: 'surface', label: 'Surface' },
  operation: { key: 'operation', label: 'Operation' },
  billingPolicy: {
    key: 'billingPolicy',
    label: 'Policy',
    render: formatBillingPolicy
  }
};

// Fallback for a grouping key with no entry above: render it plainly rather
// than dropping it, so the row stays interpretable and the gap is visible.
function getIdentityColumn(key: string): DataTableColumn {
  return (
    COLUMN_BY_KEY[key] || {
      key,
      label: key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (c) => c.toUpperCase())
    }
  );
}

// Fallback grouping, used only if an older API response omits breakdownKeys.
const FALLBACK_BREAKDOWN_KEYS: Record<BreakdownDimension, string[]> = {
  model: ['provider', 'model', 'billingPolicy'],
  surface: ['surface', 'billingPolicy'],
  operation: ['operation', 'surface', 'model'],
  policy: ['billingPolicy']
};

const DIMENSION_NOTES: Record<BreakdownDimension, string> = {
  model: 'Which models the spend runs through.',
  surface: 'Which product surfaces spend it.',
  operation:
    'Which step within a feature spends it, split by model — the view for checking whether a change to one step actually moved its cost.',
  policy: 'Who absorbs the cost.'
};

export function BreakdownPanel({ report }: { report: BreakdownReport }) {
  const [dimension, setDimension] = useState<BreakdownDimension>('model');

  const identityColumns = useMemo(() => {
    const keys =
      report.breakdownKeys?.[dimension] || FALLBACK_BREAKDOWN_KEYS[dimension];
    return keys.map(getIdentityColumn);
  }, [dimension, report.breakdownKeys]);

  const rows = useMemo(() => {
    const source: AiCostRow[] =
      dimension === 'model'
        ? report.byProviderModel
        : dimension === 'surface'
          ? report.bySurface
          : dimension === 'operation'
            ? report.byOperation || []
            : report.byBillingPolicy;

    return source.map((row) => {
      // Requests, not events. A single cost event can bill several provider
      // calls — tool-cost rows record one event with requestCount set to the
      // number of calls — so dividing by events would overstate those rows.
      // Fall back to events only if a row somehow carries no request count.
      const requests =
        numberValue(row.requestCount) || numberValue(row.eventCount);
      if (requests <= 0) {
        return { ...row, avgCostUsd: 0, avgInputTokens: 0, avgOutputTokens: 0 };
      }
      return {
        ...row,
        avgCostUsd: numberValue(row.estimatedCostUsd) / requests,
        avgInputTokens: numberValue(row.inputTokens) / requests,
        avgOutputTokens: numberValue(row.outputTokens) / requests
      };
    });
  }, [
    dimension,
    report.byProviderModel,
    report.bySurface,
    report.byOperation,
    report.byBillingPolicy
  ]);

  return (
    <Panel
      title="Breakdown"
      note={DIMENSION_NOTES[dimension]}
      action={
        <div className={rangeClass}>
          {DIMENSIONS.map((option) => (
            <button
              key={option.value}
              className={dimension === option.value ? 'active' : ''}
              onClick={() => setDimension(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      <DataTable
        columns={[...identityColumns, ...UNIT_ECONOMICS_COLUMNS]}
        rows={rows}
      />
    </Panel>
  );
}

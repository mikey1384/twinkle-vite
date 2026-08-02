import React from 'react';
import Loading from '~/components/Loading';
import { BreakdownPanel } from './BreakdownPanel';
import { DataTable, PaginationFooter } from './DataTable';
import { Panel } from './Panel';
import {
  formatBillingPolicy,
  formatCompact,
  formatNumber,
  formatProviderModel,
  formatTime,
  formatTokenLabel,
  formatUsd,
  numberValue
} from './helpers/formatters';
import {
  detailErrorClass,
  detailHeadingClass,
  detailSummaryClass
} from './styles';
import { AiCostAccountDetail } from './types';

export default function AccountDetail({
  detail,
  error,
  eventsError,
  loading,
  loadingMore,
  onLoadMore
}: {
  detail: AiCostAccountDetail | null;
  error: string;
  eventsError: string;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className={detailErrorClass}>{error}</div>;
  }

  if (!detail) {
    return null;
  }

  return (
    <>
      <div className={detailSummaryClass}>
        <div>
          <span>Estimated Spend</span>
          <strong>{formatUsd(detail.summary.estimatedCostUsd)}</strong>
        </div>
        <div>
          <span>Requests</span>
          <strong>{formatNumber(detail.summary.requestCount)}</strong>
        </div>
        <div>
          <span>Energy Charged</span>
          <strong>{formatCompact(detail.summary.energyChargedUnits)}</strong>
        </div>
        <div>
          <span>Recharges</span>
          <strong>{formatNumber(detail.rechargeSummary.rechargeCount)}</strong>
          <small>
            {formatNumber(detail.rechargeSummary.accountRechargeCoins)} account
            {' coins · '}
            {formatNumber(detail.rechargeSummary.sponsoredRechargeCoins)}
            {' community coins'}
          </small>
        </div>
      </div>

      <h3 className={detailHeadingClass}>Daily Activity</h3>
      <DataTable
        columns={[
          { key: 'dayKey', label: 'UTC Day' },
          {
            key: 'estimatedCostUsd',
            label: 'Cost',
            align: 'right',
            render: formatUsd
          },
          {
            key: 'requestCount',
            label: 'Requests',
            align: 'right',
            render: formatNumber
          },
          {
            key: 'rechargeCount',
            label: 'Recharges',
            align: 'right',
            render: formatNumber
          },
          {
            key: 'rechargeCoins',
            label: 'Recharge Coins',
            align: 'right',
            render: formatNumber
          }
        ]}
        rows={detail.byDay}
      />

      <BreakdownPanel report={detail} />

      <Panel
        title="Recharge Activity"
        note={`${formatNumber(
          detail.rechargeSummary.accountRechargeCount
        )} account-funded, ${formatNumber(
          detail.rechargeSummary.sponsoredRechargeCount
        )} community-sponsored.`}
      >
        <DataTable
          columns={[
            {
              key: 'createdAt',
              label: 'Time',
              render: (value) => formatTime(numberValue(value))
            },
            {
              key: 'rechargeType',
              label: 'Source',
              render: formatRechargeType
            },
            {
              key: 'rechargeCoins',
              label: 'Coins',
              align: 'right',
              render: formatNumber
            }
          ]}
          rows={detail.recharges}
          rowKey={(row) =>
            `${String(row.rechargeType || '')}:${Number(row.id || 0)}`
          }
        />
      </Panel>

      <Panel
        title="Usage Events"
        note={`Showing ${formatNumber(detail.events.length)} of ${formatNumber(
          detail.summary.eventCount
        )} events in this range.`}
      >
        <DataTable
          columns={[
            {
              key: 'createdAt',
              label: 'Time',
              render: (value) => formatTime(numberValue(value))
            },
            {
              key: 'source',
              label: 'Source',
              render: formatTokenLabel
            },
            { key: 'surface', label: 'Surface' },
            { key: 'operation', label: 'Operation' },
            {
              key: 'model',
              label: 'Model',
              render: (value, row) => formatProviderModel(value, row)
            },
            {
              key: 'billingPolicy',
              label: 'Policy',
              render: formatBillingPolicy
            },
            {
              key: 'estimatedCostUsd',
              label: 'Cost',
              align: 'right',
              render: formatUsd
            }
          ]}
          rows={detail.events}
        />
        <PaginationFooter
          hasMore={detail.eventsHasMore}
          loading={loadingMore}
          error={eventsError}
          onLoadMore={onLoadMore}
        />
      </Panel>
    </>
  );
}

function formatRechargeType(value: unknown) {
  return value === 'community' ? 'Community sponsored' : 'Paid by account';
}

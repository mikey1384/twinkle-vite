import React from 'react';
import Loading from '~/components/Loading';
import { DataTable, PaginationFooter } from './DataTable';
import {
  detailErrorClass,
  detailHeadingClass,
  detailSummaryClass,
  subsectionHeaderClass
} from './styles';
import { AiCostRiskGroupDetail } from './types';
import {
  formatAccountName,
  formatCompact,
  formatNumber,
  formatProviderModel,
  formatTime,
  formatUsd,
  numberValue
} from './formatters';

export default function RiskGroupDetail({
  detail,
  error,
  loading,
  loadingMore,
  onLoadMore,
  eventsError
}: {
  detail: AiCostRiskGroupDetail | null;
  error: string;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  eventsError: string;
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
          <span>Accounts</span>
          <strong>{formatNumber(detail.summary.accountCount)}</strong>
        </div>
        <div>
          <span>Events</span>
          <strong>{formatNumber(detail.summary.eventCount)}</strong>
        </div>
        <div>
          <span>Cost</span>
          <strong>{formatUsd(detail.summary.estimatedCostUsd)}</strong>
        </div>
        <div>
          <span>Energy</span>
          <strong>{formatCompact(detail.summary.energyChargedUnits)}</strong>
        </div>
      </div>

      <h3 className={detailHeadingClass}>Top Accounts</h3>
      <DataTable
        columns={[
          {
            key: 'username',
            label: 'Account',
            render: (value, row) => formatAccountName({ value, row })
          },
          { key: 'accountVerifiedEmail', label: 'Email' },
          { key: 'identities', label: 'Energy Identities' },
          {
            key: 'eventCount',
            label: 'Events',
            align: 'right',
            render: formatNumber
          },
          {
            key: 'estimatedCostUsd',
            label: 'Cost',
            align: 'right',
            render: formatUsd
          }
        ]}
        rows={detail.accounts}
      />

      <SubsectionHeader
        title="Recent Events"
        note={`Showing ${formatNumber(detail.events.length)} of ${formatNumber(
          detail.summary.eventCount
        )} events.`}
      />
      <DataTable
        columns={[
          {
            key: 'createdAt',
            label: 'Time',
            render: (value) => formatTime(numberValue(value))
          },
          {
            key: 'username',
            label: 'Account',
            render: (value, row) => formatAccountName({ value, row })
          },
          { key: 'surface', label: 'Surface' },
          { key: 'operation', label: 'Operation' },
          {
            key: 'model',
            label: 'Model',
            render: (value, row) => formatProviderModel(value, row)
          },
          {
            key: 'targetType',
            label: 'Target',
            render: (_value, row) =>
              row.targetType ? `${row.targetType}:${row.targetId || 0}` : '—'
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
    </>
  );
}

function SubsectionHeader({
  title,
  note
}: {
  title: string;
  note: string;
}) {
  return (
    <div className={subsectionHeaderClass}>
      <h3>{title}</h3>
      <span>{note}</span>
    </div>
  );
}

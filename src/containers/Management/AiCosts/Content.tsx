import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import RiskGroupDetail from './RiskGroupDetail';
import { DataTable, EmptyMessage, PaginationFooter } from './DataTable';
import {
  formatAccountName,
  formatBillingPolicy,
  formatCompact,
  formatNumber,
  formatProviderModel,
  formatProviderName,
  formatTime,
  formatTokenLabel,
  formatUsd,
  getRiskGroupRowKey,
  getRiskGroupSelectionKey,
  getWidthPercent,
  numberValue,
  shortenHash
} from './formatters';
import {
  actionsClass,
  barRowClass,
  barsClass,
  emptyStateClass,
  headerClass,
  metricCardClass,
  pageClass,
  panelClass,
  rangeClass,
  summaryGridClass,
  twoColumnClass
} from './styles';
import {
  AiCostReport,
  AiCostRiskGroupDetail,
  AiCostRow,
  RangeOption
} from './types';

const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Today', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
];

export default function Content({
  days,
  downloading,
  error,
  eventsError,
  eventsLoadingMore,
  loading,
  onDownloadCSV,
  onLoadMoreEvents,
  onLoadMoreRiskGroupEvents,
  onRefresh,
  onRiskGroupSelect,
  onSelectDays,
  onCloseRiskGroup,
  report,
  riskGroupDetail,
  riskGroupError,
  riskGroupEventsError,
  riskGroupEventsLoadingMore,
  riskGroupLoading,
  selectedRiskGroup
}: {
  days: RangeOption;
  downloading: boolean;
  error: string;
  eventsError: string;
  eventsLoadingMore: boolean;
  loading: boolean;
  onDownloadCSV: () => void;
  onLoadMoreEvents: () => void;
  onLoadMoreRiskGroupEvents: () => void;
  onRefresh: () => void;
  onRiskGroupSelect: (row: AiCostRow) => void;
  onSelectDays: (days: RangeOption) => void;
  onCloseRiskGroup: () => void;
  report: AiCostReport | null;
  riskGroupDetail: AiCostRiskGroupDetail | null;
  riskGroupError: string;
  riskGroupEventsError: string;
  riskGroupEventsLoadingMore: boolean;
  riskGroupLoading: boolean;
  selectedRiskGroup: {
    riskKeyType: string;
    riskKeyHash: string;
  } | null;
}) {
  const dayMaxCost = useMemo(() => {
    return Math.max(
      0,
      ...(report?.byDay || []).map((row) => numberValue(row.estimatedCostUsd))
    );
  }, [report]);

  return (
    <div className={pageClass}>
      <header className={headerClass}>
        <div>
          <h1>AI Costs</h1>
          <p>
            Official Twinkle-paid provider spend, Energy usage, helper calls,
            and account/risk-group attribution. Dates are bucketed by UTC day.
          </p>
        </div>
        <div className={actionsClass}>
          <div className={rangeClass}>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={days === option.value ? 'active' : ''}
                onClick={() => onSelectDays(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            color="darkerGray"
            variant="outline"
            loading={downloading}
            onClick={onDownloadCSV}
          >
            <Icon icon="file-csv" />
            CSV
          </Button>
          <Button color="logoBlue" variant="solid" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </header>

      {loading ? <Loading /> : null}

      {!loading && error ? (
        <div className={emptyStateClass}>
          <div>{error}</div>
          <Button color="logoBlue" variant="soft" onClick={onRefresh}>
            Try Again
          </Button>
        </div>
      ) : null}

      {!loading && !error && report ? (
        <>
          <section className={summaryGridClass}>
            <MetricCard
              label="Estimated Spend"
              value={formatUsd(report.summary.estimatedCostUsd)}
              detail={`${formatNumber(report.summary.eventCount)} events`}
              color="logoBlue"
            />
            <MetricCard
              label="Requests"
              value={formatNumber(report.summary.requestCount)}
              detail={`${formatCompact(report.summary.totalTokens)} tokens`}
              color="green"
            />
            <MetricCard
              label="Energy Charged"
              value={formatCompact(report.summary.energyChargedUnits)}
              detail={`${formatCompact(
                report.summary.energyOverflowUnits
              )} overflow`}
              color="orange"
            />
            <MetricCard
              label="Images"
              value={formatNumber(report.summary.imageCount)}
              detail="image events"
              color="rose"
            />
          </section>

          <Panel title="Daily Spend (UTC)">
            {report.byDay.length === 0 ? (
              <EmptyMessage />
            ) : (
              <div className={barsClass}>
                {report.byDay.map((row) => (
                  <BarRow
                    key={row.dayIndex || row.dayKey}
                    label={row.dayKey || String(row.dayIndex || '')}
                    value={formatUsd(row.estimatedCostUsd)}
                    widthPercent={getWidthPercent(
                      row.estimatedCostUsd,
                      dayMaxCost
                    )}
                    detail={`${formatNumber(row.requestCount)} requests`}
                  />
                ))}
              </div>
            )}
          </Panel>

          <div className={twoColumnClass}>
            <Panel title="Top Surfaces" note="Top 100 by estimated spend.">
              <DataTable
                columns={[
                  { key: 'surface', label: 'Surface' },
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
                  },
                  {
                    key: 'requestCount',
                    label: 'Req',
                    align: 'right',
                    render: formatNumber
                  }
                ]}
                rows={report.bySurface}
              />
            </Panel>

            <Panel
              title="Top Providers"
              note="Top 100 provider/model/policy groups."
            >
              <DataTable
                columns={[
                  {
                    key: 'provider',
                    label: 'Provider',
                    render: (value, row) => formatProviderName(value, row)
                  },
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
                rows={report.byProviderModel}
              />
            </Panel>
          </div>

          <div className={twoColumnClass}>
            <Panel title="Billing Policy">
              <DataTable
                columns={[
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
                  },
                  {
                    key: 'energyChargedUnits',
                    label: 'Energy',
                    align: 'right',
                    render: formatCompact
                  },
                  {
                    key: 'coinCharged',
                    label: 'Coins',
                    align: 'right',
                    render: formatNumber
                  }
                ]}
                rows={report.byBillingPolicy}
              />
            </Panel>

            <Panel title="Top Accounts" note="Top 50 by estimated spend.">
              <DataTable
                columns={[
                  {
                    key: 'username',
                    label: 'Account',
                    render: (value, row) => formatAccountName({ value, row })
                  },
                  { key: 'accountVerifiedEmail', label: 'Email' },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  },
                  {
                    key: 'requestCount',
                    label: 'Req',
                    align: 'right',
                    render: formatNumber
                  }
                ]}
                rows={report.topAccounts}
              />
            </Panel>
          </div>

          <div className={twoColumnClass}>
            <Panel
              title="Top Energy Identities"
              note="Top 50 shared Energy identities by spend."
            >
              <DataTable
                columns={[
                  { key: 'identityKey', label: 'Identity' },
                  {
                    key: 'accountCount',
                    label: 'Accounts',
                    align: 'right',
                    render: formatNumber
                  },
                  { key: 'userIds', label: 'User IDs' },
                  {
                    key: 'estimatedCostUsd',
                    label: 'Cost',
                    align: 'right',
                    render: formatUsd
                  }
                ]}
                rows={report.topIdentities}
              />
            </Panel>

            <Panel
              title="Top Risk Groups"
              note="Top 50 shared device/IP/user-agent groups by spend. Click a group to inspect accounts and events."
            >
              <DataTable
                columns={[
                  { key: 'riskKeyType', label: 'Type' },
                  {
                    key: 'riskKeyHash',
                    label: 'Hash',
                    render: (value) => shortenHash(String(value || ''))
                  },
                  {
                    key: 'accountCount',
                    label: 'Accounts',
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
                rows={report.topRiskGroups}
                rowKey={getRiskGroupRowKey}
                activeRowKey={
                  selectedRiskGroup
                    ? getRiskGroupSelectionKey(selectedRiskGroup)
                    : ''
                }
                onRowClick={onRiskGroupSelect}
              />
            </Panel>
          </div>

          {selectedRiskGroup ? (
            <Panel
              title="Risk Group Detail"
              note={`Top 100 accounts, paginated events. ${
                selectedRiskGroup.riskKeyType
              } ${shortenHash(selectedRiskGroup.riskKeyHash)}`}
              action={
                <Button
                  color="darkerGray"
                  variant="outline"
                  onClick={onCloseRiskGroup}
                >
                  Close
                </Button>
              }
            >
              <RiskGroupDetail
                detail={riskGroupDetail}
                error={riskGroupError}
                loading={riskGroupLoading}
                loadingMore={riskGroupEventsLoadingMore}
                onLoadMore={onLoadMoreRiskGroupEvents}
                eventsError={riskGroupEventsError}
              />
            </Panel>
          ) : null}

          <Panel
            title="Recent Events"
            note={`Showing ${formatNumber(
              report.recentEvents.length
            )} of ${formatNumber(report.summary.eventCount)} events.`}
          >
            <DataTable
              columns={[
                {
                  key: 'createdAt',
                  label: 'Time',
                  render: (value) => formatTime(numberValue(value))
                },
                { key: 'source', label: 'Source', render: formatTokenLabel },
                { key: 'surface', label: 'Surface' },
                { key: 'operation', label: 'Operation' },
                {
                  key: 'billingPolicy',
                  label: 'Policy',
                  render: formatBillingPolicy
                },
                {
                  key: 'username',
                  label: 'Account',
                  render: (value, row) => formatAccountName({ value, row })
                },
                {
                  key: 'estimatedCostUsd',
                  label: 'Cost',
                  align: 'right',
                  render: formatUsd
                }
              ]}
              rows={report.recentEvents}
            />
            <PaginationFooter
              hasMore={report.recentEventsHasMore}
              loading={eventsLoadingMore}
              error={eventsError}
              onLoadMore={onLoadMoreEvents}
            />
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  note,
  action,
  children
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>{title}</h2>
          {note ? <span>{note}</span> : null}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div
      className={metricCardClass}
      style={{
        borderColor: Color[color](0.35),
        background: Color[color](0.07)
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function BarRow({
  label,
  value,
  detail,
  widthPercent
}: {
  label: string;
  value: string;
  detail: string;
  widthPercent: number;
}) {
  return (
    <div className={barRowClass}>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <div className="bar-track">
        <div style={{ width: `${widthPercent}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

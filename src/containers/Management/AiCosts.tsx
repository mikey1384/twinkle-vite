import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  Color,
  mediumBorderRadius,
  mobileMaxWidth
} from '~/constants/css';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import { css } from '@emotion/css';

type RangeOption = 1 | 7 | 30 | 90;

interface AiCostSummary {
  accountCount?: number;
  eventCount: number;
  requestCount: number;
  estimatedCostUsd: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imageCount: number;
  audioSeconds: number;
  energyUnits: number;
  energyChargedUnits: number;
  energyOverflowUnits: number;
  coinCharged: number;
}

interface AiCostRow extends Partial<AiCostSummary> {
  eventId?: number;
  source?: string;
  sourceRank?: number;
  dayIndex?: number;
  dayKey?: string;
  userId?: number;
  username?: string;
  identityKey?: string;
  accountVerifiedEmail?: string;
  verifiedEmail?: string;
  provider?: string;
  model?: string;
  surface?: string;
  operation?: string;
  billingPolicy?: string;
  targetType?: string;
  targetId?: number | string;
  accountCount?: number;
  userIds?: string;
  identities?: string;
  riskKeyType?: string;
  riskKeyHash?: string;
  createdAt?: number;
}

interface AiCostEventCursor {
  createdAt: number;
  sourceRank: number;
  eventId: number;
}

interface AiCostEventPage {
  events: AiCostRow[];
  nextCursor: AiCostEventCursor | null;
  hasMore: boolean;
  pageSize: number;
}

interface AiCostReport {
  days: number;
  startDayIndex: number;
  endDayIndex: number;
  generatedAt: number;
  summary: AiCostSummary;
  byDay: AiCostRow[];
  bySurface: AiCostRow[];
  byProviderModel: AiCostRow[];
  byBillingPolicy: AiCostRow[];
  topAccounts: AiCostRow[];
  topIdentities: AiCostRow[];
  topRiskGroups: AiCostRow[];
  recentEvents: AiCostRow[];
  recentEventsCursor: AiCostEventCursor | null;
  recentEventsHasMore: boolean;
  recentEventsPageSize: number;
}

interface AiCostRiskGroupDetail {
  days: number;
  startDayIndex: number;
  endDayIndex: number;
  generatedAt: number;
  riskKeyType: string;
  riskKeyHash: string;
  summary: AiCostSummary & {
    riskKeyType?: string;
    riskKeyHash?: string;
  };
  accounts: AiCostRow[];
  events: AiCostRow[];
  eventsCursor: AiCostEventCursor | null;
  eventsHasMore: boolean;
  eventsPageSize: number;
}

const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Today', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
];

export default function AiCosts() {
  const [days, setDays] = useState<RangeOption>(7);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<AiCostReport | null>(null);
  const [selectedRiskGroup, setSelectedRiskGroup] = useState<{
    riskKeyType: string;
    riskKeyHash: string;
  } | null>(null);
  const [riskGroupDetail, setRiskGroupDetail] =
    useState<AiCostRiskGroupDetail | null>(null);
  const [riskGroupLoading, setRiskGroupLoading] = useState(false);
  const [riskGroupEventsLoadingMore, setRiskGroupEventsLoadingMore] =
    useState(false);
  const [riskGroupError, setRiskGroupError] = useState('');
  const [riskGroupEventsError, setRiskGroupEventsError] = useState('');
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const loadAiCostReport = useAppContext(
    (v) => v.requestHelpers.loadAiCostReport
  );
  const loadAiCostEvents = useAppContext(
    (v) => v.requestHelpers.loadAiCostEvents
  );
  const loadAiCostReportCSV = useAppContext(
    (v) => v.requestHelpers.loadAiCostReportCSV
  );
  const loadAiCostRiskGroup = useAppContext(
    (v) => v.requestHelpers.loadAiCostRiskGroup
  );
  const loadAiCostRiskGroupEvents = useAppContext(
    (v) => v.requestHelpers.loadAiCostRiskGroupEvents
  );
  const canView = managementLevel >= ADMIN_MANAGEMENT_LEVEL;

  useEffect(() => {
    if (!canView) return;
    let canceled = false;
    void init();
    async function init() {
      setLoading(true);
      setError('');
      setEventsError('');
      setEventsLoadingMore(false);
      try {
        const data = await loadAiCostReport(days);
        if (canceled) return;
        setReport(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load AI cost report');
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, days, reloadKey]);

  useEffect(() => {
    if (!canView || !selectedRiskGroup) {
      setRiskGroupDetail(null);
      setRiskGroupError('');
      setRiskGroupEventsError('');
      setRiskGroupLoading(false);
      setRiskGroupEventsLoadingMore(false);
      return;
    }
    const riskGroup = selectedRiskGroup;
    let canceled = false;
    void init();
    async function init() {
      setRiskGroupLoading(true);
      setRiskGroupError('');
      setRiskGroupEventsError('');
      setRiskGroupEventsLoadingMore(false);
      try {
        const data = await loadAiCostRiskGroup({
          days,
          riskKeyType: riskGroup.riskKeyType,
          riskKeyHash: riskGroup.riskKeyHash
        });
        if (canceled) return;
        setRiskGroupDetail(data);
      } catch (loadError: any) {
        if (canceled) return;
        setRiskGroupError(
          loadError?.message || 'Failed to load risk group detail'
        );
      } finally {
        if (!canceled) {
          setRiskGroupLoading(false);
        }
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canView,
    days,
    reloadKey,
    selectedRiskGroup?.riskKeyType,
    selectedRiskGroup?.riskKeyHash
  ]);

  const dayMaxCost = useMemo(() => {
    return Math.max(
      0,
      ...(report?.byDay || []).map((row) => numberValue(row.estimatedCostUsd))
    );
  }, [report]);

  if (!canView) {
    return (
      <InvalidPage
        title="Admins only"
        text="AI cost reporting is only available to admins."
      />
    );
  }

  return (
    <div className={pageClass}>
      <header className={headerClass}>
        <div>
          <h1>AI Costs</h1>
          <p>
            Official Twinkle-paid provider spend, Energy usage, helper calls,
            and account/risk-group attribution.
          </p>
        </div>
        <div className={actionsClass}>
          <div className={rangeClass}>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={days === option.value ? 'active' : ''}
                onClick={() => setDays(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            color="darkerGray"
            variant="outline"
            loading={downloading}
            onClick={handleDownloadCSV}
          >
            <Icon icon="file-csv" />
            CSV
          </Button>
          <Button
            color="logoBlue"
            variant="solid"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Refresh
          </Button>
        </div>
      </header>

      {loading && <Loading />}

      {!loading && error && (
        <div className={emptyStateClass}>
          <div>{error}</div>
          <Button
            color="logoBlue"
            variant="soft"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && report && (
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
              detail={`${formatCompact(report.summary.energyOverflowUnits)} overflow`}
              color="orange"
            />
            <MetricCard
              label="Images + Audio"
              value={formatNumber(report.summary.imageCount)}
              detail={`${formatDuration(report.summary.audioSeconds)} audio`}
              color="rose"
            />
          </section>

          <Panel title="Daily Spend">
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
                    render: (value, row) =>
                      formatAccountName({ value, row })
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
                onRowClick={handleRiskGroupSelect}
              />
            </Panel>
          </div>

          {selectedRiskGroup && (
            <Panel
              title="Risk Group Detail"
              note={`Top 100 accounts, paginated events. ${selectedRiskGroup.riskKeyType} ${shortenHash(
                selectedRiskGroup.riskKeyHash
              )}`}
              action={
                <Button
                  color="darkerGray"
                  variant="outline"
                  onClick={() => setSelectedRiskGroup(null)}
                >
                  Close
                </Button>
              }
            >
              {riskGroupLoading && <Loading />}
              {!riskGroupLoading && riskGroupError && (
                <div className={detailErrorClass}>{riskGroupError}</div>
              )}
              {!riskGroupLoading && !riskGroupError && riskGroupDetail && (
                <>
                  <div className={detailSummaryClass}>
                    <div>
                      <span>Accounts</span>
                      <strong>
                        {formatNumber(riskGroupDetail.summary.accountCount)}
                      </strong>
                    </div>
                    <div>
                      <span>Events</span>
                      <strong>
                        {formatNumber(riskGroupDetail.summary.eventCount)}
                      </strong>
                    </div>
                    <div>
                      <span>Cost</span>
                      <strong>
                        {formatUsd(riskGroupDetail.summary.estimatedCostUsd)}
                      </strong>
                    </div>
                    <div>
                      <span>Energy</span>
                      <strong>
                        {formatCompact(
                          riskGroupDetail.summary.energyChargedUnits
                        )}
                      </strong>
                    </div>
                  </div>

                  <h3 className={detailHeadingClass}>Top Accounts</h3>
                  <DataTable
                    columns={[
                      {
                        key: 'username',
                        label: 'Account',
                        render: (value, row) =>
                          formatAccountName({ value, row })
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
                    rows={riskGroupDetail.accounts}
                  />

                  <SubsectionHeader
                    title="Recent Events"
                    note={`Showing ${formatNumber(
                      riskGroupDetail.events.length
                    )} of ${formatNumber(
                      riskGroupDetail.summary.eventCount
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
                        render: (value, row) =>
                          formatAccountName({ value, row })
                      },
                      { key: 'surface', label: 'Surface' },
                      { key: 'operation', label: 'Operation' },
                      {
                        key: 'model',
                        label: 'Model',
                        render: (value, row) =>
                          formatProviderModel(value, row)
                      },
                      {
                        key: 'targetType',
                        label: 'Target',
                        render: (_value, row) =>
                          row.targetType
                            ? `${row.targetType}:${row.targetId || 0}`
                            : '—'
                      },
                      {
                        key: 'estimatedCostUsd',
                        label: 'Cost',
                        align: 'right',
                        render: formatUsd
                      }
                    ]}
                    rows={riskGroupDetail.events}
                  />
                  <PaginationFooter
                    hasMore={riskGroupDetail.eventsHasMore}
                    loading={riskGroupEventsLoadingMore}
                    error={riskGroupEventsError}
                    onLoadMore={handleLoadMoreRiskGroupEvents}
                  />
                </>
              )}
            </Panel>
          )}

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
                  render: (value, row) =>
                    formatAccountName({ value, row })
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
              onLoadMore={handleLoadMoreEvents}
            />
          </Panel>
        </>
      )}
    </div>
  );

  async function handleDownloadCSV() {
    setDownloading(true);
    try {
      const response = await loadAiCostReportCSV(days);
      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai-costs-${days}d.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error downloading AI cost CSV:', downloadError);
    } finally {
      setDownloading(false);
    }
  }

  async function handleLoadMoreEvents() {
    if (!report?.recentEventsHasMore || !report.recentEventsCursor) return;
    const requestDays = days;
    const cursor = report.recentEventsCursor;
    setEventsLoadingMore(true);
    setEventsError('');
    try {
      const page = (await loadAiCostEvents({
        days: requestDays,
        cursor
      })) as AiCostEventPage;
      setReport((currentReport) => {
        if (!currentReport || currentReport.days !== requestDays) {
          return currentReport;
        }
        return {
          ...currentReport,
          recentEvents: [...currentReport.recentEvents, ...page.events],
          recentEventsCursor: page.nextCursor,
          recentEventsHasMore: page.hasMore,
          recentEventsPageSize: page.pageSize
        };
      });
    } catch (loadError: any) {
      setEventsError(loadError?.message || 'Failed to load more events');
    } finally {
      setEventsLoadingMore(false);
    }
  }

  async function handleLoadMoreRiskGroupEvents() {
    if (
      !selectedRiskGroup ||
      !riskGroupDetail?.eventsHasMore ||
      !riskGroupDetail.eventsCursor
    ) {
      return;
    }
    const requestDays = days;
    const riskGroup = selectedRiskGroup;
    const cursor = riskGroupDetail.eventsCursor;
    setRiskGroupEventsLoadingMore(true);
    setRiskGroupEventsError('');
    try {
      const page = (await loadAiCostRiskGroupEvents({
        days: requestDays,
        riskKeyType: riskGroup.riskKeyType,
        riskKeyHash: riskGroup.riskKeyHash,
        cursor
      })) as AiCostEventPage;
      setRiskGroupDetail((currentDetail) => {
        if (
          !currentDetail ||
          currentDetail.days !== requestDays ||
          currentDetail.riskKeyType !== riskGroup.riskKeyType ||
          currentDetail.riskKeyHash !== riskGroup.riskKeyHash
        ) {
          return currentDetail;
        }
        return {
          ...currentDetail,
          events: [...currentDetail.events, ...page.events],
          eventsCursor: page.nextCursor,
          eventsHasMore: page.hasMore,
          eventsPageSize: page.pageSize
        };
      });
    } catch (loadError: any) {
      setRiskGroupEventsError(
        loadError?.message || 'Failed to load more risk group events'
      );
    } finally {
      setRiskGroupEventsLoadingMore(false);
    }
  }

  function handleRiskGroupSelect(row: AiCostRow) {
    if (!row.riskKeyType || !row.riskKeyHash) return;
    setSelectedRiskGroup({
      riskKeyType: row.riskKeyType,
      riskKeyHash: row.riskKeyHash
    });
  }
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
          {note && <span>{note}</span>}
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

function SubsectionHeader({ title, note }: { title: string; note: string }) {
  return (
    <div className={subsectionHeaderClass}>
      <h3>{title}</h3>
      <span>{note}</span>
    </div>
  );
}

function PaginationFooter({
  hasMore,
  loading,
  error,
  onLoadMore
}: {
  hasMore: boolean;
  loading: boolean;
  error: string;
  onLoadMore: () => void;
}) {
  if (!hasMore && !error) return null;
  return (
    <div className={paginationFooterClass}>
      {error && <span>{error}</span>}
      {hasMore && (
        <Button
          color="logoBlue"
          variant="outline"
          loading={loading}
          onClick={onLoadMore}
        >
          Load More
        </Button>
      )}
    </div>
  );
}

function DataTable({
  columns,
  rows,
  rowKey,
  activeRowKey,
  onRowClick
}: {
  columns: {
    key: keyof AiCostRow;
    label: string;
    align?: 'left' | 'right';
    render?: (value: unknown, row: AiCostRow) => React.ReactNode;
  }[];
  rows: AiCostRow[];
  rowKey?: (row: AiCostRow, rowIndex: number) => string;
  activeRowKey?: string;
  onRowClick?: (row: AiCostRow) => void;
}) {
  if (rows.length === 0) {
    return <EmptyMessage />;
  }

  return (
    <div className={tableWrapClass}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} style={{ textAlign: column.align }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const key = rowKey
              ? rowKey(row, rowIndex)
              : getRowKey(row, rowIndex);
            const isClickable = Boolean(onRowClick);
            return (
              <tr
                key={key}
                className={[
                  isClickable ? 'clickable-row' : '',
                  activeRowKey === key ? 'active-row' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={isClickable ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  isClickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick?.(row);
                        }
                      }
                    : undefined
                }
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    style={{ textAlign: column.align }}
                    title={String(row[column.key] ?? '')}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : formatCell(row[column.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyMessage() {
  return <div className={emptyInlineClass}>No data for this range.</div>;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function formatUsd(value: unknown) {
  return `$${numberValue(value).toFixed(4)}`;
}

function formatNumber(value: unknown) {
  return Math.floor(numberValue(value)).toLocaleString();
}

function formatCompact(value: unknown) {
  return Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(numberValue(value));
}

function formatDuration(value: unknown) {
  const seconds = Math.floor(numberValue(value));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTime(value: number) {
  if (!value) return '';
  return new Date(value * 1000).toLocaleString();
}

function formatCell(value: unknown) {
  if (typeof value === 'number') return formatNumber(value);
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function normalizeToken(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatTokenLabel(value: unknown) {
  const text = normalizeToken(value);
  if (!text) return '—';
  return text
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'ai') return 'AI';
      if (lower === 'tts') return 'TTS';
      if (lower === 'usd') return 'USD';
      if (lower === 'id') return 'ID';
      return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

function formatBillingPolicy(value: unknown) {
  const policy = normalizeToken(value).toLowerCase();
  if (policy === 'ai_energy') return 'AI Energy';
  if (policy === 'system_covered') return 'System covered';
  if (policy === 'system_covered_failure') return 'System covered failure';
  if (policy === 'free_helper') return 'Free helper';
  if (policy === 'free_product') return 'Free product';
  if (policy === 'retry_fallback_recovery') return 'Retry recovery';
  if (policy === 'private_key_excluded') return 'Private key';
  return formatTokenLabel(value);
}

function inferProviderFromModel(model: unknown) {
  const normalizedModel = normalizeToken(model).toLowerCase();
  if (
    normalizedModel.startsWith('gpt') ||
    normalizedModel.startsWith('o1') ||
    normalizedModel.startsWith('o3') ||
    normalizedModel.startsWith('o4') ||
    normalizedModel.startsWith('text-embedding') ||
    normalizedModel.startsWith('tts') ||
    normalizedModel.startsWith('whisper') ||
    normalizedModel.startsWith('gpt-image')
  ) {
    return 'openai';
  }
  if (normalizedModel.startsWith('claude')) return 'anthropic';
  if (normalizedModel.startsWith('gemini')) return 'google';
  return '';
}

function formatProviderName(value: unknown, row?: AiCostRow) {
  const provider =
    normalizeToken(value).toLowerCase() || inferProviderFromModel(row?.model);
  const resolvedProvider =
    provider === 'unknown' ? inferProviderFromModel(row?.model) : provider;
  if (resolvedProvider === 'openai') return 'OpenAI';
  if (resolvedProvider === 'anthropic') return 'Anthropic';
  if (resolvedProvider === 'google') return 'Google';
  if (resolvedProvider) return formatTokenLabel(resolvedProvider);
  return 'No provider captured';
}

function formatProviderModel(value: unknown, row?: AiCostRow) {
  const model = normalizeToken(value);
  if (!model) return 'No model captured';
  const provider = normalizeToken(row?.provider).toLowerCase();
  if (model === 'containers') return 'Code containers';
  if (model === 'files') {
    return provider === 'anthropic' ? 'Claude files' : 'Files API';
  }
  return model;
}

function formatAccountName({
  value,
  row
}: {
  value: unknown;
  row: AiCostRow;
}) {
  const username = typeof value === 'string' ? value.trim() : '';
  if (username) return username;
  return row.userId ? `User ${row.userId}` : 'System';
}

function shortenHash(value: string) {
  if (value.length <= 16) return value || '—';
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getWidthPercent(value: unknown, maxValue: number) {
  if (maxValue <= 0) return 0;
  return Math.max(3, Math.min(100, (numberValue(value) / maxValue) * 100));
}

function getRowKey(row: AiCostRow, rowIndex: number) {
  return [
    row.eventId,
    row.source,
    row.dayIndex,
    row.userId,
    row.identityKey,
    row.riskKeyType,
    row.riskKeyHash,
    row.surface,
    row.operation,
    row.createdAt,
    rowIndex
  ]
    .filter((value) => value !== undefined && value !== '')
    .join(':');
}

function getRiskGroupSelectionKey(row: {
  riskKeyType?: string;
  riskKeyHash?: string;
}) {
  return `${row.riskKeyType || ''}:${row.riskKeyHash || ''}`;
}

function getRiskGroupRowKey(row: AiCostRow) {
  return getRiskGroupSelectionKey(row);
}

const pageClass = css`
  width: 100%;
  padding: 1rem;
  padding-bottom: 10rem;
  color: ${Color.black()};

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0;
    padding-bottom: 8rem;
  }
`;

const headerClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.6rem;
  padding: 1.6rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};

  h1 {
    margin: 0;
    font-size: 2.8rem;
  }

  p {
    margin: 0.6rem 0 0;
    color: ${Color.darkGray()};
    font-size: 1.45rem;
    line-height: 1.45;
  }

  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

const actionsClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.8rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const rangeClass = css`
  display: flex;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};

  button {
    border: 0;
    border-right: 1px solid ${Color.borderGray()};
    background: ${Color.white()};
    color: ${Color.darkGray()};
    padding: 0.9rem 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  button:last-child {
    border-right: 0;
  }

  button.active {
    background: ${Color.logoBlue(0.14)};
    color: ${Color.logoBlue()};
  }
`;

const summaryGridClass = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.6rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 1rem;
  }
`;

const metricCardClass = css`
  border: 1px solid;
  border-radius: ${mediumBorderRadius};
  padding: 1.4rem;
  min-width: 0;

  span,
  small {
    display: block;
    color: ${Color.darkGray()};
    font-size: 1.25rem;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 0.45rem 0;
    font-size: 2.4rem;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
`;

const panelClass = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};
  overflow: hidden;
  margin-bottom: 1.6rem;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid ${Color.borderGray()};
  }

  > header > div:first-child {
    min-width: 0;
    flex: 1;
  }

  h2 {
    margin: 0;
    font-size: 1.8rem;
  }

  header span {
    color: ${Color.darkGray()};
    font-size: 1.2rem;
    text-align: right;
  }

  > div {
    padding: 1.2rem;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

const twoColumnClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const barsClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const barRowClass = css`
  display: grid;
  grid-template-columns: minmax(12rem, 0.9fr) minmax(12rem, 2fr) auto;
  align-items: center;
  gap: 1rem;
  font-size: 1.35rem;

  > div:first-child {
    min-width: 0;
  }

  > div:first-child strong,
  > div:first-child span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > div:first-child span {
    margin-top: 0.2rem;
    color: ${Color.darkGray()};
    font-size: 1.2rem;
  }

  .bar-track {
    height: 1rem;
    overflow: hidden;
    border-radius: 999px;
    background: ${Color.inputGray()};
  }

  .bar-track > div {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${Color.logoBlue()},
      ${Color.green()}
    );
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const tableWrapClass = css`
  width: 100%;
  overflow-x: auto;

  table {
    width: 100%;
    min-width: 58rem;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 1rem;
    border-bottom: 1px solid ${Color.borderGray(0.7)};
    font-size: 1.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 24rem;
  }

  th {
    color: ${Color.darkGray()};
    font-size: 1.15rem;
    text-transform: uppercase;
    background: ${Color.whiteGray()};
  }

  td {
    color: ${Color.black()};
  }

  tbody tr:hover td {
    background: ${Color.whiteBlueGray()};
  }

  tbody tr.clickable-row {
    cursor: pointer;
  }

  tbody tr.active-row td {
    background: ${Color.logoBlue(0.1)};
  }

  tbody tr.clickable-row:focus {
    outline: 2px solid ${Color.logoBlue(0.45)};
    outline-offset: -2px;
  }
`;

const detailSummaryClass = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.6rem;

  > div {
    min-width: 0;
    border: 1px solid ${Color.borderGray()};
    border-radius: ${mediumBorderRadius};
    padding: 1rem;
    background: ${Color.whiteGray()};
  }

  span,
  strong {
    display: block;
  }

  span {
    color: ${Color.darkGray()};
    font-size: 1.15rem;
    font-weight: 700;
  }

  strong {
    margin-top: 0.4rem;
    font-size: 1.8rem;
    overflow-wrap: anywhere;
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const detailHeadingClass = css`
  margin: 1.6rem 0 0.8rem;
  font-size: 1.45rem;
`;

const subsectionHeaderClass = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.6rem 0 0.8rem;

  h3 {
    margin: 0;
    font-size: 1.45rem;
  }

  span {
    color: ${Color.darkGray()};
    font-size: 1.2rem;
    font-weight: 700;
    text-align: right;
  }

  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
`;

const paginationFooterClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.2rem 0 0.2rem;

  span {
    color: ${Color.red()};
    font-size: 1.25rem;
    font-weight: 700;
  }
`;

const detailErrorClass = css`
  padding: 1.4rem;
  border: 1px solid ${Color.red(0.25)};
  border-radius: ${mediumBorderRadius};
  color: ${Color.red()};
  background: ${Color.red(0.06)};
  font-size: 1.35rem;
`;

const emptyStateClass = css`
  display: flex;
  min-height: 24rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  color: ${Color.darkGray()};
  font-size: 1.6rem;
  text-align: center;
`;

const emptyInlineClass = css`
  padding: 2rem;
  color: ${Color.darkGray()};
  text-align: center;
  font-size: 1.4rem;
`;

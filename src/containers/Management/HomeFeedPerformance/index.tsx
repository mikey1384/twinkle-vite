import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import {
  formatCompact,
  formatNumber,
  formatTime
} from '../AiCosts/helpers/formatters';
import {
  actionsClass,
  emptyInlineClass,
  emptyStateClass,
  metricCardClass,
  panelClass,
  rangeClass,
  summaryGridClass,
  tableWrapClass
} from '../AiCosts/styles';
import { Color } from '~/constants/css';

type HomeFeedPerformanceRangeOption = 1 | 6 | 24 | 168;

interface HomeFeedPerformanceSummary {
  eventCount: number;
  serverEventCount: number;
  clientEventCount: number;
  scrollStallCount: number;
  staleIgnoredCount: number;
  skippedNoLoadMoreButtonCount: number;
  duplicateExistingFeedCount: number;
  p50ServerTotalMs: number;
  p95ServerTotalMs: number;
  p50RequestDurationMs: number;
  p95RequestDurationMs: number;
  p50TriggerToPaintMs: number;
  p95TriggerToPaintMs: number;
  p95AppendToPaintMs: number;
  avgVisibleRowsReturned: number;
  avgPayloadBytes: number;
  generatedAt: number;
}

interface HomeFeedPerformanceCategoryRow {
  category: string;
  subFilter: string;
  eventCount: number;
  clientEventCount: number;
  serverEventCount: number;
  scrollStallCount: number;
  staleIgnoredCount: number;
  p95ServerTotalMs: number;
  p95RequestDurationMs: number;
  p95TriggerToPaintMs: number;
  avgRowsReturned: number;
}

interface HomeFeedPerformanceEventRow {
  id: number;
  createdAt: number;
  eventType: string;
  clientRequestId: string;
  source: string;
  category: string;
  subFilter: string;
  feedFilter: string;
  displayOrder: string;
  orderByLabel: string;
  loadingMore: boolean;
  totalMs: number;
  requestDurationMs: number;
  triggerToPaintMs: number;
  appendToPaintMs: number;
  startRemainingPx: number;
  responseRemainingPx: number;
  paintRemainingPx: number;
  rawRowsScanned: number;
  visibleRowsReturned: number;
  feedsReturnedCount: number;
  payloadBytes: number;
  duplicateExistingFeedCount: number;
  reachedLoadedEndDuringRequest: boolean;
  staleIgnored: boolean;
  skippedNoLoadMoreButton: boolean;
}

interface HomeFeedPerformanceReport {
  hours: number;
  generatedAt: number;
  summary: HomeFeedPerformanceSummary;
  byCategory: HomeFeedPerformanceCategoryRow[];
  recentEvents: HomeFeedPerformanceEventRow[];
  reportLimit: number;
}

const RANGE_OPTIONS: {
  label: string;
  value: HomeFeedPerformanceRangeOption;
}[] = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 }
];

export default function HomeFeedPerformance() {
  const [hours, setHours] = useState<HomeFeedPerformanceRangeOption>(24);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'json' | ''>(
    ''
  );
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<HomeFeedPerformanceReport | null>(null);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadHomeFeedPerformanceReport = useAppContext(
    (v) => v.requestHelpers.loadHomeFeedPerformanceReport
  );
  const loadHomeFeedPerformanceExport = useAppContext(
    (v) => v.requestHelpers.loadHomeFeedPerformanceExport
  );
  const clearHomeFeedPerformanceData = useAppContext(
    (v) => v.requestHelpers.clearHomeFeedPerformanceData
  );

  const visibleRecentEvents = (report?.recentEvents || []).slice(0, 40);

  useEffect(() => {
    if (userId !== ADMIN_USER_ID) return;
    let canceled = false;
    void loadReport();

    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const data = await loadHomeFeedPerformanceReport(hours);
        if (canceled) return;
        setReport(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load home feed performance');
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
  }, [hours, reloadKey, userId]);

  if (userId !== ADMIN_USER_ID) {
    return (
      <InvalidPage
        title="Owner only"
        text="Home feed performance is only available to the owner account."
      />
    );
  }

  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>Home Feed Performance</h2>
          {report ? (
            <span>
              {formatNumber(report.summary.eventCount)} events over {hours}h
            </span>
          ) : null}
        </div>
        <div className={actionsClass}>
          <div className={rangeClass}>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={hours === option.value ? 'active' : ''}
                onClick={() => setHours(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button color="darkerGray" variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button
            color="darkerGray"
            variant="outline"
            loading={exportingFormat === 'csv'}
            onClick={() => handleExport('csv')}
          >
            <Icon icon="file-csv" />
            CSV
          </Button>
          <Button
            color="darkerGray"
            variant="outline"
            loading={exportingFormat === 'json'}
            onClick={() => handleExport('json')}
          >
            <Icon icon="code" />
            JSON
          </Button>
          <Button
            color="red"
            variant="outline"
            loading={clearing}
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      </header>
      <div>
        {loading ? <Loading /> : null}

        {!loading && error ? (
          <div className={emptyStateClass}>
            <div>{error}</div>
            <Button color="logoBlue" variant="soft" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : null}

        {!loading && !error && report ? (
          <>
            <section className={summaryGridClass}>
              <MetricCard
                label="Request p95"
                value={formatMs(report.summary.p95RequestDurationMs)}
                detail={`${formatMs(report.summary.p50RequestDurationMs)} p50`}
                color="logoBlue"
              />
              <MetricCard
                label="Server p95"
                value={formatMs(report.summary.p95ServerTotalMs)}
                detail={`${formatMs(report.summary.p50ServerTotalMs)} p50`}
                color="green"
              />
              <MetricCard
                label="Trigger to Paint"
                value={formatMs(report.summary.p95TriggerToPaintMs)}
                detail={`${formatMs(report.summary.p50TriggerToPaintMs)} p50`}
                color="orange"
              />
              <MetricCard
                label="Scroll Stalls"
                value={formatNumber(report.summary.scrollStallCount)}
                detail={`${formatNumber(
                  report.summary.staleIgnoredCount
                )} stale ignored`}
                color="rose"
              />
            </section>

            <Subsection title="Categories">
              {report.byCategory.length === 0 ? (
                <div className={emptyInlineClass}>No sampled events.</div>
              ) : (
                <div className={tableWrapClass}>
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Events</th>
                        <th>Stalls</th>
                        <th>Server p95</th>
                        <th>Request p95</th>
                        <th>Paint p95</th>
                        <th>Avg Rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byCategory.map((row) => (
                        <CategoryRow
                          key={`${row.category}:${row.subFilter}`}
                          row={row}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Subsection>

            <Subsection title="Recent Samples">
              {visibleRecentEvents.length === 0 ? (
                <div className={emptyInlineClass}>No sampled events.</div>
              ) : (
                <div className={tableWrapClass}>
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Request</th>
                        <th>Feed</th>
                        <th>Request ms</th>
                        <th>Server ms</th>
                        <th>Paint ms</th>
                        <th>Runway</th>
                        <th>Rows</th>
                        <th>Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecentEvents.map((row) => (
                        <EventRow key={row.id} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Subsection>
          </>
        ) : null}
      </div>
    </section>
  );

  function handleRefresh() {
    setReloadKey((key) => key + 1);
  }

  async function handleExport(format: 'csv' | 'json') {
    setExportingFormat(format);
    try {
      const response = await loadHomeFeedPerformanceExport({ hours, format });
      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], {
              type: format === 'json' ? 'application/json' : 'text/csv'
            });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `home-feed-performance-${hours}h.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError: any) {
      setError(
        exportError?.message || 'Failed to export home feed performance data'
      );
    } finally {
      setExportingFormat('');
    }
  }

  async function handleClear() {
    setClearing(true);
    try {
      await clearHomeFeedPerformanceData(hours);
      setReport(null);
      handleRefresh();
    } catch (clearError: any) {
      setError(clearError?.message || 'Failed to clear home feed performance');
    } finally {
      setClearing(false);
    }
  }
}

function Subsection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: '1.4rem' }}>
      <h3 style={{ fontSize: '1.45rem', margin: '0 0 0.8rem' }}>{title}</h3>
      {children}
    </div>
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

function CategoryRow({ row }: { row: HomeFeedPerformanceCategoryRow }) {
  return (
    <tr>
      <td>{`${row.category}/${row.subFilter}`}</td>
      <td>{formatNumber(row.eventCount)}</td>
      <td>{formatNumber(row.scrollStallCount)}</td>
      <td>{formatMs(row.p95ServerTotalMs)}</td>
      <td>{formatMs(row.p95RequestDurationMs)}</td>
      <td>{formatMs(row.p95TriggerToPaintMs)}</td>
      <td>{formatNumber(row.avgRowsReturned)}</td>
    </tr>
  );
}

function EventRow({ row }: { row: HomeFeedPerformanceEventRow }) {
  const flags = [
    row.reachedLoadedEndDuringRequest ? 'stall' : '',
    row.staleIgnored ? 'stale' : '',
    row.skippedNoLoadMoreButton ? 'end' : ''
  ].filter(Boolean);
  const requestId = row.clientRequestId
    ? row.clientRequestId.split(':').slice(-1)[0]
    : '';
  const rows =
    row.eventType === 'server'
      ? row.visibleRowsReturned
      : row.feedsReturnedCount;

  return (
    <tr>
      <td>{formatTime(row.createdAt)}</td>
      <td>{row.eventType}</td>
      <td>{requestId}</td>
      <td>{`${row.category || row.feedFilter}/${row.subFilter || 'all'}`}</td>
      <td>{formatMs(row.requestDurationMs)}</td>
      <td>{formatMs(row.totalMs)}</td>
      <td>{formatMs(row.triggerToPaintMs)}</td>
      <td>{formatCompact(row.responseRemainingPx || row.startRemainingPx)}</td>
      <td>{formatNumber(rows)}</td>
      <td>{flags.join(', ')}</td>
    </tr>
  );
}

function formatMs(value: number) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '-';
  return `${formatNumber(Math.round(Number(value)))} ms`;
}

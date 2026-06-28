import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  ADMIN_USER_ID,
  HOME_FEED_PERFORMANCE_FORCE_KEY
} from '~/constants/defaultValues';
import {
  getStoredItem,
  removeStoredItem,
  setStoredItem
} from '~/helpers/userDataHelpers';
import {
  formatCompact,
  formatNumber,
  formatTime
} from '../AiCosts/helpers/formatters';
import {
  actionsClass,
  emptyInlineClass,
  emptyStateClass,
  panelClass,
  rangeClass,
  summaryGridClass,
  tableWrapClass
} from '../AiCosts/styles';
import { Color } from '~/constants/css';
import MetricCard from '../MetricCard';

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
  metrics?: {
    explain?: Record<string, QueryExplain>;
  };
}

interface QueryExplainTable {
  table: string;
  access: string;
  key: string | null;
  keyLen: string | null;
  rows: number | null;
  filtered: number | null;
  fullScan: boolean;
}

interface QueryExplain {
  tables: QueryExplainTable[];
  usingFilesort: boolean;
  usingTemporary: boolean;
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

function isHomeFeedPerformanceCaptureEnabled() {
  return getStoredItem(HOME_FEED_PERFORMANCE_FORCE_KEY) === '1';
}

function HomeFeedFactor() {
  const [hours, setHours] = useState<HomeFeedPerformanceRangeOption>(24);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'json' | ''>(
    ''
  );
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<HomeFeedPerformanceReport | null>(null);
  const [captureEnabled, setCaptureEnabled] = useState(
    isHomeFeedPerformanceCaptureEnabled
  );
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
          <h2>Home Feed</h2>
          {report ? (
            <span>
              {formatNumber(report.summary.eventCount)} events over {hours}h
            </span>
          ) : null}
        </div>
        <div className={actionsClass}>
          <SwitchButton
            ariaLabel="Toggle home feed performance capture in this browser"
            checked={captureEnabled}
            color={Color.logoBlue()}
            label="Capture"
            onChange={handleToggleCapture}
            small
          />
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

  function handleToggleCapture() {
    setCaptureEnabled((enabled) => {
      const nextEnabled = !enabled;
      if (nextEnabled) {
        setStoredItem(HOME_FEED_PERFORMANCE_FORCE_KEY, '1');
      } else {
        removeStoredItem(HOME_FEED_PERFORMANCE_FORCE_KEY);
      }
      return nextEnabled;
    });
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
  const explainEntries = Object.entries(row.metrics?.explain || {});

  return (
    <>
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
      {explainEntries.map(([label, explain]) => (
        <tr key={`${row.id}-${label}`}>
          <td colSpan={10} style={{ paddingLeft: '1.5rem' }}>
            <ExplainSummaryView label={label} explain={explain} />
          </td>
        </tr>
      ))}
    </>
  );
}

function ExplainSummaryView({
  label,
  explain
}: {
  label: string;
  explain: QueryExplain;
}) {
  const warn = '#c0392b';
  const muted = '#7f8c8d';
  return (
    <div style={{ fontFamily: 'monospace' }}>
      <span style={{ color: muted }}>{label}: </span>
      {explain.tables.map((table, index) => {
        const noIndex = !table.key;
        const danger = table.fullScan || noIndex;
        return (
          <span key={`${table.table}-${index}`}>
            {index > 0 ? ' → ' : ''}
            <span style={{ color: danger ? warn : 'inherit' }}>
              {table.table} {table.access || '?'}
              {table.key ? ` ${table.key}` : ' (no index)'}
              {table.rows != null
                ? ` ·${formatNumber(table.rows)}r`
                : ''}
              {table.fullScan ? ' ⚠FULL SCAN' : ''}
            </span>
          </span>
        );
      })}
      {explain.usingFilesort ? (
        <span style={{ color: warn }}> ·⚠filesort</span>
      ) : null}
      {explain.usingTemporary ? (
        <span style={{ color: warn }}> ·⚠temp table</span>
      ) : null}
    </div>
  );
}

function formatMs(value: number) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '-';
  return `${formatNumber(Math.round(Number(value)))} ms`;
}

type PerformanceFactor = 'homeFeed' | 'effortLevel' | 'grammarbles';

const PERFORMANCE_FACTORS: { key: PerformanceFactor; label: string }[] = [
  { key: 'homeFeed', label: 'Home Feed' },
  { key: 'effortLevel', label: 'Effort Level' },
  { key: 'grammarbles', label: 'Grammarbles' }
];

export default function Performance() {
  const userId = useKeyContext((v) => v.myState.userId);
  const [factor, setFactor] = useState<PerformanceFactor>('homeFeed');

  if (userId !== ADMIN_USER_ID) {
    return (
      <InvalidPage
        title="Owner only"
        text="Performance insights are only available to the owner account."
      />
    );
  }

  return (
    <div>
      <div className={rangeClass} style={{ marginBottom: '1.5rem' }}>
        {PERFORMANCE_FACTORS.map((option) => (
          <button
            key={option.key}
            className={factor === option.key ? 'active' : ''}
            onClick={() => setFactor(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {factor === 'homeFeed' ? (
        <HomeFeedFactor />
      ) : factor === 'effortLevel' ? (
        <EffortLevelFactor />
      ) : (
        <GrammarFactor />
      )}
    </div>
  );
}

interface EffortLevelEventRow {
  id: number;
  createdAt: number;
  userId: number;
  statusCode: number;
  contentType: string;
  contentId: number;
  totalMs: number;
  settingsMs: number;
  moderatorMs: number;
  contentUpdateMs: number;
  notiFeedsMs: number;
  cannotChange: boolean;
}

interface EffortLevelReport {
  hours: number;
  generatedAt: number;
  slowThresholdMs: number;
  summary: {
    eventCount: number;
    p50TotalMs: number;
    p95TotalMs: number;
    maxTotalMs: number;
    avgTotalMs: number;
  };
  recentEvents: EffortLevelEventRow[];
}

function PerformanceExportButtons({
  hours,
  source
}: {
  hours: HomeFeedPerformanceRangeOption;
  source: string;
}) {
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'json' | ''>(
    ''
  );
  const loadPerformanceExport = useAppContext(
    (v) => v.requestHelpers.loadPerformanceExport
  );

  return (
    <>
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
    </>
  );

  async function handleExport(format: 'csv' | 'json') {
    setExportingFormat(format);
    try {
      const response = await loadPerformanceExport({ hours, source, format });
      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], {
              type: format === 'json' ? 'application/json' : 'text/csv'
            });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${source}-performance-${hours}h.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error(exportError);
    } finally {
      setExportingFormat('');
    }
  }
}

function EffortLevelFactor() {
  const [hours, setHours] = useState<HomeFeedPerformanceRangeOption>(24);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<EffortLevelReport | null>(null);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadEffortLevelPerformanceReport = useAppContext(
    (v) => v.requestHelpers.loadEffortLevelPerformanceReport
  );

  const recentEvents = report?.recentEvents || [];

  useEffect(() => {
    if (userId !== ADMIN_USER_ID) return;
    let canceled = false;
    void loadReport();

    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const data = await loadEffortLevelPerformanceReport(hours);
        if (canceled) return;
        setReport(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load effort level performance');
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

  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>Effort Level</h2>
          {report ? (
            <span>
              {formatNumber(report.summary.eventCount)} slow assignments (≥
              {report.slowThresholdMs}ms) over {hours}h
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
          <Button
            color="darkerGray"
            variant="outline"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Refresh
          </Button>
          <PerformanceExportButtons hours={hours} source="effortLevel" />
        </div>
      </header>
      <div>
        {loading ? <Loading /> : null}

        {!loading && error ? (
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
        ) : null}

        {!loading && !error && report ? (
          <>
            <section className={summaryGridClass}>
              <MetricCard
                label="Total p95"
                value={formatMs(report.summary.p95TotalMs)}
                detail={`${formatMs(report.summary.p50TotalMs)} p50`}
                color="logoBlue"
              />
              <MetricCard
                label="Total max"
                value={formatMs(report.summary.maxTotalMs)}
                detail={`${formatMs(report.summary.avgTotalMs)} avg`}
                color="rose"
              />
              <MetricCard
                label="Slow events"
                value={formatNumber(report.summary.eventCount)}
                detail={`≥ ${report.slowThresholdMs} ms`}
                color="orange"
              />
            </section>

            {recentEvents.length === 0 ? (
              <div className={emptyInlineClass}>
                No slow effort-level assignments captured in this range. 🎉
              </div>
            ) : (
              <div className={tableWrapClass}>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Content</th>
                      <th>Total</th>
                      <th>Settings read</th>
                      <th>Moderator</th>
                      <th>Content UPDATE</th>
                      <th>noti_feeds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.map((row) => (
                      <EffortLevelEventRowView key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}

function EffortLevelEventRowView({ row }: { row: EffortLevelEventRow }) {
  return (
    <tr>
      <td>{formatTime(row.createdAt)}</td>
      <td>
        {row.contentType || '-'}
        {row.contentId ? ` #${row.contentId}` : ''}
      </td>
      <td>{formatMs(row.totalMs)}</td>
      <td>{formatMs(row.settingsMs)}</td>
      <td>{formatMs(row.moderatorMs)}</td>
      <td>{formatMs(row.contentUpdateMs)}</td>
      <td>{formatMs(row.notiFeedsMs)}</td>
    </tr>
  );
}

interface GrammarEventRow {
  id: number;
  createdAt: number;
  userId: number;
  statusCode: number;
  isPerfect: boolean;
  level: number;
  totalMs: number;
  scoringMs: number;
  ratingHistoryMs: number;
  dailyTaskMs: number;
  xpRewardMs: number;
  coinUpdateMs: number;
  statsMs: number;
  achievementMs: number;
}

interface PerformanceByUserRow {
  userId: number;
  eventCount: number;
  p95TotalMs: number;
  maxTotalMs: number;
}

interface GrammarReport {
  hours: number;
  generatedAt: number;
  slowThresholdMs: number;
  summary: {
    eventCount: number;
    perfectCount: number;
    p50TotalMs: number;
    p95TotalMs: number;
    maxTotalMs: number;
    avgTotalMs: number;
  };
  byUser: PerformanceByUserRow[];
  recentEvents: GrammarEventRow[];
}

function GrammarFactor() {
  const [hours, setHours] = useState<HomeFeedPerformanceRangeOption>(24);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<GrammarReport | null>(null);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadGrammarPerformanceReport = useAppContext(
    (v) => v.requestHelpers.loadGrammarPerformanceReport
  );

  const recentEvents = report?.recentEvents || [];

  useEffect(() => {
    if (userId !== ADMIN_USER_ID) return;
    let canceled = false;
    void loadReport();

    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const data = await loadGrammarPerformanceReport(hours);
        if (canceled) return;
        setReport(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load grammar performance');
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

  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>Grammarbles</h2>
          {report ? (
            <span>
              {formatNumber(report.summary.eventCount)} slow finishes (≥
              {report.slowThresholdMs}ms) over {hours}h ·{' '}
              {formatNumber(report.summary.perfectCount)} perfect
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
          <Button
            color="darkerGray"
            variant="outline"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Refresh
          </Button>
          <PerformanceExportButtons hours={hours} source="grammarGame" />
        </div>
      </header>
      <div>
        {loading ? <Loading /> : null}

        {!loading && error ? (
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
        ) : null}

        {!loading && !error && report ? (
          <>
            <section className={summaryGridClass}>
              <MetricCard
                label="Total p95"
                value={formatMs(report.summary.p95TotalMs)}
                detail={`${formatMs(report.summary.p50TotalMs)} p50`}
                color="logoBlue"
              />
              <MetricCard
                label="Total max"
                value={formatMs(report.summary.maxTotalMs)}
                detail={`${formatMs(report.summary.avgTotalMs)} avg`}
                color="rose"
              />
              <MetricCard
                label="Slow finishes"
                value={formatNumber(report.summary.eventCount)}
                detail={`≥ ${report.slowThresholdMs} ms`}
                color="orange"
              />
            </section>

            {report.byUser.length > 0 ? (
              <Subsection title="Slow finishes by user">
                <div className={tableWrapClass}>
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Slow finishes</th>
                        <th>p95 total</th>
                        <th>Max total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byUser.map((user) => (
                        <tr key={user.userId}>
                          <td>{user.userId}</td>
                          <td>{formatNumber(user.eventCount)}</td>
                          <td>{formatMs(user.p95TotalMs)}</td>
                          <td>{formatMs(user.maxTotalMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Subsection>
            ) : null}

            <Subsection title="Recent slow finishes">
              {recentEvents.length === 0 ? (
                <div className={emptyInlineClass}>
                  No slow Grammarbles finishes captured in this range. 🎉
                </div>
              ) : (
                <div className={tableWrapClass}>
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Level</th>
                        <th>Perfect</th>
                        <th>Total</th>
                        <th>Scoring</th>
                        <th>XP</th>
                        <th>Coins</th>
                        <th>Stats</th>
                        <th>Achv</th>
                        <th>Ratings + history</th>
                        <th>Daily tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map((row) => (
                        <GrammarEventRowView key={row.id} row={row} />
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
}

function GrammarEventRowView({ row }: { row: GrammarEventRow }) {
  return (
    <tr>
      <td>{formatTime(row.createdAt)}</td>
      <td>{row.level || '-'}</td>
      <td>{row.isPerfect ? 'PERFECT' : '-'}</td>
      <td>{formatMs(row.totalMs)}</td>
      <td>{formatMs(row.scoringMs)}</td>
      <td>{formatMs(row.xpRewardMs)}</td>
      <td>{formatMs(row.coinUpdateMs)}</td>
      <td>{formatMs(row.statsMs)}</td>
      <td>{formatMs(row.achievementMs)}</td>
      <td>{formatMs(row.ratingHistoryMs)}</td>
      <td>{formatMs(row.dailyTaskMs)}</td>
    </tr>
  );
}

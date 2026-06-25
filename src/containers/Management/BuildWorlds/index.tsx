import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';

const RANGE_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 }
];

const DEFAULT_BUILD_ID = '363';

interface CountRow {
  key: string;
  count: number;
}

interface TelemetryEvent {
  id: number;
  createdAt: number;
  eventType: string;
  worldKey: string;
  roomKey: string;
  roomId: string;
  userId: number;
  guestId: string;
  isGuest: boolean;
  outcome: string;
  stage: string;
  leaveReason: string;
  errorCode: string;
  errorMessage: string;
  durationMs: number;
  sessionDurationMs: number;
  playerCount: number;
  presenceUpdateCount: number;
  actionSendCount: number;
}

interface TelemetryReport {
  buildId: number;
  hours: number;
  generatedAt: number;
  rowLimitReached: boolean;
  summary: {
    totalEvents: number;
    byEventType: CountRow[];
    join: {
      total: number;
      ok: number;
      error: number;
      roomFull: number;
      successRate: number;
      durationMs: { p50: number; p95: number; avg: number };
      errorsByStage: CountRow[];
      errorsByMessage: CountRow[];
    };
    leave: {
      total: number;
      byReason: CountRow[];
      avgSessionDurationMs: number;
    };
    distinct: {
      sessions: number;
      rooms: number;
      users: number;
      guests: number;
      worlds: number;
    };
    maxPlayerCount: number;
  };
  events: TelemetryEvent[];
}

export default function BuildWorlds() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadReport = useAppContext(
    (v) => v.requestHelpers.loadBuildWorldTelemetryReport
  );
  const loadExport = useAppContext(
    (v) => v.requestHelpers.loadBuildWorldTelemetryExport
  );
  const clearTelemetry = useAppContext(
    (v) => v.requestHelpers.clearBuildWorldTelemetry
  );

  const [buildIdInput, setBuildIdInput] = useState(DEFAULT_BUILD_ID);
  const [activeBuildId, setActiveBuildId] = useState(Number(DEFAULT_BUILD_ID));
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<TelemetryReport | null>(null);
  const [exportingFormat, setExportingFormat] = useState('');
  const [clearing, setClearing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isOwner = userId === ADMIN_USER_ID;
  // The text field can hold an un-applied build id; gate Export/Clear on it so a
  // destructive action never targets a build different from the one displayed.
  const buildIdDirty = (Number(buildIdInput) || 0) !== activeBuildId;

  useEffect(() => {
    if (!isOwner || !activeBuildId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    loadReport({ buildId: activeBuildId, hours })
      .then((data: TelemetryReport) => {
        if (cancelled) return;
        setReport(data);
      })
      .catch((loadError: any) => {
        if (cancelled) return;
        setError(loadError?.message || 'Failed to load telemetry');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuildId, hours, reloadKey, isOwner]);

  // Only treat a loaded report as current when it matches the active controls,
  // so a failed or in-flight reload never renders stale telemetry under a newly
  // selected build/window.
  const activeReport =
    report && report.buildId === activeBuildId && report.hours === hours
      ? report
      : null;
  const summary = activeReport?.summary;
  const join = summary?.join;

  const joinErrorCount = join ? join.error + join.roomFull : 0;
  const successColor = useMemo(() => {
    if (!join || !join.total) return 'darkerGray';
    if (join.successRate >= 99) return 'green';
    if (join.successRate >= 80) return 'orange';
    return 'rose';
  }, [join]);

  if (!isOwner) {
    return (
      <InvalidPage
        title="For authorized admins only"
        text="This page is only available to the site owner"
      />
    );
  }

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <h1>Build Worlds Telemetry</h1>
        <p>
          Server-side capture of every shared-world lifecycle event (join /
          leave / presence). Use it to see whether shared-world joins are
          reaching the server and, if so, which stage fails.
        </p>
      </div>

      <div className={controlsClass}>
        <div className={fieldClass}>
          <label htmlFor="build-worlds-build-id">Build ID</label>
          <input
            id="build-worlds-build-id"
            value={buildIdInput}
            inputMode="numeric"
            onChange={(event) =>
              setBuildIdInput(event.target.value.replace(/[^0-9]/g, ''))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleApplyBuildId();
            }}
          />
          <Button color="logoBlue" onClick={handleApplyBuildId}>
            Load
          </Button>
          {buildIdDirty && (
            <span className={dirtyHintClass}>Press Load to apply</span>
          )}
        </div>
        <div className={rangeRowClass}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`${rangeButtonClass}${
                hours === option.value ? ' active' : ''
              }`}
              onClick={() => setHours(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={actionsRowClass}>
          <Button
            color="darkerGray"
            variant="outline"
            loading={loading}
            onClick={() => setReloadKey((key) => key + 1)}
          >
            <Icon icon="sync" />
            <span style={{ marginLeft: '0.5rem' }}>Refresh</span>
          </Button>
          <Button
            color="darkerGray"
            variant="outline"
            loading={exportingFormat === 'csv'}
            disabled={buildIdDirty}
            onClick={() => handleExport('csv')}
          >
            <Icon icon="file-csv" />
            <span style={{ marginLeft: '0.5rem' }}>CSV</span>
          </Button>
          <Button
            color="darkerGray"
            variant="outline"
            loading={exportingFormat === 'json'}
            disabled={buildIdDirty}
            onClick={() => handleExport('json')}
          >
            <Icon icon="code" />
            <span style={{ marginLeft: '0.5rem' }}>JSON</span>
          </Button>
          <Button
            color="rose"
            variant="outline"
            loading={clearing}
            disabled={buildIdDirty}
            onClick={handleClear}
          >
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '0.5rem' }}>Clear window</span>
          </Button>
        </div>
      </div>

      {error && <div className={errorClass}>{error}</div>}

      {loading && !activeReport ? (
        <Loading />
      ) : !summary || !join ? (
        <div className={emptyClass}>No telemetry yet for this window.</div>
      ) : (
        <>
          <div className={cardGridClass}>
            <MetricCard
              label="Join attempts"
              value={formatNumber(join.total)}
              detail={`${formatNumber(summary.totalEvents)} total events`}
              color="logoBlue"
            />
            <MetricCard
              label="Join success rate"
              value={`${join.successRate}%`}
              detail={`${formatNumber(join.ok)} ok / ${formatNumber(
                join.total
              )}`}
              color={successColor}
            />
            <MetricCard
              label="Join failures"
              value={formatNumber(joinErrorCount)}
              detail={`${formatNumber(join.error)} error / ${formatNumber(
                join.roomFull
              )} room-full`}
              color={joinErrorCount > 0 ? 'rose' : 'green'}
            />
            <MetricCard
              label="Join latency (ok)"
              value={formatMs(join.durationMs.p95)}
              detail={`p50 ${formatMs(join.durationMs.p50)} · avg ${formatMs(
                join.durationMs.avg
              )}`}
              color="purple"
            />
            <MetricCard
              label="Leaves"
              value={formatNumber(summary.leave.total)}
              detail={`avg session ${formatMs(
                summary.leave.avgSessionDurationMs
              )}`}
              color="darkerGray"
            />
            <MetricCard
              label="Distinct sessions"
              value={formatNumber(summary.distinct.sessions)}
              detail={`${formatNumber(
                summary.distinct.users
              )} users · ${formatNumber(summary.distinct.guests)} guests`}
              color="darkBlue"
            />
            <MetricCard
              label="Rooms / worlds"
              value={`${formatNumber(summary.distinct.rooms)} / ${formatNumber(
                summary.distinct.worlds
              )}`}
              detail={`peak ${formatNumber(summary.maxPlayerCount)} players`}
              color="darkerGray"
            />
          </div>

          <CountTable
            title="Join failures by stage"
            emptyText="No join failures in this window."
            rows={join.errorsByStage}
            keyLabel="Stage"
          />
          <CountTable
            title="Join failure messages"
            emptyText="No join failure messages in this window."
            rows={join.errorsByMessage}
            keyLabel="Message / outcome"
          />
          <CountTable
            title="Leaves by reason"
            emptyText="No leaves in this window."
            rows={summary.leave.byReason}
            keyLabel="Reason"
          />

          <div className={sectionClass}>
            <h3>
              Recent events
              {activeReport?.rowLimitReached ? ' (report row cap reached)' : ''}
            </h3>
            <div className={tableWrapClass}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Outcome</th>
                    <th>Stage / reason</th>
                    <th>World / room</th>
                    <th>Who</th>
                    <th>Dur</th>
                    <th>Players</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReport?.events.map((event) => (
                    <tr key={event.id}>
                      <td>{formatTime(event.createdAt)}</td>
                      <td>{event.eventType}</td>
                      <td>
                        <span
                          style={{
                            color: outcomeColor(event.outcome),
                            fontWeight: 'bold'
                          }}
                        >
                          {event.outcome || '—'}
                        </span>
                      </td>
                      <td>{event.stage || event.leaveReason || '—'}</td>
                      <td>{`${event.worldKey || '—'} / ${
                        event.roomKey || '—'
                      }`}</td>
                      <td>
                        {event.isGuest
                          ? `guest ${event.guestId.slice(0, 8)}`
                          : `user ${event.userId}`}
                      </td>
                      <td>
                        {event.eventType === 'leave'
                          ? formatMs(event.sessionDurationMs)
                          : formatMs(event.durationMs)}
                      </td>
                      <td>{event.playerCount}</td>
                      <td className={detailCellClass}>
                        {event.errorMessage ||
                          (event.eventType === 'leave'
                            ? `presence ${event.presenceUpdateCount} · send ${event.actionSendCount}`
                            : '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {summary.byEventType.length > 0 && (
            <p className={footnoteClass}>
              Events by type:{' '}
              {summary.byEventType
                .map((row) => `${row.key} ${row.count}`)
                .join(' · ')}
            </p>
          )}
        </>
      )}
    </div>
  );

  function handleApplyBuildId() {
    const parsed = Number(buildIdInput) || 0;
    if (!parsed) {
      setError('Enter a valid build ID');
      return;
    }
    setActiveBuildId(parsed);
  }

  async function handleExport(format: 'csv' | 'json') {
    if (!activeBuildId || buildIdDirty) return;
    setExportingFormat(format);
    try {
      const response = await loadExport({
        buildId: activeBuildId,
        hours,
        format
      });
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
        `build-${activeBuildId}-world-telemetry-${hours}h.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError: any) {
      setError(exportError?.message || 'Failed to export telemetry');
    } finally {
      setExportingFormat('');
    }
  }

  async function handleClear() {
    if (!activeBuildId || buildIdDirty) return;
    setClearing(true);
    try {
      await clearTelemetry({ buildId: activeBuildId, hours });
      // Drop the just-deleted data immediately so a failed reload can't keep
      // rendering rows that no longer exist; the reload repopulates on success.
      setReport(null);
      setReloadKey((key) => key + 1);
    } catch (clearError: any) {
      setError(clearError?.message || 'Failed to clear telemetry');
    } finally {
      setClearing(false);
    }
  }
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
        borderColor: Color[color]?.(0.35) || Color.darkerGray(0.35),
        background: Color[color]?.(0.07) || Color.darkerGray(0.07)
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function CountTable({
  title,
  rows,
  keyLabel,
  emptyText
}: {
  title: string;
  rows: CountRow[];
  keyLabel: string;
  emptyText: string;
}) {
  return (
    <div className={sectionClass}>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <div className={emptyInlineClass}>{emptyText}</div>
      ) : (
        <div className={tableWrapClass}>
          <table>
            <thead>
              <tr>
                <th>{keyLabel}</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.key}</td>
                  <td>{formatNumber(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

function formatMs(value: number) {
  if (!value) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

function formatTime(seconds: number) {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleString();
}

function outcomeColor(outcome: string) {
  if (outcome === 'ok') return Color.green();
  if (outcome === 'room_full') return Color.orange();
  if (outcome === 'error') return Color.rose();
  return Color.darkerGray();
}

const containerClass = css`
  width: 100%;
  font-size: 1.1rem;
  padding-bottom: 5rem;
`;

const headerClass = css`
  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0 0 0.5rem;
  }
  p {
    font-size: 1.1rem;
    color: ${Color.darkerGray()};
    margin: 0;
    max-width: 70rem;
  }
`;

const controlsClass = css`
  margin: 1.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: center;
`;

const fieldClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  label {
    font-size: 1.1rem;
    font-weight: bold;
  }
  input {
    width: 9rem;
    font-size: 1.1rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 5px;
  }
`;

const dirtyHintClass = css`
  font-size: 1rem;
  color: ${Color.rose()};
  white-space: nowrap;
`;

const rangeRowClass = css`
  display: flex;
  gap: 0.5rem;
`;

const rangeButtonClass = css`
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  &.active {
    background: ${Color.logoBlue()};
    border-color: ${Color.logoBlue()};
    color: #fff;
    font-weight: bold;
  }
`;

const actionsRowClass = css`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const cardGridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const metricCardClass = css`
  border: 1px solid;
  border-radius: 8px;
  padding: 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  span {
    font-size: 1.1rem;
    color: ${Color.darkerGray()};
  }
  strong {
    font-size: 2rem;
  }
  small {
    font-size: 1rem;
    color: ${Color.gray()};
  }
`;

const sectionClass = css`
  margin-top: 1.8rem;
  h3 {
    font-size: 1.5rem;
    margin: 0 0 0.8rem;
  }
`;

const tableWrapClass = css`
  overflow-x: auto;
  border: 1px solid ${Color.borderGray()};
  border-radius: 8px;
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.1rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid ${Color.highlightGray()};
    white-space: nowrap;
  }
  th {
    background: ${Color.highlightGray()};
    font-weight: bold;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

const detailCellClass = css`
  white-space: normal !important;
  max-width: 30rem;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  margin: 1rem 0;
`;

const emptyClass = css`
  margin-top: 2rem;
  font-size: 1.2rem;
  color: ${Color.darkerGray()};
`;

const emptyInlineClass = css`
  font-size: 1.1rem;
  color: ${Color.gray()};
`;

const footnoteClass = css`
  margin-top: 1.5rem;
  font-size: 1rem;
  color: ${Color.gray()};
`;

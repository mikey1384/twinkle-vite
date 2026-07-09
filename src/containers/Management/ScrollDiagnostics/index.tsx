import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import { useKeyContext, useManagementContext } from '~/contexts';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import type { AdminTelemetryEvent } from '~/contexts/Management/actions';
import {
  clearScrollDiagnostics,
  getScrollDiagnosticEvents,
  isScrollDiagnosticsLoggingEnabled,
  scrollDiagnosticsToCsv,
  setScrollDiagnosticsLoggingEnabled,
  type ScrollDiagnosticEvent
} from '~/helpers/scrollAnchorDiagnostics';
import {
  actionsClass,
  emptyInlineClass,
  metricCardClass,
  panelClass,
  rangeClass,
  summaryGridClass,
  tableWrapClass
} from '../AiCosts/styles';

const RECENT_LIMIT = 60;
type DiagnosticsView = 'scroll' | 'admin-telemetry';

export default function Diagnostics() {
  const userId = useKeyContext((v) => v.myState.userId);
  const adminTelemetryEvents = useManagementContext(
    (v) => v.state.adminTelemetryEvents
  );
  const onClearAdminTelemetry = useManagementContext(
    (v) => v.actions.onClearAdminTelemetry
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [loggingEnabled, setLoggingEnabled] = useState(
    isScrollDiagnosticsLoggingEnabled
  );
  const [events, setEvents] = useState<ScrollDiagnosticEvent[]>(
    getScrollDiagnosticEvents
  );

  const summary = useMemo(() => computeSummary(events), [events]);
  const recent = useMemo(
    () => events.slice(-RECENT_LIMIT).reverse(),
    [events]
  );
  const recentAdminTelemetryEvents = useMemo(
    () =>
      [...((adminTelemetryEvents || []) as AdminTelemetryEvent[])].reverse(),
    [adminTelemetryEvents]
  );
  const activeView: DiagnosticsView =
    searchParams.get('view') === 'admin-telemetry'
      ? 'admin-telemetry'
      : 'scroll';

  // Refresh the snapshot periodically so the count grows live while capturing.
  useEffect(() => {
    const id = window.setInterval(() => {
      setEvents(getScrollDiagnosticEvents());
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  if (userId !== ADMIN_USER_ID) {
    return (
      <InvalidPage
        title="Owner only"
        text="Diagnostics are only available to the owner account."
      />
    );
  }

  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>Diagnostics</h2>
          <span>
            {activeView === 'admin-telemetry'
              ? `Admin telemetry · ${adminTelemetryEvents.length} events`
              : `Home-feed scroll-restore capture · ${events.length} events`}
          </span>
        </div>
        <div className={actionsClass}>
          {activeView === 'admin-telemetry'
            ? renderAdminTelemetryActions()
            : renderScrollActions()}
        </div>
      </header>

      <div>
        <div className={rangeClass}>
          <button
            className={activeView === 'scroll' ? 'active' : ''}
            onClick={() => handleSetView('scroll')}
          >
            Scroll
          </button>
          <button
            className={activeView === 'admin-telemetry' ? 'active' : ''}
            onClick={() => handleSetView('admin-telemetry')}
          >
            Admin Telemetry
          </button>
        </div>
      </div>

      {activeView === 'admin-telemetry'
        ? renderAdminTelemetry()
        : renderScrollDiagnostics()}
    </section>
  );

  function renderScrollActions() {
    return (
      <>
        <SwitchButton
          ariaLabel="Toggle scroll-restore logging in this browser"
          checked={loggingEnabled}
          color={Color.logoBlue()}
          label="Logging"
          onChange={handleToggleLogging}
          small
        />
        <Button color="darkerGray" variant="outline" onClick={handleRefresh}>
          <Icon icon="sync" />
          Refresh
        </Button>
        <Button
          color="darkerGray"
          variant="outline"
          disabled={events.length === 0}
          onClick={handleDownloadCsv}
        >
          <Icon icon="file-csv" />
          CSV
        </Button>
        <Button
          color="red"
          variant="outline"
          disabled={events.length === 0}
          onClick={handleClear}
        >
          Clear
        </Button>
      </>
    );
  }

  function renderAdminTelemetryActions() {
    return (
      <Button
        color="red"
        variant="outline"
        disabled={adminTelemetryEvents.length === 0}
        onClick={onClearAdminTelemetry}
      >
        Clear
      </Button>
    );
  }

  function renderScrollDiagnostics() {
    return (
      <div>
        <p
          style={{
            margin: '0 0 1rem',
            color: Color.darkerGray(),
            fontSize: '1.3rem',
            lineHeight: 1.5
          }}
        >
          Turn on <b>Logging</b>, reproduce the bug (scroll the home feed, go to
          Explore, come back), then download the CSV. Capture is local to this
          device and survives a reload.
        </p>

        <div className={summaryGridClass}>
          <SummaryCard label="Restore starts" value={summary.restoreStart} />
          <SummaryCard
            label="Anchor-missing fallbacks"
            value={summary.anchorMissing}
            highlight={summary.anchorMissing > 0}
          />
          <SummaryCard
            label="Restores cancelled"
            value={summary.cancelled}
            highlight={summary.cancelled > 0}
          />
          <SummaryCard
            label="Cancels suppressed (grace)"
            value={summary.cancelSuppressed}
          />
          <SummaryCard
            label="Initial scroll (top)"
            value={summary.initialScroll}
          />
          <SummaryCard label="Saves" value={summary.save} />
        </div>

        <div className={tableWrapClass} style={{ marginTop: '1.5rem' }}>
          {recent.length === 0 ? (
            <div className={emptyInlineClass}>
              No events captured yet. Enable logging and reproduce the issue.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>seq</th>
                  <th>t (ms)</th>
                  <th>type</th>
                  <th>path</th>
                  <th>scrollTop</th>
                  <th>saved</th>
                  <th>reason / note</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((event) => (
                  <tr key={event.seq}>
                    <td>{event.seq}</td>
                    <td>{event.t}</td>
                    <td style={{ fontWeight: typeWeight(event.type) }}>
                      {event.type}
                    </td>
                    <td>{event.path}</td>
                    <td>{event.scrollTop}</td>
                    <td>
                      {event.savedScrollTop === ''
                        ? ''
                        : `${event.savedScrollTop} / ${event.savedOffset}`}
                    </td>
                    <td>{event.reason || event.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  function renderAdminTelemetry() {
    return (
      <div>
        <div className={tableWrapClass}>
          {recentAdminTelemetryEvents.length === 0 ? (
            <div className={emptyInlineClass}>
              No admin telemetry received in this session.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>time</th>
                  <th>notify</th>
                  <th>message</th>
                </tr>
              </thead>
              <tbody>
                {recentAdminTelemetryEvents.map((event, index) => (
                  <tr key={`${event.timestamp}-${index}`}>
                    <td>{formatTelemetryTime(event.timestamp)}</td>
                    <td>{event.notifyAdmin ? 'Yes' : ''}</td>
                    <td>{event.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  function handleSetView(view: DiagnosticsView) {
    const nextParams = new URLSearchParams(searchParams);
    if (view === 'scroll') {
      nextParams.delete('view');
    } else {
      nextParams.set('view', view);
    }
    setSearchParams(nextParams, { replace: true });
  }

  function handleToggleLogging() {
    setLoggingEnabled((enabled) => {
      const next = !enabled;
      setScrollDiagnosticsLoggingEnabled(next);
      return next;
    });
  }

  function handleRefresh() {
    setEvents(getScrollDiagnosticEvents());
  }

  function handleClear() {
    clearScrollDiagnostics();
    setEvents([]);
  }

  function handleDownloadCsv() {
    const csv = scrollDiagnosticsToCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'scroll-diagnostics.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

function SummaryCard({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={metricCardClass}>
      <span>{label}</span>
      <strong style={highlight ? { color: Color.rose() } : undefined}>
        {value}
      </strong>
    </div>
  );
}

function computeSummary(events: ScrollDiagnosticEvent[]) {
  const summary = {
    restoreStart: 0,
    anchorMissing: 0,
    cancelled: 0,
    cancelSuppressed: 0,
    initialScroll: 0,
    save: 0
  };
  for (const event of events) {
    if (event.type === 'restore-start') summary.restoreStart += 1;
    else if (event.type === 'anchor-missing-fallback-scrolltop') {
      summary.anchorMissing += 1;
    } else if (event.type === 'restore-cancelled') summary.cancelled += 1;
    else if (event.type === 'cancel-suppressed') summary.cancelSuppressed += 1;
    else if (event.type === 'initial-scroll') summary.initialScroll += 1;
    else if (event.type === 'save') summary.save += 1;
  }
  return summary;
}

function typeWeight(type: string) {
  return type === 'restore-cancelled' ||
    type === 'anchor-missing-fallback-scrolltop'
    ? 800
    : 400;
}

function formatTelemetryTime(timestamp: number) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
}

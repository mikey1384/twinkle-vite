import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import { useKeyContext } from '~/contexts';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import {
  clearScrollDiagnostics,
  getScrollDiagnosticEvents,
  isScrollDiagnosticsLoggingEnabled,
  isScrollRestoreFixEnabled,
  scrollDiagnosticsToCsv,
  setScrollDiagnosticsLoggingEnabled,
  setScrollRestoreFixEnabled,
  type ScrollDiagnosticEvent
} from '~/helpers/scrollAnchorDiagnostics';
import {
  actionsClass,
  emptyInlineClass,
  metricCardClass,
  panelClass,
  summaryGridClass,
  tableWrapClass
} from '../AiCosts/styles';

const RECENT_LIMIT = 60;

export default function ScrollDiagnostics() {
  const userId = useKeyContext((v) => v.myState.userId);
  const [loggingEnabled, setLoggingEnabled] = useState(
    isScrollDiagnosticsLoggingEnabled
  );
  const [fixEnabled, setFixEnabled] = useState(isScrollRestoreFixEnabled);
  const [events, setEvents] = useState<ScrollDiagnosticEvent[]>(
    getScrollDiagnosticEvents
  );

  const summary = useMemo(() => computeSummary(events), [events]);
  const recent = useMemo(
    () => events.slice(-RECENT_LIMIT).reverse(),
    [events]
  );

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
        text="Scroll diagnostics is only available to the owner account."
      />
    );
  }

  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>Scroll Diagnostics</h2>
          <span>
            Home-feed scroll-restore capture (this browser only) ·{' '}
            {events.length} events
          </span>
        </div>
        <div className={actionsClass}>
          <SwitchButton
            ariaLabel="Toggle scroll-restore logging in this browser"
            checked={loggingEnabled}
            color={Color.logoBlue()}
            label="Logging"
            onChange={handleToggleLogging}
            small
          />
          <SwitchButton
            ariaLabel="Toggle the candidate scroll-restore fix in this browser"
            checked={fixEnabled}
            color={Color.green()}
            label="Fix"
            onChange={handleToggleFix}
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
        </div>
      </header>

      <p
        style={{
          margin: '0 0 1rem',
          color: Color.darkerGray(),
          fontSize: '1.3rem',
          lineHeight: 1.5
        }}
      >
        Turn on <b>Logging</b>, reproduce the bug (scroll the home feed, go to
        Explore, come back), then download the CSV. Use the <b>Fix</b> toggle to
        capture a run with the candidate fix on vs. off and compare. Capture is
        local to this device and survives a reload.
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
          label="Cancels suppressed (fix)"
          value={summary.cancelSuppressed}
        />
        <SummaryCard label="Initial scroll (top)" value={summary.initialScroll} />
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
    </section>
  );

  function handleToggleLogging() {
    setLoggingEnabled((enabled) => {
      const next = !enabled;
      setScrollDiagnosticsLoggingEnabled(next);
      return next;
    });
  }

  function handleToggleFix() {
    setFixEnabled((enabled) => {
      const next = !enabled;
      setScrollRestoreFixEnabled(next);
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

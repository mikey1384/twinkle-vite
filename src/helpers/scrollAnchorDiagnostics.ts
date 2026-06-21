import {
  getStoredItem,
  removeStoredItem,
  setStoredItem
} from '~/helpers/userDataHelpers';

// Client-side, opt-in diagnostics for the home-feed scroll-anchor restoration.
// Logging is OFF by default and is a cheap no-op until an admin enables it from
// Management → Scroll Diagnostics, so it adds nothing for normal users. When
// enabled it records save/restore/cancel events into a capped in-memory ring
// buffer (mirrored to localStorage so the capture survives an iOS tab reload),
// which Management exports as CSV. The companion fix flag lets the restore hook
// behave with or without the candidate fix so the two can be compared from the
// same captured insights.

const LOGGING_KEY = 'twinkleScrollDiagnosticsLogging';
const FIX_KEY = 'twinkleScrollDiagnosticsFix';
const EVENTS_KEY = 'twinkleScrollDiagnosticsEvents';
const MAX_EVENTS = 4000;

export interface ScrollDiagnosticEvent {
  seq: number;
  t: number;
  type: string;
  fixActive: boolean;
  anchorKey: string;
  path: string;
  scrollTop: number;
  primaryId: string;
  secondaryId: string;
  savedScrollTop: number | '';
  savedOffset: number | '';
  computedScrollTop: number | '';
  attempt: number | '';
  reason: string;
  itemsReady: boolean | '';
  note: string;
}

const CSV_COLUMNS: Array<keyof ScrollDiagnosticEvent> = [
  'seq',
  't',
  'type',
  'fixActive',
  'anchorKey',
  'path',
  'scrollTop',
  'primaryId',
  'secondaryId',
  'savedScrollTop',
  'savedOffset',
  'computedScrollTop',
  'attempt',
  'reason',
  'itemsReady',
  'note'
];

let loggingEnabled = getStoredItem(LOGGING_KEY) === '1';
let fixEnabled = getStoredItem(FIX_KEY) === '1';
let seqCounter = 0;
let events: ScrollDiagnosticEvent[] = loadPersistedEvents();
let flushScheduled = false;

if (events.length > 0) {
  seqCounter = events[events.length - 1].seq;
}

export function isScrollDiagnosticsLoggingEnabled() {
  return loggingEnabled;
}

export function setScrollDiagnosticsLoggingEnabled(enabled: boolean) {
  loggingEnabled = enabled;
  if (enabled) {
    setStoredItem(LOGGING_KEY, '1');
  } else {
    removeStoredItem(LOGGING_KEY);
  }
}

export function isScrollRestoreFixEnabled() {
  return fixEnabled;
}

export function setScrollRestoreFixEnabled(enabled: boolean) {
  fixEnabled = enabled;
  if (enabled) {
    setStoredItem(FIX_KEY, '1');
  } else {
    removeStoredItem(FIX_KEY);
  }
}

export function recordScrollDiagnostic(
  event: Partial<ScrollDiagnosticEvent> & { type: string }
) {
  if (!loggingEnabled) return;
  const entry: ScrollDiagnosticEvent = {
    seq: ++seqCounter,
    t: Math.round(getMonotonicMs()),
    type: event.type,
    // Stamp the live fix state on every row so a fix-on run is always
    // distinguishable from a fix-off run in the exported CSV, even when the
    // run produced no suppressed cancels and even if the toggle flips mid-capture.
    fixActive: fixEnabled,
    anchorKey: event.anchorKey ?? '',
    path: event.path ?? getPathname(),
    scrollTop: event.scrollTop ?? -1,
    primaryId: event.primaryId ?? '',
    secondaryId: event.secondaryId ?? '',
    savedScrollTop: event.savedScrollTop ?? '',
    savedOffset: event.savedOffset ?? '',
    computedScrollTop: event.computedScrollTop ?? '',
    attempt: event.attempt ?? '',
    reason: event.reason ?? '',
    itemsReady: event.itemsReady ?? '',
    note: event.note ?? ''
  };
  events.push(entry);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  scheduleFlush();
}

export function getScrollDiagnosticEvents() {
  return events.slice();
}

export function getScrollDiagnosticEventCount() {
  return events.length;
}

export function clearScrollDiagnostics() {
  events = [];
  seqCounter = 0;
  removeStoredItem(EVENTS_KEY);
}

export function scrollDiagnosticsToCsv() {
  const header = CSV_COLUMNS.join(',');
  const rows = events.map((event) =>
    CSV_COLUMNS.map((column) => toCsvCell(event[column])).join(',')
  );
  return [header, ...rows].join('\n');
}

function toCsvCell(value: ScrollDiagnosticEvent[keyof ScrollDiagnosticEvent]) {
  const text = value === '' || value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function getPathname() {
  try {
    return window.location.pathname;
  } catch {
    return '';
  }
}

function getMonotonicMs() {
  try {
    return performance.now();
  } catch {
    return 0;
  }
}

function loadPersistedEvents(): ScrollDiagnosticEvent[] {
  const raw = getStoredItem(EVENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  const flush = () => {
    flushScheduled = false;
    try {
      setStoredItem(EVENTS_KEY, JSON.stringify(events));
    } catch {
      // ignore quota/serialization errors; in-memory buffer is the source.
    }
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(flush, { timeout: 2000 });
  } else {
    setTimeout(flush, 1000);
  }
}

// Persist immediately when the page is hidden/unloaded so an iOS tab reload or
// app switch right after reproducing the bug doesn't drop the capture.
if (typeof window !== 'undefined') {
  const persistNow = () => {
    if (!loggingEnabled) return;
    try {
      setStoredItem(EVENTS_KEY, JSON.stringify(events));
    } catch {
      // ignore
    }
  };
  window.addEventListener('pagehide', persistNow);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistNow();
  });
}

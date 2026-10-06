// Performance pieces of the owner's client trace (nav-timing, slow-request,
// stall, page-load), kept free of app imports so they can be tested in node.
// ownerTrace.ts wires them to the recorder, the router and the window. Each
// piece takes an isActive() gate (the owner check) and does nothing, starts no
// timers when it says no.

type Timer = unknown;

interface TimerDeps {
  now?: () => number;
  setTimer?: (callback: () => void, ms: number) => Timer;
  clearTimer?: (handle: Timer) => void;
}

type RecordFn = (
  type: string,
  data: Record<string, unknown>,
  path?: string
) => void;

// ---------------------------------------------------------------- nav-timing

// After the route commits, how long to wait for a content page's "ready"
// (content-scroll ready) before closing the navigation's event without it.
export const NAV_TIMING_READY_WAIT_MS = 5000;
// A pointerdown this recent is taken as the tap that started a navigation.
export const NAV_TIMING_TAP_WINDOW_MS = 1000;

export interface NavTimingGateReport {
  // The deploy-freshness probe's answer as the navigation saw it.
  probe?: string;
  probeMs?: number;
  // The navigation gate's result: current | deferred | reloading | failed.
  result?: string;
}

interface NavTimingRecord {
  at: number;
  via: string;
  to?: string;
  nav?: string;
  urlAt?: number;
  gateAt?: number;
  gate?: NavTimingGateReport;
  commitAt?: number;
  readyAt?: number;
  timer?: Timer;
}

// One compact `nav-timing` event per navigation: the tap (or the explicit
// navigation start), the URL change, the deploy-probe gate release, the route
// commit and, on content pages, content-ready. Offsets are ms from the start.
export function createNavTimingTracker({
  isActive,
  record,
  getRecentTapAt = () => null,
  now = () => Date.now(),
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as any),
  readyWaitMs = NAV_TIMING_READY_WAIT_MS
}: TimerDeps & {
  isActive: () => boolean;
  record: RecordFn;
  // When the last pointerdown happened (null if none recently).
  getRecentTapAt?: () => number | null;
  readyWaitMs?: number;
}) {
  let current: NavTimingRecord | null = null;
  let lastUsedTapAt: number | null = null;

  return { start, location, gate, commit, contentReady, flush };

  // The recent pointerdown that started this navigation, used once.
  function takeTapAt(t: number) {
    const tapAt = getRecentTapAt();
    if (
      typeof tapAt !== 'number' ||
      tapAt === lastUsedTapAt ||
      tapAt > t ||
      t - tapAt > NAV_TIMING_TAP_WINDOW_MS
    ) {
      return null;
    }
    lastUsedTapAt = tapAt;
    return tapAt;
  }

  // An explicit navigation start (Header nav tap, Home feed card open).
  function start(via: string) {
    if (!isActive()) return;
    if (current?.urlAt !== undefined) finish('next-nav');
    const t = now();
    // A start whose URL never changed (a repeat tap) is replaced.
    current = { at: takeTapAt(t) ?? t, via };
  }

  // The router's location changed. Only the pathname is kept (no search or
  // hash).
  function location(rawTo: string, nav: string) {
    if (!isActive()) return;
    const to = pathnameOnly(rawTo);
    const t = now();
    if (current && current.urlAt === undefined) {
      current.urlAt = t;
      current.to = to;
      current.nav = nav;
      return;
    }
    if (current && current.commitAt === undefined && nav === 'REPLACE') {
      // A redirect before the first destination committed: same navigation.
      current.to = to;
      return;
    }
    if (current) finish('next-nav');
    const tapAt = takeTapAt(t);
    current = {
      at: tapAt ?? t,
      via: nav === 'POP' ? 'pop' : tapAt !== null ? 'tap' : 'url',
      to,
      nav,
      urlAt: t
    };
  }

  function gate(report: NavTimingGateReport) {
    if (!isActive() || !current || current.urlAt === undefined) return;
    if (current.gateAt !== undefined) return;
    current.gateAt = now();
    current.gate = report;
    // A reloading gate never commits; the page is about to go away.
    if (report.result === 'reloading') finish();
  }

  function commit(rawPath: string) {
    if (!isActive() || !current || current.urlAt === undefined) return;
    if (current.commitAt !== undefined) return;
    const path = pathnameOnly(rawPath);
    if (current.to && path && current.to !== path) {
      // A redirect: the committed route is the destination.
      current.to = path;
    }
    current.commitAt = now();
    const committed = current;
    committed.timer = setTimer(() => {
      if (current === committed) finish();
    }, readyWaitMs);
  }

  function contentReady() {
    if (!isActive() || !current || current.commitAt === undefined) return;
    if (current.readyAt !== undefined) return;
    current.readyAt = now();
    finish();
  }

  // Page going away: emit what is known.
  function flush() {
    if (current?.urlAt !== undefined) finish('hidden');
    else current = null;
  }

  function finish(cut?: string) {
    const entry = current;
    current = null;
    if (!entry || entry.urlAt === undefined) return;
    if (entry.timer !== undefined) clearTimer(entry.timer);
    const offset = (value?: number) =>
      value === undefined ? undefined : Math.max(0, Math.round(value - entry.at));
    const end = entry.readyAt ?? entry.commitAt;
    const data: Record<string, unknown> = {
      to: entry.to,
      via: entry.via,
      nav: entry.nav,
      url: offset(entry.urlAt),
      gate: offset(entry.gateAt),
      commit: offset(entry.commitAt),
      ready: offset(entry.readyAt),
      total: end === undefined ? offset(now()) : offset(end),
      probe: entry.gate?.probe,
      probeMs:
        entry.gate?.probeMs !== undefined && entry.gate.probeMs > 0
          ? Math.round(entry.gate.probeMs)
          : undefined,
      result:
        entry.gate?.result && entry.gate.result !== 'current'
          ? entry.gate.result
          : undefined,
      cut
    };
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) delete data[key];
    }
    record('nav-timing', data, entry.to);
  }
}

export function pathnameOnly(path: string) {
  return String(path || '').split(/[?#]/)[0];
}

// ------------------------------------------------------------- slow-request

export const SLOW_REQUEST_THRESHOLD_MS = 1000;
const MAX_REQUEST_PATH_CHARS = 160;

// A non-numeric segment right after one of these can be a member's username
// (/users/<name>, /profile/<name>, /username/<name>), so it is masked. Bare
// 'user' is not a marker: it is the API namespace (/user/session,
// /user/verify), and the client sends usernames as query values, which are
// dropped anyway. The cost is a little route detail on paths such as
// /user/username/check or /user/profile/sections (logged as .../*).
const usernameMarkerSegments = new Set(['users', 'username', 'profile']);

// An API URL reduced to a pattern safe for the trace: no origin, query keys
// only (values can be search text), long opaque segments masked. Numeric ids
// stay.
export function redactRequestPath(url: unknown): string {
  if (typeof url !== 'string' || !url) return '';
  let value = url;
  const hashIndex = value.indexOf('#');
  if (hashIndex >= 0) value = value.slice(0, hashIndex);
  const queryIndex = value.indexOf('?');
  const query = queryIndex >= 0 ? value.slice(queryIndex + 1) : '';
  let pathname = queryIndex >= 0 ? value.slice(0, queryIndex) : value;
  pathname = pathname.replace(/^[a-z][a-z\d+.-]*:\/\/[^/]*/i, '');
  pathname = pathname
    .split('/')
    .map((segment, index, segments) =>
      // Numeric ids stay; long opaque or letter+digit tokens are masked, and
      // so is whatever follows a username-carrying segment.
      !/^\d+$/.test(segment) &&
      (segment.length > 24 ||
        (segment.length >= 16 && /\d/.test(segment) && /[a-z]/i.test(segment)) ||
        (index > 0 && usernameMarkerSegments.has(segments[index - 1])))
        ? '*'
        : segment
    )
    .join('/');
  const keys = query
    .split('&')
    .map((part) => part.split('=')[0])
    .filter((key) => key && key !== '_retry' && key !== '_ts');
  return `${pathname || '/'}${keys.length ? `?${keys.join('&')}` : ''}`.slice(
    0,
    MAX_REQUEST_PATH_CHARS
  );
}

export function describeSlowRequest({
  method,
  url,
  status,
  ms,
  queuedMs,
  attempts,
  thresholdMs = SLOW_REQUEST_THRESHOLD_MS
}: {
  method?: string;
  url?: string;
  status?: number | string;
  ms: number;
  queuedMs?: number;
  attempts?: number;
  thresholdMs?: number;
}): Record<string, unknown> | null {
  if (!Number.isFinite(ms) || ms < thresholdMs) return null;
  const data: Record<string, unknown> = {
    m: String(method || 'get').toUpperCase(),
    api: redactRequestPath(url),
    status: status ?? 'none',
    ms: Math.round(ms)
  };
  if (queuedMs !== undefined && queuedMs >= 50) data.q = Math.round(queuedMs);
  if (attempts !== undefined && attempts > 1) data.tries = attempts;
  return data;
}

// -------------------------------------------------------------------- stall

export const STALL_THRESHOLD_MS = 200;
// How often the stall timer checks its own lateness. A chained timer, not a
// requestAnimationFrame loop: a per-frame loop keeps the phone's main thread
// from ever idling (Mikey's phones have run hot from always-on per-frame work).
export const STALL_CHECK_INTERVAL_MS = 500;
// Stalls this close together are one burst, reported once.
export const STALL_COALESCE_MS = 1000;
// Lateness this long is a suspended page (app switcher, lock screen), not a
// main-thread stall.
export const STALL_MAX_GAP_MS = 30_000;

export interface StallBurst {
  // The longest single stall, the number of stalls, their sum, and the
  // burst's span from the first stall's start to the last one's end.
  ms: number;
  n: number;
  total: number;
  span: number;
  path: string;
}

// Main-thread stall detector by timer drift: a timer due every
// STALL_CHECK_INTERVAL_MS measures how late it fired; lateness over the
// threshold is a stall of about that length. Runs only while isActive() and
// isVisible(); stops itself otherwise.
export function createStallMonitor({
  isActive,
  isVisible,
  getPath,
  onStall,
  now = () => Date.now(),
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as any),
  scheduleCheck = (callback, ms) => setTimeout(callback, ms),
  cancelCheck = (handle) => clearTimeout(handle as any),
  intervalMs = STALL_CHECK_INTERVAL_MS,
  thresholdMs = STALL_THRESHOLD_MS,
  coalesceMs = STALL_COALESCE_MS,
  maxGapMs = STALL_MAX_GAP_MS
}: TimerDeps & {
  isActive: () => boolean;
  isVisible: () => boolean;
  getPath: () => string;
  onStall: (burst: StallBurst) => void;
  // The drift timer (separate from the burst timer so tests can drive each).
  scheduleCheck?: (callback: () => void, ms: number) => Timer;
  cancelCheck?: (handle: Timer) => void;
  intervalMs?: number;
  thresholdMs?: number;
  coalesceMs?: number;
  maxGapMs?: number;
}) {
  let check: Timer | null = null;
  let running = false;
  let dueAt = 0;
  let burst: (StallBurst & { start: number; end: number }) | null = null;
  let burstTimer: Timer | null = null;

  return { start, stop, isRunning: () => running };

  function start() {
    if (running || !isActive() || !isVisible()) return;
    running = true;
    schedule();
  }

  function schedule() {
    dueAt = now() + intervalMs;
    check = scheduleCheck(tick, intervalMs);
  }

  function stop() {
    // First, while still marked running, so recording the burst cannot
    // restart the timer it is stopping.
    flushBurst();
    if (check !== null) cancelCheck(check);
    check = null;
    running = false;
  }

  function tick() {
    check = null;
    if (!running) return;
    if (!isActive() || !isVisible()) {
      stop();
      return;
    }
    const t = now();
    const lateness = t - dueAt;
    if (lateness > thresholdMs && lateness <= maxGapMs) {
      noteStall(lateness, t);
    }
    schedule();
  }

  function noteStall(ms: number, endAt: number) {
    if (burst) {
      burst.n += 1;
      burst.ms = Math.max(burst.ms, ms);
      burst.total += ms;
      burst.end = endAt;
    } else {
      burst = {
        ms,
        n: 1,
        total: ms,
        span: 0,
        path: pathnameOnly(getPath()),
        start: endAt - ms,
        end: endAt
      };
    }
    if (burstTimer !== null) clearTimer(burstTimer);
    burstTimer = setTimer(() => {
      burstTimer = null;
      flushBurst();
    }, coalesceMs);
  }

  function flushBurst() {
    if (burstTimer !== null) {
      clearTimer(burstTimer);
      burstTimer = null;
    }
    const done = burst;
    burst = null;
    if (!done) return;
    onStall({
      ms: Math.round(done.ms),
      n: done.n,
      total: Math.round(done.total),
      span: Math.round(done.end - done.start),
      path: done.path
    });
  }
}

// ---------------------------------------------------------------- page-load

interface NavigationTimingLike {
  type?: string;
  responseStart?: number;
  domContentLoadedEventEnd?: number;
  loadEventEnd?: number;
  transferSize?: number;
}

// Navigation Timing for the document plus when the first route was ready, all
// in ms since the navigation started.
export function buildPageLoadTiming(
  entry: NavigationTimingLike | null | undefined,
  firstRouteReadyMs: number | null
): Record<string, unknown> {
  const ms = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0
      ? Math.round(value)
      : undefined;
  const data: Record<string, unknown> = {
    type: entry?.type || undefined,
    ttfb: ms(entry?.responseStart),
    dcl: ms(entry?.domContentLoadedEventEnd),
    load: ms(entry?.loadEventEnd),
    route: ms(firstRouteReadyMs),
    cached: entry && entry.transferSize === 0 ? true : undefined
  };
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }
  return data;
}

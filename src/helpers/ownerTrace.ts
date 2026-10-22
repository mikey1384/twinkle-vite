import API_URL from '~/constants/URL';
import { ADMIN_USER_ID, clientVersion } from '~/constants/defaultValues';
import { userIdRef } from '~/constants/state';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { createOwnerTraceRecorder } from '~/helpers/ownerTraceRecorder';
import {
  createScrollPerfMonitor,
  getScrollPerfContext
} from '~/helpers/ownerTraceScrollPerf';
import { createFrameAttribution } from '~/helpers/ownerTraceFrameAttribution';
import {
  buildPageLoadTiming,
  createNavTimingTracker,
  createStallMonitor,
  describeSlowRequest,
  redactRequestPath,
  type NavTimingGateReport
} from '~/helpers/ownerTracePerf';
import { createWakeProfiler } from '~/helpers/ownerTraceWake';
import { installOwnerViewportTrace } from '~/helpers/ownerTraceViewport';
import type {
  ExtendedAxiosRequestConfig,
  RequestAttemptTiming
} from '~/contexts/requestHelpers/axiosInstance/requestScheduler';

// Always-on client trace for the site owner only (the same
// userIdRef.current === ADMIN_USER_ID gate as emitAdminTelemetry). When Mikey
// reports a UI issue from his desktop or phone, agents read it with
// `lumine admin owner-trace`. Records ids, paths, scroll numbers and short
// error text only: never message text or other members' content. A no-op for
// everyone else (no listeners, timers or requests).

const MAX_ERROR_CHARS = 200;

const recorder = createOwnerTraceRecorder({
  isOwner: () =>
    Number.isSafeInteger(ADMIN_USER_ID) &&
    ADMIN_USER_ID > 0 &&
    userIdRef.current === ADMIN_USER_ID,
  send: sendOwnerTraceBatch,
  getPath: getCurrentPath,
  getSessionHeader,
  onFirstActivation: installOwnerTraceListeners
});

export function isOwnerTraceActive() {
  return recorder.isActive();
}

export function recordOwnerTrace(
  type: string,
  data?: Record<string, unknown>,
  path?: string
) {
  recorder.record(type, data, path);
  if (!recorder.isActive()) return;
  // Shared hooks into the per-navigation timeline, so feature code does not
  // need to know about nav-timing.
  if (type === 'feed-open') navTiming.start('feed');
  else if (type === 'content-scroll' && data?.phase === 'ready') {
    navTiming.contentReady();
  }
  stallMonitor.start();
}

// ------------------------------------------------------------------ perf
// nav-timing, slow-request, stall and page-load (ownerTracePerf.ts). Owner
// only: every entry point below is a no-op check for anyone else, except
// noteOwnerRouteReady's one-time timestamp of the first route.

let lastPointerDownAt: number | null = null;

// Taps that reached their page quickly are routine; only slow ones are kept
// (10-20 noise cut: 130 of 132 a day were under this).
const NAV_TIMING_MIN_TOTAL_MS = 500;

const navTiming = createNavTimingTracker({
  isActive: () => recorder.isActive(),
  record: (type, data, path) => {
    if (
      type === 'nav-timing' &&
      Number(data?.total) < NAV_TIMING_MIN_TOTAL_MS
    ) {
      return;
    }
    recordOwnerTrace(type, data, path);
  },
  getRecentTapAt: () => lastPointerDownAt
});

const stallMonitor = createStallMonitor({
  isActive: () => recorder.isActive(),
  isVisible: () =>
    typeof document !== 'undefined' && document.visibilityState === 'visible',
  getPath: getCurrentPath,
  onStall: ({ path, ...data }) => {
    wakeProfiler.noteStall(Number(data.ms));
    recordOwnerTrace('stall', data, path);
  }
});

// The WAKE_WINDOW_MS after a load (an iOS tab restore is a fresh back_forward
// load) or a return to the tab, summarized as one `wake` event.
const wakeProfiler = createWakeProfiler({
  isActive: () => recorder.isActive(),
  record: (data) => recordOwnerTrace('wake', data)
});
// a cold load starts disconnected; connect/disconnect events keep it current
let lastSocketConnected = false;
let hiddenAt: number | null = null;

// Socket.IO transitions (useInitSocket), for the wake window.
export function noteOwnerSocket(
  event: 'connect' | 'disconnect' | 'reconnect-attempt',
  reason?: string
) {
  if (event === 'connect') lastSocketConnected = true;
  else if (event === 'disconnect') lastSocketConnected = false;
  wakeProfiler.noteSocket(event, reason);
}

// A boot/refresh pipeline that ran (session init, chat load), for the wake
// window: shows which trigger repeated the work.
export function noteOwnerWakeWork(name: string) {
  wakeProfiler.noteWork(name);
}

let smoothScrollSamples = 0;

// Slow-frame attribution only exists while a scroll sample is open, which
// only happens for the owner.
const frameAttribution = createFrameAttribution();

const scrollPerfMonitor = createScrollPerfMonitor({
  isActive: () => recorder.isActive(),
  isVisible: () =>
    typeof document !== 'undefined' && document.visibilityState === 'visible',
  getPath: getCurrentPath,
  getContext: () => getScrollPerfContext(document, window),
  // A smooth sample is routine (504 of 576 a day): keep only samples with a
  // dropped frame, carrying how many smooth ones came before (10-20 noise cut).
  record: (data, path) => {
    if (Number(data.over50) === 0 && Number(data.maxFrameMs) < 50) {
      smoothScrollSamples += 1;
      return;
    }
    recordOwnerTrace(
      'scroll-perf',
      { ...data, smoothBefore: smoothScrollSamples },
      path
    );
    smoothScrollSamples = 0;
  },
  attribution: frameAttribution,
  recordFrame: (data, path) => recordOwnerTrace('scroll-frame', data, path)
});

// Feed cards call these on every render (see useOwnerFeedCardFrameCount).
// A single boolean check unless the owner is mid-scroll.
export function noteOwnerFeedCardRender(type: string, firstRender: boolean) {
  wakeProfiler.noteCardRender(type, firstRender);
  if (!frameAttribution.isActive()) return;
  if (firstRender) frameAttribution.noteMount(type);
  else frameAttribution.noteRender(type);
}

// Measure the suspected synchronous layout read, only inside an owner's
// existing scroll sample. No extra observer, timer, DOM read or event volume.
export function measureOwnerFeedText<T>(measure: () => T): T {
  if (!frameAttribution.isActive()) return measure();
  const startedAt = performance.now();
  try { return measure(); }
  finally { frameAttribution.noteTextMeasure(performance.now() - startedAt); }
}

// Attribute scoped synchronous layout work during the existing owner sample.
export function measureOwnerLayout<T>(name: 'block-preview' | 'richtext-overflow' | 'feed-truncation', run: () => T): T {
  if (!frameAttribution.isActive()) return run();
  const at = performance.now();
  try { return run(); } finally { frameAttribution.noteLayout(name, performance.now() - at); }
}

// A navigation the app started itself (Header nav tap).
export function noteOwnerNavStart(via: string) {
  navTiming.start(via);
}

export function noteOwnerNavLocation(path: string, navigationType: string) {
  wakeProfiler.noteRoute();
  scrollPerfMonitor.stop('route');
  navTiming.location(path, navigationType);
}

export function noteOwnerNavGate(report: NavTimingGateReport) {
  navTiming.gate(report);
}

let firstRouteReadyMs: number | null = null;
let pageLoadState: 'idle' | 'waiting' | 'recorded' = 'idle';

export function noteOwnerRouteReady(path: string) {
  if (firstRouteReadyMs === null) {
    firstRouteReadyMs =
      typeof performance === 'undefined' ? null : performance.now();
    maybeRecordPageLoad();
  }
  navTiming.commit(path);
}

// Once per page load, after the load event, when the owner is known.
function maybeRecordPageLoad() {
  if (pageLoadState !== 'idle' || firstRouteReadyMs === null) return;
  if (!recorder.isActive() || typeof document === 'undefined') return;
  if (document.readyState !== 'complete') {
    pageLoadState = 'waiting';
    window.addEventListener(
      'load',
      () => {
        // loadEventEnd is only set after the load handlers return.
        window.setTimeout(() => {
          pageLoadState = 'idle';
          maybeRecordPageLoad();
        }, 0);
      },
      { once: true }
    );
    return;
  }
  pageLoadState = 'recorded';
  let entry: PerformanceNavigationTiming | undefined;
  try {
    entry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
  } catch {
    entry = undefined;
  }
  recordOwnerTrace('page-load', buildPageLoadTiming(entry, firstRouteReadyMs));
}

// Wraps one API request (axiosInstance) for the owner only: a request slower
// than SLOW_REQUEST_THRESHOLD_MS is recorded with its method, a redacted path
// pattern, status, total ms and scheduler queue time.
export function traceOwnerRequest<T, R>(
  config: ExtendedAxiosRequestConfig<T>,
  send: (config: ExtendedAxiosRequestConfig<T>) => Promise<R>
): Promise<R> {
  if (!recorder.isActive()) return send(config);
  const method = String(config.method || 'get').toUpperCase();
  const pattern = `${method} ${redactRequestPath(config.url)}`;
  // grouped by redacted pattern; true repeats counted by the exact request
  // (URL and params, kept in memory only), so 13 different feed cards are not
  // 13 "repeats"
  wakeProfiler.noteRequest(
    pattern,
    `${method} ${config.url || ''} ${stableParams(config.params)}`
  );
  const startedAt = Date.now();
  let queuedMs = 0;
  let attempts = 0;
  const originalTiming = config.meta?.onAttemptTiming;
  const traced: ExtendedAxiosRequestConfig<T> = {
    ...config,
    meta: {
      ...(config.meta || {}),
      onAttemptTiming(timing: RequestAttemptTiming) {
        attempts = Math.max(attempts, timing.attempt + 1);
        queuedMs += (timing.preQueueDelayMs || 0) + (timing.queueWaitMs || 0);
        originalTiming?.(timing);
      }
    }
  };
  const promise = send(traced);
  const finish = (status: number | string | undefined) => {
    wakeProfiler.noteRequestDone(pattern);
    const data = describeSlowRequest({
      method: config.method,
      url: config.url,
      status,
      ms: Date.now() - startedAt,
      queuedMs,
      attempts
    });
    if (data) recordOwnerTrace('slow-request', data);
  };
  promise.then(
    (response) =>
      finish(Number((response as { status?: unknown })?.status) || undefined),
    (error) =>
      finish(
        Number(error?.response?.status) ||
          String(error?.code || error?.message || 'error').slice(0, 40)
      )
  );
  return promise;
}

function stableParams(params: unknown) {
  if (!params || typeof params !== 'object') return '';
  try {
    return JSON.stringify(
      Object.keys(params as Record<string, unknown>)
        .sort()
        .map((key) => [key, (params as Record<string, unknown>)[key]])
    );
  } catch {
    return '';
  }
}

// Which element a Home feed open came from, in coarse terms (how it was
// triggered and the tapped element's tag), noted by the event handler and taken
// by the navigation in the same tick.
let pendingTap: { via: string; el: string; at: number } | null = null;

export function noteOwnerTraceTap(via: string, target: EventTarget | null) {
  if (!recorder.isActive()) return;
  pendingTap = { via, el: describeTraceTarget(target), at: Date.now() };
}

export function takeOwnerTraceTap(): { via: string; el: string } | null {
  const tap = pendingTap;
  pendingTap = null;
  if (!tap || Date.now() - tap.at > 1000) return null;
  return { via: tap.via, el: tap.el };
}

function describeTraceTarget(target: EventTarget | null) {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return '';
  const tag = target.tagName.toLowerCase();
  const control = target.closest('button, a, [role="button"]');
  const media = target.closest('img, video, picture, canvas, iframe');
  return [
    tag,
    media && media !== target ? media.tagName.toLowerCase() : '',
    control && control !== target ? `in-${control.tagName.toLowerCase()}` : ''
  ]
    .filter(Boolean)
    .join('/');
}

export function getOwnerTraceScrollTop() {
  if (typeof document === 'undefined') return -1;
  const appScroller = document.getElementById('App');
  const bodyScroller = document.scrollingElement;
  return Math.round(
    Math.max(appScroller?.scrollTop || 0, bodyScroller?.scrollTop || 0)
  );
}

export function getOwnerTraceScrollHeight() {
  if (typeof document === 'undefined') return -1;
  const appScroller = document.getElementById('App');
  const bodyScroller = document.scrollingElement;
  return Math.round(
    Math.max(appScroller?.scrollHeight || 0, bodyScroller?.scrollHeight || 0)
  );
}

function sendOwnerTraceBatch(
  body: string,
  { unloading }: { unloading: boolean }
) {
  const token = getStoredItem('token');
  if (!token) return;
  // fetch (not sendBeacon) because the route needs the authorization header;
  // keepalive lets the unloading flush outlive pagehide.
  fetch(`${API_URL}/user/owner-trace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: token
    },
    body,
    // Only the pagehide/visibility flush: keepalive requests share a 64KB
    // in-flight budget, so a routine batch must not use it.
    keepalive: unloading
  }).catch(() => {});
}

function getNavigationType() {
  try {
    const entry = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    return entry?.type || '';
  } catch {
    return '';
  }
}

function getCurrentPath() {
  try {
    return `${window.location.pathname}${window.location.search}`.slice(
      0,
      255
    );
  } catch {
    return '';
  }
}

function getSessionHeader(): Record<string, unknown> {
  try {
    const nav = window.navigator as Navigator & {
      standalone?: boolean;
      userAgentData?: { platform?: string; mobile?: boolean };
    };
    return {
      version: clientVersion,
      scrollPerf: 1,
      viewportTrace: 1,
      vw: window.innerWidth,
      vh: window.innerHeight,
      vvh: Math.round(window.visualViewport?.height || 0),
      dpr: window.devicePixelRatio,
      sw: window.screen?.width,
      sh: window.screen?.height,
      ua: String(nav.userAgent || '').slice(0, 220),
      platform: nav.userAgentData?.platform || nav.platform || '',
      mobile: nav.userAgentData?.mobile,
      standalone:
        nav.standalone === true ||
        window.matchMedia?.('(display-mode: standalone)').matches === true,
      touch: navigator.maxTouchPoints || 0,
      // back_forward on iOS with a fresh session = the tab was discarded while
      // away and restored by reloading
      navType: getNavigationType()
    };
  } catch {
    return { version: clientVersion };
  }
}

let listenersInstalled = false;

function installOwnerTraceListeners() {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  installOwnerViewportTrace({
    isActive: () => recorder.isActive(),
    record: (data) => recordOwnerTrace('wake-viewport', data),
    version: clientVersion
  });
  document.addEventListener('scroll', () => scrollPerfMonitor.scroll(), {
    capture: true,
    passive: true
  });
  // Tap time for nav-timing (a timestamp, nothing recorded).
  window.addEventListener(
    'pointerdown',
    () => {
      lastPointerDownAt = Date.now();
    },
    { capture: true, passive: true }
  );
  // After the 'session' header this activation is about to push.
  window.setTimeout(() => {
    maybeRecordPageLoad();
    stallMonitor.start();
    if (document.visibilityState === 'visible') {
      wakeProfiler.start({
        kind: 'load',
        navType: getNavigationType(),
        socketConnected: lastSocketConnected
      });
    }
  }, 0);
  window.addEventListener('error', (event: ErrorEvent) => {
    recordOwnerTrace('error', {
      msg: String(event.message || '').slice(0, MAX_ERROR_CHARS),
      src: String(event.filename || '')
        .split('?')[0]
        .split('/')
        .pop(),
      line: event.lineno,
      col: event.colno
    });
  });
  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      recordOwnerTrace('rejection', {
        msg: String(
          reason?.message || reason?.code || reason?.name || reason || ''
        ).slice(0, MAX_ERROR_CHARS),
        status: Number(reason?.response?.status) || undefined
      });
    }
  );
  window.addEventListener('pagehide', (event: PageTransitionEvent) => {
    wakeProfiler.stop('pagehide');
    scrollPerfMonitor.stop('pagehide');
    navTiming.flush();
    stallMonitor.stop();
    recordOwnerTrace('pagehide', { persisted: event.persisted });
    recorder.flush({ unloading: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      wakeProfiler.stop('hidden');
      scrollPerfMonitor.stop('hidden');
      navTiming.flush();
      stallMonitor.stop();
    }
    // Recording restarts the stall monitor when visible again.
    recordOwnerTrace('visibility', { state: document.visibilityState });
    if (document.visibilityState === 'visible') {
      wakeProfiler.start({
        kind: 'resume',
        awayMs: hiddenAt === null ? undefined : Date.now() - hiddenAt,
        socketConnected: lastSocketConnected
      });
      hiddenAt = null;
    }
    if (document.visibilityState === 'hidden') {
      recorder.flush({ unloading: true });
    }
  });
}

import API_URL from '~/constants/URL';
import { ADMIN_USER_ID, clientVersion } from '~/constants/defaultValues';
import { userIdRef } from '~/constants/state';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { createOwnerTraceRecorder } from '~/helpers/ownerTraceRecorder';
import {
  buildPageLoadTiming,
  createNavTimingTracker,
  createStallMonitor,
  describeSlowRequest,
  type NavTimingGateReport
} from '~/helpers/ownerTracePerf';
import type {
  ExtendedAxiosRequestConfig,
  RequestAttemptTiming
} from '~/contexts/requestHelpers/axiosInstance/requestScheduler';

// Always-on client trace for the site owner only (the same
// userIdRef.current === ADMIN_USER_ID gate as emitAdminTelemetry). When Mikey
// reports a UI issue from his phone, Claude reads it with
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

const navTiming = createNavTimingTracker({
  isActive: () => recorder.isActive(),
  record: (type, data, path) => recordOwnerTrace(type, data, path),
  getRecentTapAt: () => lastPointerDownAt
});

const stallMonitor = createStallMonitor({
  isActive: () => recorder.isActive(),
  isVisible: () =>
    typeof document !== 'undefined' && document.visibilityState === 'visible',
  getPath: getCurrentPath,
  onStall: ({ path, ...data }) => recordOwnerTrace('stall', data, path)
});

// A navigation the app started itself (Header nav tap).
export function noteOwnerNavStart(via: string) {
  navTiming.start(via);
}

export function noteOwnerNavLocation(path: string, navigationType: string) {
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
      touch: navigator.maxTouchPoints || 0
    };
  } catch {
    return { version: clientVersion };
  }
}

let listenersInstalled = false;

function installOwnerTraceListeners() {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
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
    navTiming.flush();
    stallMonitor.stop();
    recordOwnerTrace('pagehide', { persisted: event.persisted });
    recorder.flush({ unloading: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      navTiming.flush();
      stallMonitor.stop();
    }
    // Recording restarts the stall monitor when visible again.
    recordOwnerTrace('visibility', { state: document.visibilityState });
    if (document.visibilityState === 'hidden') {
      recorder.flush({ unloading: true });
    }
  });
}

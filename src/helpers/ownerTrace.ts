import API_URL from '~/constants/URL';
import { ADMIN_USER_ID, clientVersion } from '~/constants/defaultValues';
import { userIdRef } from '~/constants/state';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { createOwnerTraceRecorder } from '~/helpers/ownerTraceRecorder';

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
    recordOwnerTrace('pagehide', { persisted: event.persisted });
    recorder.flush({ unloading: true });
  });
  document.addEventListener('visibilitychange', () => {
    recordOwnerTrace('visibility', { state: document.visibilityState });
    if (document.visibilityState === 'hidden') {
      recorder.flush({ unloading: true });
    }
  });
}

import API_URL from '~/constants/URL';
import { ADMIN_USER_ID, clientVersion } from '~/constants/defaultValues';
import { userIdRef } from '~/constants/state';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { getRunningEntryScripts } from '~/helpers/clientUpdate';
import { setClientTraceSink } from '~/helpers/clientTraceBus';
import {
  flushOwnerTraceNow,
  isOwnerTraceActive,
  recordOwnerTrace
} from '~/helpers/ownerTrace';
import {
  createMemberTrace,
  type MemberTraceStorage
} from '~/helpers/memberTraceCore';

// The member client trace (memberTraceCore.ts): the owner trace switched on
// for a member account an admin put on the server's list, read with
// `lumine admin member-trace <username>`. Records the session header (website
// version and bundle, device, how the page was opened), routes, chat
// channel/subchannel selection, every self-reload with its reason, error
// screens, window errors and unhandled rejections, page hide/show. Ids, paths
// and short error text only: never message text or other members' content.
// A no-op for everyone else (no listeners, timers, storage or requests).

const MAX_ERROR_CHARS = 200;

const trace = createMemberTrace({
  storage: getLocalStorage,
  tabStorage: getSessionStorage,
  getUserId: currentUserId,
  isOwner: () =>
    Number.isSafeInteger(ADMIN_USER_ID) &&
    ADMIN_USER_ID > 0 &&
    currentUserId() === ADMIN_USER_ID,
  post: postBatch,
  getPath: getCurrentPath,
  getSessionHeader,
  version: clientVersion,
  onFirstActivation: installMemberTraceListeners
});

let started = false;

// main.tsx, right after the history guards: installs the reload hand-off for
// both traces and, when this device's account is traced, starts at once (a
// reload loop must be seen from the first moment of each load).
export function startMemberTrace() {
  if (started || typeof window === 'undefined') return;
  started = true;
  setClientTraceSink({
    record(type, data) {
      if (isOwnerTraceActive()) recordOwnerTrace(type, data);
      else trace.record(type, data);
    },
    recordMember(type, data) {
      trace.record(type, data);
    },
    reload(reason, data) {
      if (isOwnerTraceActive()) {
        recordOwnerTrace('reload', { reason, ...(data || {}) });
        flushOwnerTraceNow();
        return;
      }
      trace.recordReload(reason, data);
    }
  });
  trace.start({ navType: getNavigationType() });
}

// The canonical session answer (App's session load): `clientTrace` says
// whether an admin switched tracing on for this account.
export function noteMemberTraceSession(userId: number, clientTrace: unknown) {
  trace.noteSession(
    Number(userId) || 0,
    typeof clientTrace === 'boolean' ? clientTrace : undefined
  );
}

export function isMemberTraceActive() {
  return trace.isActive();
}

let socketUpAt = 0;
let socketDownAt = 0;
let visibleSinceAt = typeof document === 'undefined' ? 0 : Date.now();

// Socket.IO transitions (useInitSocket), member trace only: how long the
// connection lasted or was down, whether the page was visible, and how long
// it had been visible when it noticed (a drop noticed right after a return to
// the tab is the phone's sleep; one while the member is looking is not).
export function noteMemberSocket(
  event: 'connect' | 'disconnect' | 'reconnect-attempt',
  reason?: string
) {
  if (!trace.isActive()) return;
  const now = Date.now();
  const visible =
    typeof document !== 'undefined' && document.visibilityState === 'visible';
  const data: Record<string, unknown> = {
    e: event,
    vis: visible ? 'visible' : 'hidden',
    ...(visible && visibleSinceAt ? { visibleForMs: now - visibleSinceAt } : {})
  };
  if (reason) data.reason = String(reason).slice(0, 60);
  if (event === 'connect') {
    if (socketDownAt) data.downMs = now - socketDownAt;
    socketUpAt = now;
    socketDownAt = 0;
  } else if (event === 'disconnect') {
    if (socketUpAt) data.upMs = now - socketUpAt;
    socketDownAt = now;
    socketUpAt = 0;
  } else if (socketDownAt) {
    data.downMs = now - socketDownAt;
  }
  trace.record('socket', data);
}

export function recordMemberTrace(
  type: string,
  data?: Record<string, unknown>,
  path?: string
) {
  trace.record(type, data, path);
}

function currentUserId() {
  const fromApp = Number(userIdRef.current || 0);
  if (fromApp > 0) return fromApp;
  // before the app has mounted: the account this device is signed in to
  return Number(getStoredItem('userId') || 0) || 0;
}

function getSessionStorage(): MemberTraceStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage(): MemberTraceStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function postBatch(
  body: string,
  { unloading }: { unloading: boolean }
): Promise<number> {
  const token = getStoredItem('token');
  if (!token) return Promise.resolve(401);
  // The upload needs the authorization header, which sendBeacon cannot send;
  // keepalive fetch is the unloading-safe equivalent (as for the owner trace),
  // and the outbox in memberTraceCore.ts covers a send the page did not live
  // to finish.
  return fetch(`${API_URL}/user/owner-trace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: token,
      'x-twinkle-client-version': clientVersion
    },
    body,
    keepalive: unloading
  }).then(
    (response) => response.status,
    () => 0
  );
}

function getNavigationType() {
  try {
    const entry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    return entry?.type || '';
  } catch {
    return '';
  }
}

function getCurrentPath() {
  try {
    return `${window.location.pathname}${window.location.search}`.slice(0, 255);
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
      // the deployed bundle this page runs (a stale cache shows here even when
      // the version number did not change)
      entry: getRunningEntryScripts(document).join(',').slice(0, 120),
      vw: window.innerWidth,
      vh: window.innerHeight,
      dpr: window.devicePixelRatio,
      ua: String(nav.userAgent || '').slice(0, 220),
      platform: nav.userAgentData?.platform || nav.platform || '',
      mobile: nav.userAgentData?.mobile,
      standalone:
        nav.standalone === true ||
        window.matchMedia?.('(display-mode: standalone)').matches === true,
      touch: navigator.maxTouchPoints || 0,
      // reload / navigate / back_forward: how this page was opened
      navType: getNavigationType()
    };
  } catch {
    return { version: clientVersion };
  }
}

let listenersInstalled = false;

function installMemberTraceListeners() {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  window.addEventListener('error', (event: ErrorEvent) => {
    trace.record('error', {
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
      trace.record('rejection', {
        msg: String(
          reason?.message || reason?.code || reason?.name || reason || ''
        ).slice(0, MAX_ERROR_CHARS),
        status: Number(reason?.response?.status) || undefined
      });
    }
  );
  // Every page end, including reloads nobody announced (the browser's own,
  // a pull-to-refresh, a link that loads a new page): flushed into the outbox
  // before the page goes.
  window.addEventListener('pagehide', (event: PageTransitionEvent) => {
    trace.record('pagehide', { persisted: event.persisted });
    trace.flush({ unloading: true });
  });
  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (event.persisted) trace.record('pageshow', { persisted: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') visibleSinceAt = Date.now();
    trace.record('visibility', { state: document.visibilityState });
    if (document.visibilityState === 'hidden') {
      trace.flush({ unloading: true });
    }
  });
}

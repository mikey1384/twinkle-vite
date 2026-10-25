import API_URL from '~/constants/URL';
import { clientVersion } from '~/constants/defaultValues';
import { getStoredItem } from '~/helpers/userDataHelpers';

// Did the last page in this tab die instead of closing? A page that closes
// normally (tab closed, reload, navigation) fires pagehide; one the browser
// kills for memory, or that iOS discards in the background, never does. Each
// page keeps a marker in sessionStorage (it survives those reloads in the same
// tab) and clears it on pagehide; a marker still there at the next load means
// the page died. We report what was going on at the time: which apps were
// loaded (3D ones separately) and how far down the page was, so warnings and
// fixes rest on evidence (10-25: Safari killed the tab with a 3D app kept in
// the background and the home feed 55,000 px down).

const MARKER_KEY = 'twinkle:page-alive';
const WRITE_EVERY_MS = 2000;

interface PageMarker {
  startedAt: number;
  updatedAt: number;
  pathname: string;
  hidden: boolean;
  appIds: number[];
  heavyAppIds: number[];
  scrollDepth: number;
}

let marker: PageMarker | null = null;
let diedOn: string | null = null;
let writeTimer: number | null = null;
// Set by pagehide. Some browsers (WebKit) fire visibilitychange AFTER
// pagehide while unloading; nothing may write the marker back after that.
let closed = false;

function readMarker(): PageMarker | null {
  try {
    const raw = sessionStorage.getItem(MARKER_KEY);
    return raw ? (JSON.parse(raw) as PageMarker) : null;
  } catch {
    return null;
  }
}

function scrollDepth() {
  const app = document.getElementById('App');
  return Math.round(
    Math.max(app?.scrollTop || 0, document.scrollingElement?.scrollTop || 0)
  );
}

function writeNow() {
  if (writeTimer) {
    window.clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (!marker || closed) return;
  marker.updatedAt = Date.now();
  marker.pathname = window.location.pathname;
  marker.scrollDepth = scrollDepth();
  try {
    sessionStorage.setItem(MARKER_KEY, JSON.stringify(marker));
  } catch {
    // storage full or blocked: the next load just can't tell
  }
}

function writeSoon() {
  if (writeTimer) return;
  writeTimer = window.setTimeout(writeNow, WRITE_EVERY_MS);
}

function report(previous: PageMarker) {
  try {
    const token = getStoredItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers.authorization = token;
    fetch(`${API_URL}/user/page-death`, {
      method: 'POST',
      headers,
      keepalive: true,
      body: JSON.stringify({
        kind: previous.hidden ? 'discard' : 'crash',
        pathname: previous.pathname,
        appIds: previous.appIds,
        heavyAppIds: previous.heavyAppIds,
        scrollDepth: previous.scrollDepth,
        aliveSeconds: Math.round(
          (previous.updatedAt - previous.startedAt) / 1000
        ),
        clientVersion
      })
    }).catch(() => {});
  } catch {
    // Telemetry must never affect the page.
  }
}

export function startPageDeathTracker() {
  if (typeof window === 'undefined' || marker) return;
  const previous = readMarker();
  if (previous && previous.startedAt) {
    diedOn = String(previous.pathname || '');
    report(previous);
  }
  marker = {
    startedAt: Date.now(),
    updatedAt: Date.now(),
    pathname: window.location.pathname,
    hidden: document.visibilityState === 'hidden',
    appIds: [],
    heavyAppIds: [],
    scrollDepth: 0
  };
  writeNow();
  window.addEventListener('pagehide', () => {
    closed = true;
    if (writeTimer) window.clearTimeout(writeTimer);
    writeTimer = null;
    try {
      sessionStorage.removeItem(MARKER_KEY);
    } catch {
      // nothing to clear
    }
  });
  // Back from the back/forward cache: this page is alive again.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    closed = false;
    writeNow();
  });
  document.addEventListener('visibilitychange', () => {
    if (!marker || closed) return;
    marker.hidden = document.visibilityState === 'hidden';
    writeNow();
  });
  window.addEventListener('popstate', writeSoon);
  document.addEventListener('scroll', writeSoon, { capture: true, passive: true });
}

/**
 * Where the previous page in this tab was when it died (crashed or was
 * discarded) instead of closing; null when it closed normally.
 */
export function previousPageDeathPath() {
  return diedOn;
}

/** KeepAliveHost: the apps currently loaded in this tab. */
export function notePageDeathApps(appIds: number[], heavyAppIds: number[]) {
  if (!marker) return;
  marker.appIds = appIds.slice(0, 20);
  marker.heavyAppIds = heavyAppIds.slice(0, 20);
  writeNow();
}

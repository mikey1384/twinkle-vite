// Twinkle.app.lifecycle, host side. Apps send small JSON snapshots of their
// place (SDK lifecycleScript.ts); we keep them in IndexedDB so they survive
// unloading the app, a reload of the tab and iOS killing the tab, and hand the
// latest one back when that app starts again (the SDK's init reply).
//
// Only a RETURN gets the whole snapshot back. A NEW VISIT (the app opened
// again the next day, or after a long gap, or in a new tab) starts at the
// app's start: where the viewer was looking (scroll, open tab, chosen
// article) is dropped, and only what the app marked as unfinished work (a
// game in play, a draft) comes back (11-02, Mikey: Newspaper opened the next
// morning at yesterday's scroll). See resolveAppLifecycleResume.
//
// The registry also remembers, per running app, whether it saves its place
// and whether it draws 3D (heavy), and lets KeepAliveHost ask an app for a
// fresh snapshot right before unloading it.

const DB_NAME = 'twinkle-app-lifecycle';
const STORE = 'snapshots';
// savedAt per key, so pruning never has to read the snapshots themselves.
const META = 'saved-at';
const PRUNE_DELAY_MS = 10_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// The SDK gives onSuspend 1.5 s; leave room for the message round trip.
const SNAPSHOT_WAIT_MS = 2500;
// App start never waits longer than this for a saved place: protection
// against an IndexedDB open that never finishes (WebKit), not a slow phone.
const LOAD_TIMEOUT_MS = 1500;
// Same cap as the SDK (1 MB of JSON), measured here again: a frame can post
// to the host directly, so the SDK's own check is not enough.
const MAX_SNAPSHOT_CHARS = 1_100_000;
// One snapshot per app per second at most; the newest within that second
// waits. Two cases are written at once, judged from what the host knows (the
// app's own reason label is not trusted): an unload is waiting for this
// snapshot, or this page itself is going to the background, where iOS can
// freeze it before a timer fires.
const MIN_SNAPSHOT_GAP_MS = 1000;
const MAX_SNAPSHOTS = 200;
// A start is a return when the snapshot was taken in this browser tab's
// session less than this long ago. 30 minutes: Mikey's own returns to a
// backgrounded Twinkle tab (owner trace, late Oct) were 93% under 5 minutes
// and 99% under 30, with the rest an hour or more; it is also the usual
// "session" length (Android clears a task left this long, analytics sessions
// end after it). Keep it in step with the SDK (lifecycleScript.ts).
export const APP_RETURN_WINDOW_MS = 30 * 60 * 1000;
// The tab's session: sessionStorage survives reloads and the phone killing
// and reloading the tab, but not a new tab or a new browser session.
const VISIT_KEY = 'twinkle:app-visit';
const MAX_WORK_KEYS = 100;

export interface AppLifecycleSnapshot {
  state: Record<string, unknown>;
  savedAt: number;
  reason: string;
  /** The tab session it was taken in (missing on snapshots from before 11-02). */
  visit?: string;
  /** Top-level keys of state that are unfinished work, or true for all of it. */
  work?: string[] | true;
}

/** What the app's getResumeState() gets. */
export interface AppLifecycleResume {
  kind: 'return' | 'new_visit';
  state: Record<string, unknown>;
  savedAt: number;
  ageMs: number;
  reason: string;
}

let fallbackVisitId: string | null = null;
function newVisitId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** This tab session's id, made on first use. */
export function getAppVisitId() {
  try {
    const stored = sessionStorage.getItem(VISIT_KEY);
    if (stored) return stored;
    const id = newVisitId();
    sessionStorage.setItem(VISIT_KEY, id);
    return id;
  } catch {
    // No sessionStorage: one id per page, so a reload counts as a new visit
    // (a fresh start rather than a stale one).
    return fallbackVisitId || (fallbackVisitId = newVisitId());
  }
}

/** The app's "work" option: a list of top-level keys, true, or null (none). */
export function normalizeAppLifecycleWork(value: unknown): string[] | true | null {
  if (value === true) return true;
  if (!Array.isArray(value)) return null;
  const keys = Array.from(
    new Set(
      value.filter(
        (key): key is string =>
          typeof key === 'string' && key.length > 0 && key.length <= 64
      )
    )
  ).slice(0, MAX_WORK_KEYS);
  return keys.length ? keys : null;
}

/**
 * A stored snapshot as the app should get it at this start, or null for a
 * fresh start.
 * - Return (taken in this tab session, less than APP_RETURN_WINDOW_MS ago):
 *   the whole snapshot.
 * - New visit: only the keys the app marked as work (all of it with
 *   work: true); null when there are none, so apps that never mark work
 *   start fresh with nothing to undo.
 * Snapshots from before visits were recorded go by age alone.
 */
export function resolveAppLifecycleResume(
  snapshot: AppLifecycleSnapshot | null | undefined,
  { now, visit }: { now: number; visit: string }
): AppLifecycleResume | null {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.state) return null;
  if (typeof snapshot.state !== 'object' || Array.isArray(snapshot.state)) return null;
  const savedAt = Number(snapshot.savedAt);
  const ageMs = now - savedAt;
  if (!(ageMs >= 0 && ageMs < MAX_AGE_MS)) return null;
  const reason = String(snapshot.reason || '');
  const sameVisit =
    typeof snapshot.visit === 'string' ? snapshot.visit === visit : true;
  if (sameVisit && ageMs < APP_RETURN_WINDOW_MS) {
    return { kind: 'return', state: snapshot.state, savedAt, ageMs, reason };
  }
  const work = normalizeAppLifecycleWork(snapshot.work);
  if (!work) return null;
  let state = snapshot.state;
  if (work !== true) {
    state = {};
    for (const key of work) {
      const value = snapshot.state[key];
      if (value !== undefined && value !== null) state[key] = value;
    }
    if (!Object.keys(state).length) return null;
  }
  return { kind: 'new_visit', state, savedAt, ageMs, reason };
}

export interface AppLifecycleStatus {
  suspend: boolean;
  webgl: number;
}

/** Per viewer, app, runtime source (live / workspace) and subject mount. */
export function appLifecycleKey({
  userId,
  buildId,
  source,
  mount
}: {
  userId?: number | null;
  buildId: number;
  source: string;
  mount?: { type: string; id: number } | null;
}) {
  const place = mount ? `${mount.type}-${mount.id}` : 'app';
  return `${Number(userId) || 0}:${buildId}:${source}:${place}`;
}

/**
 * A snapshot as plain JSON within the size cap, or null. Anything that does
 * not survive JSON (Blobs, Maps, ArrayBuffers) is dropped, and the size is
 * measured on what is actually stored.
 */
export function normalizeAppLifecycleState(state: unknown) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  try {
    const text = JSON.stringify(state);
    if (!text || text.length > MAX_SNAPSHOT_CHARS) return null;
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      };
      request.onsuccess = () => {
        resolve(request.result);
        // Later, so it never queues in front of an app's first read.
        window.setTimeout(() => pruneSnapshots(request.result), PRUNE_DELAY_MS);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

// Once per page: drop snapshots older than a week, and the oldest past
// MAX_SNAPSHOTS, so the store never grows without bound. Reads only the small
// saved-at index, never the snapshots themselves.
function pruneSnapshots(db: IDBDatabase) {
  try {
    const tx = db.transaction([STORE, META], 'readwrite');
    const meta = tx.objectStore(META);
    const all: Array<{ key: IDBValidKey; savedAt: number }> = [];
    const cursorRequest = meta.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        all.push({ key: cursor.key, savedAt: Number(cursor.value) || 0 });
        cursor.continue();
        return;
      }
      all.sort((a, b) => b.savedAt - a.savedAt);
      all.forEach((entry, index) => {
        if (index >= MAX_SNAPSHOTS || !(Date.now() - entry.savedAt < MAX_AGE_MS)) {
          tx.objectStore(STORE).delete(entry.key);
          meta.delete(entry.key);
        }
      });
    };
  } catch {
    // pruning is best effort
  }
}

/** Start opening the store early, so the first app start does not wait. */
export function warmAppLifecycleStore() {
  void openDb();
}

function run<T>(
  mode: IDBTransactionMode,
  action: (stores: { snapshots: IDBObjectStore; meta: IDBObjectStore }) => IDBRequest<T> | void
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction([STORE, META], mode);
          const request = action({ snapshots: tx.objectStore(STORE), meta: tx.objectStore(META) });
          tx.oncomplete = () => resolve(request ? (request.result as T) : null);
          tx.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

/**
 * What one app start got, for the owner trace (11-02: confirm the return /
 * new-visit rule on Mikey's own phone). Numbers and flags only, never the
 * snapshot's contents.
 */
export interface AppLifecycleStartInfo {
  kind: 'return' | 'new_visit' | 'none';
  /** A snapshot was stored for this app (none: a fresh start either way). */
  stored: boolean;
  ageMs: number | null;
  /** Taken in this tab session; null for a snapshot from before 11-02. */
  sameTab: boolean | null;
  /** Keys the app marked as work (true: all of it). */
  work: number | true | null;
  keys: number;
}

export function describeAppLifecycleStart(
  snapshot: AppLifecycleSnapshot | null | undefined,
  resume: AppLifecycleResume | null,
  { now, visit }: { now: number; visit: string }
): AppLifecycleStartInfo {
  const stored = Boolean(snapshot && typeof snapshot === 'object' && snapshot.state);
  const work = stored ? normalizeAppLifecycleWork(snapshot?.work) : null;
  return {
    kind: resume ? resume.kind : 'none',
    stored,
    ageMs: stored ? Math.round(now - Number(snapshot?.savedAt)) || 0 : null,
    sameTab:
      stored && typeof snapshot?.visit === 'string' ? snapshot.visit === visit : null,
    work: work === true ? true : work ? work.length : null,
    keys: resume ? Object.keys(resume.state).length : 0
  };
}

export async function loadAppLifecycleSnapshot(
  key: string,
  onStart?: (info: AppLifecycleStartInfo) => void
): Promise<AppLifecycleResume | null> {
  let timedOut = false;
  const value = await Promise.race([
    run<AppLifecycleSnapshot>('readonly', ({ snapshots }) => snapshots.get(key)),
    new Promise<null>((resolve) =>
      window.setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, LOAD_TIMEOUT_MS)
    )
  ]);
  // The store hung (WebKit's IndexedDB open that never settles): give up on
  // it for this page so later app starts don't each wait the full guard.
  if (timedOut) dbPromise = Promise.resolve(null);
  const now = Date.now();
  const visit = getAppVisitId();
  const resume = value ? resolveAppLifecycleResume(value, { now, visit }) : null;
  try {
    onStart?.(describeAppLifecycleStart(value, resume, { now, visit }));
  } catch {
    // tracing never blocks a start
  }
  if (!value) return null;
  // Nothing in it is for this start (too old, or a new visit with no
  // unfinished work): it would never be for a later one either.
  if (!resume) void forgetAppLifecycleSnapshot(key);
  return resume;
}

export async function saveAppLifecycleSnapshot(
  key: string,
  snapshot: AppLifecycleSnapshot
) {
  await run('readwrite', ({ snapshots, meta }) => {
    meta.put(snapshot.savedAt, key);
    return snapshots.put(snapshot, key);
  });
}

export async function forgetAppLifecycleSnapshot(key: string) {
  await run('readwrite', ({ snapshots, meta }) => {
    meta.delete(key);
    return snapshots.delete(key);
  });
}

/** Forget every snapshot of one app for this viewer (explicit "Close app"). */
export async function forgetAppLifecycleSnapshots({
  userId,
  buildId
}: {
  userId?: number | null;
  buildId: number;
}) {
  const prefix = `${Number(userId) || 0}:${buildId}:`;
  await run('readwrite', ({ snapshots, meta }) => {
    const cursorRequest = meta.openKeyCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) {
        snapshots.delete(cursor.key);
        meta.delete(cursor.key);
      }
      cursor.continue();
    };
  });
}

// ---- running apps -------------------------------------------------------

interface RunningApp {
  status: AppLifecycleStatus;
  lastSnapshotAt: number;
  pendingSave: { key: string; snapshot: AppLifecycleSnapshot } | null;
  pendingTimer: number | null;
  requestSuspend: ((reason: string) => void) | null;
  waiters: Array<(saved: boolean) => void>;
}

const running = new Map<number, RunningApp>();
const listeners = new Set<() => void>();
// Apps the viewer closed: a last snapshot still on its way must not bring the
// old place back. Cleared when the app starts again.
const closedApps = new Set<number>();

export function markAppClosed(buildId: number) {
  closedApps.add(buildId);
  const app = running.get(buildId);
  if (app) app.pendingSave = null;
}

export function noteAppStarted(buildId: number) {
  closedApps.delete(buildId);
}

export function isAppClosed(buildId: number) {
  return closedApps.has(buildId);
}

function entry(buildId: number) {
  let app = running.get(buildId);
  if (!app) {
    app = {
      status: { suspend: false, webgl: 0 },
      lastSnapshotAt: 0,
      pendingSave: null,
      pendingTimer: null,
      requestSuspend: null,
      waiters: []
    };
    running.set(buildId, app);
  }
  return app;
}

export function getAppLifecycleStatus(buildId: number): AppLifecycleStatus {
  return { ...(running.get(buildId)?.status || { suspend: false, webgl: 0 }) };
}

// Records exist only while the app's frame is registered: a late message from
// an app already unloaded must not bring back its old flags for the next run.
export function setAppLifecycleStatus(
  buildId: number,
  status: Partial<AppLifecycleStatus>
) {
  const app = running.get(buildId);
  if (!app) return;
  app.status = {
    suspend:
      typeof status.suspend === 'boolean' ? status.suspend : app.status.suspend,
    webgl: Math.max(0, Math.floor(Number(status.webgl ?? app.status.webgl) || 0))
  };
  listeners.forEach((listener) => listener());
}

export function subscribeAppLifecycleStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The app's frame registers how to ask it for a snapshot. */
export function registerAppLifecycleFrame(
  buildId: number,
  requestSuspend: (reason: string) => void
) {
  const app = entry(buildId);
  app.requestSuspend = requestSuspend;
  return () => {
    if (app.requestSuspend === requestSuspend) app.requestSuspend = null;
  };
}

/**
 * Keep a snapshot an app sent. Waiters (an unload in progress) hear right
 * away; the write follows. At most one write per app per second: a newer
 * snapshot inside that second replaces the queued one.
 */
export function acceptAppLifecycleSnapshot(
  buildId: number,
  key: string,
  snapshot: AppLifecycleSnapshot
) {
  const app = running.get(buildId);
  if (!app) return;
  const waiters = app.waiters;
  app.waiters = [];
  waiters.forEach((resolve) => resolve(true));
  app.pendingSave = { key, snapshot };
  const wait = Math.max(0, app.lastSnapshotAt + MIN_SNAPSHOT_GAP_MS - Date.now());
  const urgent =
    waiters.length > 0 ||
    (typeof document !== 'undefined' && document.visibilityState === 'hidden');
  if (wait === 0 || urgent) {
    if (app.pendingTimer !== null) window.clearTimeout(app.pendingTimer);
    app.pendingTimer = null;
    flushPendingSave(buildId, app);
    return;
  }
  if (app.pendingTimer !== null) return;
  app.pendingTimer = window.setTimeout(() => {
    app.pendingTimer = null;
    flushPendingSave(buildId, app);
  }, wait);
}

function flushPendingSave(buildId: number, app: RunningApp) {
  const pending = app.pendingSave;
  app.pendingSave = null;
  if (!pending || closedApps.has(buildId)) return;
  app.lastSnapshotAt = Date.now();
  void saveAppLifecycleSnapshot(pending.key, pending.snapshot);
}

/**
 * Ask a running app for a fresh snapshot (before unloading it). Resolves true
 * once one arrives, false if the app does not save its place or is too slow.
 */
export function requestAppLifecycleSnapshot(
  buildId: number,
  reason: string
): Promise<boolean> {
  const app = running.get(buildId);
  if (!app?.status.suspend || !app.requestSuspend) return Promise.resolve(false);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      app.waiters = app.waiters.filter((waiter) => waiter !== done);
      resolve(false);
    }, SNAPSHOT_WAIT_MS);
    function done(saved: boolean) {
      window.clearTimeout(timer);
      resolve(saved);
    }
    app.waiters.push(done);
    app.requestSuspend?.(reason);
  });
}

export function forgetRunningApp(buildId: number) {
  running.delete(buildId);
  listeners.forEach((listener) => listener());
}

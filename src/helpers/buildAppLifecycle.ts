// Twinkle.app.lifecycle, host side. Apps send small JSON snapshots of their
// place (SDK lifecycleScript.ts); we keep them in IndexedDB so they survive
// unloading the app, a reload of the tab and iOS killing the tab, and hand the
// latest one back when that app starts again (the SDK's init reply).
//
// The registry also remembers, per running app, whether it saves its place
// and whether it draws 3D (heavy), and lets KeepAliveHost ask an app for a
// fresh snapshot right before unloading it.

const DB_NAME = 'twinkle-app-lifecycle';
const STORE = 'snapshots';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SNAPSHOT_WAIT_MS = 1600;

export interface AppLifecycleSnapshot {
  state: Record<string, unknown>;
  savedAt: number;
  reason: string;
}

export interface AppLifecycleStatus {
  suspend: boolean;
  webgl: number;
}

export function appLifecycleKey({
  userId,
  buildId,
  mount
}: {
  userId?: number | null;
  buildId: number;
  mount?: { type: string; id: number } | null;
}) {
  const place = mount ? `${mount.type}-${mount.id}` : 'app';
  return `${Number(userId) || 0}:${buildId}:${place}`;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const request = action(tx.objectStore(STORE));
          tx.oncomplete = () => resolve(request ? (request.result as T) : null);
          tx.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

export async function loadAppLifecycleSnapshot(
  key: string
): Promise<AppLifecycleSnapshot | null> {
  const value = await run<AppLifecycleSnapshot>('readonly', (store) =>
    store.get(key)
  );
  if (!value || typeof value !== 'object' || !value.state) return null;
  if (!(Date.now() - Number(value.savedAt) < MAX_AGE_MS)) {
    void forgetAppLifecycleSnapshot(key);
    return null;
  }
  return value;
}

export async function saveAppLifecycleSnapshot(
  key: string,
  snapshot: AppLifecycleSnapshot
) {
  await run('readwrite', (store) => store.put(snapshot, key));
}

export async function forgetAppLifecycleSnapshot(key: string) {
  await run('readwrite', (store) => store.delete(key));
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
  await run('readwrite', (store) => {
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
  });
}

// ---- running apps -------------------------------------------------------

interface RunningApp {
  status: AppLifecycleStatus;
  lastSnapshotAt: number;
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

export function setAppLifecycleStatus(
  buildId: number,
  status: Partial<AppLifecycleStatus>
) {
  const app = entry(buildId);
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

export function noteAppLifecycleSnapshot(buildId: number) {
  const app = entry(buildId);
  app.lastSnapshotAt = Date.now();
  const waiters = app.waiters;
  app.waiters = [];
  waiters.forEach((resolve) => resolve(true));
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

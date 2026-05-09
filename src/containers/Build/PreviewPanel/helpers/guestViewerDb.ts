import {
  getStoredItem,
  removeStoredItem,
  setStoredItem
} from '~/helpers/userDataHelpers';

const HOST_SQL_JS_CDN_BASE =
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3';
const GUEST_VIEWER_DB_STORAGE_KEY_PREFIX = 'twinkle_build_guest_viewer_db:';
const GUEST_VIEWER_DB_SIZE_LIMIT_BYTES = 1 * 1024 * 1024;
const GUEST_VIEWER_DB_MAX_ROWS = 1000;

const guestViewerDbCache = new Map<string, any>();
let hostSqlJsPromise: Promise<any> | null = null;

declare global {
  interface Window {
    initSqlJs?: (options: {
      locateFile: (file: string) => string;
    }) => Promise<any>;
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getGuestViewerDbCacheKey(buildId: number, guestSessionId: string) {
  return `${buildId}:${guestSessionId}`;
}

function getGuestViewerDbStorageKey(buildId: number, guestSessionId: string) {
  return `${GUEST_VIEWER_DB_STORAGE_KEY_PREFIX}${buildId}:${guestSessionId}`;
}

async function loadHostSqlJs() {
  if (hostSqlJsPromise) return hostSqlJsPromise;

  hostSqlJsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      hostSqlJsPromise = null;
      reject(new Error('Window not available'));
      return;
    }

    function initializeSqlJs() {
      if (typeof window.initSqlJs !== 'function') {
        hostSqlJsPromise = null;
        reject(new Error('Failed to initialize sql.js'));
        return;
      }

      window
        .initSqlJs({
          locateFile: (file) => `${HOST_SQL_JS_CDN_BASE}/${file}`
        })
        .then(resolve)
        .catch((error) => {
          hostSqlJsPromise = null;
          reject(
            error instanceof Error
              ? error
              : new Error('Failed to initialize sql.js')
          );
        });
    }

    if (typeof window.initSqlJs === 'function') {
      initializeSqlJs();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-twinkle-host-sqljs="true"]'
    ) as HTMLScriptElement | null;
    const script = existingScript || document.createElement('script');

    function handleLoad() {
      initializeSqlJs();
    }

    function handleError() {
      hostSqlJsPromise = null;
      reject(new Error('Failed to load sql.js'));
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.src = `${HOST_SQL_JS_CDN_BASE}/sql-wasm.min.js`;
      script.async = true;
      script.setAttribute('data-twinkle-host-sqljs', 'true');
      document.head.appendChild(script);
    }
  });

  return hostSqlJsPromise;
}

async function getGuestViewerDb({
  buildId,
  guestSessionId
}: {
  buildId: number;
  guestSessionId: string;
}) {
  const cacheKey = getGuestViewerDbCacheKey(buildId, guestSessionId);
  const cached = guestViewerDbCache.get(cacheKey);
  if (cached) return cached;

  const SQL = await loadHostSqlJs();
  const storageKey = getGuestViewerDbStorageKey(buildId, guestSessionId);

  try {
    const storedBase64 = getStoredItem(storageKey);
    if (storedBase64) {
      const db = new SQL.Database(base64ToBytes(storedBase64));
      guestViewerDbCache.set(cacheKey, db);
      return db;
    }
  } catch {
    removeStoredItem(storageKey);
  }

  const emptyDb = new SQL.Database();
  guestViewerDbCache.set(cacheKey, emptyDb);
  return emptyDb;
}

function persistGuestViewerDb({
  buildId,
  guestSessionId,
  db
}: {
  buildId: number;
  guestSessionId: string;
  db: any;
}) {
  const exported = db.export() as Uint8Array;
  if (exported.length > GUEST_VIEWER_DB_SIZE_LIMIT_BYTES) {
    throw new Error('Guest app data exceeds the local storage limit.');
  }

  const stored = setStoredItem(
    getGuestViewerDbStorageKey(buildId, guestSessionId),
    bytesToBase64(exported)
  );
  if (!stored) {
    throw new Error('Failed to save guest app data locally.');
  }
}

export async function executeGuestViewerDbQuery({
  buildId,
  guestSessionId,
  sql,
  params
}: {
  buildId: number;
  guestSessionId: string;
  sql: string;
  params?: any[];
}) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('SQL is required');
  }
  if (typeof params !== 'undefined' && !Array.isArray(params)) {
    throw new Error('Params must be an array');
  }

  const db = await getGuestViewerDb({ buildId, guestSessionId });
  const stmt = db.prepare(sql);

  try {
    if (!stmt.reader) {
      throw new Error('Query must return rows');
    }
    if (params?.length) {
      stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    const rowCount = rows.length;
    const truncated = rowCount > GUEST_VIEWER_DB_MAX_ROWS;

    return {
      rows: truncated ? rows.slice(0, GUEST_VIEWER_DB_MAX_ROWS) : rows,
      rowCount,
      truncated
    };
  } finally {
    stmt.free();
  }
}

export async function executeGuestViewerDbExec({
  buildId,
  guestSessionId,
  sql,
  params
}: {
  buildId: number;
  guestSessionId: string;
  sql: string;
  params?: any[];
}) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('SQL is required');
  }
  if (typeof params !== 'undefined' && !Array.isArray(params)) {
    throw new Error('Params must be an array');
  }

  const db = await getGuestViewerDb({ buildId, guestSessionId });
  const stmt = db.prepare(sql);

  try {
    if (stmt.reader) {
      throw new Error('Use query() for SELECT statements');
    }

    stmt.run(params || []);
    const metadataResult = db.exec(
      'SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowid'
    );
    const metadataRow = metadataResult?.[0]?.values?.[0] || [];

    persistGuestViewerDb({ buildId, guestSessionId, db });

    return {
      changes: Number(metadataRow[0] || 0),
      lastInsertRowid: Number(metadataRow[1] || 0)
    };
  } finally {
    stmt.free();
  }
}

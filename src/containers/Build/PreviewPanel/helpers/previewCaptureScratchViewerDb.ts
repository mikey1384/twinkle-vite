// Twinkle.db (the per-viewer SQL database) for a Lumine capture's throwaway
// store (previewCaptureScratch.ts). The real one is a SQLite file per viewer
// and app on the server (twinkle-api helpers/build/viewerDatabase.ts), which
// a capture may only read.
//
// Until the app's first write, reads go to the real database through the
// read-only query route, exactly as before: a look that only reads needs no
// copy. The first write opens a copy: the viewer's whole database arrives as
// one SQLite image (POST viewer-db/file, read-only, bounded by the 1 MB
// limit) and opens in sql.js, the engine the website already uses for guests
// (guestViewerDb.ts). From then on every read and write in this session uses
// the copy, which goes when the session ends. The copy is the owner's real
// database (the capture runs as the build owner, and a "save, come back" test
// must start from what the app would really find); an owner who never used
// the app has an empty one, like a first-time viewer. A copy that could not
// be made is remembered for a while instead of being retried on every call,
// and reads keep using the real route meanwhile.
//
// Same rules as the server: one statement, no comments, only SELECT, INSERT,
// UPDATE, DELETE, CREATE TABLE/INDEX, WITH and transactions, at most 10,000
// characters and 1,000 params, at most 1,000 rows returned, and the 1 MB
// database size limit (a write that would pass it is undone).

const MAX_SQL_LENGTH = 10000;
const MAX_PARAMS = 1000;
const MAX_ROWS = 1000;
const SIZE_LIMIT_BYTES = 1 * 1024 * 1024;
// A copy that could not be made is not tried again for this long.
const COPY_RETRY_MS = 30_000;

export const PREVIEW_CAPTURE_VIEWER_DB_TYPES = ['user-db:query', 'user-db:exec'] as const;
export type PreviewCaptureViewerDbType = (typeof PREVIEW_CAPTURE_VIEWER_DB_TYPES)[number];

export interface ViewerDbRealReads {
  // the read-only query route (viewer-db/query)
  query(payload: { sql: string; params?: unknown[] }): Promise<any>;
  // the whole database as one SQLite image (viewer-db/file): { image: base64 }
  exportImage(): Promise<any>;
}

// twinkle-api viewerDatabase.ts validateSql, same messages.
export function validateViewerSql(sql: unknown) {
  if (!sql || typeof sql !== 'string') throw new Error('SQL must be a string');
  if (sql.length > MAX_SQL_LENGTH) throw new Error('SQL is too long');
  const withoutTrailing = sql.trim().replace(/;+$/, '');
  if (withoutTrailing.includes(';')) throw new Error('Multiple statements are not allowed');
  if (/--|\/\*/.test(withoutTrailing)) throw new Error('SQL comments are not allowed');
  const upper = withoutTrailing.toUpperCase();
  if (/(ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|LOAD_EXTENSION|ALTER|DROP|ANALYZE)\b/.test(upper)) {
    throw new Error('SQL statement is not allowed');
  }
  const match = upper.match(/^\s*(\w+)/);
  if (!match) throw new Error('Invalid SQL');
  if (!['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'WITH', 'BEGIN', 'COMMIT', 'ROLLBACK'].includes(match[1])) {
    throw new Error('SQL statement is not allowed');
  }
  if (match[1] === 'CREATE' && !/^\s*CREATE\s+(TABLE|INDEX)\b/i.test(withoutTrailing)) {
    throw new Error('Only CREATE TABLE/INDEX is allowed');
  }
  return withoutTrailing;
}

function checkParams(params: unknown) {
  if (params != null && !Array.isArray(params)) throw new Error('Params must be an array');
  if (Array.isArray(params) && params.length > MAX_PARAMS) throw new Error('Too many params');
  return (params as unknown[] | undefined) || [];
}

// A row value as sql.js takes it: Buffers arrive from the server as JSON.
function bindable(value: unknown) {
  if (value && typeof value === 'object' && (value as any).type === 'Buffer' && Array.isArray((value as any).data)) {
    return new Uint8Array((value as any).data);
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value as any;
}

function decodeImage(base64: unknown) {
  if (typeof base64 !== 'string') throw new Error('the server sent no database image');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Only a plain SELECT can go to the real (read-only) route; anything else,
// such as INSERT ... RETURNING through query(), needs the copy.
const isPlainRead = (sql: string) => /^\s*SELECT\b/i.test(sql) && !/\bRETURNING\b/i.test(sql);

export function createScratchViewerDb({
  loadSqlJs,
  now = () => Date.now()
}: {
  loadSqlJs: () => Promise<any>;
  now?: () => number;
}) {
  let db: any = null;
  let opening: Promise<any> | null = null;
  let failure: { message: string; at: number } | null = null;
  let copied: { bytes: number } | null = null;

  async function openCopy(real: ViewerDbRealReads) {
    if (db) return db;
    if (failure && now() - failure.at < COPY_RETRY_MS) throw new Error(failure.message);
    if (!opening) {
      opening = (async () => {
        try {
          const [SQL, exported] = await Promise.all([loadSqlJs(), real.exportImage()]);
          const bytes = decodeImage(exported?.image);
          if (bytes.length > SIZE_LIMIT_BYTES) throw new Error('Viewer database exceeds size limit');
          const copy = bytes.length ? new SQL.Database(bytes) : new SQL.Database();
          copy.exec('SELECT count(*) FROM sqlite_master');
          db = copy;
          copied = { bytes: bytes.length };
          failure = null;
          return db;
        } catch (error: any) {
          failure = {
            message: `The preview could not copy the viewer database to test writes (${String(error?.message || error).slice(0, 160)}). Reads still work; try writing again in a little while.`,
            at: now()
          };
          throw new Error(failure.message);
        }
      })().finally(() => {
        opening = null;
      });
    }
    return opening;
  }

  const sizeBytes = (database: any) => {
    const pageSize = Number(database.exec('PRAGMA page_size')?.[0]?.values?.[0]?.[0]) || 4096;
    const pageCount = Number(database.exec('PRAGMA page_count')?.[0]?.values?.[0]?.[0]) || 0;
    return pageSize * pageCount;
  };

  async function handle(type: PreviewCaptureViewerDbType, payload: any, real: ViewerDbRealReads) {
    const sql = validateViewerSql(payload?.sql);
    const rawParams = checkParams(payload?.params);
    if (type === 'user-db:query' && !db && isPlainRead(sql)) {
      return real.query({ sql: payload.sql, params: payload?.params });
    }
    const params = rawParams.map(bindable);
    const database = await openCopy(real);
    const stmt = database.prepare(sql);
    try {
      const returnsRows = stmt.getColumnNames().length > 0;
      if (type === 'user-db:query') {
        if (!returnsRows) throw new Error('Query must return rows');
        if (params.length) stmt.bind(params);
        const rows: any[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return { rows: rows.length > MAX_ROWS ? rows.slice(0, MAX_ROWS) : rows, rowCount: rows.length, truncated: rows.length > MAX_ROWS };
      }
      if (returnsRows) throw new Error('Use query() for SELECT statements');
      // A savepoint (nested inside an app's own BEGIN, if any) lets a write
      // that would pass the size limit be undone.
      const guard = !/^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.test(sql);
      if (guard) database.run('SAVEPOINT twinkle_preview_exec');
      try {
        stmt.run(params);
        const changes = database.getRowsModified();
        const lastInsertRowid = Number(database.exec('SELECT last_insert_rowid()')?.[0]?.values?.[0]?.[0]) || 0;
        if (sizeBytes(database) > SIZE_LIMIT_BYTES) throw new Error('Viewer database exceeds size limit');
        if (guard) database.run('RELEASE twinkle_preview_exec');
        return { changes, lastInsertRowid };
      } catch (error) {
        if (guard) {
          database.run('ROLLBACK TO twinkle_preview_exec');
          database.run('RELEASE twinkle_preview_exec');
        }
        throw error;
      }
    } finally {
      stmt.free();
    }
  }

  return {
    handle,
    copied: () => copied,
    close() {
      db?.close();
      db = null;
    }
  };
}

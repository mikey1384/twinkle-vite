import {
  normalizeAppLifecycleState,
  normalizeAppLifecycleWork,
  resolveAppLifecycleResume
} from '~/helpers/buildAppLifecycle';
import {
  createScratchEntries,
  PREVIEW_CAPTURE_ENTRY_TYPES,
  type PreviewCaptureEntryType,
  type ScratchViewer
} from './previewCaptureScratchEntries';
import {
  createScratchViewerDb,
  PREVIEW_CAPTURE_VIEWER_DB_TYPES,
  type PreviewCaptureViewerDbType
} from './previewCaptureScratchViewerDb';

// Throwaway storage for a Lumine preview capture (view_preview,
// run_preview_test, lumine preview/test). A capture runs under a read-only
// pass, so the API refuses every write. Without somewhere to keep them, an
// app's "save, leave, come back" and keep-place could never be checked.
//
// This store lives only in the capture host page's memory, one per capture
// session: each session is its own browser, and the page (with this store)
// goes when the session ends. Writes never leave it, so no real member or
// app data is ever touched. Reads see this session's writes over the real
// data the read-only pass may read, so an owner's existing save still shows.
// It covers every app save: Twinkle.privateDb, Twinkle.sharedDb key-value
// storage and entries (previewCaptureScratchEntries.ts), the per-viewer SQL
// database Twinkle.db (previewCaptureScratchViewerDb.ts, on sql.js) and
// Twinkle.app.lifecycle snapshots, with the real stores' validation, limits
// and error text (twinkle-api privateDb.ts, sharedDbKvValidation.ts,
// sharedDb.ts, viewerDatabase.ts, buildAppLifecycle.ts). Entry claims and
// notifications stay with the real server.
//
// Only ThumbnailCaptureHost creates one, and only for a Lumine capture; every
// other preview (the editor, published apps, the reward player) never has it.

// twinkle-api controllers/build/routes/privateDb.ts
const PRIVATE_KEY_MAX_LENGTH = 120;
const PRIVATE_VALUE_MAX_BYTES = 16384;
const PRIVATE_LIST_DEFAULT = 50;
const PRIVATE_LIST_MAX = 200;
// twinkle-api controllers/build/routes/sharedDbKvValidation.ts
const KV_VALUE_MAX_CHARS = 10240;
const KV_ITEMS_PER_SET_MAX = 100;
const KV_NAMESPACE_MAX_LENGTH = 100;
const KV_KEY_MAX_LENGTH = 191;
const KV_LIST_DEFAULT = 100;
const KV_LIST_MAX = 500;
// Bounds for the capture browser's memory only; the real stores have none.
// Bytes count every value written (overwrites included), so the bound holds
// however an app loops; the viewer database has its own 1 MB limit.
const SCRATCH_MAX_ENTRIES = 5000;
const SCRATCH_MAX_BYTES = 32 * 1024 * 1024;
// Scratch ids and change sequences sort after every real row, so lists can
// hand out the real pages first and this session's writes after them.
const SCRATCH_BASE = 1_000_000_000_000_000;

export const PREVIEW_CAPTURE_SCRATCH_TYPES = [
  'private-db:get',
  'private-db:list',
  'private-db:set',
  'private-db:remove',
  'private-db:compare-and-set',
  'shared-db:kv-get',
  'shared-db:kv-list',
  'shared-db:kv-set',
  'shared-db:kv-delete',
  ...PREVIEW_CAPTURE_ENTRY_TYPES,
  ...PREVIEW_CAPTURE_VIEWER_DB_TYPES
] as const;
export type PreviewCaptureScratchType =
  (typeof PREVIEW_CAPTURE_SCRATCH_TYPES)[number];

export function isPreviewCaptureScratchType(
  type: string
): type is PreviewCaptureScratchType {
  return (PREVIEW_CAPTURE_SCRATCH_TYPES as readonly string[]).includes(type);
}

interface PrivateEntry {
  id: number;
  key: string;
  // null: removed in this session (hides a real row)
  value: unknown;
  updatedAt: number;
  removed: boolean;
}

interface KvEntry {
  id: number;
  key: string;
  value: unknown;
  version: number;
  changeSeq: number;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

interface LifecycleEntry {
  state: Record<string, unknown>;
  savedAt: number;
  reason: string;
  work?: string[] | true;
}

// Reads of the real stores through the read-only pass, supplied by the host.
export type PreviewCaptureRealRead = (
  type:
    | 'private-db:get'
    | 'private-db:list'
    | 'shared-db:kv-get'
    | 'shared-db:kv-list'
    | 'shared-db:get-topics'
    | 'shared-db:get-entries'
    | 'shared-db:get-entries-by-ids'
    | 'user-db:query'
    | 'user-db:export',
  payload: Record<string, any>
) => Promise<any>;
export type { ScratchViewer };

export interface PreviewCaptureScratch {
  handle(
    type: PreviewCaptureScratchType,
    payload: any,
    readReal: PreviewCaptureRealRead,
    viewer?: ScratchViewer
  ): Promise<any>;
  saveLifecycle(input: { state: unknown; reason?: unknown; work?: unknown }): boolean;
  lifecycleResume(): ReturnType<typeof resolveAppLifecycleResume>;
  size(): { privateKeys: number; kvKeys: number; topics: number; entries: number; lifecycle: boolean; viewerDb: { bytes: number } | null };
  dispose(): void;
}

function fail(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

function utf8Bytes(text: string) {
  return new TextEncoder().encode(text).length;
}

// JSON round trip, exactly what the real store keeps and hands back.
function storedJson(value: unknown) {
  const text = JSON.stringify(value);
  return { text, value: text === undefined ? undefined : JSON.parse(text) };
}

function privateKey(input: unknown) {
  if (!input || typeof input !== 'string') fail('key is required');
  const key = (input as string).trim();
  if (!key) fail('key is required');
  if (key.length > PRIVATE_KEY_MAX_LENGTH) {
    fail(`key must be ${PRIVATE_KEY_MAX_LENGTH} characters or fewer`);
  }
  if (!/^[a-zA-Z0-9._:-]+$/.test(key)) {
    fail('key may only include letters, numbers, ., _, :, and -');
  }
  return key;
}

function privateValue(value: unknown) {
  if (typeof value === 'undefined') fail('value is required');
  const { text, value: stored } = storedJson(value);
  if (typeof text !== 'string') fail('value must be JSON-serializable');
  if (utf8Bytes(text as string) > PRIVATE_VALUE_MAX_BYTES) {
    fail(`value exceeds max size of ${PRIVATE_VALUE_MAX_BYTES} bytes`);
  }
  return stored;
}

function kvNamespace(input: unknown) {
  const namespace = typeof input === 'string' ? input.trim() : '';
  if (!namespace || namespace.length > KV_NAMESPACE_MAX_LENGTH) {
    fail('namespace is required');
  }
  return namespace;
}

function kvKey(input: unknown) {
  const key = typeof input === 'string' ? input.trim() : '';
  if (!key || key.length > KV_KEY_MAX_LENGTH) fail('key is required');
  return key;
}

function kvItems(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) {
    fail('items must be a non-empty array');
  }
  const items = raw as any[];
  if (items.length > KV_ITEMS_PER_SET_MAX) {
    fail(`items must contain at most ${KV_ITEMS_PER_SET_MAX} entries`);
  }
  const seen = new Set<string>();
  return items.map((item) => {
    const key = typeof item?.key === 'string' ? item.key.trim() : '';
    if (!key || key.length > KV_KEY_MAX_LENGTH) {
      fail(`each item needs a key of at most ${KV_KEY_MAX_LENGTH} characters`);
    }
    if (item?.value === undefined) fail(`item "${key}" is missing a value`);
    const { text, value } = storedJson(item.value);
    if (text === undefined || text.length > KV_VALUE_MAX_CHARS) {
      fail(`item "${key}" value must be JSON of at most ${KV_VALUE_MAX_CHARS} bytes`);
    }
    if (seen.has(key)) fail(`duplicate key "${key}" in items`);
    seen.add(key);
    return { key, value };
  });
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const NO_VIEWER: ScratchViewer = { userId: null, username: null, profilePicUrl: null };

export function createPreviewCaptureScratch({
  loadSqlJs = async () => {
    throw new Error('The viewer database is not available in this preview.');
  },
  now
}: {
  // sql.js, loaded the way guestViewerDb.ts loads it (ThumbnailCaptureHost)
  loadSqlJs?: () => Promise<any>;
  // the clock for retrying a failed viewer database copy (tests)
  now?: () => number;
} = {}): PreviewCaptureScratch {
  const privateEntries = new Map<string, PrivateEntry>();
  const kvEntries = new Map<string, Map<string, KvEntry>>();
  const compareReceipts = new Map<string, Set<string>>();
  let lifecycle: LifecycleEntry | null = null;
  const entries = createScratchEntries({
    reserve: (isNew: boolean, value?: unknown) => {
      if (value !== undefined) chargeBytes(value);
      ensureRoom(isNew);
    }
  });
  const viewerDb = createScratchViewerDb({ loadSqlJs, ...(now ? { now } : {}) });
  let nextId = SCRATCH_BASE;
  let nextSeq = SCRATCH_BASE;
  let entryCount = 0;
  let storedBytes = 0;

  const chargeBytes = (value: unknown) => {
    const bytes = (JSON.stringify(value) ?? '').length * 2;
    if (storedBytes + bytes > SCRATCH_MAX_BYTES) {
      fail(`This preview session has saved ${Math.round(SCRATCH_MAX_BYTES / 1048576)} MB already. Restart the preview to clear it.`);
    }
    storedBytes += bytes;
  };

  const ensureRoom = (isNew: boolean) => {
    if (isNew && entryCount >= SCRATCH_MAX_ENTRIES) {
      fail(`This preview session already keeps ${SCRATCH_MAX_ENTRIES} saved keys. Restart the preview to clear them.`);
    }
    if (isNew) entryCount += 1;
  };

  const privateItem = (entry: PrivateEntry) => ({
    id: entry.id,
    key: entry.key,
    value: entry.value,
    updatedAt: entry.updatedAt
  });

  const kvItem = (entry: KvEntry) => ({
    id: entry.id,
    key: entry.key,
    value: entry.deleted ? null : entry.value,
    version: entry.version,
    changeSeq: entry.changeSeq,
    deleted: entry.deleted,
    updatedBy: null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  });

  const setPrivate = (key: string, value: unknown) => {
    const existing = privateEntries.get(key);
    chargeBytes(value);
    ensureRoom(!existing);
    const entry: PrivateEntry = {
      id: existing?.id ?? nextId++,
      key,
      value,
      updatedAt: nowSeconds(),
      removed: false
    };
    privateEntries.set(key, entry);
    return entry;
  };

  async function currentPrivateValue(key: string, readReal: PreviewCaptureRealRead) {
    const entry = privateEntries.get(key);
    if (entry) return entry.removed ? null : entry.value;
    const real = await readReal('private-db:get', { key });
    return real?.item ? real.item.value : null;
  }

  async function handle(
    type: PreviewCaptureScratchType,
    payload: any,
    readReal: PreviewCaptureRealRead,
    viewer: ScratchViewer = NO_VIEWER
  ): Promise<any> {
    if ((PREVIEW_CAPTURE_ENTRY_TYPES as readonly string[]).includes(type)) {
      return entries.handle(type as PreviewCaptureEntryType, payload, readReal, viewer);
    }
    if ((PREVIEW_CAPTURE_VIEWER_DB_TYPES as readonly string[]).includes(type)) {
      return viewerDb.handle(type as PreviewCaptureViewerDbType, payload, {
        query: (query) => readReal('user-db:query', query),
        exportImage: () => readReal('user-db:export', {})
      });
    }
    switch (type) {
      case 'private-db:get': {
        const key = privateKey(payload?.key);
        const entry = privateEntries.get(key);
        if (entry) return { item: entry.removed ? null : privateItem(entry) };
        return readReal('private-db:get', { key });
      }
      case 'private-db:list': {
        const prefix = typeof payload?.prefix === 'string' ? payload.prefix.trim() : '';
        const limit = Math.min(Math.max(Number(payload?.limit) || PRIVATE_LIST_DEFAULT, 1), PRIVATE_LIST_MAX);
        const cursorId = Number(payload?.cursor?.id) || 0;
        const touched = (key: string) => privateEntries.has(key);
        // Real pages first (minus keys this session changed), then this
        // session's live keys, which sort after every real id.
        if (cursorId < SCRATCH_BASE) {
          const real = await readReal('private-db:list', { prefix: payload?.prefix, limit, cursor: payload?.cursor });
          const items = (Array.isArray(real?.items) ? real.items : []).filter((item: any) => !touched(String(item?.key)));
          if (real?.cursor) return { items, cursor: real.cursor };
          const ours = [...privateEntries.values()]
            .filter((entry) => !entry.removed && entry.key.startsWith(prefix))
            .sort((a, b) => a.id - b.id);
          const room = Math.max(0, limit - items.length);
          const page = ours.slice(0, room).map(privateItem);
          const more = ours.length > room;
          const all = [...items, ...page];
          const last = page[page.length - 1] || null;
          return {
            items: all,
            ...(more ? { cursor: { id: last ? last.id : SCRATCH_BASE - 1 } } : {})
          };
        }
        const ours = [...privateEntries.values()]
          .filter((entry) => !entry.removed && entry.key.startsWith(prefix) && entry.id > cursorId)
          .sort((a, b) => a.id - b.id);
        const page = ours.slice(0, limit).map(privateItem);
        return {
          items: page,
          ...(ours.length > limit ? { cursor: { id: page[page.length - 1].id } } : {})
        };
      }
      case 'private-db:set': {
        const key = privateKey(payload?.key);
        const value = privateValue(payload?.value);
        return { item: privateItem(setPrivate(key, value)) };
      }
      case 'private-db:remove': {
        const key = privateKey(payload?.key);
        const before = await currentPrivateValue(key, readReal);
        const existed = privateEntries.has(key)
          ? !privateEntries.get(key)!.removed
          : before !== null;
        const entry = privateEntries.get(key);
        ensureRoom(!entry);
        privateEntries.set(key, {
          id: entry?.id ?? nextId++,
          key,
          value: null,
          updatedAt: nowSeconds(),
          removed: true
        });
        return { success: true, deleted: existed };
      }
      case 'private-db:compare-and-set': {
        if (
          payload?.expectedUserId != null &&
          (!Number.isSafeInteger(payload.expectedUserId) || payload.expectedUserId <= 0)
        ) {
          fail('Invalid expectedUserId');
        }
        const key = privateKey(payload?.key);
        if (!Object.prototype.hasOwnProperty.call(payload || {}, 'expectedValue')) {
          fail('expectedValue is required (null for an absent value)');
        }
        privateValue(payload.expectedValue);
        const value = privateValue(payload.value);
        if (typeof payload.operationId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(payload.operationId)) {
          fail('operationId must contain 8–64 letters, digits, underscores or hyphens');
        }
        const current = await currentPrivateValue(key, readReal);
        const receipts = compareReceipts.get(key) || new Set<string>();
        const item = () => {
          const entry = privateEntries.get(key);
          return entry && !entry.removed
            ? privateItem(entry)
            : { id: entry?.id ?? null, key, value: current, updatedAt: entry?.updatedAt ?? null };
        };
        if (receipts.has(payload.operationId)) {
          return { item: item(), applied: false, duplicate: true, conflict: false,
            matchesSubmittedValue: sameJson(current, value) };
        }
        if (!sameJson(current, storedJson(payload.expectedValue).value)) {
          return { item: item(), applied: false, duplicate: false, conflict: true };
        }
        const entry = setPrivate(key, value);
        receipts.add(payload.operationId);
        compareReceipts.set(key, receipts);
        return { item: privateItem(entry), applied: true, duplicate: false, conflict: false, matchesSubmittedValue: true };
      }
      case 'shared-db:kv-get': {
        const namespace = kvNamespace(payload?.namespace);
        const key = kvKey(payload?.key);
        const entry = kvEntries.get(namespace)?.get(key);
        if (entry) return { item: entry.deleted ? null : kvItem(entry) };
        return readReal('shared-db:kv-get', { namespace, key });
      }
      case 'shared-db:kv-list': {
        const namespace = kvNamespace(payload?.namespace);
        const limit = Math.min(Math.max(Number(payload?.limit) || KV_LIST_DEFAULT, 1), KV_LIST_MAX);
        const since = Number(payload?.since) || 0;
        const cursorSeq = Number(payload?.cursor?.changeSeq) || 0;
        const fullScan = cursorSeq > 0 ? Boolean(payload?.cursor?.live) : since <= 0;
        const afterSeq = cursorSeq > 0 ? cursorSeq : since;
        const afterId = cursorSeq > 0 ? Number(payload?.cursor?.id) || 0 : null;
        const ours = kvEntries.get(namespace) || new Map<string, KvEntry>();
        const oursAfter = [...ours.values()]
          .filter((entry) => (fullScan ? !entry.deleted : true))
          .filter((entry) => entry.changeSeq > afterSeq
            || (afterId !== null && entry.changeSeq === afterSeq && entry.id > afterId))
          .sort((a, b) => a.changeSeq - b.changeSeq || a.id - b.id);
        const cursorFor = (entry: { changeSeq: number; id: number }) => ({
          changeSeq: entry.changeSeq,
          id: entry.id,
          ...(fullScan ? { live: true } : {})
        });
        if (afterSeq < SCRATCH_BASE) {
          const real = await readReal('shared-db:kv-list', {
            namespace,
            limit,
            cursor: payload?.cursor,
            since: payload?.since
          });
          const items = (Array.isArray(real?.items) ? real.items : []).filter((item: any) => !ours.has(String(item?.key)));
          if (real?.hasMore) return { items, cursor: real.cursor, hasMore: true };
          const room = Math.max(0, limit - items.length);
          const page = oursAfter.slice(0, room);
          const more = oursAfter.length > room;
          const lastReal = items[items.length - 1];
          const last = page[page.length - 1];
          return {
            items: [...items, ...page.map(kvItem)],
            cursor: more
              ? last ? cursorFor(last) : lastReal ? cursorFor(lastReal) : { changeSeq: afterSeq || 1, id: afterId || 0, ...(fullScan ? { live: true } : {}) }
              : null,
            hasMore: more
          };
        }
        const page = oursAfter.slice(0, limit);
        const more = oursAfter.length > limit;
        return {
          items: page.map(kvItem),
          cursor: more ? cursorFor(page[page.length - 1]) : null,
          hasMore: more
        };
      }
      case 'shared-db:kv-set': {
        const namespace = kvNamespace(payload?.namespace);
        const items = kvItems(payload?.items);
        const space = kvEntries.get(namespace) || new Map<string, KvEntry>();
        // The real rows behind keys this session has not written yet (for
        // version and createdAt): one list of the namespace, and only if it
        // is too long to list at once, the remaining keys in parallel.
        const realVersions = new Map<string, any>();
        const unknown = items.map((item) => item.key).filter((key) => !space.has(key));
        if (unknown.length) {
          const listed = await readReal('shared-db:kv-list', { namespace, limit: KV_LIST_MAX });
          for (const row of Array.isArray(listed?.items) ? listed.items : []) {
            if (unknown.includes(String(row?.key)) && !row?.deleted) realVersions.set(String(row.key), row);
          }
          const rest = listed?.hasMore ? unknown.filter((key) => !realVersions.has(key)) : [];
          const fetched = await Promise.all(rest.map((key) => readReal('shared-db:kv-get', { namespace, key })));
          rest.forEach((key, index) => realVersions.set(key, fetched[index]?.item || null));
        }
        const changeSeq = nextSeq++;
        const now = nowSeconds();
        const written = items.map((item) => {
          const existing = space.get(item.key);
          const real = realVersions.get(item.key);
          chargeBytes(item.value);
          ensureRoom(!existing);
          const entry: KvEntry = {
            id: existing?.id ?? nextId++,
            key: item.key,
            value: item.value,
            version: (existing?.version ?? Number(real?.version ?? 0)) + 1,
            changeSeq,
            deleted: false,
            createdAt: existing?.createdAt ?? Number(real?.createdAt ?? now),
            updatedAt: now
          };
          space.set(item.key, entry);
          return entry;
        });
        kvEntries.set(namespace, space);
        return { items: written.map(kvItem) };
      }
      case 'shared-db:kv-delete': {
        const namespace = kvNamespace(payload?.namespace);
        const key = kvKey(payload?.key);
        const space = kvEntries.get(namespace) || new Map<string, KvEntry>();
        const existing = space.get(key);
        let live = existing ? !existing.deleted : false;
        let real: any = null;
        if (!existing) {
          real = (await readReal('shared-db:kv-get', { namespace, key }))?.item || null;
          live = Boolean(real);
        }
        if (!live) return { success: true, deleted: false };
        ensureRoom(!existing);
        const now = nowSeconds();
        space.set(key, {
          id: existing?.id ?? nextId++,
          key,
          value: null,
          version: (existing?.version ?? Number(real?.version ?? 0)) + 1,
          changeSeq: nextSeq++,
          deleted: true,
          createdAt: existing?.createdAt ?? Number(real?.createdAt ?? now),
          updatedAt: now
        });
        kvEntries.set(namespace, space);
        return { success: true, deleted: true };
      }
      default:
        return fail(`${type} is not kept in a preview`);
    }
  }

  return {
    handle,
    saveLifecycle({ state, reason, work }) {
      const kept = normalizeAppLifecycleState(state);
      if (!kept) return false;
      const keptWork = normalizeAppLifecycleWork(work);
      lifecycle = {
        state: kept,
        savedAt: Date.now(),
        reason: String(reason || '').slice(0, 40),
        ...(keptWork ? { work: keptWork } : {})
      };
      return true;
    },
    // A reload in a capture is the same visit, minutes later: a return.
    lifecycleResume() {
      return lifecycle
        ? resolveAppLifecycleResume(
            { ...lifecycle, visit: 'preview-capture' },
            { now: Date.now(), visit: 'preview-capture' }
          )
        : null;
    },
    size() {
      let kvKeys = 0;
      for (const space of kvEntries.values()) kvKeys += space.size;
      return { privateKeys: privateEntries.size, kvKeys, ...entries.size(), lifecycle: Boolean(lifecycle), viewerDb: viewerDb.copied() };
    },
    dispose() {
      viewerDb.close();
    }
  };
}

// Twinkle.sharedDb entries (topics, entries, batches, updates, deletes) for
// a Lumine capture's throwaway store (previewCaptureScratch.ts). Writes stay
// in this session's memory; reads merge the real entries the read-only pass
// can see with this session's changes. Validation, limits and error text
// follow twinkle-api controllers/build/routes/sharedDb.ts and
// sharedDbValidation.ts. The capture runs as the build owner, who may change
// any entry, so no ownership check applies. Claims, notifications and the
// Groove soundtrack visibility rules stay with the real server: a claim is
// refused in a capture and notify is accepted but never sent.

export const SCRATCH_ENTRY_ID_BASE = 1_000_000_000_000_000;
const MAX_DATA_BYTES = 10240;
const MAX_BATCH = 100;
const TOPIC_NAME_MAX = 100;
const LIST_DEFAULT = 20;
const LIST_MAX = 100;
// A subjectRef add looks for an existing canonical record among this many
// of the topic's newest real entries.
const SUBJECT_SCAN_PAGES = 5;

export const PREVIEW_CAPTURE_ENTRY_TYPES = [
  'shared-db:get-topics',
  'shared-db:create-topic',
  'shared-db:get-entries',
  'shared-db:query-entries',
  'shared-db:get-entries-by-ids',
  'shared-db:add-entry',
  'shared-db:add-entries',
  'shared-db:update-entry',
  'shared-db:delete-entry',
  'shared-db:delete-entries'
] as const;
export type PreviewCaptureEntryType = (typeof PREVIEW_CAPTURE_ENTRY_TYPES)[number];

export type EntryRealRead = (
  type: 'shared-db:get-topics' | 'shared-db:get-entries' | 'shared-db:get-entries-by-ids',
  payload: Record<string, any>
) => Promise<any>;

export interface ScratchViewer {
  userId: number | null;
  username: string | null;
  profilePicUrl: string | null;
}

interface Topic {
  id: number;
  name: string;
  createdBy: number | null;
  createdAt: number;
}

interface EntryRow {
  id: number;
  topicId: number;
  userId: number | null;
  subjectId: number | null;
  claimedByUserId: number | null;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  username: string | null;
  profilePicUrl: string | null;
}

interface Overlay {
  row: EntryRow;
  deleted: boolean;
  // false: created in this session; true: a real entry this session changed
  real: boolean;
}

interface EntryQuery {
  authorUserId: number | null;
  fields: string[] | null;
  where: { field: string; equals?: unknown; truthy?: true } | null;
  countBy: string | null;
  includeAuthor: boolean;
}

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

function entryData(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('data must be a JSON object');
  let text: string;
  try {
    text = JSON.stringify(data);
  } catch {
    fail('data must be JSON serializable');
  }
  if (new TextEncoder().encode(text!).length > MAX_DATA_BYTES) {
    fail(`data exceeds max size of ${MAX_DATA_BYTES} bytes`);
  }
  return JSON.parse(text!) as Record<string, unknown>;
}

function entryBatch(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) fail('items must be a non-empty array');
  const list = items as unknown[];
  if (list.length > MAX_BATCH) fail(`items must contain at most ${MAX_BATCH} entries`);
  return list.map((item, index) => {
    try {
      return entryData(item);
    } catch (error: any) {
      return fail(`items[${index}]: ${error.message}`);
    }
  });
}

export function normalizeEntryId(value: unknown): number | null {
  let id: number;
  if (typeof value === 'number') id = value;
  else if (typeof value === 'string' && /^\d+$/.test(value.trim())) id = Number(value.trim());
  else return null;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function entryIds(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) fail('entryIds must be a non-empty array');
  const list = value as unknown[];
  if (list.length > MAX_BATCH) fail(`entryIds must contain at most ${MAX_BATCH} entries`);
  const seen = new Set<number>();
  return list.map((raw) => {
    const id = normalizeEntryId(raw);
    if (!id) fail('entryIds must contain only positive integers');
    if (seen.has(id!)) fail(`entryIds contains duplicate entry ${id}`);
    seen.add(id!);
    return id!;
  });
}

const fieldName = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value);

// twinkle-api services/sharedDbEntryQuery.ts normalizeEntryQuery
function entryQuery(raw: unknown): EntryQuery | null {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) fail('query must be an object');
  const value = raw as Record<string, any>;
  // The SDK always sends the keys; absent options arrive as undefined.
  const authorUserId = value.authorUserId == null ? null : normalizeEntryId(value.authorUserId);
  if (value.authorUserId != null && !authorUserId) fail('Invalid query authorUserId');
  let fields: string[] | null = null;
  if (value.fields != null) {
    if (!Array.isArray(value.fields) || value.fields.length > 24 || !value.fields.every(fieldName)) {
      fail('query fields must contain at most 24 top-level field names');
    }
    fields = [...new Set<string>(value.fields)];
  }
  let where: EntryQuery['where'] = null;
  if (value.where != null) {
    const filter = value.where;
    if (typeof filter !== 'object' || Array.isArray(filter) || !fieldName(filter.field)
      || (!Object.prototype.hasOwnProperty.call(filter, 'equals') && filter.truthy !== true)) {
      fail('Invalid query where');
    }
    const equal = filter.equals;
    if (filter.truthy !== true && !(equal === null || typeof equal === 'boolean'
      || (typeof equal === 'string' && equal.length <= 256) || (typeof equal === 'number' && Number.isFinite(equal)))) {
      fail('query where.equals must be a JSON scalar');
    }
    if (filter.truthy === true && Object.prototype.hasOwnProperty.call(filter, 'equals')) {
      fail('Choose equals or truthy, not both');
    }
    where = filter.truthy === true ? { field: filter.field, truthy: true } : { field: filter.field, equals: equal };
  }
  if (value.includeAuthor != null && typeof value.includeAuthor !== 'boolean') fail('query includeAuthor must be a boolean');
  if (value.countBy != null && !fieldName(value.countBy)) fail('Invalid query countBy');
  return { authorUserId, fields, where, countBy: value.countBy ?? null, includeAuthor: value.includeAuthor !== false };
}

function fieldOf(data: unknown, field: string) {
  return data && typeof data === 'object' && !Array.isArray(data)
    && Object.prototype.hasOwnProperty.call(data, field)
    ? (data as Record<string, unknown>)[field] : undefined;
}

// The server's JSON filter: equals compares JSON values; truthy excludes
// null, false, 0 and "" (and a missing field).
function matches(query: EntryQuery | null, row: EntryRow) {
  if (query?.authorUserId && row.userId !== query.authorUserId) return false;
  if (!query?.where) return true;
  const value = fieldOf(row.data, query.where.field);
  if (query.where.truthy) return value !== undefined && value !== null && value !== false && value !== 0 && value !== '';
  return value !== undefined && JSON.stringify(value) === JSON.stringify(query.where.equals);
}

function project(query: EntryQuery | null, row: EntryRow) {
  const data = query?.fields
    ? Object.fromEntries(query.fields.map((field) => [field, fieldOf(row.data, field) ?? null]))
    : row.data;
  const out: Record<string, unknown> = {
    id: row.id, topicId: row.topicId, userId: row.userId, subjectId: row.subjectId,
    claimedByUserId: row.claimedByUserId, data, createdAt: row.createdAt, updatedAt: row.updatedAt
  };
  if (query?.includeAuthor !== false) {
    out.username = row.username;
    out.profilePicUrl = row.profilePicUrl;
  }
  return out;
}

function realRow(entry: any): EntryRow {
  return {
    id: Number(entry.id),
    topicId: Number(entry.topicId),
    userId: entry.userId == null ? null : Number(entry.userId),
    subjectId: entry.subjectId == null ? null : Number(entry.subjectId),
    claimedByUserId: entry.claimedByUserId == null ? null : Number(entry.claimedByUserId),
    data: entry.data && typeof entry.data === 'object' ? entry.data : {},
    createdAt: Number(entry.createdAt) || 0,
    updatedAt: Number(entry.updatedAt) || 0,
    username: entry.username ?? null,
    profilePicUrl: entry.profilePicUrl ?? null
  };
}

export function createScratchEntries({ reserve }: { reserve: (isNew: boolean, value?: unknown) => void }) {
  const topics = new Map<string, Topic>();
  const overlays = new Map<number, Overlay>();
  let nextId = SCRATCH_ENTRY_ID_BASE;

  const nextNewId = () => nextId++;

  async function realTopics(read: EntryRealRead): Promise<Topic[]> {
    const response = await read('shared-db:get-topics', {});
    return Array.isArray(response?.topics) ? response.topics : [];
  }

  async function resolveTopic(
    payload: any,
    read: EntryRealRead,
    viewer: ScratchViewer,
    create: boolean
  ): Promise<Topic | null> {
    const numericTopicId = payload?.topicId ? Number(payload.topicId) : null;
    if (numericTopicId) {
      const own = [...topics.values()].find((topic) => topic.id === numericTopicId);
      if (own) return own;
      const real = (await realTopics(read)).find((topic) => Number(topic.id) === numericTopicId);
      if (!real) fail('Topic not found', 404);
      return real!;
    }
    const name = typeof payload?.topicName === 'string' ? payload.topicName.trim() : '';
    if (!name) fail('topicName or topicId is required');
    if (name.length > TOPIC_NAME_MAX) fail(`topicName must be ${TOPIC_NAME_MAX} characters or less`);
    const real = (await realTopics(read)).find((topic) => topic.name === name);
    if (real) return real;
    const own = topics.get(name);
    if (own || !create) return own || null;
    reserve(true, name);
    const topic = { id: nextNewId(), name, createdBy: viewer.userId, createdAt: nowSeconds() };
    topics.set(name, topic);
    return topic;
  }

  // The entry as this session sees it, or null (missing or deleted).
  async function findEntry(id: number, read: EntryRealRead): Promise<EntryRow | null> {
    const overlay = overlays.get(id);
    if (overlay) return overlay.deleted ? null : overlay.row;
    if (id >= SCRATCH_ENTRY_ID_BASE) return null;
    const response = await read('shared-db:get-entries-by-ids', { entryIds: [id] });
    const entry = Array.isArray(response?.entries) ? response.entries[0] : null;
    return entry ? realRow(entry) : null;
  }

  function setOverlay(row: EntryRow, real: boolean, deleted = false) {
    reserve(!overlays.has(row.id), deleted ? null : row.data);
    overlays.set(row.id, { row, real, deleted });
  }

  function newRow(topic: Topic, data: Record<string, unknown>, viewer: ScratchViewer, subjectId: number | null): EntryRow {
    const now = nowSeconds();
    return {
      id: nextNewId(), topicId: Number(topic.id), userId: viewer.userId, subjectId, claimedByUserId: null,
      data, createdAt: now, updatedAt: now, username: viewer.username, profilePicUrl: viewer.profilePicUrl
    };
  }

  async function listEntries(payload: any, read: EntryRealRead) {
    const query = entryQuery(payload?.query);
    const limit = Math.min(Math.max(Math.floor(Number(payload?.limit ?? payload?.pageSize) || LIST_DEFAULT), 1), LIST_MAX);
    const order = String(payload?.order || payload?.sort || payload?.direction || '').trim().toLowerCase();
    const ascending = ['asc', 'ascending', 'oldest', 'oldest-first', 'oldest-to-newest', 'old_to_new', 'old-to-new',
      'earliest', 'earliest-first', 'chronological'].includes(order);
    const topic = await resolveTopic(payload, read, { userId: null, username: null, profilePicUrl: null }, false);
    if (!topic) {
      return { ...(query?.countBy ? { groups: [] } : { entries: [] }), cursor: null, hasMore: false, ...(query ? { queryVersion: 1 } : {}) };
    }
    const cursorId = payload?.cursor?.id == null ? null : normalizeEntryId(payload.cursor.id);
    if (query && payload?.cursor?.id != null && cursorId === null) fail('Invalid cursor');
    const inTopic = [...overlays.values()].filter((overlay) => overlay.row.topicId === Number(topic.id));
    const touchedReal = new Set(inTopic.filter((overlay) => overlay.real).map((overlay) => overlay.row.id));
    const liveMatching = inTopic.filter((overlay) => !overlay.deleted && matches(query, overlay.row));
    const ownNew = liveMatching.filter((overlay) => !overlay.real).map((overlay) => overlay.row);
    const ownChanged = liveMatching.filter((overlay) => overlay.real).map((overlay) => overlay.row);
    const realTopic = Number(topic.id) < SCRATCH_ENTRY_ID_BASE;
    const realPayload = { topicId: topic.id, query: payload?.query, order: ascending ? 'asc' : 'desc' };

    if (query?.countBy) {
      // Real counts, minus the real entries this session changed (as they
      // were), plus every live entry of this session that matches.
      const real = realTopic && (cursorId == null || cursorId < SCRATCH_ENTRY_ID_BASE)
        ? await read('shared-db:get-entries', { ...realPayload, limit, cursor: payload?.cursor })
        : { groups: [], hasMore: false, cursor: null, truncated: false };
      const groups: Array<{ value: unknown; count: number }> = (Array.isArray(real?.groups) ? real.groups : []).map((group: any) => ({ ...group }));
      const keyOf = (value: unknown) => JSON.stringify(value ?? null);
      const bump = (value: unknown, by: number, addMissing: boolean) => {
        const group = groups.find((item) => keyOf(item.value) === keyOf(value));
        if (group) group.count = Math.max(0, group.count + by);
        else if (addMissing && by > 0) groups.push({ value: value ?? null, count: by });
      };
      const changedIds = [...touchedReal].slice(0, MAX_BATCH);
      if (changedIds.length) {
        const originals = await read('shared-db:get-entries-by-ids', { entryIds: changedIds });
        for (const entry of Array.isArray(originals?.entries) ? originals.entries : []) {
          const row = realRow(entry);
          if (matches(query, row)) bump(fieldOf(row.data, query.countBy), -1, false);
        }
      }
      const lastPage = !real?.hasMore;
      for (const row of [...ownChanged, ...ownNew]) bump(fieldOf(row.data, query.countBy), 1, lastPage);
      return { queryVersion: 1, groups: groups.filter((group) => group.count > 0), hasMore: Boolean(real?.hasMore),
        cursor: real?.cursor ?? null, truncated: Boolean(real?.truncated) };
    }

    const byOrder = (a: EntryRow, b: EntryRow) => (ascending ? a.id - b.id : b.id - a.id);
    const page = (rows: EntryRow[], extra: Record<string, unknown> = {}) => ({
      entries: rows.map((row) => project(query, row)),
      ...extra,
      ...(query ? { queryVersion: 1 } : {})
    });
    // This session's new entries have the highest ids: first when newest
    // first, last when oldest first.
    const newSorted = ownNew.sort(byOrder);
    const inNewRegion = cursorId != null && cursorId >= SCRATCH_ENTRY_ID_BASE;
    if (!ascending && (cursorId == null || inNewRegion)) {
      const pending = newSorted.filter((row) => cursorId == null || row.id < cursorId);
      if (pending.length > limit) {
        const rows = pending.slice(0, limit);
        return page(rows, { cursor: { id: rows[rows.length - 1].id }, hasMore: true });
      }
      const room = limit - pending.length;
      const rest = realTopic && room > 0
        ? await realPage(undefined, room)
        : { rows: [] as EntryRow[], cursor: null, hasMore: false };
      if (realTopic && room === 0) {
        return page(pending, { cursor: pending.length ? { id: pending[pending.length - 1].id } : null, hasMore: true });
      }
      return page([...pending, ...rest.rows], { cursor: rest.cursor, hasMore: rest.hasMore });
    }
    if (ascending && inNewRegion) {
      const pending = newSorted.filter((row) => row.id > cursorId!);
      const rows = pending.slice(0, limit);
      const more = pending.length > limit;
      return page(rows, { cursor: more ? { id: rows[rows.length - 1].id } : null, hasMore: more });
    }
    const real = realTopic ? await realPage(payload?.cursor, limit) : { rows: [] as EntryRow[], cursor: null, hasMore: false };
    if (ascending && !real.hasMore) {
      const room = Math.max(0, limit - real.rows.length);
      const rows = newSorted.slice(0, room);
      const more = newSorted.length > room;
      const all = [...real.rows, ...rows];
      return page(all, { cursor: more ? { id: all.length ? all[all.length - 1].id : SCRATCH_ENTRY_ID_BASE - 1 } : null, hasMore: more });
    }
    return page(real.rows, { cursor: real.cursor, hasMore: real.hasMore });

    // One real page with this session's changes: changed or deleted real
    // entries leave it, and changed ones that still match come back at their
    // place in this page's id range.
    async function realPage(cursor: any, size: number) {
      const response = await read('shared-db:get-entries', { ...realPayload, limit: size, ...(cursor ? { cursor } : {}) });
      const rows: EntryRow[] = (Array.isArray(response?.entries) ? response.entries : [])
        .map(realRow).filter((row: EntryRow) => !touchedReal.has(row.id));
      const from = cursor?.id != null ? Number(cursor.id) : ascending ? 0 : Infinity;
      const to = response?.hasMore && response?.cursor?.id != null ? Number(response.cursor.id) : ascending ? SCRATCH_ENTRY_ID_BASE : 0;
      const inRange = (id: number) => (ascending ? id > from && id <= to : id < from && id >= to);
      const merged = [...rows, ...ownChanged.filter((row) => inRange(row.id))].sort(byOrder);
      return { rows: merged, cursor: response?.cursor ?? null, hasMore: Boolean(response?.hasMore) };
    }
  }

  async function handle(type: PreviewCaptureEntryType, payload: any, read: EntryRealRead, viewer: ScratchViewer): Promise<any> {
    switch (type) {
      case 'shared-db:get-topics': {
        const real = await realTopics(read);
        return { topics: [...real, ...[...topics.values()].filter((topic) => !real.some((item) => item.name === topic.name))] };
      }
      case 'shared-db:create-topic': {
        const name = payload?.name;
        if (!name || typeof name !== 'string' || !name.trim()) fail('name is required');
        if (name.trim().length > TOPIC_NAME_MAX) fail(`name must be ${TOPIC_NAME_MAX} characters or less`);
        return { topic: await resolveTopic({ topicName: name }, read, viewer, true) };
      }
      case 'shared-db:get-entries':
      case 'shared-db:query-entries':
        return listEntries(payload, read);
      case 'shared-db:get-entries-by-ids': {
        const ids = entryIds(payload?.entryIds);
        const realIds = ids.filter((id) => id < SCRATCH_ENTRY_ID_BASE && !overlays.has(id));
        const real = realIds.length ? await read('shared-db:get-entries-by-ids', { entryIds: realIds }) : { entries: [] };
        const byId = new Map<number, any>();
        for (const entry of Array.isArray(real?.entries) ? real.entries : []) byId.set(Number(entry.id), entry);
        for (const [id, overlay] of overlays) if (!overlay.deleted) byId.set(id, project(null, overlay.row));
        return { entries: ids.map((id) => byId.get(id)).filter(Boolean) };
      }
      case 'shared-db:add-entry': {
        const data = entryData(payload?.data);
        let subjectId: number | null = null;
        if (payload?.subjectRef != null) {
          subjectId = Number(payload.subjectRef);
          if (!Number.isInteger(subjectId) || subjectId <= 0) fail('subjectRef must be a positive integer');
        }
        const topic = (await resolveTopic(payload, read, viewer, true))!;
        if (subjectId != null) {
          // Get-or-create: the subject's canonical record, if it exists.
          const own = [...overlays.values()].find((overlay) => !overlay.deleted
            && overlay.row.topicId === Number(topic.id) && overlay.row.subjectId === subjectId);
          if (own) return { entry: project(null, own.row) };
          if (Number(topic.id) < SCRATCH_ENTRY_ID_BASE) {
            let cursor: any = undefined;
            for (let scanned = 0; scanned < SUBJECT_SCAN_PAGES; scanned += 1) {
              const response = await read('shared-db:get-entries', { topicId: topic.id, limit: LIST_MAX, ...(cursor ? { cursor } : {}) });
              const found = (Array.isArray(response?.entries) ? response.entries : [])
                .find((entry: any) => Number(entry.subjectId) === subjectId && !overlays.get(Number(entry.id))?.deleted);
              if (found) return { entry: project(null, realRow(found)) };
              if (!response?.hasMore) break;
              cursor = response.cursor;
            }
          }
        }
        const row = newRow(topic, data, viewer, subjectId);
        setOverlay(row, false);
        return { entry: project(null, row) };
      }
      case 'shared-db:add-entries': {
        const items = entryBatch(payload?.items);
        const topic = (await resolveTopic(payload, read, viewer, true))!;
        const rows = items.map((data) => {
          const row = newRow(topic, data, viewer, null);
          setOverlay(row, false);
          return row;
        });
        return { entries: rows.map((row) => project(null, row)) };
      }
      case 'shared-db:update-entry': {
        const id = normalizeEntryId(payload?.entryId);
        if (!id) fail('entryId must be a positive integer');
        const data = entryData(payload?.data);
        const current = await findEntry(id!, read);
        if (!current) fail('Entry not found', 404);
        const row = { ...current!, data, updatedAt: nowSeconds() };
        setOverlay(row, id! < SCRATCH_ENTRY_ID_BASE);
        return { entry: project(null, row) };
      }
      case 'shared-db:delete-entry': {
        const id = normalizeEntryId(payload?.entryId);
        if (!id) fail('entryId must be a positive integer');
        const current = await findEntry(id!, read);
        if (!current) fail('Entry not found', 404);
        setOverlay(current!, id! < SCRATCH_ENTRY_ID_BASE, true);
        return { success: true };
      }
      case 'shared-db:delete-entries': {
        const ids = entryIds(payload?.entryIds);
        const deletedEntryIds: number[] = [];
        for (const id of ids) {
          const current = await findEntry(id, read);
          if (!current) continue;
          setOverlay(current, id < SCRATCH_ENTRY_ID_BASE, true);
          deletedEntryIds.push(id);
        }
        const deleted = new Set(deletedEntryIds);
        return { success: true, deletedEntryIds, missingEntryIds: ids.filter((id) => !deleted.has(id)) };
      }
    }
  }

  return {
    handle,
    size: () => ({ topics: topics.size, entries: overlays.size })
  };
}

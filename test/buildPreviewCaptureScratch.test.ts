import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A Lumine preview capture's throwaway SDK store: saves and keep-place
// snapshots stay in the session's memory over the real (read-only) data,
// with the real stores' limits, and only the Lumine capture host has one.
(globalThis as any).window = globalThis;
const { createPreviewCaptureScratch, isPreviewCaptureScratchType } = await import(
  '../src/containers/Build/PreviewPanel/helpers/previewCaptureScratch.ts'
);

function realStore(rows: { privateRows?: any[]; kvRows?: any[] } = {}) {
  const calls: Array<[string, any]> = [];
  const privateRows = rows.privateRows || [];
  const kvRows = rows.kvRows || [];
  const readReal = async (type: string, payload: any) => {
    calls.push([type, payload]);
    if (type === 'private-db:get') {
      const row = privateRows.find((item) => item.key === payload.key);
      return { item: row || null };
    }
    if (type === 'private-db:list') {
      const items = privateRows.filter((item) => item.key.startsWith(payload.prefix || ''));
      return { items };
    }
    if (type === 'shared-db:kv-get') {
      const row = kvRows.find((item) => item.key === payload.key && item.namespace === payload.namespace);
      return { item: row || null };
    }
    return { items: kvRows.filter((item) => item.namespace === payload.namespace), cursor: null, hasMore: false };
  };
  return { calls, readReal };
}

test('private saves stay in the session and read back over the real data', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realStore({ privateRows: [{ id: 7, key: 'best', value: 3, updatedAt: 1 }, { id: 8, key: 'coins', value: 10, updatedAt: 1 }] });
  assert.deepEqual((await scratch.handle('private-db:get', { key: 'best' }, real.readReal)).item.value, 3, 'existing saves still show');
  const saved = await scratch.handle('private-db:set', { key: 'best', value: { level: 9 } }, real.readReal);
  assert.deepEqual(saved.item.value, { level: 9 });
  assert.ok(saved.item.id >= 1e15, 'scratch ids sort after every real id');
  assert.deepEqual((await scratch.handle('private-db:get', { key: 'best' }, real.readReal)).item.value, { level: 9 });
  assert.deepEqual(await scratch.handle('private-db:remove', { key: 'coins' }, real.readReal), { success: true, deleted: true });
  assert.equal((await scratch.handle('private-db:get', { key: 'coins' }, real.readReal)).item, null, 'a removal hides the real row');
  await scratch.handle('private-db:set', { key: 'new', value: 'x' }, real.readReal);
  const listed = await scratch.handle('private-db:list', {}, real.readReal);
  assert.deepEqual(listed.items.map((item: any) => [item.key, item.value]), [['best', { level: 9 }], ['new', 'x']]);
  // Nothing was written anywhere else: only reads reached the real store.
  assert.ok(real.calls.every(([type]) => type === 'private-db:get' || type === 'private-db:list'));
});

test('private limits match the real store, and compare-and-set behaves like it', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realStore();
  for (const [payload, message] of [
    [{ key: '', value: 1 }, /key is required/],
    [{ key: 'x'.repeat(121), value: 1 }, /120 characters or fewer/],
    [{ key: 'bad key', value: 1 }, /letters, numbers/],
    [{ key: 'k' }, /value is required/],
    [{ key: 'k', value: 'é'.repeat(8193) }, /max size of 16384 bytes/]
  ] as const) {
    await assert.rejects(scratch.handle('private-db:set', payload, real.readReal), message);
  }
  await scratch.handle('private-db:set', { key: 'k', value: 'é'.repeat(8190) }, real.readReal);
  const op = { key: 'save', operationId: 'op-12345678' };
  const first = await scratch.handle('private-db:compare-and-set', { ...op, expectedValue: null, value: { v: 1 } }, real.readReal);
  assert.equal(first.applied, true);
  const again = await scratch.handle('private-db:compare-and-set', { ...op, expectedValue: null, value: { v: 1 } }, real.readReal);
  assert.deepEqual([again.applied, again.duplicate, again.matchesSubmittedValue], [false, true, true]);
  const stale = await scratch.handle('private-db:compare-and-set', { key: 'save', operationId: 'op-abcdefgh', expectedValue: null, value: { v: 2 } }, real.readReal);
  assert.deepEqual([stale.applied, stale.conflict, stale.item.value], [false, true, { v: 1 }]);
  await assert.rejects(scratch.handle('private-db:compare-and-set', { key: 'save', operationId: 'short', expectedValue: null, value: 1 }, real.readReal), /operationId/);
});

test('shared key-value writes stay in the session with real limits, versions and incremental lists', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realStore({ kvRows: [{ id: 3, namespace: 'board', key: 'alice', value: 5, version: 2, changeSeq: 40, deleted: false, createdAt: 1, updatedAt: 1 }] });
  const set = await scratch.handle('shared-db:kv-set', { namespace: 'board', items: [{ key: 'alice', value: 9 }, { key: 'bob', value: 1 }] }, real.readReal);
  assert.deepEqual(set.items.map((item: any) => [item.key, item.value, item.version]), [['alice', 9, 3], ['bob', 1, 1]]);
  assert.equal((await scratch.handle('shared-db:kv-get', { namespace: 'board', key: 'alice' }, real.readReal)).item.value, 9);
  const full = await scratch.handle('shared-db:kv-list', { namespace: 'board' }, real.readReal);
  assert.deepEqual(full.items.map((item: any) => item.key), ['alice', 'bob'], 'the real alice is replaced, not listed twice');
  const since = full.items.at(-1).changeSeq;
  assert.deepEqual(await scratch.handle('shared-db:kv-delete', { namespace: 'board', key: 'bob' }, real.readReal), { success: true, deleted: true });
  const incremental = await scratch.handle('shared-db:kv-list', { namespace: 'board', since }, real.readReal);
  assert.deepEqual(incremental.items.map((item: any) => [item.key, item.deleted]), [['bob', true]], 'a sync after "since" sees the tombstone');
  for (const [payload, message] of [
    [{ namespace: '', items: [{ key: 'a', value: 1 }] }, /namespace is required/],
    [{ namespace: 'n', items: [] }, /non-empty array/],
    [{ namespace: 'n', items: Array.from({ length: 101 }, (_, i) => ({ key: `k${i}`, value: i })) }, /at most 100 entries/],
    [{ namespace: 'n', items: [{ key: 'a', value: 'x'.repeat(10240) }] }, /at most 10240 bytes/],
    [{ namespace: 'n', items: [{ key: 'a', value: 1 }, { key: 'a', value: 2 }] }, /duplicate key/]
  ] as const) {
    await assert.rejects(scratch.handle('shared-db:kv-set', payload, real.readReal), message);
  }
});

test('keep-place snapshots come back as a return in the same session', () => {
  const scratch = createPreviewCaptureScratch();
  assert.equal(scratch.lifecycleResume(), null);
  assert.equal(scratch.saveLifecycle({ state: [1] }), false, 'only plain objects, as on the real host');
  assert.equal(scratch.saveLifecycle({ state: { room: 4, hp: 7 }, reason: 'pagehide', work: ['room'] }), true);
  const resume = scratch.lifecycleResume();
  assert.equal(resume?.kind, 'return');
  assert.deepEqual(resume?.state, { room: 4, hp: 7 });
  assert.equal(resume?.reason, 'pagehide');
  // Two sessions never share anything.
  assert.equal(createPreviewCaptureScratch().lifecycleResume(), null);
});

test('every storage request is served from the store; everything else keeps its normal path', () => {
  for (const type of ['private-db:set', 'private-db:get', 'shared-db:kv-set', 'shared-db:kv-list', 'shared-db:add-entry',
    'shared-db:query-entries', 'shared-db:delete-entries', 'user-db:exec', 'user-db:query']) assert.equal(isPreviewCaptureScratchType(type), true);
  for (const type of ['shared-db:claim-entry', 'rewards:claim', 'files:save-as', 'lifecycle:snapshot', 'notifications:subscribe']) assert.equal(isPreviewCaptureScratchType(type), false);
});

test('only the Lumine capture host creates a store, and the bridge consults it first', () => {
  const host = readFileSync(new URL('../src/containers/Build/ThumbnailCaptureHost.tsx', import.meta.url), 'utf8');
  assert.match(host, /lumineCaptureId\s*\? createPreviewCaptureScratch\(\{ loadSqlJs: loadHostSqlJs \}\)\s*: null/);
  assert.match(host, /captureScratch=\{captureScratch\}/);
  const bridge = readFileSync(new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url), 'utf8');
  assert.match(bridge, /if \(captureScratchStore && isPreviewCaptureScratchType\(type\)\) \{[\s\S]*?response = await captureScratchStore\.handle\(type, payload, readReal, \{[\s\S]*?\}\);\s*\} else switch \(type\) \{/);
  assert.match(bridge, /lifecycleResume: captureScratchStore\s*\? captureScratchStore\.lifecycleResume\(\)/);
  assert.match(bridge, /case 'lifecycle:snapshot': \{\s*if \(captureScratchStore\) \{/);
  // No other container passes a store.
  const runtime = readFileSync(new URL('../src/containers/Build/Runtime/index.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(runtime, /captureScratch/);
});

// Shared entries and the viewer database (r3).
const { validateViewerSql } = await import('../src/containers/Build/PreviewPanel/helpers/previewCaptureScratchViewerDb.ts');
const viewer = { userId: 7, username: 'owner', profilePicUrl: null };

function realEntries(rows: any[] = [], topicsList: any[] = [{ id: 4, name: 'scores', createdBy: 7, createdAt: 1 }]) {
  const calls: Array<[string, any]> = [];
  const readReal = async (type: string, payload: any) => {
    calls.push([type, payload]);
    if (type === 'shared-db:get-topics') return { topics: topicsList };
    if (type === 'shared-db:get-entries-by-ids') return { entries: rows.filter((row) => payload.entryIds.includes(row.id)) };
    if (type === 'shared-db:get-entries') {
      const asc = payload.order === 'asc';
      let list = rows.filter((row) => row.topicId === Number(payload.topicId)).sort((a, b) => asc ? a.id - b.id : b.id - a.id);
      if (payload.cursor?.id) list = list.filter((row) => asc ? row.id > payload.cursor.id : row.id < payload.cursor.id);
      if (payload.query?.countBy) {
        const counts = new Map<string, any>();
        for (const row of list) { const key = JSON.stringify(row.data[payload.query.countBy] ?? null); const g = counts.get(key) || { value: row.data[payload.query.countBy] ?? null, count: 0 }; g.count++; counts.set(key, g); }
        return { queryVersion: 1, groups: [...counts.values()], hasMore: false, cursor: null, truncated: false };
      }
      const page = list.slice(0, payload.limit);
      const hasMore = list.length > payload.limit;
      return { entries: page, cursor: hasMore ? { id: page[page.length - 1].id } : null, hasMore };
    }
    return {};
  };
  return { calls, readReal };
}
const entry = (id: number, data: any, extra: any = {}) => ({ id, topicId: 4, userId: 9, subjectId: null, claimedByUserId: null, data, createdAt: id, updatedAt: id, username: 'someone', profilePicUrl: null, ...extra });

test('shared entries: adds, updates and deletes stay in the session and merge into real pages', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realEntries([entry(1, { score: 5, team: 'red' }), entry(2, { score: 8, team: 'blue' }), entry(3, { score: 2, team: 'red' })]);
  const added = await scratch.handle('shared-db:add-entry', { topicName: 'scores', data: { score: 11, team: 'blue' } }, real.readReal, viewer);
  assert.equal(added.entry.userId, 7); assert.equal(added.entry.topicId, 4); assert.ok(added.entry.id >= 1e15);
  await scratch.handle('shared-db:update-entry', { entryId: 1, data: { score: 6, team: 'blue' } }, real.readReal, viewer);
  await scratch.handle('shared-db:delete-entry', { entryId: 3 }, real.readReal, viewer);
  const newest = await scratch.handle('shared-db:get-entries', { topicName: 'scores', limit: 10 }, real.readReal, viewer);
  assert.deepEqual(newest.entries.map((item: any) => [item.id >= 1e15 ? 'new' : item.id, item.data.score]), [['new', 11], [2, 8], [1, 6]]);
  const oldest = await scratch.handle('shared-db:get-entries', { topicName: 'scores', limit: 2, order: 'asc' }, real.readReal, viewer);
  assert.deepEqual(oldest.entries.map((item: any) => item.data.score), [6, 8]);
  const next = await scratch.handle('shared-db:get-entries', { topicName: 'scores', limit: 2, order: 'asc', cursor: oldest.cursor }, real.readReal, viewer);
  assert.deepEqual(next.entries.map((item: any) => item.data.score), [11]);
  // Queries filter and count this session's changes too.
  const blue = await scratch.handle('shared-db:query-entries', { topicName: 'scores', limit: 10, query: { where: { field: 'team', equals: 'blue' }, fields: ['score'] } }, real.readReal, viewer);
  assert.deepEqual(blue.entries.map((item: any) => item.data), [{ score: 11 }, { score: 8 }, { score: 6 }]);
  const counts = await scratch.handle('shared-db:query-entries', { topicName: 'scores', query: { countBy: 'team' } }, real.readReal, viewer);
  assert.deepEqual(counts.groups, [{ value: 'blue', count: 3 }]);
  const byIds = await scratch.handle('shared-db:get-entries-by-ids', { entryIds: [3, added.entry.id, 1] }, real.readReal, viewer);
  assert.deepEqual(byIds.entries.map((item: any) => item.data.score), [11, 6]);
  assert.deepEqual(await scratch.handle('shared-db:delete-entries', { entryIds: [2, 3, 99] }, real.readReal, viewer), { success: true, deletedEntryIds: [2], missingEntryIds: [3, 99] });
  assert.ok(real.calls.every(([type]) => ['shared-db:get-topics', 'shared-db:get-entries', 'shared-db:get-entries-by-ids'].includes(type)), 'only reads reach the real store');
});

test('shared entries: topics, subject records and the server limits and messages', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realEntries([entry(5, { title: 'Book' }, { subjectId: 42 })]);
  const topic = await scratch.handle('shared-db:create-topic', { name: 'notes' }, real.readReal, viewer);
  assert.ok(topic.topic.id >= 1e15);
  assert.deepEqual((await scratch.handle('shared-db:get-topics', {}, real.readReal, viewer)).topics.map((item: any) => item.name), ['scores', 'notes']);
  const canonical = await scratch.handle('shared-db:add-entry', { topicName: 'scores', data: { title: 'other' }, subjectRef: 42 }, real.readReal, viewer);
  assert.equal(canonical.entry.id, 5, 'a subject record that exists is returned, not duplicated');
  const batch = await scratch.handle('shared-db:add-entries', { topicName: 'notes', items: [{ a: 1 }, { a: 2 }] }, real.readReal, viewer);
  assert.equal(batch.entries.length, 2);
  for (const [type, payload, message] of [
    ['shared-db:add-entry', { topicName: 'scores', data: [1] }, /data must be a JSON object/],
    ['shared-db:add-entry', { topicName: 'scores', data: { x: 'é'.repeat(5121) } }, /data exceeds max size of 10240 bytes/],
    ['shared-db:add-entry', { data: { a: 1 } }, /topicName or topicId is required/],
    ['shared-db:add-entry', { topicName: 'x'.repeat(101), data: { a: 1 } }, /topicName must be 100 characters or less/],
    ['shared-db:add-entry', { topicId: 777, data: { a: 1 } }, /Topic not found/],
    ['shared-db:add-entry', { topicName: 'scores', data: { a: 1 }, subjectRef: -1 }, /subjectRef must be a positive integer/],
    ['shared-db:add-entries', { topicName: 'scores', items: Array.from({ length: 101 }, () => ({})) }, /items must contain at most 100 entries/],
    ['shared-db:add-entries', { topicName: 'scores', items: [{}, 'x'] }, /items\[1\]: data must be a JSON object/],
    ['shared-db:update-entry', { entryId: 'abc', data: {} }, /entryId must be a positive integer/],
    ['shared-db:update-entry', { entryId: 404, data: {} }, /Entry not found/],
    ['shared-db:delete-entries', { entryIds: [1, 1] }, /duplicate entry 1/],
    ['shared-db:create-topic', { name: ' ' }, /name is required/],
    ['shared-db:query-entries', { topicName: 'scores', query: { where: { field: 'a', equals: {} } } }, /query where.equals must be a JSON scalar/]
  ] as const) {
    await assert.rejects(scratch.handle(type as any, payload, real.readReal, viewer), message);
  }
});

test('viewer SQL follows the server rules word for word', () => {
  for (const [sql, message] of [
    ['', /SQL must be a string/], ['x'.repeat(10001), /SQL is too long/], ['SELECT 1; SELECT 2', /Multiple statements/],
    ['SELECT 1 -- hi', /comments are not allowed/], ['PRAGMA user_version', /statement is not allowed/],
    ['DROP TABLE t', /statement is not allowed/], ['EXPLAIN SELECT 1', /statement is not allowed/], ['CREATE VIEW v AS SELECT 1', /Only CREATE TABLE\/INDEX/]
  ] as const) assert.throws(() => validateViewerSql(sql), message);
  assert.equal(validateViewerSql(' SELECT 1;; '), 'SELECT 1');
});

// The engine itself, when a local sql.js build is given (the website loads
// the same version from cdnjs): SQLJS_DIST=/path/to/sql.js/dist
test('viewer database: reads use the real route until the first write, which opens a one-read copy of a big database', {
  skip: !process.env.SQLJS_DIST && 'set SQLJS_DIST to a sql.js 1.10.3 dist folder'
}, async () => {
  const { createRequire } = await import('node:module');
  const initSqlJs = createRequire(import.meta.url)(`${process.env.SQLJS_DIST}/sql-wasm.js`);
  const loadSqlJs = () => initSqlJs({ locateFile: (file: string) => `${process.env.SQLJS_DIST}/${file}` });
  const SQL = await loadSqlJs();
  // The owner's real database: 20 tables, 15,000 rows (more than the old
  // per-table copy could ever read), plus a unique index.
  const real = new SQL.Database();
  for (let t = 0; t < 20; t += 1) {
    real.run(`CREATE TABLE t${t} (id INTEGER PRIMARY KEY AUTOINCREMENT, slot TEXT, coins INTEGER)`);
    real.run('BEGIN');
    for (let r = 0; r < 750; r += 1) real.run(`INSERT INTO t${t} (slot, coins) VALUES (?, ?)`, [`s${r}`, r]);
    real.run('COMMIT');
  }
  real.run('CREATE UNIQUE INDEX t0_slot ON t0 (slot)');
  const image = Buffer.from(real.export()).toString('base64');
  const calls: string[] = [];
  let exportFails = false;
  const readReal = async (type: string, payload: any) => {
    calls.push(type);
    if (type === 'user-db:export') {
      if (exportFails) throw new Error('viewer database operation rate limit exceeded');
      return { sizeBytes: image.length, image };
    }
    assert.equal(type, 'user-db:query');
    const stmt = real.prepare(payload.sql);
    const rows: any[] = [];
    if (payload.params?.length) stmt.bind(payload.params);
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return { rows, rowCount: rows.length, truncated: false };
  };
  let clock = 1_000_000;
  const scratch = createPreviewCaptureScratch({ loadSqlJs, now: () => clock } as any);
  const query = (sql: string, params?: any[]) => scratch.handle('user-db:query', { sql, params }, readReal as any);
  const exec = (sql: string, params?: any[]) => scratch.handle('user-db:exec', { sql, params }, readReal as any);
  assert.deepEqual((await query('SELECT COUNT(*) AS n FROM t19')).rows, [{ n: 750 }]);
  assert.deepEqual(calls, ['user-db:query'], 'a read-only look needs no copy');
  assert.deepEqual(await exec('INSERT INTO t0 (slot, coins) VALUES (?, ?)', ['new', 5]), { changes: 1, lastInsertRowid: 751 });
  assert.deepEqual(calls, ['user-db:query', 'user-db:export'], 'the first write copies the whole database in one read');
  await exec('UPDATE t3 SET coins = coins + 1 WHERE slot = ?', ['s0']);
  assert.deepEqual((await query('SELECT coins FROM t0 WHERE slot = ?', ['new'])).rows, [{ coins: 5 }]);
  assert.deepEqual((await query('SELECT SUM(n) AS rows FROM (SELECT COUNT(*) AS n FROM t0 UNION ALL SELECT COUNT(*) FROM t19)')).rows, [{ rows: 1501 }]);
  assert.deepEqual((await query('SELECT coins FROM t3 WHERE slot = ?', ['s0'])).rows, [{ coins: 1 }]);
  assert.equal(calls.length, 2, 'after the copy, nothing reaches the real database');
  assert.deepEqual((await query('SELECT COUNT(*) AS n FROM t0')).rows, [{ n: 751 }]);
  assert.deepEqual(real.exec('SELECT COUNT(*) FROM t0')[0].values[0][0], 750, 'the real database never changed');
  await assert.rejects(exec('INSERT INTO t0 (slot) VALUES (?)', ['new']), /UNIQUE/);
  await assert.rejects(query("INSERT INTO t0 (slot) VALUES ('c')"), /Query must return rows/);
  await assert.rejects(exec('SELECT 1'), /Use query\(\) for SELECT statements/);
  await assert.rejects(exec('CREATE TABLE big (v TEXT)').then(() => exec('INSERT INTO big VALUES (?)', ['x'.repeat(1_200_000)])), /exceeds size limit/);
  assert.deepEqual((await query('SELECT COUNT(*) AS n FROM big')).rows, [{ n: 0 }], 'a write past the size limit is undone');
  const many = await query('WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 1500) SELECT i FROM n');
  assert.deepEqual([many.rows.length, many.rowCount, many.truncated], [1000, 1500, true]);
  // A copy that fails is remembered: writes say so without retrying every
  // call, reads keep working through the real route, and it retries later.
  const failing = createPreviewCaptureScratch({ loadSqlJs, now: () => clock } as any);
  calls.length = 0;
  exportFails = true;
  await assert.rejects(failing.handle('user-db:exec', { sql: 'DELETE FROM t1' }, readReal as any), /could not copy the viewer database to test writes \(viewer database operation rate limit exceeded\)\. Reads still work/);
  await assert.rejects(failing.handle('user-db:exec', { sql: 'DELETE FROM t1' }, readReal as any), /could not copy/);
  assert.deepEqual(calls, ['user-db:export'], 'not retried on the next call');
  assert.deepEqual((await failing.handle('user-db:query', { sql: 'SELECT COUNT(*) AS n FROM t1' }, readReal as any)).rows, [{ n: 750 }]);
  exportFails = false;
  clock += 31_000;
  assert.deepEqual(await failing.handle('user-db:exec', { sql: 'DELETE FROM t1 WHERE id = 1' }, readReal as any), { changes: 1, lastInsertRowid: 0 });
  // An owner who never used the app has an empty database, like a first-time viewer.
  const empty = Buffer.from(new SQL.Database().export()).toString('base64');
  const fresh = createPreviewCaptureScratch({ loadSqlJs });
  const freshReal = async (type: string) => type === 'user-db:export' ? { image: empty } : { rows: [] };
  await fresh.handle('user-db:exec', { sql: 'CREATE TABLE runs (score INTEGER)' }, freshReal as any);
  assert.deepEqual((await fresh.handle('user-db:query', { sql: 'SELECT COUNT(*) AS n FROM runs' }, freshReal as any)).rows, [{ n: 0 }]);
});

test('shared key-value: a batch of new keys costs one real list, not one read per key', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realStore({ kvRows: [{ id: 3, namespace: 'board', key: 'k5', value: 1, version: 4, changeSeq: 9, deleted: false, createdAt: 1, updatedAt: 1 }] });
  const items = Array.from({ length: 100 }, (_, i) => ({ key: `k${i}`, value: i }));
  const set = await scratch.handle('shared-db:kv-set', { namespace: 'board', items }, real.readReal);
  assert.equal(set.items.length, 100);
  assert.equal(set.items[5].version, 5, 'a real key keeps counting its versions');
  assert.equal(set.items[6].version, 1);
  assert.deepEqual(real.calls.map(([type]) => type), ['shared-db:kv-list']);
});

test('a session cannot grow without bound, however an app loops', async () => {
  const scratch = createPreviewCaptureScratch();
  const real = realStore();
  const big = 'x'.repeat(16000);
  let refused: any = null;
  for (let i = 0; i < 1200 && !refused; i += 1) {
    await scratch.handle('private-db:set', { key: 'autosave', value: big }, real.readReal).catch((error: any) => { refused = error; });
  }
  assert.match(String(refused?.message), /saved 32 MB already\. Restart the preview/);
});

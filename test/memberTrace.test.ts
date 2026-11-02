import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMemberTrace,
  MEMBER_TRACE_FLAG_KEY,
  MEMBER_TRACE_OUTBOX_KEY,
  type MemberTraceStorage
} from '../src/helpers/memberTraceCore';
import { redactTracePath } from '../src/helpers/ownerTraceRecorder';
import {
  noteClientReload,
  recordClientTrace,
  setClientTraceSink
} from '../src/helpers/clientTraceBus';

const DEW = 42;
const OWNER = 7;

function memoryStorage(): MemberTraceStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key)! : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    }
  };
}

// One page load. `answer` is what the API answers each upload (a status, or a
// promise that never settles: the page went away before the answer).
function page({
  storage,
  userId = DEW,
  answer = () => Promise.resolve(200)
}: {
  storage: MemberTraceStorage;
  userId?: number;
  answer?: (body: any) => Promise<number>;
}) {
  const posts: { body: any; unloading: boolean }[] = [];
  const timers: (() => void)[] = [];
  const state = { userId };
  let batch = 0;
  const trace = createMemberTrace({
    storage: () => storage,
    getUserId: () => state.userId,
    isOwner: () => state.userId === OWNER,
    post: (body, { unloading }) => {
      const parsed = JSON.parse(body);
      posts.push({ body: parsed, unloading });
      return answer(parsed);
    },
    getPath: () => '/chat/general/main',
    getSessionHeader: () => ({ version: '2.5.20', navType: 'reload' }),
    version: '2.5.20',
    makeSessionId: () => `session-${Math.random().toString(36).slice(2, 8)}`,
    makeBatchId: () => `batch-${++batch}-${Math.random().toString(36).slice(2, 6)}`,
    setTimer: (callback) => {
      timers.push(callback);
      return timers.length;
    },
    clearTimer: () => {}
  });
  return { trace, posts, timers, state };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function outbox(storage: ReturnType<typeof memoryStorage>) {
  const raw = storage.data.get(MEMBER_TRACE_OUTBOX_KEY);
  return raw ? JSON.parse(raw) : null;
}

test('gating: untraced members, other accounts and the owner record nothing', async () => {
  const storage = memoryStorage();
  const untraced = page({ storage });
  untraced.trace.start({ navType: 'navigate' });
  untraced.trace.record('route', { nav: 'PUSH' });
  untraced.trace.recordReload('lazy-chunk-recovery');
  untraced.trace.flush({ unloading: true });
  await settle();
  assert.equal(untraced.posts.length, 0);
  assert.equal(storage.data.size, 0, 'nothing stored on the device');

  // the flag names dew; someone else signed in on the same device
  storage.setItem(MEMBER_TRACE_FLAG_KEY, String(DEW));
  const other = page({ storage, userId: 8 });
  other.trace.start();
  other.trace.recordReload('http-301');
  await settle();
  assert.equal(other.posts.length, 0);
  assert.equal(storage.data.has(MEMBER_TRACE_OUTBOX_KEY), false);

  // the owner has the owner trace; the member trace never runs for him
  storage.setItem(MEMBER_TRACE_FLAG_KEY, String(OWNER));
  const owner = page({ storage, userId: OWNER });
  owner.trace.start();
  owner.trace.recordReload('http-301');
  await settle();
  assert.equal(owner.posts.length, 0);
});

test('the session answer switches tracing on and off for this account', async () => {
  const storage = memoryStorage();
  const load = page({ storage });
  assert.equal(load.trace.isActive(), false);
  // the server did not say: nothing changes
  load.trace.noteSession(DEW, undefined);
  assert.equal(load.trace.isActive(), false);
  load.trace.noteSession(DEW, true);
  assert.equal(load.trace.isActive(), true);
  assert.equal(storage.getItem(MEMBER_TRACE_FLAG_KEY), String(DEW));
  load.trace.record('chat-select', { channelId: 2, subchannel: 'main' });
  load.trace.flush();
  await settle();
  const sent = load.posts[0].body.events;
  assert.deepEqual(
    sent.map((event: any) => event.type),
    ['session', 'boot', 'chat-select']
  );
  assert.equal(sent[0].data.member, 1);
  // the build version rides on every event
  assert.ok(sent.slice(1).every((event: any) => event.data.v === '2.5.20'));
  assert.equal(outbox(storage), null, 'accepted batches leave the outbox');

  // switched off by an admin: the next session answer stops it and clears the device
  load.trace.record('route', { nav: 'PUSH' });
  load.trace.noteSession(DEW, false);
  load.trace.flush();
  await settle();
  assert.equal(load.posts.length, 1);
  assert.equal(load.trace.isActive(), false);
  assert.equal(storage.getItem(MEMBER_TRACE_FLAG_KEY), null);
});

test('a self-reload is kept on the device before the page goes, and the next load sends it', async () => {
  const storage = memoryStorage();
  storage.setItem(MEMBER_TRACE_FLAG_KEY, String(DEW));

  // load 1: the upload never gets an answer (the page reloads first)
  const first = page({ storage, answer: () => new Promise<number>(() => {}) });
  first.trace.start({ navType: 'navigate' });
  first.trace.record('chat-select', { channelId: 2, subchannel: 'main' });
  first.trace.recordReload('lazy-chunk-recovery', { truncated: false });
  // synchronously, before any network answer: the outbox holds the reason
  const kept = outbox(storage);
  assert.equal(kept.userId, DEW);
  assert.equal(kept.batches.length, 1);
  const keptEvents = JSON.parse(kept.batches[0].body).events;
  const reload = keptEvents.find((event: any) => event.type === 'reload');
  assert.deepEqual(reload.data, {
    reason: 'lazy-chunk-recovery',
    truncated: false,
    v: '2.5.20'
  });
  assert.equal(reload.path, '/chat/general/main');
  assert.equal(first.posts[0].unloading, true, 'sent with keepalive too');

  // load 2: the earlier batch is sent first, then removed once accepted
  const second = page({ storage });
  second.trace.start({ navType: 'reload' });
  await settle();
  await settle();
  const replayed = second.posts.find(
    (post) => post.body.sessionId === JSON.parse(kept.batches[0].body).sessionId
  );
  assert.ok(replayed, 'the previous page’s batch was re-sent');
  assert.ok(replayed!.body.events.some((event: any) => event.type === 'reload'));
  assert.equal(outbox(storage)?.batches.length ?? 0, 0);
  // and the new load says the earlier page left one batch behind
  second.trace.flush();
  await settle();
  const keptSession = JSON.parse(kept.batches[0].body).sessionId;
  const boot = second.posts
    .filter((post) => post.body.sessionId !== keptSession)
    .flatMap((post) => post.body.events)
    .find((event: any) => event.type === 'boot');
  // why it loaded: the browser's navType plus the previous page's note
  // naming the code path that reloaded it (a reload by hand leaves none)
  assert.equal(boot.data.navType, 'reload');
  assert.equal(boot.data.kept, 1);
  assert.equal(boot.data.byCode, 'lazy-chunk-recovery');
  assert.equal(boot.data.byCodeAt, '/chat/general/main');
  assert.ok(boot.data.byCodeAgoMs >= 0 && boot.data.byCodeAgoMs < 60_000);
  assert.equal(boot.data.v, '2.5.20');
  // read once: a later load is not blamed on the same reload
  const third = page({ storage });
  third.trace.start({ navType: 'reload' });
  third.trace.flush();
  await settle();
  const thirdBoot = third.posts
    .flatMap((post) => post.body.events)
    .find((event: any) => event.type === 'boot');
  assert.equal(thirdBoot.data.byCode, undefined);
});

test('kept batches wait out failures, and a 403 (switched off) drops them', async () => {
  const storage = memoryStorage();
  storage.setItem(MEMBER_TRACE_FLAG_KEY, String(DEW));
  const offline = page({ storage, answer: () => Promise.resolve(0) });
  offline.trace.start();
  offline.trace.recordReload('http-301');
  await settle();
  assert.equal(outbox(storage).batches.length, 1, 'no answer: kept');

  const busy = page({ storage, answer: () => Promise.resolve(429) });
  busy.trace.start();
  await settle();
  // 429: still kept (this load's own boot event waits for its timer)
  assert.equal(outbox(storage).batches.length, 1);

  const switchedOff = page({ storage, answer: () => Promise.resolve(403) });
  switchedOff.trace.start();
  await settle();
  assert.equal(storage.data.has(MEMBER_TRACE_OUTBOX_KEY), false);
  assert.equal(storage.getItem(MEMBER_TRACE_FLAG_KEY), null);
  assert.equal(switchedOff.trace.isActive(), false);
});

test("a different account never uploads another account's kept batches", async () => {
  const storage = memoryStorage();
  storage.setItem(MEMBER_TRACE_FLAG_KEY, String(DEW));
  const dew = page({ storage, answer: () => Promise.resolve(0) });
  dew.trace.start();
  dew.trace.recordReload('http-301');
  await settle();
  assert.ok(outbox(storage));
  // someone else signs in; their session says they are not traced
  const other = page({ storage, userId: 8 });
  other.trace.start();
  other.trace.noteSession(8, false);
  await settle();
  assert.equal(other.posts.length, 0);
  assert.equal(storage.data.has(MEMBER_TRACE_OUTBOX_KEY), false);
});

test('the outbox keeps the newest batches within its cap', async () => {
  const storage = memoryStorage();
  storage.setItem(MEMBER_TRACE_FLAG_KEY, String(DEW));
  const load = page({ storage, answer: () => Promise.resolve(0) });
  load.trace.start();
  for (let i = 0; i < 25; i++) load.trace.recordReload(`reason-${i}`);
  await settle();
  const kept = outbox(storage).batches;
  assert.equal(kept.length, 20);
  const last = JSON.parse(kept[kept.length - 1].body).events;
  assert.equal(last[last.length - 1].data.reason, 'reason-24');
});

test('the reload hand-off is a no-op until a trace installs itself', () => {
  setClientTraceSink(null);
  noteClientReload('http-301');
  recordClientTrace('chat-select', { channelId: 2 });
  const calls: string[] = [];
  setClientTraceSink({
    record: (type) => calls.push(`record:${type}`),
    recordMember: (type) => calls.push(`member:${type}`),
    reload: (reason) => {
      calls.push(`reload:${reason}`);
      throw new Error('a broken trace never breaks the page');
    }
  });
  noteClientReload('client-update-silent');
  recordClientTrace('chat-select');
  assert.deepEqual(calls, ['reload:client-update-silent', 'record:chat-select']);
  setClientTraceSink(null);
});

test('credential path segments are masked, including Bridge check-in links', () => {
  assert.equal(redactTracePath('/bridge/c/abc123'), '/bridge/c/***');
  assert.equal(redactTracePath('/reset/password/tok'), '/reset/password/***');
  assert.equal(redactTracePath('/verify/email/tok?x=1'), '/verify/email/***?x=1');
  assert.equal(redactTracePath('/chat/general/main'), '/chat/general/main');
});

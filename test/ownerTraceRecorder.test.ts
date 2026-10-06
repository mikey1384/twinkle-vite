import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createOwnerTraceRecorder,
  redactTracePath
} from '../src/helpers/ownerTraceRecorder';

function setup({
  owner = true,
  maxEventsPerBatch,
  maxBatchBytes
}: {
  owner?: boolean;
  maxEventsPerBatch?: number;
  maxBatchBytes?: number;
} = {}) {
  const state = { owner };
  const sent: { body: any; unloading: boolean }[] = [];
  const timers: { callback: () => void; ms: number; cleared: boolean }[] = [];
  let activations = 0;
  let clock = 1000;
  const recorder = createOwnerTraceRecorder({
    isOwner: () => state.owner,
    send: (body, { unloading }) =>
      sent.push({ body: JSON.parse(body), unloading }),
    getPath: () => '/home',
    getSessionHeader: () => ({ vw: 390, version: 'test' }),
    onFirstActivation: () => {
      activations += 1;
    },
    now: () => ++clock,
    makeSessionId: () => 'session-1',
    setTimer: (callback, ms) => {
      const timer = { callback, ms, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (handle) => {
      (handle as { cleared: boolean }).cleared = true;
    },
    flushDelayMs: 25_000,
    maxEventsPerBatch,
    maxBatchBytes
  });
  const fireTimers = () => {
    for (const timer of timers.splice(0)) {
      if (!timer.cleared) timer.callback();
    }
  };
  return {
    recorder,
    sent,
    timers,
    state,
    fireTimers,
    activations: () => activations
  };
}

test('a non-owner records nothing: no session, listeners, timers or requests', () => {
  const { recorder, sent, timers, activations } = setup({ owner: false });
  recorder.record('route', { nav: 'PUSH' });
  recorder.record('error', { msg: 'boom' });
  recorder.flush({ unloading: true });
  assert.equal(recorder.isActive(), false);
  assert.equal(recorder.getBufferedCount(), 0);
  assert.equal(timers.length, 0);
  assert.equal(sent.length, 0);
  assert.equal(activations(), 0);
});

test('the owner session starts with a header and flushes on the timer', () => {
  const { recorder, sent, timers, fireTimers, activations } = setup();
  recorder.record('route', { nav: 'POP' }, '/comments/5');
  recorder.record('content-scroll', { st: 120 });
  assert.equal(activations(), 1);
  assert.equal(timers.length, 1, 'one pending flush timer, not one per event');
  assert.equal(timers[0].ms, 25_000);
  assert.equal(sent.length, 0);
  fireTimers();
  assert.equal(sent.length, 1);
  const { sessionId, events } = sent[0].body;
  assert.equal(sessionId, 'session-1');
  assert.deepEqual(
    events.map((event: any) => [event.seq, event.type, event.path]),
    [
      [1, 'session', '/home'],
      [2, 'route', '/comments/5'],
      [3, 'content-scroll', '/home']
    ]
  );
  assert.deepEqual(events[0].data, { vw: 390, version: 'test' });
  assert.equal(sent[0].unloading, false);
  assert.equal(recorder.getBufferedCount(), 0);
});

test('a full batch flushes at once and pagehide flushes with keepalive', () => {
  const { recorder, sent } = setup({ maxEventsPerBatch: 3 });
  recorder.record('a');
  recorder.record('b');
  assert.equal(sent.length, 1, 'session + a + b fill a batch of three');
  assert.equal(sent[0].body.events.length, 3);
  recorder.record('c');
  recorder.flush({ unloading: true });
  assert.equal(sent.length, 2);
  assert.equal(sent[1].unloading, true);
  assert.deepEqual(
    sent[1].body.events.map((event: any) => event.type),
    ['c']
  );
  recorder.flush({ unloading: true });
  assert.equal(sent.length, 2, 'an empty buffer sends nothing');
});

test('a batch stays under the byte cap; the rest goes with the next flush', () => {
  const { recorder, sent, fireTimers } = setup({ maxBatchBytes: 400 });
  for (let i = 0; i < 6; i += 1) {
    recorder.record('scroll-anchor', { note: 'x'.repeat(80) });
  }
  recorder.flush();
  assert.ok(JSON.stringify(sent[0].body).length <= 400 + 64);
  const firstCount = sent[0].body.events.length;
  assert.ok(firstCount < 7);
  fireTimers();
  while (recorder.getBufferedCount() > 0) fireTimers();
  const total = sent.reduce(
    (sum, batch) => sum + batch.body.events.length,
    0
  );
  assert.equal(total, 7);
});

test('signing out drops the buffer instead of uploading it as someone else', () => {
  const { recorder, sent, state } = setup();
  recorder.record('route');
  state.owner = false;
  recorder.flush({ unloading: true });
  assert.equal(sent.length, 0);
  assert.equal(recorder.getBufferedCount(), 0);
});

test('a runaway buffer keeps the newest events and reports how many it dropped', () => {
  const sent: any[] = [];
  const recorder = createOwnerTraceRecorder({
    isOwner: () => true,
    send: (body) => sent.push(JSON.parse(body)),
    getPath: () => '/',
    getSessionHeader: () => ({}),
    setTimer: () => 1,
    clearTimer: () => {},
    maxBufferedEvents: 5,
    maxEventsPerBatch: 100
  });
  for (let i = 0; i < 10; i += 1) recorder.record('e', { i });
  recorder.flush();
  const events = sent[0].events;
  assert.equal(events[0].type, 'trace-dropped');
  assert.deepEqual(events[0].data, { count: 6 });
  assert.deepEqual(
    events.slice(1).map((event: any) => event.data.i),
    [5, 6, 7, 8, 9]
  );
});

test('credential-like query values and data hashes never reach the trace', () => {
  assert.equal(
    redactTracePath('/signup/guardian?token=abc&step=2#x=1'),
    '/signup/guardian?token=***&step=2'
  );
  assert.equal(redactTracePath('/cli/device?code=ABCD'), '/cli/device?code=***');
  assert.equal(redactTracePath('/c/5?apiKey=1&q=hi#reply'), '/c/5?apiKey=***&q=hi#reply');
  const { recorder, sent } = setup();
  recorder.record(
    'route',
    { from: '/bridge-builder/parent?token=t', hash: '#access_token=z', note: 'x' },
    '/consent?session=s&lang=en'
  );
  recorder.record('scroll-anchor', { note: 'link:/signup/guardian?Token=q' });
  recorder.flush();
  const [, route, anchor] = sent[0].body.events;
  assert.equal(route.path, '/consent?session=***&lang=en');
  assert.deepEqual(route.data, {
    from: '/bridge-builder/parent?token=***',
    hash: '',
    note: 'x'
  });
  assert.equal(anchor.data.note, 'link:/signup/guardian?Token=***');
});

test('a payload that cannot serialize is dropped and never throws into the caller', () => {
  const { recorder, sent } = setup();
  const circular: Record<string, unknown> = { a: 1 };
  circular.self = circular;
  assert.doesNotThrow(() => recorder.record('bad', circular));
  recorder.record('good', { ok: true });
  assert.doesNotThrow(() => recorder.flush());
  const types = sent[0].body.events.map((event: any) => event.type);
  assert.deepEqual(types, ['trace-dropped', 'session', 'good']);
  assert.deepEqual(sent[0].body.events[0].data, { count: 1 });

  const throwing = createOwnerTraceRecorder({
    isOwner: () => true,
    send: () => {
      throw new Error('network');
    },
    getPath: () => {
      throw new Error('no location');
    },
    getSessionHeader: () => ({}),
    setTimer: () => 1,
    clearTimer: () => {}
  });
  assert.doesNotThrow(() => throwing.record('x', {}, '/ok'));
  assert.doesNotThrow(() => throwing.flush({ unloading: true }));
});

test('reset and verify token path segments are masked', () => {
  assert.equal(redactTracePath('/reset/password/abc.def'), '/reset/password/***');
  assert.equal(
    redactTracePath('/verify/email/tok123?next=/home&code=9#x'),
    '/verify/email/***?next=/home&code=***#x'
  );
  assert.equal(redactTracePath('/reset'), '/reset');
  assert.equal(redactTracePath('/comments/5'), '/comments/5');
});

const readSource = (file: string) =>
  readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

test('only the unloading flush uses keepalive (64KB shared budget)', () => {
  const source = readSource('helpers/ownerTrace.ts');
  assert.match(source, /keepalive: unloading\b/);
  assert.doesNotMatch(source, /keepalive: true/);
});

test('routine per-scroll anchor saves return before any trace work', () => {
  const source = readSource('helpers/hooks/useScrollAnchorRestoration.ts');
  assert.match(
    source,
    /function recordAnchorSave\(anchorKey: string, note: string\) \{\s*(\/\/[^\n]*\n\s*)*if \(note !== 'element' && !isScrollDiagnosticsLoggingEnabled\(\)\) return;/
  );
  // Every per-scroll save goes through saveCurrentAnchor with a routine note.
  const saveCurrent = source.slice(
    source.indexOf('function saveCurrentAnchor('),
    source.indexOf('function findCurrentAnchorElement(')
  );
  const notes = [...saveCurrent.matchAll(/recordAnchorSave\(anchorKey, '([^']+)'\)/g)].map(
    (match) => match[1]
  );
  assert.ok(notes.length >= 4);
  assert.ok(!notes.includes('element'));
});

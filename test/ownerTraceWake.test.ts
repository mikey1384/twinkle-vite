import test from 'node:test';
import assert from 'node:assert/strict';
import { createWakeProfiler } from '../src/helpers/ownerTraceWake';

function harness({ active = true } = {}) {
  let clock = 0;
  const frames: ((at: number) => void)[] = [];
  const timers: { callback: () => void; cleared: boolean }[] = [];
  const records: Record<string, any>[] = [];
  const profiler = createWakeProfiler({
    isActive: () => active,
    record: (data) => records.push(data),
    now: () => clock,
    requestFrame: (callback) => frames.push(callback),
    cancelFrame: () => {
      frames.length = 0;
    },
    setTimer: (callback) => {
      const timer = { callback, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (handle) => {
      (handle as { cleared: boolean }).cleared = true;
    },
    countImages: () => 3
  });
  return {
    profiler,
    records,
    frame(gapMs: number) {
      clock += gapMs;
      const callback = frames.shift();
      callback?.(clock);
    },
    endWindow() {
      for (const timer of timers.splice(0)) {
        if (!timer.cleared) timer.callback();
      }
    }
  };
}

test('a wake window sums frame pacing, repeated requests, socket churn and boot work', () => {
  const h = harness();
  h.profiler.start({
    kind: 'load',
    navType: 'back_forward',
    socketConnected: false
  });
  h.frame(16); // first frame only sets the baseline
  h.frame(16);
  h.frame(60);
  h.frame(140);
  h.profiler.noteRequest('GET /user/session');
  h.profiler.noteRequest('GET /user/session');
  h.profiler.noteRequest('GET /community/funds');
  h.profiler.noteSocket('reconnect-attempt');
  h.profiler.noteSocket('connect');
  h.profiler.noteSocket('disconnect', 'transport close');
  h.profiler.noteSocket('connect');
  h.profiler.noteWork('session-init');
  h.profiler.noteWork('chat-load-writer');
  h.profiler.noteStall(450);
  h.endWindow();
  assert.equal(h.records.length, 1);
  const wake = h.records[0];
  assert.equal(wake.kind, 'load');
  assert.equal(wake.navType, 'back_forward');
  assert.equal(wake.end, 'window');
  assert.equal(wake.frames, 3);
  assert.equal(wake.over50, 2);
  assert.equal(wake.over100, 1);
  assert.equal(wake.maxFrameMs, 140);
  assert.equal(wake.requests, 3);
  assert.equal(wake.repeats, 1);
  assert.deepEqual(wake.top, ['GET /user/session x2', 'GET /community/funds']);
  assert.equal(wake.images, 3);
  assert.deepEqual(wake.socket, {
    atStart: false,
    connects: 2,
    disconnects: 1,
    attempts: 1,
    reasons: ['transport close']
  });
  assert.deepEqual(wake.work, { 'session-init': 1, 'chat-load-writer': 1 });
  assert.equal(wake.stalls, 1);
  assert.equal(wake.stallMs, 450);
});

test('hiding the tab closes the window early; a new wake closes the previous one', () => {
  const h = harness();
  h.profiler.start({ kind: 'resume', awayMs: 300_000 });
  h.profiler.stop('hidden');
  h.profiler.start({ kind: 'resume', awayMs: 5_000 });
  h.profiler.start({ kind: 'resume', awayMs: 1_000 });
  assert.deepEqual(
    h.records.map((r) => [r.end, r.awayMs]),
    [
      ['hidden', 300_000],
      ['next-wake', 5_000]
    ]
  );
  assert.equal(h.profiler.isOpen(), true);
});

test('the top list is cut, not dropped, and nothing records for anyone but the owner', () => {
  const h = harness();
  h.profiler.start({ kind: 'load' });
  for (let i = 0; i < 14; i++) h.profiler.noteRequest(`GET /r${i}`);
  h.endWindow();
  assert.equal(h.records[0].top.length, 10);
  assert.equal(h.records[0].topCut, 4);
  assert.equal(h.records[0].requests, 14);
  assert.ok(JSON.stringify(h.records[0]).length < 2000);

  const other = harness({ active: false });
  other.profiler.start({ kind: 'load' });
  other.profiler.noteRequest('GET /x');
  other.endWindow();
  assert.equal(other.records.length, 0);
  assert.equal(other.profiler.isOpen(), false);
});

test('different items under one request pattern are grouped but not counted as repeats', () => {
  const h = harness();
  h.profiler.start({ kind: 'load' });
  h.profiler.noteRequest('GET /content?contentId', 'GET /content?contentId=1');
  h.profiler.noteRequest('GET /content?contentId', 'GET /content?contentId=2');
  h.profiler.noteRequest('GET /content?contentId', 'GET /content?contentId=2');
  h.endWindow();
  assert.equal(h.records[0].requests, 3);
  assert.equal(h.records[0].repeats, 1);
  assert.deepEqual(h.records[0].top, ['GET /content?contentId x3']);
});

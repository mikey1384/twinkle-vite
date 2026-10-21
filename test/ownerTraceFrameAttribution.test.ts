import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_FRAME_EVENT_CHARS,
  boundFrameEvent,
  createFrameAttribution,
  stripScriptUrl,
  summarizeLongFrame,
  type LongFrameEntry
} from '../src/helpers/ownerTraceFrameAttribution';
import { createScrollPerfMonitor } from '../src/helpers/ownerTraceScrollPerf';

const ORIGIN = 'https://www.twin-kle.com';

test('minified slow-frame scripts retain exact source positions but omit unavailable coordinates', () => {
  const summary = summarizeLongFrame({ startTime: 0, duration: 100, scripts: [
    { duration: 80, sourceURL: `${ORIGIN}/assets/main.js?private=1`, sourceFunctionName: 'Y', sourceCharPosition: 1234, sourceLine: 1, sourceColumn: 1235 },
    { duration: 10, sourceCharPosition: -1, sourceLine: NaN, sourceColumn: undefined }
  ] });
  assert.equal(summary.scripts[0].char, 1234);
  assert.equal(summary.scripts[0].line, 1);
  assert.equal(summary.scripts[0].column, 1235);
  assert.equal(summary.scripts[1].char, undefined);
  assert.equal(summary.scripts[1].line, undefined);
  assert.doesNotMatch(JSON.stringify(summary), /private/);
});

test('text measurement time belongs only to its active frame and resets between samples', () => {
  const tracker = createFrameAttribution({ observeLongFrames: () => null, listenImageLoads: () => () => {} });
  tracker.noteTextMeasure(100);
  tracker.begin();
  tracker.noteTextMeasure(12);
  tracker.noteTextMeasure(30);
  tracker.frame(80, 80);
  tracker.noteTextMeasure(NaN);
  tracker.frame(60, 140);
  const result = tracker.end(0)!;
  assert.deepEqual(result.frames[0].textMeasure, { calls: 2, ms: 42, maxMs: 30 });
  assert.deepEqual(result.frames[1].textMeasure, { calls: 0, ms: 0, maxMs: 0 });
  tracker.begin(); tracker.frame(70, 210);
  assert.equal(tracker.end(140)!.frames[0].textMeasure.calls, 0);
});

function fakeLoaf(supported: boolean) {
  const state = {
    observing: 0,
    disconnected: 0,
    deliver: (_entries: LongFrameEntry[]) => {},
    pending: [] as LongFrameEntry[]
  };
  const observeLongFrames = (onEntries: (entries: LongFrameEntry[]) => void) => {
    if (!supported) return null;
    state.observing += 1;
    state.deliver = onEntries;
    return {
      takeRecords: () => {
        const out = state.pending;
        state.pending = [];
        return out;
      },
      disconnect: () => {
        state.disconnected += 1;
      }
    };
  };
  const images = { listeners: 0, fire: () => {} };
  const listenImageLoads = (onLoad: () => void) => {
    images.listeners += 1;
    images.fire = onLoad;
    return () => {
      images.listeners -= 1;
      images.fire = () => {};
    };
  };
  return { state, images, observeLongFrames, listenImageLoads };
}

function setupMonitor(supported: boolean) {
  const loaf = fakeLoaf(supported);
  const attribution = createFrameAttribution({
    observeLongFrames: loaf.observeLongFrames,
    listenImageLoads: loaf.listenImageLoads,
    getOrigin: () => ORIGIN
  });
  const state = { clock: 0 };
  let nextId = 1;
  const frames = new Map<number, (at: number) => void>();
  const events: Array<{ type: string; data: any; path: string }> = [];
  const monitor = createScrollPerfMonitor({
    isActive: () => true,
    isVisible: () => true,
    getPath: () => '/',
    getContext: () => ({ cards: [] }),
    record: (data, path) => events.push({ type: 'scroll-perf', data, path }),
    recordFrame: (data, path) => events.push({ type: 'scroll-frame', data, path }),
    attribution,
    now: () => state.clock,
    requestFrame: (callback) => {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame: (id) => {
      frames.delete(id);
    }
  });
  function frame(at: number) {
    state.clock = at;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(at));
  }
  return { loaf, attribution, monitor, frame, events, state };
}

test('script URLs lose query, hash and this site origin; other hosts keep host and path', () => {
  assert.equal(
    stripScriptUrl(`${ORIGIN}/assets/index-C5h.js?v=2&token=abc#x`, ORIGIN),
    '/assets/index-C5h.js'
  );
  assert.equal(
    stripScriptUrl('https://cdn.example.com/lib/a.js?k=1', ORIGIN),
    'cdn.example.com/lib/a.js'
  );
  assert.equal(stripScriptUrl('', ORIGIN), '');
});

test('a long animation frame keeps its top three scripts by duration and the style/layout share', () => {
  const summary = summarizeLongFrame(
    {
      startTime: 1000,
      duration: 120,
      blockingDuration: 70,
      renderStart: 1060,
      styleAndLayoutStart: 1090,
      scripts: [
        { duration: 5, sourceURL: `${ORIGIN}/assets/small.js`, invoker: 'A', invokerType: 'event-listener' },
        {
          duration: 40,
          sourceURL: `${ORIGIN}/assets/FeedCard-abc.js?x=1`,
          sourceFunctionName: 'HomeFeedCard',
          invoker: 'DIV.feed-item.onclick',
          invokerType: 'event-listener',
          forcedStyleAndLayoutDuration: 12
        },
        { duration: 30, sourceURL: `${ORIGIN}/assets/index.js`, invoker: `${ORIGIN}/assets/index.js?v=9`, invokerType: 'classic-script' },
        { duration: 10, sourceURL: `${ORIGIN}/assets/b.js`, invoker: 'Window.requestAnimationFrame', invokerType: 'user-callback' }
      ]
    },
    ORIGIN
  );
  assert.equal(summary.ms, 120);
  assert.equal(summary.blockingMs, 70);
  assert.equal(summary.styleLayoutShare, 0.25);
  assert.equal(summary.renderShare, 0.5);
  assert.equal(summary.scriptCount, 4);
  assert.deepEqual(
    summary.scripts.map((script) => script.ms),
    [40, 30, 10]
  );
  assert.deepEqual(summary.scripts[0], {
    ms: 40,
    src: '/assets/FeedCard-abc.js',
    fn: 'HomeFeedCard',
    invoker: 'DIV.feed-item.onclick',
    type: 'event-listener',
    forcedLayoutMs: 12
  });
  assert.equal(summary.scripts[1].invoker, '/assets/index.js');
});

test('Chrome path: LoAF frames over 50 ms become at most three scroll-frame events, matched to card counters', () => {
  const s = setupMonitor(true);
  s.monitor.scroll();
  assert.equal(s.loaf.state.observing, 1);
  assert.equal(s.loaf.images.listeners, 1);
  s.frame(16);
  // Work during the next (slow) frame interval.
  s.attribution.noteRender('subject');
  s.attribution.noteRender('subject');
  s.attribution.noteMount('aiCard');
  s.loaf.images.fire();
  s.frame(116); // 100 ms frame
  s.frame(132);
  s.loaf.state.deliver([
    { startTime: 20, duration: 95, blockingDuration: 45, scripts: [{ duration: 60, sourceURL: `${ORIGIN}/assets/x.js?q=1`, invokerType: 'event-listener', invoker: 'IMG.onload' }] },
    { startTime: 140, duration: 30 } // not slow: ignored
  ]);
  s.loaf.state.pending = [
    { startTime: 200, duration: 70 },
    { startTime: 300, duration: 55 },
    { startTime: 400, duration: 52 }
  ];
  s.monitor.stop('test');
  assert.equal(s.loaf.state.disconnected, 1);
  assert.equal(s.loaf.images.listeners, 0);
  const perf = s.events.find((event) => event.type === 'scroll-perf');
  assert.deepEqual(perf?.data.frameSource, {
    source: 'loaf',
    loafFrames: 4,
    cardRenders: 2,
    cardMounts: 1,
    imgLoads: 1
  });
  const frames = s.events.filter((event) => event.type === 'scroll-frame');
  assert.equal(frames.length, 3);
  assert.deepEqual(
    frames.map((event) => event.data.loaf.ms),
    [95, 70, 55]
  );
  assert.equal(frames[0].data.source, 'loaf');
  assert.equal(frames[0].data.gapMs, 100);
  assert.deepEqual(frames[0].data.renders, { subject: 2 });
  assert.deepEqual(frames[0].data.mounts, { aiCard: 1 });
  assert.equal(frames[0].data.imgLoads, 1);
  assert.equal(frames[0].data.loaf.scripts[0].src, '/assets/x.js');
  assert.equal(frames[1].data.renders, undefined);
  // Closed: no counting after the sample ends.
  s.attribution.noteRender('subject');
  assert.equal(s.attribution.isActive(), false);
});

test('Safari path (no LoAF): slow rAF frames record which card types rendered or mounted in that frame', () => {
  const s = setupMonitor(false);
  s.monitor.scroll();
  assert.equal(s.loaf.state.observing, 0);
  s.frame(16);
  s.attribution.noteRender('video'); // belongs to the fast frame below
  s.frame(32);
  s.attribution.noteMount('build');
  s.attribution.noteMount('build');
  s.attribution.noteRender('rewardDigest');
  s.loaf.images.fire();
  s.loaf.images.fire();
  s.frame(110); // 78 ms
  s.frame(126);
  s.attribution.noteRender('subject');
  s.frame(190); // 64 ms
  s.monitor.stop('test');
  const perf = s.events.find((event) => event.type === 'scroll-perf');
  assert.equal(perf?.data.frameSource.source, 'raf');
  assert.equal(perf?.data.frameSource.loafFrames, null);
  assert.equal(perf?.data.over50, 2);
  const frames = s.events.filter((event) => event.type === 'scroll-frame');
  assert.deepEqual(
    frames.map((event) => event.data),
    [
      { schema: 1, source: 'raf', offsetMs: 32, gapMs: 78, renders: { rewardDigest: 1 }, mounts: { build: 2 }, imgLoads: 2, textMeasure: { calls: 0, ms: 0, maxMs: 0 } },
      { schema: 1, source: 'raf', offsetMs: 126, gapMs: 64, renders: { subject: 1 }, mounts: {}, imgLoads: 0, textMeasure: { calls: 0, ms: 0, maxMs: 0 } }
    ]
  );
});

test('no sample, no work: counters ignore renders and nothing is observed outside a scroll', () => {
  const s = setupMonitor(true);
  s.attribution.noteRender('subject');
  assert.equal(s.loaf.state.observing, 0);
  assert.equal(s.loaf.images.listeners, 0);
  s.monitor.scroll();
  s.frame(16);
  s.frame(32);
  s.monitor.stop('test');
  const frames = s.events.filter((event) => event.type === 'scroll-frame');
  assert.equal(frames.length, 0);
  assert.equal(s.events[0].data.frameSource.cardRenders, 0);
});

test('a frame event stays under the server data limit', () => {
  const long = 'x'.repeat(400);
  const data = boundFrameEvent({
    schema: 1,
    source: 'loaf',
    renders: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`type${i}`.padEnd(24, 'y'), i])),
    loaf: {
      ms: 200,
      scripts: Array.from({ length: 3 }, () => ({ src: long, fn: long, invoker: long, type: 'event-listener' }))
    }
  });
  assert.ok(JSON.stringify(data).length <= MAX_FRAME_EVENT_CHARS);
  assert.equal(data.loaf.ms, 200);
});

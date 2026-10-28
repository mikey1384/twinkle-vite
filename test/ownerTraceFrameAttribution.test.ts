import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_FRAME_EVENT_CHARS,
  boundFrameEvent,
  createFrameAttribution,
  feedRenderChanges,
  stripScriptUrl,
  summarizeLongFrame,
  type LongFrameEntry
} from '../src/helpers/ownerTraceFrameAttribution';
import { createScrollPerfMonitor } from '../src/helpers/ownerTraceScrollPerf';

const ORIGIN = 'https://www.twin-kle.com';

test('slow block-preview detail identifies the worst batch, excludes content and resets between frames', () => {
  const tracker = createFrameAttribution({ observeLongFrames: () => null, listenImageLoads: () => () => {} });
  const profile = { nodes: 4, textNodes: 90, rects: 160, ancestorReads: 12,
    styleMs: 4.1, geometryMs: 20.2, rectMs: 12.1, resolveMs: 1.2 };
  tracker.noteLayout('block-preview', 80, profile); // inactive
  tracker.begin();
  tracker.noteLayout('block-preview', 40, { ...profile, privateText: 'never include this' } as any);
  tracker.noteLayout('block-preview', 2, { ...profile, nodes: 1 });
  tracker.noteLayout('markdown-parse', 18);
  tracker.noteLayout('markdown-elements', 9);
  tracker.frame(90, 90);
  tracker.frame(70, 160);
  const frames = tracker.end(0)!.frames;
  assert.deepEqual(frames[0].layoutWork['block-preview'], { calls: 2, ms: 42, maxMs: 40,
    slowest: { ...profile, styleMs: 4, geometryMs: 20, rectMs: 12, resolveMs: 1 } });
  assert.equal(frames[0].layoutWork['markdown-parse'].ms, 18);
  assert.equal(frames[0].layoutWork['markdown-elements'].ms, 9);
  assert.deepEqual(frames[1].layoutWork, {});
  assert.doesNotMatch(JSON.stringify(frames), /privateText|never include/);
});

test('bounded frame detail cannot erase the frame timing or masquerade as an unprofiled slower call', () => {
  const tracker = createFrameAttribution({ observeLongFrames: () => null, listenImageLoads: () => () => {} });
  tracker.begin();
  tracker.noteLayout('block-preview', 10, { nodes: Infinity, textNodes: -2, rects: NaN, ancestorReads: 1,
    styleMs: 1, geometryMs: 2, rectMs: 3, resolveMs: 4 });
  tracker.noteLayout('block-preview', 50);
  tracker.frame(80, 80);
  assert.equal(tracker.end(0)!.frames[0].layoutWork['block-preview'].slowest, undefined);
  const event = boundFrameEvent({ schema: 1, source: 'raf', gapMs: 321,
    layoutWork: { 'block-preview': { calls: 1, ms: 40, maxMs: 40, slowest: { oversized: 'x'.repeat(2000) } } } });
  assert.equal(event.gapMs, 321);
  assert.equal(event.layoutWork['block-preview'].ms, 40);
  assert.equal(event.layoutDetailOmitted, true);
  assert(JSON.stringify(event).length <= MAX_FRAME_EVENT_CHARS);
});

test('trimming one oversized frame leaves shared layout and script evidence intact for other frames', () => {
  const layoutWork = { 'block-preview': { calls: 1, ms: 40, maxMs: 40, slowest: { nodes: 4, rects: 20 } } };
  const scripts = [{ src: 'x'.repeat(2000) }];
  const original = { schema: 1, gapMs: 321, layoutWork, loaf: { ms: 300, scripts },
    renders: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`card${i}`.padEnd(30, 'x'), i])) };
  const bounded = boundFrameEvent(original);
  assert.equal(bounded.layoutDetailOmitted, true);
  assert.equal(bounded.layoutWork, undefined);
  assert.equal(scripts.length, 1);
  assert.equal(original.loaf.scripts, scripts);
  assert.equal(original.layoutWork, layoutWork);
  assert.deepEqual(layoutWork['block-preview'].slowest, { nodes: 4, rects: 20 });
  const sibling = boundFrameEvent({ schema: 1, gapMs: 100, layoutWork });
  assert.equal(sibling.layoutDetailOmitted, undefined);
  assert.deepEqual(sibling.layoutWork['block-preview'].slowest, { nodes: 4, rects: 20 });
  assert(JSON.stringify(bounded).length <= MAX_FRAME_EVENT_CHARS);
});

test('render attribution identifies changed inputs without recording their values or unbounded labels', () => {
  const previous = { feed: {}, visibility: false, content: {}, preview: {}, shown: true,
    theme: 'blue', level: 3, likeLoading: false, truncated: false, placeholderHeight: 100 };
  const next = { ...previous, visibility: true, content: { privateText: 'never send' } };
  assert.deepEqual(feedRenderChanges(previous, next), ['visibility', 'content']);
  assert.deepEqual(feedRenderChanges(next, { ...next }), ['other']);
  const tracker = createFrameAttribution({ observeLongFrames: () => null, listenImageLoads: () => () => {} });
  tracker.noteRender('comment', ['content']); // ignored while closed
  tracker.begin();
  tracker.noteRender('comment', [...feedRenderChanges(previous, next), 'untrusted member text']);
  tracker.frame(80, 100);
  const result = tracker.end(0)!;
  assert.deepEqual(result.frames[0].updates, { 'comment:visibility': 1, 'comment:content': 1 });
  assert.equal(result.frames[0].renders.comment, 1);
  assert.doesNotMatch(JSON.stringify(result), /never send|untrusted member text/);
});

test('a LoAF spanning two slow rAF intervals does not discard the interval whose counters it did not carry', () => {
  const tracker = createFrameAttribution({
    observeLongFrames: () => ({ takeRecords: () => [{ startTime: 100, duration: 210 }], disconnect() {} }),
    listenImageLoads: () => () => {}
  });
  tracker.begin();
  tracker.frame(200, 200); tracker.frame(200, 400);
  const result = tracker.end(0)!;
  assert.equal(result.frames.length, 2);
  assert.equal(result.frames.filter(frame => frame.source === 'raf').length, 1);
  assert.equal(result.summary.retainedUnmatchedRafFrames, 1);
  assert.equal(result.summary.candidateFramesDropped, 0);
});

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

test('slow first paint retains its work separately from scrolling intervals on Safari and Chrome', () => {
  for (const supported of [false, true]) {
    const s = setupMonitor(supported);
    s.monitor.scroll();
    s.attribution.noteRender('rewardDigest', ['content']);
    s.attribution.noteLayout('block-preview', 42);
    s.loaf.images.fire();
    if (supported) s.loaf.state.deliver([{ startTime: 0, duration: 300 }]);
    s.frame(300);
    const sample = s.events.find(event => event.type === 'scroll-perf')!.data;
    const detail = s.events.find(event => event.type === 'scroll-frame')!.data;
    assert.equal(sample.firstRafMs, 300);
    assert.equal(sample.frames, 0);
    assert.equal(sample.over100, 0);
    assert.equal(sample.contextPhase, 'after-initial-frame');
    assert.equal(sample.frameSource.slowRafFrames, 0);
    assert.equal(sample.frameSource.slowInitialFrames, 1);
    assert.equal(detail.phase, 'initial');
    assert.equal(detail.gapMs, 300);
    assert.equal(detail.renders.rewardDigest, 1);
    assert.equal(detail.imgLoads, 1);
    assert.equal(detail.layoutWork['block-preview'].ms, 42);
    assert.equal(s.loaf.images.listeners, 0);
    assert(JSON.stringify(detail).length < MAX_FRAME_EVENT_CHARS);
    s.monitor.scroll();
    s.frame(316);
    s.monitor.stop('done');
    assert.equal(s.events.filter(event => event.type === 'scroll-frame').length, 1);
  }
});

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
    loafDropped: 0,
    slowRafFrames: 1,
    slowInitialFrames: 0,
    retainedUnmatchedRafFrames: 0,
    candidateFramesDropped: 1,
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
      { schema: 1, source: 'raf', phase: 'scroll', offsetMs: 32, gapMs: 78, renders: { rewardDigest: 1 }, mounts: { build: 2 }, imgLoads: 2, layoutWork: {}, textMeasure: { calls: 0, ms: 0, maxMs: 0 } },
      { schema: 1, source: 'raf', phase: 'scroll', offsetMs: 126, gapMs: 64, renders: { subject: 1 }, mounts: {}, imgLoads: 0, layoutWork: {}, textMeasure: { calls: 0, ms: 0, maxMs: 0 } }
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

test('named layout work is bounded to the active frame and clears between samples', () => {
  const collector = createFrameAttribution({ observeLongFrames: () => null, listenImageLoads: () => () => {} });
  collector.noteLayout('block-preview', 999);
  collector.begin();
  collector.noteLayout('block-preview', 12.4);
  collector.noteLayout('block-preview', 3.1);
  collector.noteLayout('lazy-placeholder', 46.2);
  collector.frame(80, 100);
  const frame = collector.end(0)!.frames[0];
  assert.deepEqual(frame.layoutWork['block-preview'], { calls: 2, ms: 16, maxMs: 12 });
  assert.deepEqual(frame.layoutWork['lazy-placeholder'], { calls: 1, ms: 46, maxMs: 46 });
  collector.begin();collector.frame(80, 200);
  assert.deepEqual(collector.end(100)!.frames[0].layoutWork, {});
});

test('Chrome keeps an unmatched rAF delay even when shorter LoAFs were delivered', () => {
  const s = setupMonitor(true);
  s.monitor.scroll(); s.frame(16); s.attribution.noteRender('subject');
  s.state.clock = 600; s.monitor.scroll(); s.frame(616);
  s.loaf.state.deliver([{ startTime: 700, duration: 70 }, { startTime: 800, duration: 65 }, { startTime: 900, duration: 60 }]);
  s.monitor.stop('test');
  const frames = s.events.filter(event => event.type === 'scroll-frame');
  assert.equal(frames.length, 3);
  assert.equal(frames[0].data.source, 'raf');
  assert.equal(frames[0].data.gapMs, 600);
  assert.equal(frames[0].data.loafMatched, false);
  assert.deepEqual(frames[0].data.renders, { subject: 1 });
  assert.equal(s.events[0].data.frameSource.retainedUnmatchedRafFrames, 1);
});

test('absolute frame phases retain tiny rendering spans and do not invent absent timestamps', () => {
  const summary = summarizeLongFrame({ startTime: 1000, duration: 592,
    renderStart: 1590, styleAndLayoutStart: 1591, scripts: [{ duration: 10 }] });
  assert.equal(summary.renderShare, 0);
  assert.equal(summary.renderMs, 2);
  assert.equal(summary.styleLayoutMs, 1);
  assert.equal(summary.preRenderMs, 590);
  assert.equal(summary.reportedScriptMs, 10);
  const absent = summarizeLongFrame({ startTime: 1000, duration: 100 });
  assert.equal(absent.preRenderMs, null); assert.equal(absent.renderMs, null);
});

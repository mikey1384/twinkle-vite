import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createScrollPerfMonitor,
  getScrollPerfContext
} from '../src/helpers/ownerTraceScrollPerf';

function setup() {
  const state = {
    active: true,
    visible: true,
    path: '/',
    clock: 0,
    contexts: 0
  };
  let nextId = 1;
  const frames = new Map<number, (at: number) => void>();
  const events: Array<{ data: any; path: string }> = [];
  const monitor = createScrollPerfMonitor({
    isActive: () => state.active,
    isVisible: () => state.visible,
    getPath: () => state.path,
    getContext: () => {
      state.contexts++;
      return { cards: ['subject-42'] };
    },
    record: (data, path) => events.push({ data, path }),
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
  return { state, frames, events, monitor, frame };
}

test('no idle loop; records shorter scroll delays and a smooth baseline in bounded bursts', () => {
  const s = setup();
  assert.equal(s.frames.size, 0);
  s.monitor.scroll();
  for (const at of [16, 32, 80, 160, 176]) s.frame(at);
  s.state.clock = 176;
  s.monitor.scroll();
  s.frame(288);
  s.monitor.stop('test');
  const d = s.events[0].data;
  assert.equal(d.frames, 5);
  assert.equal(d.firstRafMs, 16);
  assert.equal(d.maxFrameMs, 112);
  assert.equal(d.over34, 3);
  assert.equal(d.over50, 2);
  assert.equal(d.over100, 1);
  assert.equal(d.contextPhase, 'after-slow-frame');
  assert.equal(d.contextGapMs, 48); // Context is from that frame, not the later maximum.
  assert.equal(s.state.contexts, 1);
  assert.equal(s.frames.size, 0);
  s.monitor.scroll();
  for (let at = 304; at <= 560; at += 16) s.frame(at);
  assert.equal(s.events.length, 2);
  assert.equal(s.events[1].data.over34, 0);
  assert.equal(s.events[1].data.contextPhase, 'end');
  assert.equal(s.frames.size, 0);
});

test('owner and visibility gates exclude background/sleep gaps and cancel pending work', () => {
  const s = setup();
  s.state.active = false;
  s.monitor.scroll();
  assert.equal(s.frames.size, 0);
  s.state.active = true;
  s.state.visible = false;
  s.monitor.scroll();
  assert.equal(s.frames.size, 0);
  s.state.visible = true;
  s.monitor.scroll();
  s.frame(16);
  s.monitor.stop('hidden');
  assert.equal(s.frames.size, 0);
  s.state.clock = 100_000;
  s.monitor.scroll();
  s.frame(131_000);
  assert.equal(s.events.length, 1);
  assert.equal(s.frames.size, 0);
  s.monitor.scroll();
  s.state.active = false;
  s.frame(131_016);
  assert.equal(s.events.length, 1);
  assert.equal(s.frames.size, 0);
});

test('continuous scrolling is summarized every five seconds without retaining frames', () => {
  const s = setup();
  for (let at = 0; at <= 10_200; at += 16) {
    s.state.clock = at;
    s.monitor.scroll();
    s.frame(at + 16);
  }
  s.monitor.stop('route');
  assert.equal(s.events.length, 3);
  assert(s.events.every((e) => e.data.spanMs <= 5016));
  assert(s.events.every((e) => JSON.stringify(e).length < 2000));
  assert.equal(s.frames.size, 0);
  assert.equal(s.state.contexts, 3);
});

test('route changes do not attach the next page’s cards to the prior scroll', () => {
  const s = setup();
  s.monitor.scroll();
  s.frame(16);
  s.state.path = '/subjects/123';
  s.monitor.stop('route');
  assert.equal(s.events[0].path, '/');
  assert.deepEqual(s.events[0].data.context, { routeChanged: true });
  assert.equal(s.state.contexts, 0);
});

test('visible-card context is bounded and contains identifiers, never card content', () => {
  let calls = 0;
  const doc = {
    hasFocus: () => false,
    visibilityState: 'visible',
    elementFromPoint: () => {
      calls++;
      return {
        closest: (selector: string) =>
          selector.startsWith('[data')
            ? {
                getAttribute: (key: string) =>
                  ({
                    'data-content-key': 'subject-123',
                    'data-feed-id': '456',
                    'data-feed-index': '2'
                  })[key] || ''
              }
            : { tagName: 'IMG' }
      };
    },
    getElementById: () => ({ scrollTop: 500 }),
    scrollingElement: { scrollTop: 0 }
  } as unknown as Document;
  const result = getScrollPerfContext(doc, {
    innerWidth: 1200,
    innerHeight: 800
  } as Window);
  assert.equal(calls, 9);
  assert.deepEqual(result, {
    focused: false,
    visibility: 'visible',
    cards: [{ key: 'subject-123', feed: '456', index: '2' }],
    media: ['img'],
    st: 500,
    vw: 1200,
    vh: 800
  });
});

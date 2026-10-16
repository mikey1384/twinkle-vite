// Owner-only frame sampling while a page actually scrolls. No idle frame loop,
// layout work per frame, retained frame list, or per-frame network request.
export function createScrollPerfMonitor({
  isActive,
  isVisible,
  getPath,
  getContext,
  record,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
  idleMs = 250,
  windowMs = 5000
}: {
  isActive: () => boolean;
  isVisible: () => boolean;
  getPath: () => string;
  getContext: () => Record<string, unknown>;
  record: (data: Record<string, unknown>, path: string) => void;
  now?: () => number;
  requestFrame?: (callback: (at: number) => void) => number;
  cancelFrame?: (id: number) => void;
  idleMs?: number;
  windowMs?: number;
}) {
  let frame: number | null = null;
  let sample: {
    path: string;
    start: number;
    lastScroll: number;
    previousFrame: number | null;
    firstFrameMs: number;
    frames: number;
    total: number;
    max: number;
    over34: number;
    over50: number;
    over100: number;
    scrolls: number;
    context: Record<string, unknown> | null;
    contextAt: number;
    contextGapMs: number;
  } | null = null;

  return { scroll, stop };

  function context() {
    try {
      return getContext();
    } catch {
      return { unavailable: true };
    }
  }

  function scroll() {
    if (!isActive() || !isVisible()) return;
    const t = now();
    const path = getPath();
    if (sample && sample.path !== path) stop('route');
    if (!sample) {
      sample = {
        path,
        start: t,
        lastScroll: t,
        previousFrame: null,
        firstFrameMs: 0,
        frames: 0,
        total: 0,
        max: 0,
        over34: 0,
        over50: 0,
        over100: 0,
        scrolls: 0,
        context: null,
        contextAt: -Infinity,
        contextGapMs: 0
      };
    }
    sample.lastScroll = t;
    sample.scrolls += 1;
    if (frame === null) frame = requestFrame(tick);
  }

  function tick(t: number) {
    frame = null;
    if (!sample) return;
    if (!isActive() || !isVisible() || sample.path !== getPath()) {
      stop('inactive');
      return;
    }
    const gap = sample.previousFrame === null ? 0 : t - sample.previousFrame;
    // OS sleep/suspended rendering is not a measured scrolling frame.
    if (t - (sample.previousFrame ?? sample.start) > 30_000) {
      sample = null;
      return;
    }
    if (sample.previousFrame === null) {
      sample.firstFrameMs = Math.max(0, t - sample.start);
    } else if (gap > 0) {
      sample.frames += 1;
      sample.total += gap;
      sample.max = Math.max(sample.max, gap);
      if (gap > 34) sample.over34 += 1;
      if (gap > 50) sample.over50 += 1;
      if (gap > 100) sample.over100 += 1;
      // At most twice a second, only following a slow frame. This is visible
      // context AFTER the delay, not proof that a card caused that delay.
      if (
        gap > 34 &&
        gap >= sample.contextGapMs &&
        t - sample.contextAt >= 500
      ) {
        sample.context = context();
        sample.contextAt = t;
        sample.contextGapMs = gap;
      }
    }
    sample.previousFrame = t;
    if (t - sample.lastScroll >= idleMs) {
      stop('idle');
    } else if (t - sample.start >= windowMs) {
      stop('window');
      // Continue only if another actual scroll event arrives.
    } else {
      frame = requestFrame(tick);
    }
  }

  function stop(reason: string) {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    const done = sample;
    sample = null;
    if (!done || !isActive()) return;
    const end = done.previousFrame ?? done.start;
    record(
      {
        schema: 1,
        reason,
        spanMs: Math.round(Math.max(0, end - done.start)),
        scrolls: done.scrolls,
        frames: done.frames,
        firstRafMs: Math.round(done.firstFrameMs),
        meanFrameMs: done.frames
          ? Math.round((done.total / done.frames) * 10) / 10
          : null,
        maxFrameMs: Math.round(done.max * 10) / 10,
        over34: done.over34,
        over50: done.over50,
        over100: done.over100,
        contextPhase: done.context ? 'after-slow-frame' : 'end',
        contextGapMs: done.context ? Math.round(done.contextGapMs) : null,
        contextOffsetMs: done.context
          ? Math.round(done.contextAt - done.start)
          : null,
        context:
          done.context ||
          (done.path === getPath() ? context() : { routeChanged: true })
      },
      done.path
    );
  }
}

// Existing card identifiers only, sampled at nine viewport points. No feed
// text, full DOM traversal, getBoundingClientRect loop or style inspection.
export function getScrollPerfContext(doc: Document, win: Window) {
  const cards = new Map<string, { key: string; feed: string; index: string }>();
  const media = new Set<string>();
  for (const x of [0.25, 0.5, 0.75]) {
    for (const y of [0.2, 0.5, 0.8]) {
      const element = doc.elementFromPoint(
        win.innerWidth * x,
        win.innerHeight * y
      );
      const card = element?.closest('[data-feed-anchor-id]');
      if (card) {
        const key = (card.getAttribute('data-content-key') || '').slice(0, 64);
        if (key && cards.size < 4)
          cards.set(key, {
            key,
            feed: (card.getAttribute('data-feed-id') || '').slice(0, 24),
            index: (card.getAttribute('data-feed-index') || '').slice(0, 12)
          });
      }
      const item = element?.closest('img, video, canvas, iframe');
      if (item) media.add(item.tagName.toLowerCase());
    }
  }
  const app = doc.getElementById('App');
  return {
    cards: [...cards.values()],
    media: [...media],
    st: Math.round(
      Math.max(app?.scrollTop || 0, doc.scrollingElement?.scrollTop || 0)
    ),
    vw: win.innerWidth,
    vh: win.innerHeight
  };
}

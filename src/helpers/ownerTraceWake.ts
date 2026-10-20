// Owner-only wake profile: what the site did in the WAKE_WINDOW_MS after a
// page load (an iOS tab restore arrives as a fresh `back_forward` load) or a
// return to a hidden tab. One `wake` event per window, so a Wi-Fi wake and a
// 5G wake can be compared side by side (the server adds the network tag).
// Mikey 10-20: waking the site on 5G drops frames and warms the phone.
//
// While a window is open: one rAF loop (frame pacing), counters bumped by the
// request layer, the socket and the boot pipelines. Nothing for anyone else.

export const WAKE_WINDOW_MS = 20_000;
const MAX_TOP_REQUESTS = 10;
const MAX_SOCKET_REASONS = 4;
// the slowest frames of a window, each with what landed just before it
const SLOW_FRAME_MS = 50;
const MAX_SLOW_FRAMES = 4;
const MAX_FRAME_REQUESTS = 3;
const MAX_FRAME_CARD_TYPES = 4;

interface SinceFrame {
  done: Map<string, number>;
  images: number;
  renders: Record<string, number>;
  mounts: Record<string, number>;
  socket: number;
  routes: number;
}

function emptySinceFrame(): SinceFrame {
  return {
    done: new Map(),
    images: 0,
    renders: {},
    mounts: {},
    socket: 0,
    routes: 0
  };
}

export type WakeKind = 'load' | 'resume';

export interface WakeStart {
  kind: WakeKind;
  // load: the navigation type (back_forward on iOS = the tab was discarded
  // and restored); resume: how long the tab was hidden
  navType?: string;
  awayMs?: number;
  socketConnected?: boolean;
}

export function createWakeProfiler({
  isActive,
  record,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as any),
  countImages = defaultCountImages,
  listenImageLoads = defaultListenImageLoads,
  windowMs = WAKE_WINDOW_MS
}: {
  isActive: () => boolean;
  record: (data: Record<string, unknown>) => void;
  now?: () => number;
  requestFrame?: (callback: (at: number) => void) => number;
  cancelFrame?: (id: number) => void;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  countImages?: (fromMs: number, toMs: number) => number;
  listenImageLoads?: (onLoad: () => void) => () => void;
  windowMs?: number;
}) {
  let wake: {
    start: WakeStart;
    startedAt: number;
    lastFrame: number | null;
    frames: number;
    over50: number;
    over100: number;
    maxFrame: number;
    jankMs: number;
    stalls: number;
    stallMs: number;
    requests: Map<string, number>;
    exactRequests: Set<string>;
    sameRequests: number;
    connects: number;
    disconnects: number;
    reconnectAttempts: number;
    disconnectReasons: string[];
    work: Record<string, number>;
    since: SinceFrame;
    slowFrames: Record<string, unknown>[];
  } | null = null;
  let stopImageListener: (() => void) | null = null;
  let frame: number | null = null;
  let timer: unknown = null;

  return {
    start,
    stop,
    noteRequest,
    noteRequestDone,
    noteCardRender,
    noteRoute,
    noteSocket,
    noteWork,
    noteStall,
    isOpen: () => wake !== null
  };

  function start(info: WakeStart) {
    if (!isActive()) return;
    // a new wake closes the previous window (a quick hide/show)
    if (wake) stop('next-wake');
    wake = {
      start: info,
      startedAt: now(),
      lastFrame: null,
      frames: 0,
      over50: 0,
      over100: 0,
      maxFrame: 0,
      jankMs: 0,
      stalls: 0,
      stallMs: 0,
      requests: new Map(),
      exactRequests: new Set(),
      sameRequests: 0,
      connects: 0,
      disconnects: 0,
      reconnectAttempts: 0,
      disconnectReasons: [],
      work: {},
      since: emptySinceFrame(),
      slowFrames: []
    };
    try {
      stopImageListener = listenImageLoads(() => {
        if (wake) wake.since.images += 1;
      });
    } catch {
      stopImageListener = null;
    }
    frame = requestFrame(tick);
    timer = setTimer(() => stop('window'), windowMs);
  }

  function tick(at: number) {
    if (!wake) return;
    if (wake.lastFrame !== null) {
      const gap = at - wake.lastFrame;
      wake.frames += 1;
      if (gap > wake.maxFrame) wake.maxFrame = gap;
      if (gap > 50) wake.over50 += 1;
      if (gap > 100) wake.over100 += 1;
      // time lost beyond a 60 Hz frame
      if (gap > 1000 / 60) wake.jankMs += gap - 1000 / 60;
      if (gap > SLOW_FRAME_MS) keepSlowFrame(gap, at);
    }
    wake.since = emptySinceFrame();
    wake.lastFrame = at;
    frame = requestFrame(tick);
  }

  // key: the redacted pattern (what is shown); exact: the full request, only
  // to tell a true repeat (same URL again) from a different item
  // A slow frame with what landed between the previous frame and it: API
  // replies (by pattern), images, Home feed card renders/mounts, socket
  // events, route changes. Safari has no script attribution, so this
  // correlation is how a startup jank gets a cause.
  function keepSlowFrame(gap: number, at: number) {
    if (!wake) return;
    const since = wake.since;
    const done = [...since.done.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FRAME_REQUESTS)
      .map(([key, n]) => (n > 1 ? `${key} x${n}` : key));
    const cards = topCounts(since.renders);
    const mounts = topCounts(since.mounts);
    const entry: Record<string, unknown> = {
      ms: Math.round(gap),
      at: Math.round(at - wake.startedAt),
      ...(done.length ? { done } : {}),
      ...(since.images ? { img: since.images } : {}),
      ...(cards ? { cards } : {}),
      ...(mounts ? { mounts } : {}),
      ...(since.socket ? { sock: since.socket } : {}),
      ...(since.routes ? { route: since.routes } : {})
    };
    const frames = wake.slowFrames;
    if (frames.length < MAX_SLOW_FRAMES) frames.push(entry);
    else {
      let smallest = 0;
      for (let i = 1; i < frames.length; i++) {
        if ((frames[i].ms as number) < (frames[smallest].ms as number)) {
          smallest = i;
        }
      }
      if ((frames[smallest].ms as number) < gap) frames[smallest] = entry;
    }
  }

  function topCounts(counts: Record<string, number>) {
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FRAME_CARD_TYPES);
    return entries.length ? Object.fromEntries(entries) : null;
  }

  function noteRequestDone(key: string) {
    if (!wake || !key) return;
    wake.since.done.set(key, (wake.since.done.get(key) || 0) + 1);
  }

  function noteCardRender(type: string, firstRender: boolean) {
    if (!wake || !type) return;
    const counts = firstRender ? wake.since.mounts : wake.since.renders;
    counts[type] = (counts[type] || 0) + 1;
  }

  function noteRoute() {
    if (wake) wake.since.routes += 1;
  }

  function noteRequest(key: string, exact = key) {
    if (!wake || !key) return;
    wake.requests.set(key, (wake.requests.get(key) || 0) + 1);
    if (wake.exactRequests.has(exact)) wake.sameRequests += 1;
    else wake.exactRequests.add(exact);
  }

  function noteSocket(
    event: 'connect' | 'disconnect' | 'reconnect-attempt',
    reason?: string
  ) {
    if (!wake) return;
    wake.since.socket += 1;
    if (event === 'connect') wake.connects += 1;
    else if (event === 'reconnect-attempt') wake.reconnectAttempts += 1;
    else {
      wake.disconnects += 1;
      if (reason && wake.disconnectReasons.length < MAX_SOCKET_REASONS) {
        wake.disconnectReasons.push(reason.slice(0, 40));
      }
    }
  }

  function noteWork(name: string) {
    if (!wake || !name) return;
    wake.work[name] = (wake.work[name] || 0) + 1;
  }

  function noteStall(ms: number) {
    if (!wake || !Number.isFinite(ms)) return;
    wake.stalls += 1;
    wake.stallMs += ms;
  }

  function stop(reason: string) {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    if (timer !== null) clearTimer(timer);
    timer = null;
    stopImageListener?.();
    stopImageListener = null;
    const done = wake;
    wake = null;
    if (!done || !isActive()) return;
    const endedAt = now();
    const requests = [...done.requests.entries()].sort((a, b) => b[1] - a[1]);
    let total = 0;
    for (const [, n] of requests) total += n;
    let images = 0;
    try {
      images = countImages(done.startedAt, endedAt);
    } catch {
      images = 0;
    }
    record({
      schema: 1,
      kind: done.start.kind,
      ...(done.start.navType ? { navType: done.start.navType } : {}),
      ...(done.start.awayMs !== undefined
        ? { awayMs: Math.round(done.start.awayMs) }
        : {}),
      end: reason,
      windowMs: Math.round(endedAt - done.startedAt),
      frames: done.frames,
      over50: done.over50,
      over100: done.over100,
      maxFrameMs: Math.round(done.maxFrame),
      jankMs: Math.round(done.jankMs),
      stalls: done.stalls,
      stallMs: Math.round(done.stallMs),
      requests: total,
      // the exact same request sent again in this window
      repeats: done.sameRequests,
      top: requests
        .slice(0, MAX_TOP_REQUESTS)
        .map(([key, n]) => (n > 1 ? `${key} x${n}` : key)),
      ...(requests.length > MAX_TOP_REQUESTS
        ? { topCut: requests.length - MAX_TOP_REQUESTS }
        : {}),
      images,
      socket: {
        atStart:
          done.start.socketConnected === undefined
            ? null
            : done.start.socketConnected,
        connects: done.connects,
        disconnects: done.disconnects,
        attempts: done.reconnectAttempts,
        ...(done.disconnectReasons.length
          ? { reasons: done.disconnectReasons }
          : {})
      },
      work: done.work,
      ...(done.slowFrames.length
        ? {
            slowFrames: [...done.slowFrames].sort(
              (a, b) => (b.ms as number) - (a.ms as number)
            )
          }
        : {})
    });
  }
}

function defaultListenImageLoads(onLoad: () => void) {
  if (typeof document === 'undefined') return () => {};
  const handler = (event: Event) => {
    if ((event.target as Element | null)?.tagName === 'IMG') onLoad();
  };
  document.addEventListener('load', handler, true);
  return () => document.removeEventListener('load', handler, true);
}

function defaultCountImages(fromMs: number, toMs: number) {
  if (typeof performance === 'undefined') return 0;
  let n = 0;
  for (const entry of performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[]) {
    if (
      entry.initiatorType === 'img' &&
      entry.startTime >= fromMs &&
      entry.startTime <= toMs
    ) {
      n += 1;
    }
  }
  return n;
}

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
  } | null = null;
  let frame: number | null = null;
  let timer: unknown = null;

  return {
    start,
    stop,
    noteRequest,
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
      work: {}
    };
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
    }
    wake.lastFrame = at;
    frame = requestFrame(tick);
  }

  // key: the redacted pattern (what is shown); exact: the full request, only
  // to tell a true repeat (same URL again) from a different item
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
      work: done.work
    });
  }
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

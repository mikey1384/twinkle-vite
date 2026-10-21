// Owner-only slow-frame attribution while a scroll sample is open (see
// ownerTraceScrollPerf.ts). Two sources, both bounded and content-free:
//
// - Long Animation Frames (Chrome/Edge): for frames over 50 ms, the frame's
//   duration, blocking time, style/layout share and its top scripts (source
//   URL without query, function name, invoker). Feature-detected; absent on
//   Safari.
// - Cheap counters (every browser, the only source on Safari/iPhone): which
//   Home feed card types rendered or mounted, and how many images finished
//   loading, between the previous animation frame and a slow one.
//
// Nothing runs unless a sample is open: no observer, listener or counting.

export const SLOW_FRAME_MS = 50;
const MAX_FRAMES_PER_SAMPLE = 3;
const MAX_SCRIPTS_PER_FRAME = 3;
const MAX_TYPES_PER_FRAME = 8;
const MAX_LOAF_ENTRIES = 40;
// The owner-trace server replaces event data over 2000 chars with a
// truncation marker; stay well under it.
export const MAX_FRAME_EVENT_CHARS = 1800;

export interface LongFrameScript {
  duration?: number;
  sourceURL?: string;
  sourceFunctionName?: string;
  sourceCharPosition?: number;
  sourceLine?: number;
  sourceColumn?: number;
  invoker?: string;
  invokerType?: string;
  forcedStyleAndLayoutDuration?: number;
}

export interface LongFrameEntry {
  startTime: number;
  duration: number;
  blockingDuration?: number;
  renderStart?: number;
  styleAndLayoutStart?: number;
  scripts?: LongFrameScript[];
}

export interface LongFrameObserver {
  takeRecords: () => LongFrameEntry[];
  disconnect: () => void;
}

type ObserveLongFrames = (
  onEntries: (entries: LongFrameEntry[]) => void
) => LongFrameObserver | null;
type ListenImageLoads = (onLoad: () => void) => () => void;

interface CounterFrame {
  gapMs: number;
  startMs: number; // performance-clock start of the slow frame interval
  endMs: number;
  renders: Record<string, number>;
  mounts: Record<string, number>;
  imgLoads: number;
  textMeasure: { calls: number; ms: number; maxMs: number };
}

export function defaultObserveLongFrames(
  onEntries: (entries: LongFrameEntry[]) => void
): LongFrameObserver | null {
  try {
    const Observer = (globalThis as any).PerformanceObserver;
    if (
      !Observer ||
      !Array.isArray(Observer.supportedEntryTypes) ||
      !Observer.supportedEntryTypes.includes('long-animation-frame')
    ) {
      return null;
    }
    const observer = new Observer((list: any) =>
      onEntries(list.getEntries() as LongFrameEntry[])
    );
    observer.observe({ type: 'long-animation-frame', buffered: false });
    return {
      takeRecords: () => (observer.takeRecords?.() || []) as LongFrameEntry[],
      disconnect: () => observer.disconnect()
    };
  } catch {
    return null;
  }
}

export function defaultListenImageLoads(onLoad: () => void) {
  if (typeof document === 'undefined') return () => {};
  const handler = (event: Event) => {
    if ((event.target as Element | null)?.tagName === 'IMG') onLoad();
  };
  // load does not bubble; capture sees every image on the page.
  document.addEventListener('load', handler, true);
  return () => document.removeEventListener('load', handler, true);
}

// "https://www.twin-kle.com/assets/index-abc.js?v=1#x" ->
// "/assets/index-abc.js" for this site's own files, "host/path" otherwise.
export function stripScriptUrl(value: unknown, origin = currentOrigin()) {
  const raw = String(value || '');
  if (!raw) return '';
  const bare = raw.split(/[?#]/)[0];
  try {
    const url = new URL(bare);
    const short =
      origin && url.origin === origin ? url.pathname : `${url.host}${url.pathname}`;
    return short.slice(-120);
  } catch {
    return bare.slice(0, 120);
  }
}

// Invokers name an element or callback ("IMG#hero.onload",
// "Window.requestAnimationFrame", "Response.json.then") or a script URL.
function cleanInvoker(value: unknown, origin: string) {
  const raw = String(value || '');
  if (/^[a-z][\w+.-]*:\/\//i.test(raw)) return stripScriptUrl(raw, origin);
  return raw.replace(/[?#].*$/, '').slice(0, 80);
}

function currentOrigin() {
  try {
    return typeof location === 'undefined' ? '' : location.origin;
  } catch {
    return '';
  }
}

function round(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function topCounts(counts: Map<string, number>) {
  return Object.fromEntries(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TYPES_PER_FRAME)
  );
}

export function summarizeLongFrame(
  entry: LongFrameEntry,
  origin = currentOrigin()
) {
  const duration = Number(entry.duration) || 0;
  const end = entry.startTime + duration;
  const styleStart = Number(entry.styleAndLayoutStart) || 0;
  const renderStart = Number(entry.renderStart) || 0;
  const scripts = [...(entry.scripts || [])]
    .sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0))
    .slice(0, MAX_SCRIPTS_PER_FRAME)
    .map((script) => ({
      ms: round(script.duration),
      src: stripScriptUrl(script.sourceURL, origin),
      fn: String(script.sourceFunctionName || '').slice(0, 60),
      ...scriptPosition(script),
      invoker: cleanInvoker(script.invoker, origin),
      type: String(script.invokerType || '').slice(0, 24),
      ...(Number(script.forcedStyleAndLayoutDuration) > 0
        ? { forcedLayoutMs: round(script.forcedStyleAndLayoutDuration) }
        : {})
    }));
  const share = (start: number) =>
    duration > 0 && start > 0
      ? Math.round((Math.max(0, end - start) / duration) * 100) / 100
      : null;
  return {
    ms: round(duration),
    blockingMs: round(entry.blockingDuration),
    styleLayoutShare: share(styleStart),
    renderShare: share(renderStart),
    scriptCount: (entry.scripts || []).length,
    scripts
  };
}

function scriptPosition(script: LongFrameScript) {
  const position: Record<string, number> = {};
  for (const [key, value] of [
    ['char', script.sourceCharPosition],
    ['line', script.sourceLine],
    ['column', script.sourceColumn]
  ] as const) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
      position[key] = value;
    }
  }
  return position;
}

// Keeps one event's data under the server's limit by dropping the smallest
// scripts, then the counters, never the frame timing.
export function boundFrameEvent(data: Record<string, any>) {
  const fits = () => JSON.stringify(data).length <= MAX_FRAME_EVENT_CHARS;
  while (!fits() && data.loaf?.scripts?.length) data.loaf.scripts.pop();
  if (!fits()) {
    delete data.renders;
    delete data.mounts;
  }
  return data;
}

export function createFrameAttribution({
  observeLongFrames = defaultObserveLongFrames,
  listenImageLoads = defaultListenImageLoads,
  getOrigin = currentOrigin
}: {
  observeLongFrames?: ObserveLongFrames;
  listenImageLoads?: ListenImageLoads;
  getOrigin?: () => string;
} = {}) {
  let active = false;
  let observer: LongFrameObserver | null = null;
  let loafSupported = false;
  let stopImages: (() => void) | null = null;
  let loafEntries: LongFrameEntry[] = [];
  let renders = new Map<string, number>();
  let mounts = new Map<string, number>();
  let imgLoads = 0;
  let textMeasure = { calls: 0, ms: 0, maxMs: 0 };
  let slowFrames: CounterFrame[] = [];
  let totals = { renders: 0, mounts: 0, imgLoads: 0 };

  return { begin, frame, end, noteRender, noteMount, noteTextMeasure, isActive: () => active };

  function noteTextMeasure(ms: number) {
    if (!active || !Number.isFinite(ms) || ms < 0) return;
    textMeasure.calls++;
    textMeasure.ms += ms;
    textMeasure.maxMs = Math.max(textMeasure.maxMs, ms);
  }

  function begin() {
    if (active) return;
    active = true;
    loafEntries = [];
    slowFrames = [];
    totals = { renders: 0, mounts: 0, imgLoads: 0 };
    resetCounters();
    observer = null;
    try {
      observer = observeLongFrames(keepEntries);
    } catch {
      observer = null;
    }
    loafSupported = Boolean(observer);
    try {
      stopImages = listenImageLoads(() => {
        if (active) imgLoads += 1;
      });
    } catch {
      stopImages = null;
    }
  }

  function keepEntries(entries: LongFrameEntry[]) {
    if (!active) return;
    for (const entry of entries || []) {
      if (!(Number(entry?.duration) > SLOW_FRAME_MS)) continue;
      loafEntries.push(entry);
    }
    if (loafEntries.length > MAX_LOAF_ENTRIES) {
      loafEntries.sort((a, b) => b.duration - a.duration);
      loafEntries.length = MAX_LOAF_ENTRIES;
    }
  }

  function noteRender(type: string) {
    if (!active) return;
    const key = String(type || 'unknown').slice(0, 24);
    renders.set(key, (renders.get(key) || 0) + 1);
  }

  function noteMount(type: string) {
    if (!active) return;
    const key = String(type || 'unknown').slice(0, 24);
    mounts.set(key, (mounts.get(key) || 0) + 1);
  }

  // Called once per measured animation frame with the time since the
  // previous one; the counters since that frame belong to this interval.
  function frame(gapMs: number, at: number) {
    if (!active) return;
    totals.renders += sum(renders);
    totals.mounts += sum(mounts);
    totals.imgLoads += imgLoads;
    if (gapMs > SLOW_FRAME_MS) {
      slowFrames.push({
        gapMs,
        startMs: at - gapMs,
        endMs: at,
        renders: topCounts(renders),
        mounts: topCounts(mounts),
        imgLoads,
        textMeasure: { calls: textMeasure.calls, ms: Math.round(textMeasure.ms), maxMs: Math.round(textMeasure.maxMs) }
      });
      if (slowFrames.length > MAX_FRAMES_PER_SAMPLE * 4) {
        slowFrames.sort((a, b) => b.gapMs - a.gapMs);
        slowFrames.length = MAX_FRAMES_PER_SAMPLE;
      }
    }
    resetCounters();
  }

  // Closes the sample: up to three frame events, worst first, plus a small
  // summary for the scroll-perf event itself.
  function end(sampleStart: number) {
    if (!active) return null;
    try {
      keepEntries(observer?.takeRecords() || []);
    } catch {
      // keep what the observer already delivered
    }
    try {
      observer?.disconnect();
    } catch {
      // nothing to release
    }
    try {
      stopImages?.();
    } catch {
      // nothing to release
    }
    observer = null;
    stopImages = null;
    active = false;
    const origin = getOrigin();
    const counterFrames = [...slowFrames].sort((a, b) => b.gapMs - a.gapMs);
    const frames: Record<string, any>[] = [];
    if (loafSupported) {
      const worst = [...loafEntries]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, MAX_FRAMES_PER_SAMPLE);
      for (const entry of worst) {
        const entryEnd = entry.startTime + entry.duration;
        const overlap = counterFrames.find(
          (item) => item.startMs < entryEnd && item.endMs > entry.startTime
        );
        frames.push(
          boundFrameEvent({
            schema: 1,
            source: 'loaf',
            offsetMs: round(entry.startTime - sampleStart),
            ...(overlap
              ? {
                  gapMs: round(overlap.gapMs),
                  renders: overlap.renders,
                  mounts: overlap.mounts,
                  imgLoads: overlap.imgLoads,
                  textMeasure: overlap.textMeasure
                }
              : {}),
            loaf: summarizeLongFrame(entry, origin)
          })
        );
      }
    } else {
      for (const item of counterFrames.slice(0, MAX_FRAMES_PER_SAMPLE)) {
        frames.push(
          boundFrameEvent({
            schema: 1,
            source: 'raf',
            offsetMs: round(item.startMs - sampleStart),
            gapMs: round(item.gapMs),
            renders: item.renders,
            mounts: item.mounts,
            imgLoads: item.imgLoads,
            textMeasure: item.textMeasure
          })
        );
      }
    }
    return {
      summary: {
        source: loafSupported ? 'loaf' : 'raf',
        loafFrames: loafSupported ? loafEntries.length : null,
        cardRenders: totals.renders,
        cardMounts: totals.mounts,
        imgLoads: totals.imgLoads
      },
      frames
    };
  }

  function resetCounters() {
    renders = new Map();
    mounts = new Map();
    imgLoads = 0;
    textMeasure = { calls: 0, ms: 0, maxMs: 0 };
  }
}

function sum(counts: Map<string, number>) {
  let total = 0;
  for (const value of counts.values()) total += value;
  return total;
}

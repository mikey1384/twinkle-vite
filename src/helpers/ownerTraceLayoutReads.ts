// Temporary owner-scroll instrumentation. No DOM values, nodes, arguments or
// raw stacks leave the browser. This measures synchronous read elapsed time;
// only a matching browser LoAF can corroborate forced style/layout work.
const MIN_READ_MS = 4;
const MAX_TIMED_READS = 2000;
const MAX_STACKS = 8;
const MAX_CALLERS = 4;
const MAX_DIAGNOSTIC_MS = 8;

// Stable indices in layoutReads v1. Keep the offline decoder in step.
export const LAYOUT_READ_APIS = [
  'Element.getBoundingClientRect', 'Element.getClientRects',
  'Range.getBoundingClientRect', 'Range.getClientRects',
  'HTMLElement.offsetWidth', 'HTMLElement.offsetHeight',
  'HTMLElement.offsetTop', 'HTMLElement.offsetLeft',
  'Element.clientWidth', 'Element.clientHeight',
  'Element.clientTop', 'Element.clientLeft',
  'Element.scrollWidth', 'Element.scrollHeight', 'Window.getComputedStyle'
] as const;

interface CallSite { src: string; line: number; column: number }
interface SlowRead {
  api: number;
  start: number;
  end: number;
  stack: CallSite[];
}
type StopReason = 'sample-end' | 'inactive' | 'read-limit' | 'stack-limit' |
  'cost-limit' | 'unavailable' | 'error';
const tenth = (value: number) => Math.round(value * 10) / 10;

// Keep only locations in this deployment's JS assets. In production the
// immutable asset origin comes from the executing module, not the page URL.
function callSites(stack: string, skipWrapper: boolean): CallSite[] {
  const origin = new URL(import.meta.url).origin;
  const sites: CallSite[] = [];
  for (const line of stack.slice(0, 8192).split('\n').slice(0, 24)) {
    const match = line.match(/(https?:\/\/[^\s()]+):(\d+):(\d+)\)?\s*$/);
    if (!match) continue;
    const url = new URL(match[1]);
    if (url.origin !== origin || !/^\/assets\/[\w.-]+\.js$/.test(url.pathname)) continue;
    if (skipWrapper) { skipWrapper = false; continue; }
    const row = Number(match[2]);
    const column = Number(match[3]);
    if (!Number.isSafeInteger(row) || row < 1 || !Number.isSafeInteger(column) || column < 1) continue;
    const src = `${url.origin}${url.pathname}`;
    if (src.length > 240) continue;
    sites.push({ src, line: row, column });
    if (sites.length === MAX_CALLERS) break;
  }
  return sites;
}

export function startOwnerLayoutReadCapture(canMeasure: () => boolean) {
  if (typeof window === 'undefined' || !canMeasure()) return null;
  const began = performance.now();
  let stoppedAt: number | null = null;
  let stopReason: StopReason = 'sample-end';
  let busy = false;
  let suppressed = false;
  let apiMask = 0;
  let measured = 0;
  let slow = 0;
  let diagnosticMs = 0;
  let restoreFailures = 0;
  const reads: SlowRead[] = [];
  const restore: (() => void)[] = [];

  function stop(reason: StopReason = 'sample-end') {
    if (stoppedAt !== null) return;
    stoppedAt = performance.now();
    stopReason = reason;
    for (const undo of restore.reverse()) {
      try { undo(); } catch { restoreFailures++; }
    }
    restore.length = 0;
    diagnosticMs += performance.now() - stoppedAt;
  }

  function hook(target: object, property: string, api: number, getter: boolean) {
    const original = Object.getOwnPropertyDescriptor(target, property);
    const native = getter ? original?.get : original?.value;
    if (!original?.configurable || typeof native !== 'function') return;
    const wrapped = function (this: unknown, ...args: unknown[]) {
      if (busy || suppressed || stoppedAt !== null) return Reflect.apply(native, this, args);
      let diagnosticStart: number;
      let start: number | null = null;
      try {
        diagnosticStart = performance.now();
        if (!canMeasure()) {
          stop('inactive');
        } else {
          start = performance.now();
        }
      } catch {
        // Diagnostic setup must not change a native read's return/throw.
        return Reflect.apply(native, this, args);
      }
      if (start === null) return Reflect.apply(native, this, args);
      busy = true;
      try {
        return Reflect.apply(native, this, args);
      } finally {
        try {
          const end = performance.now();
          measured++;
          if (end - start >= MIN_READ_MS) {
            slow++;
            const error = new Error();
            const capture = (Error as ErrorConstructor & {
              captureStackTrace?: (error: Error, boundary: Function) => void;
            }).captureStackTrace;
            // V8 removes this wrapper. Safari's stack starts in the wrapper,
            // so remove that one location ourselves; retain its actual caller.
            if (capture) capture(error, wrapped);
            reads.push({ api, start, end, stack: callSites(error.stack || '', !capture) });
          }
          diagnosticMs += start - diagnosticStart + performance.now() - end;
          if (diagnosticMs >= MAX_DIAGNOSTIC_MS) stop('cost-limit');
          else if (reads.length >= MAX_STACKS) stop('stack-limit');
          else if (measured >= MAX_TIMED_READS) stop('read-limit');
        } catch {
          // Best effort only, including engines with custom stack handling.
          try { stop('error'); } catch { /* native behavior wins */ }
        } finally {
          busy = false;
        }
      }
    };
    const installed = { ...original, ...(getter ? { get: wrapped } : { value: wrapped }) };
    Object.defineProperty(target, property, installed);
    restore.push(() => {
      const current = Object.getOwnPropertyDescriptor(target, property);
      // Never overwrite another library's later replacement or setter.
      if (current && current.configurable === installed.configurable &&
        current.enumerable === installed.enumerable &&
        (getter ? current.get === wrapped && current.set === original.set :
          current.value === wrapped && current.writable === original.writable)) {
        Object.defineProperty(target, property, original);
      }
    });
    apiMask |= 1 << api;
  }

  for (let api = 0; api < LAYOUT_READ_APIS.length; api++) {
    const [kind, property] = LAYOUT_READ_APIS[api].split('.');
    const target = kind === 'Window' ? window :
      kind === 'Element' ? Element.prototype :
        kind === 'HTMLElement' ? HTMLElement.prototype :
          typeof Range === 'undefined' ? null : Range.prototype;
    if (!target) continue;
    try { hook(target, property, api, api >= 4 && api < 14); } catch { /* unsupported descriptor */ }
  }
  diagnosticMs += performance.now() - began;
  if (!apiMask) stop('unavailable');
  else if (diagnosticMs >= MAX_DIAGNOSTIC_MS) stop('cost-limit');

  function coverage(sampleStart: number) {
    return {
      v: 1, apiMask, minMs: MIN_READ_MS,
      rangeMs: [tenth(began - sampleStart), tenth((stoppedAt ?? performance.now()) - sampleStart)],
      stop: stopReason, measured, slow, diagnosticMs: tenth(diagnosticMs),
      ...(restoreFailures ? { restoreFailures } : {})
    };
  }

  return {
    stop,
    coverage,
    withoutRecording<T>(run: () => T): T {
      const previous = suppressed;
      suppressed = true;
      try { return run(); } finally { suppressed = previous; }
    },
    forFrame(start: number, end: number, sampleStart: number) {
      const sources: string[] = [];
      const overlapping = reads.filter(read => read.start < end && read.end > start)
        .sort((a, b) => (b.end - b.start) - (a.end - a.start));
      return {
        ...coverage(sampleStart),
        sources,
        omitted: Math.max(0, overlapping.length - 3),
        reads: overlapping.slice(0, 3).map(read => ({
          api: read.api, ms: tenth(read.end - read.start),
          offsetMs: tenth(read.start - sampleStart),
          stack: read.stack.map(site => {
            let source = sources.indexOf(site.src);
            if (source < 0) { source = sources.length; sources.push(site.src); }
            return [source, site.line, site.column];
          })
        }))
      };
    }
  };
}

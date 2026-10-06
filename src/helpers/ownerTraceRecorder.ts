// The owner's client trace recorder, kept free of app imports so it can be
// tested in node. ownerTrace.ts wires it to the signed-in user, the API and the
// window. Every call is a cheap no-op unless isOwner() says the signed-in user
// is the site owner; nothing is buffered, timed or sent for anyone else.

export interface OwnerTraceEvent {
  seq: number;
  t: number;
  type: string;
  path: string;
  data?: Record<string, unknown>;
}

export interface OwnerTraceSendOptions {
  // The page is going away: the request must outlive it (keepalive).
  unloading: boolean;
}

export interface OwnerTraceRecorderOptions {
  isOwner: () => boolean;
  send: (body: string, options: OwnerTraceSendOptions) => void;
  getPath: () => string;
  getSessionHeader: () => Record<string, unknown>;
  onFirstActivation?: () => void;
  now?: () => number;
  makeSessionId?: () => string;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  flushDelayMs?: number;
  maxEventsPerBatch?: number;
  maxBatchBytes?: number;
  maxBufferedEvents?: number;
}

export const OWNER_TRACE_FLUSH_DELAY_MS = 25_000;
export const OWNER_TRACE_MAX_EVENTS_PER_BATCH = 150;
// Below the 64KB keepalive budget a browser gives an unloading page.
export const OWNER_TRACE_MAX_BATCH_BYTES = 48_000;
export const OWNER_TRACE_MAX_BUFFERED_EVENTS = 600;

export function createOwnerTraceRecorder({
  isOwner,
  send,
  getPath,
  getSessionHeader,
  onFirstActivation,
  now = () => Date.now(),
  makeSessionId = defaultSessionId,
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as any),
  flushDelayMs = OWNER_TRACE_FLUSH_DELAY_MS,
  maxEventsPerBatch = OWNER_TRACE_MAX_EVENTS_PER_BATCH,
  maxBatchBytes = OWNER_TRACE_MAX_BATCH_BYTES,
  maxBufferedEvents = OWNER_TRACE_MAX_BUFFERED_EVENTS
}: OwnerTraceRecorderOptions) {
  let sessionId = '';
  let seq = 0;
  let buffer: OwnerTraceEvent[] = [];
  let dropped = 0;
  let timer: unknown = null;

  return { record, flush, isActive, getBufferedCount };

  function isActive() {
    return isOwner();
  }

  function getBufferedCount() {
    return buffer.length;
  }

  // Never throws into the caller: an event that cannot be built or
  // serialized is dropped.
  function record(
    type: string,
    data?: Record<string, unknown>,
    path?: string
  ) {
    try {
      if (!isOwner()) return;
      if (!sessionId) {
        sessionId = makeSessionId();
        onFirstActivation?.();
        push('session', getSessionHeader(), getPath());
      }
      push(type, data, path ?? getPath());
      if (buffer.length >= maxEventsPerBatch) {
        flush();
      } else {
        scheduleFlush();
      }
    } catch {
      // Tracing must never affect the page.
    }
  }

  function push(
    type: string,
    data: Record<string, unknown> | undefined,
    path: string
  ) {
    let event: OwnerTraceEvent;
    try {
      event = {
        seq: seq + 1,
        t: now(),
        type,
        path: redactTracePath(path),
        ...(data ? { data: redactTraceData(data) } : {})
      };
      // Proves it serializes (circular or BigInt payloads are dropped here,
      // not when the whole batch is sent).
      JSON.stringify(event);
    } catch {
      dropped += 1;
      return;
    }
    seq = event.seq;
    buffer.push(event);
    if (buffer.length > maxBufferedEvents) {
      const overflow = buffer.length - maxBufferedEvents;
      buffer.splice(0, overflow);
      dropped += overflow;
    }
  }

  function scheduleFlush() {
    if (timer !== null) return;
    timer = setTimer(() => {
      timer = null;
      flush();
    }, flushDelayMs);
  }

  // Sends one batch (at most maxEventsPerBatch events and maxBatchBytes).
  // Anything left over is sent by the next timer, if the page lives on (an
  // unloading page gets one batch).
  function flush(options: { unloading?: boolean } = {}) {
    try {
      flushBatch(options);
    } catch {
      // Tracing must never affect the page.
    }
  }

  function flushBatch({ unloading = false }: { unloading?: boolean }) {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
    if (!isOwner()) {
      // The owner signed out (or switched accounts): drop, never upload as
      // someone else.
      buffer = [];
      dropped = 0;
      return;
    }
    if (!buffer.length) return;
    if (dropped > 0) {
      buffer.unshift({
        seq: ++seq,
        t: now(),
        type: 'trace-dropped',
        path: '',
        data: { count: dropped }
      });
      dropped = 0;
    }
    const events: OwnerTraceEvent[] = [];
    let bytes = 64;
    for (const event of buffer) {
      if (events.length >= maxEventsPerBatch) break;
      const size = JSON.stringify(event).length + 1;
      if (events.length > 0 && bytes + size > maxBatchBytes) break;
      events.push(event);
      bytes += size;
    }
    buffer = buffer.slice(events.length);
    if (buffer.length) scheduleFlush();
    send(JSON.stringify({ sessionId, events }), { unloading });
  }
}

// Query values that can be credentials (guardian/parent consent tokens, CLI
// device codes, ...) never reach the trace: their keys stay, values become ***.
// A hash is kept only when it is a plain anchor (no '=').
const SENSITIVE_QUERY_KEY = /token|code|key|secret|sig|auth|pass|session/i;

// Routes whose path segment is a credential: /reset/password/:token
// (ResetPassword) and /verify/email/:token (Verify), the only token-like route
// params in the app.
const TOKEN_PATH_SEGMENTS = /^(\/(?:reset\/password|verify\/email)\/)[^/]+/i;

function redactTokenSegments(pathname: string) {
  return pathname.replace(TOKEN_PATH_SEGMENTS, '$1***');
}

export function redactTracePath(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const hashIndex = value.indexOf('#');
  const beforeHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : '';
  const queryIndex = beforeHash.indexOf('?');
  let result = redactTokenSegments(
    queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash
  );
  if (queryIndex >= 0) {
    const query = beforeHash
      .slice(queryIndex + 1)
      .split('&')
      .map((part) => {
        const equals = part.indexOf('=');
        if (equals < 0) return part;
        const key = part.slice(0, equals);
        let decodedKey = key;
        try {
          decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
        } catch {
          // keep the raw key for matching
        }
        return SENSITIVE_QUERY_KEY.test(decodedKey) ? `${key}=***` : part;
      })
      .join('&');
    result = `${result}?${query}`;
  }
  if (hash && !hash.includes('=')) result += hash;
  return result.slice(0, 255);
}

// Data fields that hold a path or hash, plus a Header nav note "link:<href>".
function redactTraceData(data: Record<string, unknown>) {
  const result = { ...data };
  for (const key of ['from', 'to', 'hash']) {
    if (typeof result[key] === 'string') {
      result[key] = redactTracePath(result[key]);
    }
  }
  if (typeof result.note === 'string' && result.note.startsWith('link:')) {
    result.note = `link:${redactTracePath(result.note.slice(5))}`;
  }
  return result;
}

function defaultSessionId() {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return random.slice(0, 40);
}

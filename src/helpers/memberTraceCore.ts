// The member client trace, kept free of app imports so it can be tested in
// node; memberTrace.ts wires it to the signed-in user, the API and the window.
//
// It is the owner trace's recorder (ownerTraceRecorder.ts: same events, same
// path redaction, same batching) switched on for one member account that an
// admin put on the server's list (`lumine admin member-trace on <username>`).
// The API says so in the session response (`clientTrace`), and the website
// remembers it on the device so the next page load traces from its first
// moment, before the session answer arrives.
//
// What it adds for a reload loop: every batch is written to the device's
// storage (the outbox) BEFORE it is sent, and only removed when the API
// accepted it. A page that reloads itself records the reason and flushes into
// the outbox synchronously, so whatever the network does while the page goes,
// the next load sends it. A batch can then arrive twice (the first upload
// landed but the page was gone before its answer); the API read keeps the
// first copy of each (session, seq).
//
// A no-op for everyone else: nothing is buffered, stored or sent unless the
// signed-in user is the account the flag names (and not the owner, who has the
// owner trace).
import { createOwnerTraceRecorder } from './ownerTraceRecorder';

export const MEMBER_TRACE_FLAG_KEY = 'twinkleMemberTrace';
export const MEMBER_TRACE_OUTBOX_KEY = 'twinkleMemberTraceOutbox';
export const MEMBER_TRACE_RELOAD_NOTE_KEY = 'twinkleMemberTraceReload';
// A note older than this is not about the load that reads it.
export const MEMBER_TRACE_RELOAD_NOTE_MAX_AGE_MS = 60_000;
export const MEMBER_TRACE_FLUSH_DELAY_MS = 10_000;
export const MEMBER_TRACE_OUTBOX_MAX_BATCHES = 20;
// localStorage holds ~5MB per origin; the outbox stays far below that.
export const MEMBER_TRACE_OUTBOX_MAX_CHARS = 200_000;

export interface MemberTraceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface OutboxBatch {
  id: string;
  body: string;
}

interface Outbox {
  userId: number;
  batches: OutboxBatch[];
}

export interface MemberTraceOptions {
  storage: () => MemberTraceStorage | null;
  // This tab's storage (sessionStorage) for the reload note: the next load in
  // the same tab reads which code path reloaded it. Defaults to storage.
  tabStorage?: () => MemberTraceStorage | null;
  // the signed-in user (0 when signed out or not known yet)
  getUserId: () => number;
  isOwner: () => boolean;
  // POST /user/owner-trace; resolves to the HTTP status (0: no answer)
  post: (body: string, options: { unloading: boolean }) => Promise<number>;
  getPath: () => string;
  getSessionHeader: () => Record<string, unknown>;
  // the website build, put on every event
  version: string;
  onFirstActivation?: () => void;
  now?: () => number;
  makeSessionId?: () => string;
  makeBatchId?: () => string;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  flushDelayMs?: number;
  maxOutboxBatches?: number;
  maxOutboxChars?: number;
}

export function createMemberTrace({
  storage,
  tabStorage = storage,
  getUserId,
  isOwner,
  post,
  getPath,
  getSessionHeader,
  version,
  onFirstActivation,
  now = () => Date.now(),
  makeSessionId,
  makeBatchId = defaultBatchId,
  setTimer,
  clearTimer,
  flushDelayMs = MEMBER_TRACE_FLUSH_DELAY_MS,
  maxOutboxBatches = MEMBER_TRACE_OUTBOX_MAX_BATCHES,
  maxOutboxChars = MEMBER_TRACE_OUTBOX_MAX_CHARS
}: MemberTraceOptions) {
  let enabledUserId = readFlag();
  // batches this page is sending itself (never replayed by this page)
  const inFlight = new Set<string>();
  let replayStarted = false;

  const recorder = createOwnerTraceRecorder({
    isOwner: isActive,
    send: sendBatch,
    getPath,
    getSessionHeader: () => ({ ...getSessionHeader(), member: 1 }),
    onFirstActivation,
    now,
    ...(makeSessionId ? { makeSessionId } : {}),
    ...(setTimer ? { setTimer } : {}),
    ...(clearTimer ? { clearTimer } : {}),
    flushDelayMs
  });

  return {
    isActive,
    record,
    recordReload,
    flush: (options: { unloading?: boolean } = {}) => recorder.flush(options),
    noteSession,
    start,
    getEnabledUserId: () => enabledUserId,
    readOutbox
  };

  function isActive() {
    try {
      if (!enabledUserId || isOwner()) return false;
      return getUserId() === enabledUserId;
    } catch {
      return false;
    }
  }

  function record(
    type: string,
    data?: Record<string, unknown>,
    path?: string
  ) {
    if (!isActive()) return;
    recorder.record(type, { ...(data || {}), v: version }, path);
  }

  // A self-reload is about to happen: the reason goes into the outbox now,
  // with everything recorded before it.
  function recordReload(reason: string, data?: Record<string, unknown>) {
    if (!isActive()) return;
    const why = String(reason).slice(0, 60);
    record('reload', { reason: why, ...(data || {}) });
    // for the next load: "code reloaded me (why)", as opposed to a reload by
    // hand, which leaves no note
    try {
      tabStorage()?.setItem(
        MEMBER_TRACE_RELOAD_NOTE_KEY,
        JSON.stringify({ reason: why, at: now(), path: getPath() })
      );
    } catch {
      // the outbox still has the reload event
    }
    recorder.flush({ unloading: true });
  }

  function takeReloadNote() {
    try {
      const store = tabStorage();
      const raw = store?.getItem(MEMBER_TRACE_RELOAD_NOTE_KEY);
      if (!raw) return null;
      store?.removeItem(MEMBER_TRACE_RELOAD_NOTE_KEY);
      const note = JSON.parse(raw);
      const agoMs = now() - Number(note?.at || 0);
      if (!(agoMs >= 0 && agoMs <= MEMBER_TRACE_RELOAD_NOTE_MAX_AGE_MS)) {
        return null;
      }
      return {
        byCode: String(note.reason || '?').slice(0, 60),
        byCodeAgoMs: Math.round(agoMs),
        ...(note.path ? { byCodeAt: String(note.path).slice(0, 120) } : {})
      };
    } catch {
      return null;
    }
  }

  // Page load: say so (each load is a row, so a loop shows as many), then
  // send what an earlier page kept.
  function start(data?: Record<string, unknown>) {
    if (!isActive()) return;
    const pending = readOutbox()?.batches.length || 0;
    // why this page loaded: navType (reload/navigate/back_forward) from the
    // caller, plus the previous page's note when code reloaded it
    record('boot', {
      ...(data || {}),
      ...(takeReloadNote() || {}),
      ...(pending ? { kept: pending } : {})
    });
    void replay();
  }

  // The session answer: clientTrace true/false for this user, or undefined
  // when the server did not say (keep what we knew).
  function noteSession(userId: number, enabled: boolean | undefined) {
    if (!userId || typeof enabled !== 'boolean') return;
    if (enabled) {
      if (enabledUserId === userId) return;
      enabledUserId = userId;
      writeFlag(userId);
      start({ on: 'session' });
      return;
    }
    // Switched off, or a different account signed in on this device: stop
    // and drop what was kept (never upload it as someone else).
    if (!enabledUserId && !readOutbox()) return;
    enabledUserId = 0;
    clearAll();
  }

  function sendBatch(body: string, { unloading }: { unloading: boolean }) {
    const userId = enabledUserId;
    if (!userId) return;
    const id = makeBatchId();
    // Synchronous, before the network: this is what survives the reload.
    addToOutbox(userId, { id, body });
    inFlight.add(id);
    void deliver(id, body, unloading).finally(() => inFlight.delete(id));
  }

  async function deliver(id: string, body: string, unloading: boolean) {
    let status = 0;
    try {
      status = await post(body, { unloading });
    } catch {
      status = 0;
    }
    return settle(id, status);
  }

  // true when the batch is done with (sent or never sendable)
  function settle(id: string, status: number) {
    if (status >= 200 && status < 300) {
      removeFromOutbox(id);
      return true;
    }
    if (status === 403) {
      // tracing was switched off for this account
      enabledUserId = 0;
      clearAll();
      return true;
    }
    if (status === 400 || status === 401 || status === 413) {
      // malformed, too big or signed out: it will never be accepted
      removeFromOutbox(id);
      return true;
    }
    // no answer, 429 or 5xx: kept for a later page
    return false;
  }

  // One at a time, oldest first; stops at the first batch the API did not
  // take (the rest wait for the next load).
  async function replay() {
    if (replayStarted) return;
    replayStarted = true;
    const outbox = readOutbox();
    if (!outbox) return;
    if (outbox.userId !== enabledUserId) {
      clearOutbox();
      return;
    }
    for (const batch of outbox.batches) {
      if (inFlight.has(batch.id)) continue;
      if (!isActive()) return;
      const done = await deliver(batch.id, batch.body, false);
      if (!done) return;
    }
  }

  // ---------------------------------------------------------- storage

  function readFlag() {
    try {
      const value = Number(storage()?.getItem(MEMBER_TRACE_FLAG_KEY) || 0);
      return Number.isSafeInteger(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function writeFlag(userId: number) {
    try {
      storage()?.setItem(MEMBER_TRACE_FLAG_KEY, String(userId));
    } catch {
      // tracing still runs for this page
    }
  }

  function clearAll() {
    try {
      storage()?.removeItem(MEMBER_TRACE_FLAG_KEY);
      tabStorage()?.removeItem(MEMBER_TRACE_RELOAD_NOTE_KEY);
    } catch {
      // nothing to clear
    }
    clearOutbox();
  }

  function readOutbox(): Outbox | null {
    try {
      const raw = storage()?.getItem(MEMBER_TRACE_OUTBOX_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const userId = Number(parsed?.userId);
      if (!Number.isSafeInteger(userId) || userId <= 0) return null;
      const batches = Array.isArray(parsed?.batches)
        ? parsed.batches.filter(
            (batch: any) =>
              batch &&
              typeof batch.id === 'string' &&
              typeof batch.body === 'string'
          )
        : [];
      return batches.length ? { userId, batches } : null;
    } catch {
      return null;
    }
  }

  function writeOutbox(outbox: Outbox) {
    const store = storage();
    if (!store) return;
    try {
      if (!outbox.batches.length) {
        store.removeItem(MEMBER_TRACE_OUTBOX_KEY);
        return;
      }
      store.setItem(MEMBER_TRACE_OUTBOX_KEY, JSON.stringify(outbox));
    } catch {
      // Quota: keep the newest half and try once more.
      try {
        store.setItem(
          MEMBER_TRACE_OUTBOX_KEY,
          JSON.stringify({
            userId: outbox.userId,
            batches: outbox.batches.slice(Math.ceil(outbox.batches.length / 2))
          })
        );
      } catch {
        // storage is unusable; the network send still runs
      }
    }
  }

  function addToOutbox(userId: number, batch: OutboxBatch) {
    const current = readOutbox();
    const batches =
      current && current.userId === userId ? [...current.batches] : [];
    batches.push(batch);
    // oldest out first, by count and by size (a whole batch at a time)
    let chars = batches.reduce((sum, entry) => sum + entry.body.length, 0);
    while (
      batches.length > 1 &&
      (batches.length > maxOutboxBatches || chars > maxOutboxChars)
    ) {
      chars -= batches.shift()!.body.length;
    }
    writeOutbox({ userId, batches });
  }

  function removeFromOutbox(id: string) {
    const current = readOutbox();
    if (!current) return;
    const batches = current.batches.filter((batch) => batch.id !== id);
    if (batches.length === current.batches.length) return;
    writeOutbox({ userId: current.userId, batches });
  }

  function clearOutbox() {
    try {
      storage()?.removeItem(MEMBER_TRACE_OUTBOX_KEY);
    } catch {
      // nothing to clear
    }
  }
}

function defaultBatchId() {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return random.slice(0, 40);
}

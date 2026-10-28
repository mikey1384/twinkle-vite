// A small per-viewer outbox for request metadata only. A reward call, token,
// answer, proof, free-form error or balance is never stored here.
export const REWARD_TRACE_OPERATIONS = new Set([
  'start',
  'progress',
  'claim',
  'receipt',
  'status',
  'interpret-answer',
  'bank-start',
  'bank-claim',
  'bank-progress',
  'bank-status',
  'bank-generate',
  'bank-result',
  'rematch-claim'
]);
export interface RewardClientDiagnostic {
  requestId: string;
  operation: string;
  outcome: 'response' | 'http_error' | 'transport_error' | 'lifecycle';
  durationMs: number;
  httpStatus: number | null;
  errorCode: string | null;
  transport: 'network' | 'timeout' | 'cancelled' | 'unknown' | null;
  challengeId: string | null;
  at: number;
  outboxDropped?: number;
  bankRequestId?: string | null;
  visibility?: string | null;
  online?: boolean | null;
  transportCode?: string | null;
  lifecycle?: 'started' | 'hidden' | 'visible' | 'pagehide' | 'offline' | 'online' | null;
  pagePersisted?: boolean | null;
}
const lifecycleStages = new Set(['started', 'hidden', 'visible', 'pagehide', 'offline', 'online']);
const eventKey = (event: RewardClientDiagnostic) =>
  `${event.requestId}:${event.outcome}:${event.at}:${event.lifecycle || ''}`;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeCode = (value: unknown) =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value)
    ? value
    : null;
const busy = new Set<string>();
export function rewardTraceId() {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : null;
}
export function rewardClientDiagnostic({
  requestId,
  operation,
  payload,
  result,
  error,
  durationMs
}: {
  requestId: string;
  operation: string;
  payload?: any;
  result?: any;
  error?: { response?: { status?: number; data?: { code?: unknown } }; code?: string };
  durationMs: number;
}): RewardClientDiagnostic {
  const id = result?.challengeId || payload?.challengeId;
  const status = error?.response?.status;
  return {
    requestId,
    operation,
    durationMs: Math.max(0, Math.round(durationMs)),
    bankRequestId: typeof payload?.requestId === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(payload.requestId) ? payload.requestId : null,
    visibility: typeof document !== 'undefined' ? document.visibilityState : null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : null,
    transportCode: ['ERR_NETWORK', 'ERR_CANCELED', 'ECONNABORTED', 'ETIMEDOUT'].includes(error?.code || '') ? error!.code! : null,
    outcome: error ? (status ? 'http_error' : 'transport_error') : 'response',
    httpStatus: typeof status === 'number' ? status : error ? null : 200,
    errorCode: safeCode(error?.response?.data?.code),
    transport:
      !error || status
        ? null
        : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'timeout'
          : error.code === 'ERR_CANCELED'
            ? 'cancelled'
            : error.code === 'ERR_NETWORK'
              ? 'network'
              : 'unknown',
    challengeId: typeof id === 'string' && uuid.test(id) ? id : null,
    at: Date.now()
  };
}

// Long generation can outlive a tab. Save bounded state changes while it is
// still in flight, so a later outbox drain can explain a missing terminal reply.
// Browser process termination can still leave no final event.
export function observeRewardBankLifecycle({
  requestId, payload, report, beganAt = Date.now(), now = Date.now,
  documentTarget = typeof document === 'undefined' ? undefined : document,
  windowTarget = typeof window === 'undefined' ? undefined : window,
  online = () => typeof navigator === 'undefined' ? null : navigator.onLine
}: {
  requestId: string;
  payload: unknown;
  report: (event: RewardClientDiagnostic) => void;
  beganAt?: number;
  now?: () => number;
  documentTarget?: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
  windowTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  online?: () => boolean | null;
}) {
  let stopped = false, count = 0;
  const emit = (lifecycle: NonNullable<RewardClientDiagnostic['lifecycle']>, persisted?: boolean) => {
    // Reserve the last event for pagehide, even after frequent tab switches.
    if (stopped || count >= (lifecycle === 'pagehide' ? 8 : 7)) return;
    count++;
    try {
      report({ ...rewardClientDiagnostic({ requestId, operation: 'bank-generate', payload, durationMs: now() - beganAt }),
        outcome: 'lifecycle', httpStatus: null, lifecycle, at: now(),
        visibility: documentTarget?.visibilityState || null, online: online(),
        pagePersisted: lifecycle === 'pagehide' && typeof persisted === 'boolean' ? persisted : null });
    } catch { /* Diagnostics cannot interfere with generation. */ }
  };
  const visibility = () => emit(documentTarget?.visibilityState === 'hidden' ? 'hidden' : 'visible');
  const offline = () => emit('offline');
  const onlineEvent = () => emit('online');
  const pagehide = (event: PageTransitionEvent) => emit('pagehide', event.persisted);
  documentTarget?.addEventListener('visibilitychange', visibility);
  windowTarget?.addEventListener('offline', offline);
  windowTarget?.addEventListener('online', onlineEvent);
  windowTarget?.addEventListener('pagehide', pagehide);
  emit('started');
  return () => {
    stopped = true;
    documentTarget?.removeEventListener('visibilitychange', visibility);
    windowTarget?.removeEventListener('offline', offline);
    windowTarget?.removeEventListener('online', onlineEvent);
    windowTarget?.removeEventListener('pagehide', pagehide);
  };
}

export async function queueRewardDiagnostic({
  userId,
  buildId,
  event,
  send,
  storage
}: {
  userId: number;
  buildId: number;
  event: RewardClientDiagnostic;
  send: (event: RewardClientDiagnostic) => Promise<unknown>;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}) {
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    !Number.isSafeInteger(buildId) ||
    buildId < 1 ||
    !REWARD_TRACE_OPERATIONS.has(event.operation)
  )
    return;
  try {
    storage ||= localStorage;
  } catch {
    try {
      await send(event);
    } catch {}
    return;
  }
  const store = storage;
  const key = `twinkle.rewardDiagnostics.v1.${userId}.${buildId}`;
  const read = (): RewardClientDiagnostic[] => {
    try {
      const value = JSON.parse(store.getItem(key) || '[]');
      if (!Array.isArray(value)) return [];
      return value
        .filter(
          (v) =>
            v &&
            typeof v.requestId === 'string' &&
            uuid.test(v.requestId) &&
            REWARD_TRACE_OPERATIONS.has(v.operation) &&
            typeof v.at === 'number' &&
            (['response', 'http_error', 'transport_error'].includes(v.outcome) ||
              (v.outcome === 'lifecycle' && v.operation === 'bank-generate' && lifecycleStages.has(v.lifecycle)))
        )
        .map((v) => ({
          requestId: v.requestId,
          operation: v.operation,
          outcome: v.outcome,
          lifecycle: v.outcome === 'lifecycle' && lifecycleStages.has(v.lifecycle) ? v.lifecycle : null,
          pagePersisted: v.lifecycle === 'pagehide' && typeof v.pagePersisted === 'boolean' ? v.pagePersisted : null,
          durationMs: Number.isFinite(v.durationMs) ? v.durationMs : 0,
          bankRequestId: typeof v.bankRequestId === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(v.bankRequestId) ? v.bankRequestId : null,
          visibility: ['visible', 'hidden', 'prerender'].includes(v.visibility) ? v.visibility : null,
          online: typeof v.online === 'boolean' ? v.online : null,
          transportCode: ['ERR_NETWORK', 'ERR_CANCELED', 'ECONNABORTED', 'ETIMEDOUT'].includes(v.transportCode) ? v.transportCode : null,
          httpStatus: Number.isInteger(v.httpStatus) ? v.httpStatus : null,
          errorCode: safeCode(v.errorCode),
          transport: ['network', 'timeout', 'cancelled', 'unknown'].includes(
            v.transport
          )
            ? v.transport
            : null,
          challengeId:
            typeof v.challengeId === 'string' && uuid.test(v.challengeId)
              ? v.challengeId
              : null,
          at: v.at,
          outboxDropped:
            Number.isSafeInteger(v.outboxDropped) && v.outboxDropped > 0
              ? v.outboxDropped
              : 0
        }));
    } catch {
      return [];
    }
  };
  try {
    const previous = read();
    const recent = previous
      .filter(
        (v) => Date.now() - v.at < 7 * 86400000 && v.at <= Date.now() + 300000
      )
      .slice(-99);
    const kept = new Set(recent.map(eventKey));
    const lost = previous
      .filter((v) => !kept.has(eventKey(v)))
      .reduce((n, v) => n + 1 + (v.outboxDropped || 0), 0);
    store.setItem(
      key,
      JSON.stringify([
        ...recent,
        { ...event, outboxDropped: Math.min(1000000, lost) }
      ])
    );
  } catch {
    try {
      await send(event);
    } catch {}
    return;
  }
  if (busy.has(key)) return;
  busy.add(key);
  try {
    // No loops on failure. A later reward operation resumes this bounded
    // outbox after a connection returns; server and client records stay distinct.
    for (let n = 0; n < 10; n++) {
      const next = read()[0];
      if (!next) break;
      await send(next);
      store.setItem(
        key,
        JSON.stringify(read().filter((v) => eventKey(v) !== eventKey(next)))
      );
    }
  } catch {
    /* Keep the unsent records. Diagnostics never break play. */
  } finally {
    busy.delete(key);
  }
}

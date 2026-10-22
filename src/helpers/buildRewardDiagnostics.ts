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
  'rematch-claim'
]);
export interface RewardClientDiagnostic {
  requestId: string;
  operation: string;
  outcome: 'response' | 'http_error' | 'transport_error';
  durationMs: number;
  httpStatus: number | null;
  errorCode: string | null;
  transport: 'network' | 'timeout' | 'cancelled' | 'unknown' | null;
  challengeId: string | null;
  at: number;
  outboxDropped?: number;
}
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
            ['response', 'http_error', 'transport_error'].includes(v.outcome)
        )
        .map((v) => ({
          requestId: v.requestId,
          operation: v.operation,
          outcome: v.outcome,
          durationMs: Number.isFinite(v.durationMs) ? v.durationMs : 0,
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
    const kept = new Set(recent.map((v) => v.requestId));
    const lost = previous
      .filter((v) => !kept.has(v.requestId))
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
        JSON.stringify(read().filter((v) => v.requestId !== next.requestId))
      );
    }
  } catch {
    /* Keep the unsent records. Diagnostics never break play. */
  } finally {
    busy.delete(key);
  }
}

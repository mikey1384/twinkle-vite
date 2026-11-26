import type { DomainProgressView } from './model';

// Shared Resend state across all three surfaces (address chip menu, Build
// header notice, and Live order screen), keyed by (userId, buildId, orderId).
// Provides a synchronous in-flight lock, tracks the 15-minute cooldown with
// countdown expiry, and resets cleanly across builds, orders, and accounts.

export const RESEND_COOLDOWN_MS = 15 * 60_000;

export type ResendStatus = 'idle' | 'sending' | 'sent' | 'wait' | 'failed';
export type ResendSender = (input: {
  buildId: number;
  orderId: number;
}) => Promise<{ status?: string; resendEligibleAt?: number } | null | undefined>;

export type PendingVerification = Extract<
  NonNullable<DomainProgressView['verification']>,
  { state: 'pending' }
>;

export interface ResendSnapshot {
  pending: PendingVerification | null;
  status: ResendStatus;
  cooldownUntil: number;
  cooldownRemainingMs: number;
  canResend: boolean;
}

interface ResendRecord {
  key: string;
  status: ResendStatus;
  cooldownUntil: number;
  listeners: Set<() => void>;
}

export function toTimestampMs(value?: number | null): number {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 1e12 ? n * 1000 : n;
}

export function formatResendCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function makeKey(userId: number, buildId: number, orderId: number) {
  return `${userId}:${buildId}:${orderId}`;
}

export function createResendStore(options: { now?: () => number } = {}) {
  const now = options.now || (() => Date.now());
  const records = new Map<string, ResendRecord>();
  let currentUserId: number | null = null;

  function syncUser(userId: number | null | undefined) {
    const nextUser = userId && userId > 0 ? Number(userId) : null;
    if (currentUserId === nextUser) return;
    currentUserId = nextUser;
    records.clear();
  }

  function getOrCreate(key: string): ResendRecord {
    let record = records.get(key);
    if (!record) {
      record = { key, status: 'idle', cooldownUntil: 0, listeners: new Set() };
      records.set(key, record);
    }
    return record;
  }

  function notify(record: ResendRecord) {
    record.listeners.forEach((listener) => listener());
  }

  function getSnapshot(
    userId: number,
    buildId: number,
    progress: DomainProgressView | null
  ): ResendSnapshot {
    const pending =
      progress?.verification?.state === 'pending' ? progress.verification : null;
    if (!pending || !userId || !buildId || !progress?.orderId) {
      return {
        pending,
        status: 'idle',
        cooldownUntil: 0,
        cooldownRemainingMs: 0,
        canResend: false
      };
    }
    const currentNow = now();
    const record =
      currentUserId === userId
        ? records.get(makeKey(userId, buildId, progress.orderId))
        : undefined;
    const rawServerEligibleAt = toTimestampMs(pending.resendEligibleAt);
    const serverCooldownUntil =
      !pending.canResend && rawServerEligibleAt > currentNow ? rawServerEligibleAt : 0;
    const localCooldownUntil =
      record && record.cooldownUntil > currentNow ? record.cooldownUntil : 0;
    const cooldownUntil = Math.max(localCooldownUntil, serverCooldownUntil);
    const cooldownRemainingMs = Math.max(0, cooldownUntil - currentNow);
    const rawStatus = record?.status || 'idle';
    const status: ResendStatus =
      (rawStatus === 'sent' || rawStatus === 'wait') && cooldownRemainingMs === 0
        ? 'idle'
        : rawStatus;
    const serverBlocksWithoutTimestamp = !pending.canResend && rawServerEligibleAt === 0;
    const canResend =
      status !== 'sending' && cooldownRemainingMs === 0 && !serverBlocksWithoutTimestamp;

    return {
      pending,
      status,
      cooldownUntil,
      cooldownRemainingMs,
      canResend
    };
  }

  function subscribe(
    userId: number,
    buildId: number,
    orderId: number,
    listener: () => void
  ) {
    syncUser(userId);
    const key = makeKey(userId, buildId, orderId);
    const record = getOrCreate(key);
    record.listeners.add(listener);
    return () => {
      record.listeners.delete(listener);
      if (
        !record.listeners.size &&
        record.status !== 'sending' &&
        record.cooldownUntil <= now() &&
        records.get(key) === record
      ) {
        records.delete(key);
      }
    };
  }

  function clearExpired(userId: number, buildId: number, orderId: number) {
    if (!userId || !buildId || !orderId || currentUserId !== userId) return;
    const key = makeKey(userId, buildId, orderId);
    const record = records.get(key);
    if (!record) return;
    if ((record.status === 'sent' || record.status === 'wait') && record.cooldownUntil <= now()) {
      record.status = 'idle';
      record.cooldownUntil = 0;
      notify(record);
      if (!record.listeners.size && records.get(key) === record) {
        records.delete(key);
      }
    }
  }

  async function trigger(
    userId: number,
    buildId: number,
    progress: DomainProgressView | null,
    send: ResendSender,
    onRefresh: (buildId: number) => void
  ): Promise<boolean> {
    const pending =
      progress?.verification?.state === 'pending' ? progress.verification : null;
    if (!userId || !buildId || !progress?.orderId || !pending) return false;
    syncUser(userId);
    const snap = getSnapshot(userId, buildId, progress);
    if (!snap.canResend) return false;
    const key = makeKey(userId, buildId, progress.orderId);
    const record = getOrCreate(key);
    if (record.status === 'sending') return false;
    record.status = 'sending';
    notify(record);
    try {
      const result = await send({ buildId, orderId: progress.orderId });
      if (records.get(key) !== record) return false;
      const currentNow = now();
      if (result?.status === 'sent') {
        record.status = 'sent';
        record.cooldownUntil =
          toTimestampMs(result.resendEligibleAt) || currentNow + RESEND_COOLDOWN_MS;
      } else if (result?.status === 'wait') {
        record.status = 'wait';
        record.cooldownUntil =
          toTimestampMs(result.resendEligibleAt) ||
          toTimestampMs(pending.resendEligibleAt) ||
          currentNow + RESEND_COOLDOWN_MS;
      } else if (result?.status === 'verified') {
        record.status = 'idle';
        record.cooldownUntil = 0;
      } else {
        record.status = 'failed';
      }
      notify(record);
      onRefresh(buildId);
      return result?.status === 'sent';
    } catch {
      if (records.get(key) !== record) return false;
      record.status = 'failed';
      notify(record);
      return false;
    }
  }

  return {
    syncUser,
    getSnapshot,
    subscribe,
    clearExpired,
    trigger
  };
}

export const resendStore = createResendStore();

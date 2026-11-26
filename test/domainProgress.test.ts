import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainProgressStore } from '../src/components/Build/AppAddress/domainProgressStore';
import {
  RESEND_COOLDOWN_MS,
  createResendStore,
  formatResendCountdown,
  toTimestampMs
} from '../src/components/Build/AppAddress/checkout/resendStore';
import {
  shouldAutoVerifyCode,
  type DomainProgressView
} from '../src/components/Build/AppAddress/checkout/model';

function makeProgress(overrides: Partial<DomainProgressView> = {}): DomainProgressView {
  return {
    orderId: 101,
    domain: 'example.com',
    stage: 'one_step_left',
    steps: [
      { key: 'paid', state: 'done' },
      { key: 'registered', state: 'done' },
      { key: 'secure', state: 'done' },
      { key: 'live', state: 'done' },
      { key: 'email', state: 'current' }
    ],
    verification: {
      state: 'pending',
      verifyBy: 1_800_000_000,
      daysLeft: 14,
      canResend: true,
      resendEligibleAt: 0
    },
    ...overrides
  };
}

function makeFakeTimers() {
  let nextId = 1;
  const scheduled = new Map<number, { fn: () => void; ms: number }>();
  return {
    scheduled,
    setTimeoutFn(fn: () => void, ms: number) {
      const id = nextId++;
      scheduled.set(id, { fn, ms });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeoutFn(id: ReturnType<typeof setTimeout>) {
      scheduled.delete(id as unknown as number);
    },
    runNext() {
      const first = scheduled.entries().next();
      if (first.done) return false;
      const [id, entry] = first.value;
      scheduled.delete(id);
      entry.fn();
      return true;
    }
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test('domainProgressStore deletes entry on last unsubscribe so SPA revisit re-fetches', async () => {
  const timers = makeFakeTimers();
  let hidden = false;
  let calls = 0;
  const responses: Array<DomainProgressView | null> = [null, makeProgress({ stage: 'one_step_left' })];
  const store = createDomainProgressStore({
    isHidden: () => hidden,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  });
  const loader = async () => ({ progress: responses[calls++] ?? null });

  const unsub1 = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(calls, 1);
  assert.equal(store.getProgress(1, 42), null);

  unsub1();
  assert.equal(store.entryCount(), 0);

  // Revisit in the same SPA session: must fetch again and pick up the new order
  const unsub2 = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(calls, 2);
  assert.equal(store.getProgress(1, 42)?.stage, 'one_step_left');
  unsub2();
  assert.equal(store.entryCount(), 0);
});

test('domainProgressStore queues refreshDomainProgress while a poll is in-flight', async () => {
  const timers = makeFakeTimers();
  let resolveFirst: ((value: { progress: DomainProgressView | null }) => void) | null = null;
  let calls = 0;
  const store = createDomainProgressStore({
    isHidden: () => false,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  });
  const loader = () => {
    calls += 1;
    if (calls === 1) {
      return new Promise<{ progress: DomainProgressView | null }>((resolve) => {
        resolveFirst = resolve;
      });
    }
    return Promise.resolve({ progress: makeProgress({ stage: 'one_step_left' }) });
  };

  const unsub = store.subscribe(1, 42, loader, () => {});
  assert.equal(calls, 1);

  // Refresh arrives while first poll is still in-flight
  store.refresh(42);
  assert.equal(calls, 1);

  // Stale first response resolves with null; queued refresh must immediately follow
  resolveFirst!({ progress: null });
  await flushMicrotasks();
  assert.equal(calls, 2);
  assert.equal(store.getProgress(1, 42)?.stage, 'one_step_left');
  unsub();
});

test('domainProgressStore pauses on hidden tab, resumes on visible, and avoids duplicate retry or backoff skip', async () => {
  const timers = makeFakeTimers();
  let hidden = false;
  let calls = 0;
  let shouldFail = true;
  const store = createDomainProgressStore({
    isHidden: () => hidden,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  });
  const loader = async () => {
    calls += 1;
    if (shouldFail) throw new Error('network');
    return { progress: makeProgress({ stage: 'setting_up' }) };
  };

  const unsub1 = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(calls, 1);
  assert.equal(timers.scheduled.size, 1);
  assert.equal([...timers.scheduled.values()][0].ms, 15_000);

  // Second subscriber mounting during error backoff must NOT fire a duplicate poll
  const unsub2 = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(calls, 1);
  assert.equal(timers.scheduled.size, 1);

  // Backoff retry succeeds with setting_up (10s initial delay)
  shouldFail = false;
  timers.runNext();
  await flushMicrotasks();
  assert.equal(calls, 2);
  assert.equal([...timers.scheduled.values()][0].ms, 10_000);

  // Third subscriber mounting must NOT double-step backoff
  const unsub3 = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(calls, 2);
  assert.equal([...timers.scheduled.values()][0].ms, 10_000);

  // Hiding tab clears pending timer
  hidden = true;
  store.handleVisibilityChange();
  assert.equal(timers.scheduled.size, 0);

  // Returning to visible resumes polling (and uses the 15s next backoff step)
  hidden = false;
  store.handleVisibilityChange();
  await flushMicrotasks();
  assert.equal(calls, 3);
  assert.equal([...timers.scheduled.values()][0].ms, 15_000);

  unsub1();
  unsub2();
  unsub3();
});

test('domainProgressStore clears cache on account switch and ownership change, and shares allowed gate', async () => {
  const timers = makeFakeTimers();
  const store = createDomainProgressStore({
    isHidden: () => false,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  });
  const loader = async () => ({ progress: makeProgress({ stage: 'done' }) });

  const unsubA = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(store.getProgress(1, 42)?.stage, 'done');
  // User 2 must never see User 1's progress even before syncUser runs
  assert.equal(store.getProgress(2, 42), null);

  store.syncUser(2);
  assert.equal(store.entryCount(), 0);
  unsubA();

  const unsubB = store.subscribe(2, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(store.getProgress(2, 42)?.stage, 'done');

  // Ownership transfer clears build entry
  store.clearBuild(42);
  assert.equal(store.getProgress(2, 42), null);
  unsubB();

  // Hosting/domain-sales eligibility gate
  let notified = 0;
  const unsubAllowed = store.subscribeAllowed(42, () => {
    notified += 1;
  });
  assert.equal(store.isAllowed(42), false);
  store.setAllowed(42, true);
  assert.equal(store.isAllowed(42), true);
  assert.equal(notified, 1);
  store.setAllowed(42, false);
  assert.equal(store.isAllowed(42), false);
  assert.equal(notified, 2);
  unsubAllowed();
});

test('resendStore enforces synchronous lock, shares cooldown with countdown, re-enables after expiry, and isolates builds/users', async () => {
  let clock = 1_700_000_000_000;
  const store = createResendStore({ now: () => clock });
  const progressA = makeProgress({ orderId: 101 });
  const progressB = makeProgress({ orderId: 202 });

  let resolveSend: ((value: { status: string; resendEligibleAt?: number }) => void) | null = null;
  let sendCalls = 0;
  let refreshCalls = 0;
  const send = () => {
    sendCalls += 1;
    return new Promise<{ status: string; resendEligibleAt?: number }>((resolve) => {
      resolveSend = resolve;
    });
  };
  const onRefresh = () => {
    refreshCalls += 1;
  };

  let ticks = 0;
  const unsub = store.subscribe(1, 42, 101, () => {
    ticks += 1;
  });

  // Rapid double-click across surfaces fires only one request
  const p1 = store.trigger(1, 42, progressA, send, onRefresh);
  const p2 = store.trigger(1, 42, progressA, send, onRefresh);
  assert.equal(sendCalls, 1);
  assert.equal(store.getSnapshot(1, 42, progressA).status, 'sending');
  assert.equal(store.getSnapshot(1, 42, progressA).canResend, false);
  // Different build/order is unaffected (no cross-build bleed)
  assert.equal(store.getSnapshot(1, 43, progressB).status, 'idle');
  assert.equal(store.getSnapshot(1, 43, progressB).canResend, true);

  resolveSend!({ status: 'sent' });
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(r1, true);
  assert.equal(r2, false);
  assert.equal(refreshCalls, 1);
  assert.ok(ticks >= 2);

  // During 15-minute cooldown, Resend is disabled with countdown
  const midSnap = store.getSnapshot(1, 42, progressA);
  assert.equal(midSnap.status, 'sent');
  assert.equal(midSnap.canResend, false);
  assert.equal(midSnap.cooldownRemainingMs, RESEND_COOLDOWN_MS);
  assert.equal(formatResendCountdown(midSnap.cooldownRemainingMs), '15:00');

  // After 15 minutes pass, Resend automatically re-enables
  clock += RESEND_COOLDOWN_MS;
  store.clearExpired(1, 42, 101);
  const afterSnap = store.getSnapshot(1, 42, progressA);
  assert.equal(afterSnap.status, 'idle');
  assert.equal(afterSnap.canResend, true);
  assert.equal(afterSnap.cooldownRemainingMs, 0);

  // Server unix-seconds timestamp normalization works
  assert.equal(toTimestampMs(1_700_000_900), 1_700_000_900_000);
  assert.equal(toTimestampMs(1_700_000_900_000), 1_700_000_900_000);

  // Account switch clears state
  store.syncUser(2);
  assert.equal(store.getSnapshot(2, 42, progressA).status, 'idle');
  unsub();
});

test('shouldAutoVerifyCode prevents auto-resubmitting a failed or unchanged 6-digit code', () => {
  // Typing 6th digit for the first time auto-verifies
  assert.equal(shouldAutoVerifyCode('123456', '12345', '', false), true);
  // Typing an extra character (slices back to '123456') does NOT auto-resubmit
  assert.equal(shouldAutoVerifyCode('123456', '123456', '123456', false), false);
  // Deleting and re-typing the same failed code does NOT auto-resubmit
  assert.equal(shouldAutoVerifyCode('123456', '12345', '123456', false), false);
  // Changing to a different 6-digit code DOES auto-verify
  assert.equal(shouldAutoVerifyCode('123457', '12345', '123456', false), true);
  // Never auto-verifies while already verifying or incomplete
  assert.equal(shouldAutoVerifyCode('123457', '12345', '123456', true), false);
  assert.equal(shouldAutoVerifyCode('12345', '1234', '', false), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDomainProgressStore } from '../src/components/Build/AppAddress/domainProgressStore';
import {
  RESEND_COOLDOWN_MS,
  createResendStore,
  formatResendCountdown,
  toTimestampMs
} from '../src/components/Build/AppAddress/checkout/resendStore';
import {
  createEmailCodeGuard,
  progressFraction,
  readScopedBuildData,
  shouldAutoVerifyCode,
  shouldRefreshOrderProgress,
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

test('readScopedBuildData drops stale info immediately on cached buildId or account switch', () => {
  const buildAInfo = {
    buildId: 10,
    userId: 1,
    data: { enabled: true, url: 'https://a.lumine.app', domainSalesEnabled: true }
  };
  assert.equal(readScopedBuildData(buildAInfo, 10, 1), buildAInfo.data);
  // Switching to cached build 20 must return null on the first render (before effects run)
  assert.equal(readScopedBuildData(buildAInfo, 20, 1), null);
  // Switching accounts on the same build must also return null immediately
  assert.equal(readScopedBuildData(buildAInfo, 10, 2), null);
  assert.equal(readScopedBuildData(null, 10, 1), null);
});

test('resendStore preserves wait/sent status and falls back to future cooldown when resendEligibleAt is in the past', async () => {
  let clock = 1_700_001_000_000;
  const store = createResendStore({ now: () => clock });
  const pastEligibleAtSec = Math.floor((clock - 60_000) / 1000);
  const progressWithPastTs = makeProgress({
    orderId: 303,
    verification: {
      state: 'pending',
      verifyBy: 1_800_000_000,
      daysLeft: 14,
      canResend: false,
      resendEligibleAt: pastEligibleAtSec
    }
  });

  // Past resendEligibleAt allows clicking Resend after countdown expires
  assert.equal(store.getSnapshot(1, 42, progressWithPastTs).canResend, true);

  // Server answers wait without resendEligibleAt: must keep wait status and future cooldown
  await store.trigger(
    1,
    42,
    progressWithPastTs,
    async () => ({ status: 'wait' }),
    () => {}
  );
  const waitNoTs = store.getSnapshot(1, 42, progressWithPastTs);
  assert.equal(waitNoTs.status, 'wait');
  assert.equal(waitNoTs.canResend, false);
  assert.equal(waitNoTs.cooldownRemainingMs, RESEND_COOLDOWN_MS);

  // Advance past cooldown and test server wait with an exact-now/past resendEligibleAt
  clock += RESEND_COOLDOWN_MS;
  store.clearExpired(1, 42, 303);
  await store.trigger(
    1,
    42,
    progressWithPastTs,
    async () => ({ status: 'wait', resendEligibleAt: Math.floor(clock / 1000) }),
    () => {}
  );
  const waitPastTs = store.getSnapshot(1, 42, progressWithPastTs);
  assert.equal(waitPastTs.status, 'wait');
  assert.equal(waitPastTs.canResend, false);
  assert.equal(waitPastTs.cooldownRemainingMs, RESEND_COOLDOWN_MS);

  // Future server resendEligibleAt is still respected verbatim
  clock += RESEND_COOLDOWN_MS;
  store.clearExpired(1, 42, 303);
  const futureSec = Math.floor((clock + 120_000) / 1000);
  await store.trigger(
    1,
    42,
    progressWithPastTs,
    async () => ({ status: 'wait', resendEligibleAt: futureSec }),
    () => {}
  );
  const waitFutureTs = store.getSnapshot(1, 42, progressWithPastTs);
  assert.equal(waitFutureTs.status, 'wait');
  assert.equal(waitFutureTs.canResend, false);
  assert.equal(waitFutureTs.cooldownRemainingMs, 120_000);

  // Sent response with a non-future timestamp also falls back to RESEND_COOLDOWN_MS
  clock += 120_000;
  store.clearExpired(1, 42, 303);
  await store.trigger(
    1,
    42,
    progressWithPastTs,
    async () => ({ status: 'sent', resendEligibleAt: Math.floor((clock - 5_000) / 1000) }),
    () => {}
  );
  const sentPastTs = store.getSnapshot(1, 42, progressWithPastTs);
  assert.equal(sentPastTs.status, 'sent');
  assert.equal(sentPastTs.canResend, false);
  assert.equal(sentPastTs.cooldownRemainingMs, RESEND_COOLDOWN_MS);
});

test('createEmailCodeGuard invalidates in-flight verify when sending a new code', () => {
  const guard = createEmailCodeGuard();

  const firstSend = guard.beginSend();
  assert.notEqual(firstSend, null);
  // Duplicate send while in-flight is blocked
  assert.equal(guard.beginSend(), null);
  // Verify cannot start while a send is still in-flight
  assert.equal(guard.beginVerify(), null);
  guard.endSend(firstSend!);

  // Start verifying a 6-digit code
  const staleVerify = guard.beginVerify();
  assert.notEqual(staleVerify, null);
  assert.equal(guard.isCurrent(staleVerify!), true);
  // Duplicate verify while in-flight is blocked
  assert.equal(guard.beginVerify(), null);

  // User clicks "Send a new code" while verify is still in-flight
  const newSend = guard.beginSend();
  assert.notEqual(newSend, null);
  assert.equal(guard.isCurrent(newSend!), true);
  // Superseded verify is now stale and cannot overwrite state or collapse the code box
  assert.equal(guard.isCurrent(staleVerify!), false);
  guard.endVerify(staleVerify!);
  assert.equal(guard.isCurrent(newSend!), true);

  // Once the new send finishes, verifying the new code succeeds normally
  guard.endSend(newSend!);
  const freshVerify = guard.beginVerify();
  assert.notEqual(freshVerify, null);
  assert.equal(guard.isCurrent(freshVerify!), true);

  // Email or account switch invalidates everything in-flight
  guard.invalidate();
  assert.equal(guard.isCurrent(freshVerify!), false);
});

test('progressFraction counts done steps plus half of an active step', () => {
  assert.equal(progressFraction(makeProgress({ steps: [] })), 0);
  assert.equal(progressFraction(makeProgress()), 0.9);
  assert.equal(
    progressFraction(
      makeProgress({
        steps: [
          { key: 'paid', state: 'done' },
          { key: 'registered', state: 'done' },
          { key: 'secure', state: 'done' },
          { key: 'live', state: 'done' },
          { key: 'email', state: 'done' }
        ]
      })
    ),
    1
  );
});

test('shouldRefreshOrderProgress refreshes on first settled order response and on later transitions', () => {
  // Initial response past payment must refresh so a concurrent domain-progress
  // poll that resolved null while paying cannot strand the screen.
  for (const stage of ['setting_up', 'live', 'support', 'refunding'] as const) {
    assert.equal(
      shouldRefreshOrderProgress({
        orderAttempt: 0,
        lastStatus: '',
        lastStage: '',
        nextOrder: { status: stage, stage }
      }),
      true
    );
  }

  // Initial response still paying, stopped, or refunded needs no refresh on mount.
  for (const stage of ['paying', 'stopped', 'refunded'] as const) {
    assert.equal(
      shouldRefreshOrderProgress({
        orderAttempt: 0,
        lastStatus: '',
        lastStage: '',
        nextOrder: { status: stage, stage }
      }),
      false
    );
  }

  // Manual retry ("Check again", orderAttempt > 0) refreshes on its first response.
  assert.equal(
    shouldRefreshOrderProgress({
      orderAttempt: 1,
      lastStatus: '',
      lastStage: '',
      nextOrder: { status: 'pending', stage: 'paying' }
    }),
    true
  );

  // Subsequent polls only refresh when status or stage changes.
  assert.equal(
    shouldRefreshOrderProgress({
      orderAttempt: 0,
      lastStatus: 'paid',
      lastStage: 'setting_up',
      nextOrder: { status: 'paid', stage: 'setting_up' }
    }),
    false
  );
  assert.equal(
    shouldRefreshOrderProgress({
      orderAttempt: 0,
      lastStatus: 'paid',
      lastStage: 'setting_up',
      nextOrder: { status: 'registered', stage: 'setting_up' }
    }),
    true
  );
  assert.equal(
    shouldRefreshOrderProgress({
      orderAttempt: 0,
      lastStatus: 'pending',
      lastStage: 'paying',
      nextOrder: { status: 'pending', stage: 'setting_up' }
    }),
    true
  );
});

test('initial-poll race between domain-progress (null while paying) and first loadDomainOrder (live/setting_up) recovers via refresh', async () => {
  const timers = makeFakeTimers();
  let calls = 0;
  const responses: Array<DomainProgressView | null> = [
    null,
    makeProgress({ stage: 'one_step_left' })
  ];
  const store = createDomainProgressStore({
    isHidden: () => false,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  });
  const loader = async () => ({ progress: responses[calls++] ?? null });

  // Concurrent mount poll resolves first while order is still paying -> null, no timer
  const unsub = store.subscribe(1, 42, loader, () => {});
  await flushMicrotasks();
  assert.equal(calls, 1);
  assert.equal(store.getProgress(1, 42), null);
  assert.equal(timers.scheduled.size, 0);

  // First loadDomainOrder response returns stage: 'live' -> must trigger refresh
  if (
    shouldRefreshOrderProgress({
      orderAttempt: 0,
      lastStatus: '',
      lastStage: '',
      nextOrder: { status: 'live', stage: 'live' }
    })
  ) {
    store.refresh(42);
  }
  await flushMicrotasks();
  assert.equal(calls, 2);
  assert.equal(store.getProgress(1, 42)?.stage, 'one_step_left');
  assert.equal(store.getProgress(1, 42)?.verification?.state, 'pending');
  assert.equal(timers.scheduled.size, 1);
  unsub();
});

test('DomainCheckoutPage, AppAddress, and checkout steps wire both the progress tracker / email-code flow and the checkout page rework cleanly', () => {
  const model = readFileSync(new URL('../src/components/Build/AppAddress/checkout/model.ts', import.meta.url), 'utf8');
  const steps = readFileSync(new URL('../src/components/Build/AppAddress/checkout/steps.tsx', import.meta.url), 'utf8');
  const chip = readFileSync(new URL('../src/components/Build/AppAddress/index.tsx', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/components/Build/AppAddress/DomainCheckoutPage.tsx', import.meta.url), 'utf8');

  for (const [name, source] of [
    ['model.ts', model],
    ['steps.tsx', steps],
    ['index.tsx', chip],
    ['DomainCheckoutPage.tsx', page]
  ]) {
    assert.doesNotMatch(source, /^(<{7}|={7}|>{7})/m, `${name} must not have merge conflict markers`);
  }

  // DomainCheckoutPage wires email-code verification, progress polling, and OrderStatusView tracker props
  assert.match(page, /loadPurchaseAccountEmail/);
  assert.match(page, /requestPurchaseEmailCode/);
  assert.match(page, /verifyPurchaseEmailCode/);
  assert.match(page, /createEmailCodeGuard/);
  assert.match(page, /emailToken:\s*emailToken && emailToken\.email === typedEmail \? emailToken\.token : undefined/);
  assert.match(page, /e\?\.code === 'email_unverified'/);
  assert.match(page, /<OwnerDetailsView[\s\S]*?emailCheck=\{emailCheck\}/);
  assert.match(page, /useDomainProgress\(buildId, Boolean\(orderId\)\)/);
  assert.match(page, /shouldRefreshOrderProgress\(/);
  assert.match(page, /refreshDomainProgress\(buildId\)/);
  assert.match(page, /<OrderStatusView[\s\S]*?progress=\{progress && progress\.orderId === step\.orderId \? progress : null\}[\s\S]*?buildId=\{buildId\}/);

  // AppAddress keeps the progress chip/menu/notice and opens order progress on the checkout page (no overlay)
  assert.match(chip, /export function AppAddressProgressNotice/);
  assert.match(chip, /setDomainProgressAllowed\(buildId, domainProgressAllowed\)/);
  assert.match(chip, /openCheckoutRef\.current\(`\?domainOrder=\$\{detail\.orderId\}`\)/);
  assert.match(chip, /openCheckout\(`\?domainOrder=\$\{tracking\.orderId\}`\)/);
  assert.doesNotMatch(chip, /CheckoutSurface|appAddressCheckout/);

  // OwnerDetailsView keeps both autofill-safe state updates + name="email" and the email-code box
  assert.match(steps, /const set = \(key: keyof OwnerDetails\) => \(value: string\) => onDetails\(\(prev\) => \(\{ \.\.\.prev, \[key\]: value \}\)\);/);
  assert.match(steps, /countryInStateField\(value, \{ autofilled: isAutofillChange\(event\) \}\)/);
  assert.match(steps, /<TextField label=\{t\.email\} name="email"/);
  assert.match(steps, /shouldAutoVerifyCode\(/);
});

test('saved registrant details coexist with profile prefill, email verification, and the checkout page', () => {
  const page = readFileSync(new URL('../src/components/Build/AppAddress/DomainCheckoutPage.tsx', import.meta.url), 'utf8');
  const steps = readFileSync(new URL('../src/components/Build/AppAddress/checkout/steps.tsx', import.meta.url), 'utf8');
  const buildHelpers = readFileSync(new URL('../src/contexts/requestHelpers/build.ts', import.meta.url), 'utf8');
  const harness = readFileSync(new URL('../src/liteHost/preview/harness.tsx', import.meta.url), 'utf8');

  for (const [name, source] of [
    ['DomainCheckoutPage.tsx', page],
    ['steps.tsx', steps],
    ['build.ts', buildHelpers],
    ['harness.tsx', harness]
  ]) {
    assert.doesNotMatch(source, /^(<{7}|={7}|>{7})/m, `${name} must not have merge conflict markers`);
  }

  // DomainCheckoutPage loads/forgets saved details, lets them win over profile prefill, and wires fast path + review note
  assert.match(page, /loadSavedRegistrant/);
  assert.match(page, /forgetSavedRegistrant/);
  assert.match(page, /savedDetailsRef\.current === 'saved'/);
  assert.match(page, /saveDetails:\s*savedDetailsRef\.current !== 'forgotten'/);
  assert.match(
    page,
    /<OwnerDetailsView[\s\S]*?forgetting=\{forgettingSaved\}[\s\S]*?startPage=\{savedDetails === 'saved' && !ownerDetailsProblem\(t, owner\) && emailCheck\.verified \? 3 : 0\}[\s\S]*?saved=\{savedDetails\}[\s\S]*?onSavedChoice=\{\(\) => void forgetOrSkipSaved\(\)\}/
  );

  // OwnerDetailsView gates payment on both forgetting and email verification, and renders the saved-details note
  assert.match(steps, /const canPay = !missing && agreed && !busy && !forgetting && emailVerified;/);
  assert.match(steps, /saved === 'saved' \? t\.savedNote : saved === 'none' \? t\.saveNextNote : t\.notSavedNote/);
  assert.match(steps, /forgetting \? t\.forgetting : saved === 'saved' \? t\.savedForget : t\.dontSave/);

  // Request helper forwards both saveDetails and emailToken
  assert.match(buildHelpers, /startSelfDomainOrder\(\{ buildId, domain, registrant, agreed, priceCents, saveDetails, emailToken \}/);
  assert.match(buildHelpers, /\{ domain, registrant, agreed, priceCents, saveDetails, emailToken \}/);

  // Preview harness keeps both email-code and saved-registrant previews
  assert.match(harness, /function OwnerEmailHarness\(\)/);
  assert.match(harness, /function OwnerHarness\(\{ filled, saved: savedStart = 'none' \}/);
});

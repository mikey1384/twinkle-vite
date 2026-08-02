import assert from 'node:assert/strict';
import test from 'node:test';
import { startBuildContributionLumineFixRecovery } from '../src/helpers/buildContributionLumineFixRecovery';

function settleAsyncWork() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function createRecoveryHarness({
  shouldPoll,
  refreshCanonicalState
}: {
  shouldPoll: boolean;
  refreshCanonicalState: () => Promise<void>;
}) {
  let reconnectRefresh: (() => void) | null = null;
  let visibleRefresh: (() => void) | null = null;
  let reconnectUnsubscribed = false;
  let visibleUnsubscribed = false;
  const scheduled: Array<{
    refresh: () => void;
    delayMs: number;
    canceled: boolean;
  }> = [];
  const stop = startBuildContributionLumineFixRecovery({
    shouldPoll,
    refreshCanonicalState,
    subscribeToReconnect(refresh) {
      reconnectRefresh = refresh;
      return () => {
        reconnectUnsubscribed = true;
      };
    },
    subscribeToVisible(refresh) {
      visibleRefresh = refresh;
      return () => {
        visibleUnsubscribed = true;
      };
    },
    scheduleRefresh(refresh, delayMs) {
      const entry = { refresh, delayMs, canceled: false };
      scheduled.push(entry);
      return () => {
        entry.canceled = true;
      };
    }
  });

  return {
    get reconnectRefresh() {
      return reconnectRefresh;
    },
    get visibleRefresh() {
      return visibleRefresh;
    },
    get reconnectUnsubscribed() {
      return reconnectUnsubscribed;
    },
    get visibleUnsubscribed() {
      return visibleUnsubscribed;
    },
    scheduled,
    stop
  };
}

test('a non-running Lumine card reads canonical state on entry and visibility', async () => {
  let refreshCount = 0;
  const harness = createRecoveryHarness({
    shouldPoll: false,
    async refreshCanonicalState() {
      refreshCount += 1;
    }
  });

  await settleAsyncWork();
  assert.equal(refreshCount, 1);
  assert.equal(harness.scheduled.length, 0);

  harness.visibleRefresh?.();
  await settleAsyncWork();
  assert.equal(refreshCount, 2);
  assert.equal(harness.scheduled.length, 0);

  harness.stop();
  assert.equal(harness.reconnectUnsubscribed, true);
  assert.equal(harness.visibleUnsubscribed, true);
});

test('running Lumine recovery keeps one poll scheduled after each canonical read', async () => {
  let refreshCount = 0;
  const harness = createRecoveryHarness({
    shouldPoll: true,
    async refreshCanonicalState() {
      refreshCount += 1;
    }
  });

  await settleAsyncWork();
  assert.equal(refreshCount, 1);
  assert.equal(harness.scheduled.length, 1);
  assert.equal(harness.scheduled[0].delayMs, 5_000);

  harness.scheduled[0].refresh();
  await settleAsyncWork();
  assert.equal(refreshCount, 2);
  assert.equal(harness.scheduled[0].canceled, true);
  assert.equal(harness.scheduled.length, 2);

  harness.stop();
  assert.equal(harness.scheduled[1].canceled, true);
});

test('recovery coalesces triggers received during a canonical read', async () => {
  const pendingResolvers: Array<() => void> = [];
  let refreshCount = 0;
  const harness = createRecoveryHarness({
    shouldPoll: false,
    refreshCanonicalState() {
      refreshCount += 1;
      return new Promise<void>((resolve) => pendingResolvers.push(resolve));
    }
  });

  assert.equal(refreshCount, 1);
  harness.reconnectRefresh?.();
  harness.visibleRefresh?.();
  assert.equal(refreshCount, 1);

  pendingResolvers.shift()?.();
  await settleAsyncWork();
  assert.equal(refreshCount, 2);

  pendingResolvers.shift()?.();
  await settleAsyncWork();
  harness.stop();
});

test('stopping recovery fences queued work and polling after an in-flight read', async () => {
  let resolveRefresh: (() => void) | null = null;
  let refreshCount = 0;
  const harness = createRecoveryHarness({
    shouldPoll: true,
    refreshCanonicalState() {
      refreshCount += 1;
      return new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });
    }
  });

  harness.reconnectRefresh?.();
  harness.stop();
  resolveRefresh?.();
  await settleAsyncWork();

  assert.equal(refreshCount, 1);
  assert.equal(harness.scheduled.length, 0);
  assert.equal(harness.reconnectUnsubscribed, true);
  assert.equal(harness.visibleUnsubscribed, true);
});

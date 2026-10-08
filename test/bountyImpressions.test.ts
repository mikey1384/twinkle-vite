import test from 'node:test';
import assert from 'node:assert/strict';
import { createBountyImpressionTracker } from '../src/containers/Home/Earn/Bounties/bountyImpressions';

test('ranked and recommended sightings remain separate, repeats dedupe, and large shelves are fully batched', async () => {
  const reports: any[] = [];
  const tracker = createBountyImpressionTracker(
    async (p) => {
      reports.push(p);
      return { recorded: p.seen?.length };
    },
    () => true
  );
  for (let buildId = 1; buildId <= 45; buildId++)
    tracker.seen({ buildId, slot: 'card' });
  tracker.seen({ buildId: 2, slot: 'card' });
  tracker.seen({ buildId: 2, slot: 'recommended' });
  tracker.play({ buildId: 2, slot: 'recommended' });
  assert.deepEqual(
    reports.map((p) => p.seen?.length || 'play'),
    [40, 6, 'play']
  );
  assert.equal(
    reports.flatMap((p) => p.seen || []).filter((p) => p.buildId === 2).length,
    2
  );
  tracker.flush();
  assert.equal(reports.length, 3);
});

test('account and reward-day changes discard old queued sightings and report the same app anew', () => {
  const reports: any[] = [];
  let currentScope = '7:2026-10-08';
  const make = (scope: string) =>
    createBountyImpressionTracker(
      async (p) => {
        reports.push({ scope, ...p });
        return {};
      },
      () => scope === currentScope
    );
  const old = make(currentScope);
  old.seen({ buildId: 1, slot: 'recommended' });
  currentScope = '8:2026-10-08';
  old.flush();
  old.play({ buildId: 1, slot: 'recommended' });
  assert.equal(
    reports.length,
    0,
    'old member data is not sent with new credentials'
  );
  const next = make(currentScope);
  next.seen({ buildId: 1, slot: 'recommended' });
  next.flush();
  currentScope = '8:2026-10-09';
  const tomorrow = make(currentScope);
  tomorrow.seen({ buildId: 1, slot: 'recommended' });
  tomorrow.flush();
  assert.deepEqual(
    reports.map((p) => p.scope),
    ['8:2026-10-08', '8:2026-10-09']
  );
});

test('a failed or throttled report can be retried on the next sighting', async () => {
  let count = 0;
  const tracker = createBountyImpressionTracker(
    async () => (++count === 1 ? { throttled: true } : {}),
    () => true
  );
  tracker.seen({ buildId: 1, slot: 'recommended' });
  tracker.flush();
  await Promise.resolve();
  tracker.seen({ buildId: 1, slot: 'recommended' });
  tracker.flush();
  assert.equal(count, 2);
});

test('unmounting before the batch fires discards the old identity queue', () => {
  const reports: unknown[] = [];
  const tracker = createBountyImpressionTracker(
    async (p) => {
      reports.push(p);
      return {};
    },
    () => true
  );
  tracker.seen({ buildId: 7, slot: 'recommended' });
  tracker.dispose();
  tracker.flush();
  assert.equal(reports.length, 0);
  // React Strict Mode can set up the same tracker again after cleanup.
  tracker.seen({ buildId: 7, slot: 'recommended' });
  tracker.flush();
  assert.equal(reports.length, 1);
});

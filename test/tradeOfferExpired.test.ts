import assert from 'node:assert/strict';
import test from 'node:test';
import { getTradeStatus } from '../src/containers/Chat/Trade/helpers/status';
import { siteDayEndSec, siteDayIndex } from '../src/helpers/siteDay';

// 2026-11-17 20:30 Korea time; the site day ends 2026-11-18 00:00 UTC.
const NOW = Date.UTC(2026, 10, 17, 11, 30);
const DAY_END_SEC = Date.UTC(2026, 10, 18, 0, 0) / 1000;
const bundle = (b: any = {}) => ({ coins: 0, cardIds: [], groupIds: [], buildIds: [], ...b });
const offer = (extra: any = {}) => ({
  id: 7,
  type: 'trade',
  from: 2,
  to: 1,
  timeStamp: Math.floor(NOW / 1000) - 600,
  offer: bundle({ coins: 5000 }),
  want: bundle({ groupIds: [812] }),
  ...extra
});
const status = (transaction: any, extra: any = {}) =>
  getTradeStatus({
    transaction,
    viewerId: 1,
    isAccepted: false,
    isCancelled: false,
    isCurrent: true,
    nowMs: NOW,
    ...extra
  });

test('every item type: an open offer that cannot deliver reads Offer expired, and comes back', () => {
  assert.equal(status(offer()).label, 'Trade offer');
  assert.equal(status(offer({ deliverability: { ok: true } })).label, 'Trade offer');
  const expired = status(
    offer({ deliverability: { ok: false, reason: 'not enough coins', responsibleUserId: 2 } })
  );
  assert.equal(expired.label, 'Offer expired');
  assert.equal(expired.expired, true);
  assert.equal(expired.expiredReason, 'not enough coins');
  // drawn closed, but still open on the server: decline stays possible
  assert.equal(expired.cancelled, true);
  assert.equal(expired.closed, false);
  // the coins came back: the derived card returns to a live offer
  assert.equal(status(offer({ deliverability: { ok: true } })).expired, false);
});

test('a person closing the offer wins only when it is really closed; settled receipts never expire', () => {
  const failing = { deliverability: { ok: false, reason: 'changed group ownership', responsibleUserId: 1 } };
  assert.equal(status(offer(failing), { isCancelled: true, cancelReason: 'decline' }).label, 'Offer declined');
  assert.equal(status(offer(failing), { isAccepted: true }).label, 'Trade completed');
  assert.equal(status({ ...offer(failing), type: 'send' }).label, 'Gift received');
  assert.equal(status({ ...offer(failing), type: 'show' }).label, 'Showcase');
});

test('interest-only messages are never marked expired', () => {
  const interest = offer({
    offer: bundle(),
    deliverability: { ok: false, reason: 'not enough coins', responsibleUserId: 1 }
  });
  assert.equal(status(interest).label, 'Interest shown');
  assert.equal(status(interest).expired, false);
});

test('battery belongs to its site day: the card flips at the boundary with no request', () => {
  const withBattery = offer({ offer: bundle({ coins: 2000, battery: 480_000 }), deliverability: { ok: true } });
  assert.equal(siteDayEndSec(withBattery.timeStamp), DAY_END_SEC);
  assert.equal(status(withBattery, { nowMs: DAY_END_SEC * 1000 - 1 }).label, 'Trade offer');
  const after = status(withBattery, { nowMs: DAY_END_SEC * 1000 + 60_000 });
  assert.equal(after.label, 'Offer expired');
  assert.equal(after.expiredReason, 'battery day passed');
  // a passed date never comes back, whatever the server said earlier
  assert.equal(status(withBattery, { nowMs: DAY_END_SEC * 1000 + 86_400_000 }).expired, true);
  // offers without battery do not care about the day
  assert.equal(status(offer({ deliverability: { ok: true } }), { nowMs: DAY_END_SEC * 1000 + 60_000 }).expired, false);
  assert.equal(siteDayIndex(DAY_END_SEC * 1000) - siteDayIndex(NOW), 1);
});

// A page can mount more than one endpoint batch; no older card may disappear.
test('all mounted open offers remain eligible for bounded refresh batches', async () => {
  const { registerOpenTrade, getOpenTradeIds, MAX_DELIVERABILITY_IDS } =
    await import('../src/containers/Chat/Trade/helpers/openTrades');
  const unregister = Array.from({ length: 25 }, (_, i) => registerOpenTrade(1000 + i));
  const duplicate = registerOpenTrade(1000);
  try {
    assert.equal(getOpenTradeIds().length, 25);
    unregister[0]();
    assert.ok(getOpenTradeIds().includes(1000));
    const ids = getOpenTradeIds();
    const batches = [];
    for (let start = 0; start < ids.length; start += MAX_DELIVERABILITY_IDS)
      batches.push(ids.slice(start, start + MAX_DELIVERABILITY_IDS));
    assert.deepEqual(batches.map((batch) => batch.length), [20, 5]);
  } finally {
    duplicate();
    unregister.slice(1).forEach((remove) => remove());
  }
  assert.deepEqual(getOpenTradeIds(), []);
});

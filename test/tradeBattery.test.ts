import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BATTERY_STEP_UNITS,
  batteryExpiresAtForOffer,
  batteryPercent,
  describeBatteryUse,
  formatBatteryExpiry
} from '../src/helpers/battery';
import {
  hasTradeAssets,
  isInterestOnlyTrade,
  normalizeBundle,
  summarizeBundle,
  tradeTermsKey
} from '../src/containers/Chat/Trade/helpers/terms';
import { getTradeStatus } from '../src/containers/Chat/Trade/helpers/status';
import { getAiEnergyDisplay } from '../src/helpers/aiEnergyDisplay';

const FULL = 1_200_000;
// 2026-11-17 20:30 in Korea; the site day ends at 9:00 AM Korea time.
const NOW = Date.UTC(2026, 10, 17, 11, 30);
const DAY_END = Date.UTC(2026, 10, 18, 0, 0) / 1000;

test('members see % of a battery and a plain equivalent, never units', () => {
  assert.equal(BATTERY_STEP_UNITS, 12_000);
  assert.equal(batteryPercent(FULL * 0.4), 40);
  assert.equal(describeBatteryUse(FULL * 0.4), 'about 5 Lumine runs');
  assert.equal(describeBatteryUse(95_000), 'about 1 Lumine run');
  assert.equal(describeBatteryUse(48_000), 'about 3 chats with Zero or Ciel');
  assert.equal(describeBatteryUse(1), 'about 1 chat with Zero or Ciel');
});

test('expiry is shown in the member’s own clock', () => {
  assert.equal(batteryExpiresAtForOffer(Math.floor(NOW / 1000)), DAY_END);
  assert.equal(formatBatteryExpiry(DAY_END, NOW, 'Asia/Seoul'), 'tomorrow at 9:00 AM');
  assert.equal(formatBatteryExpiry(DAY_END, Date.UTC(2026, 10, 17, 16, 0), 'Asia/Seoul'), 'today at 9:00 AM');
  assert.equal(formatBatteryExpiry(DAY_END, NOW, 'America/Los_Angeles'), 'today at 4:00 PM');
});

test('battery is a real trade asset: summaries, terms keys and interest', () => {
  const offer = { coins: 0, battery: FULL * 0.4, cardIds: [], groupIds: [], buildIds: [] };
  assert.equal(hasTradeAssets(normalizeBundle(offer)), true);
  assert.equal(summarizeBundle(normalizeBundle(offer)), '40% battery');
  assert.equal(isInterestOnlyTrade({ type: 'trade', offer }), false);
  const a = tradeTermsKey({ type: 'trade', offer, want: {} });
  const b = tradeTermsKey({ type: 'trade', offer: { ...offer, battery: FULL * 0.2 }, want: {} });
  assert.notEqual(a, b, 'a changed battery amount is a changed offer');
  const status = getTradeStatus({
    transaction: { type: 'trade', from: 2, to: 1, timeStamp: Math.floor(NOW / 1000), offer, want: { coins: 5 } },
    viewerId: 1,
    isAccepted: false,
    isCancelled: false,
    nowMs: DAY_END * 1000 + 1000
  });
  assert.equal(status.label, 'Offer expired');
  assert.equal(status.expiredReason, 'battery day passed');
});

test('received battery can show past one full battery; recharges never do', () => {
  const base = 1_200_000;
  assert.equal(getAiEnergyDisplay({ energyRemaining: 1_680_000, baseEnergyUnitsPerDay: base, batteryReceivedUnits: 480_000 }).label, '140%');
  assert.equal(getAiEnergyDisplay({ energyRemaining: 1_680_000, baseEnergyUnitsPerDay: base, batteryReceivedUnits: 480_000 }).percent, 100);
  assert.equal(getAiEnergyDisplay({ energyRemaining: 1_680_000, baseEnergyUnitsPerDay: base }).label, '100%');
  assert.equal(getAiEnergyDisplay({ energyRemaining: 600_000, baseEnergyUnitsPerDay: base, batteryReceivedUnits: 480_000 }).label, '50%');
});

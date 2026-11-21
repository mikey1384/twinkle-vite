// The tradable AI battery, as members see it. Server units stay internal;
// members see "% of a battery" and a plain equivalent. Costs come from the
// 11-17 production probe (last 7 closed days): a Lumine run (committed
// generation with its chat) is about 95,000 units, a Zero or Ciel chat reply
// about 16,000.
import { siteDayEndSec } from './siteDay';

export const FULL_BATTERY_UNITS = 1_200_000;
export const BATTERY_STEP_UNITS = FULL_BATTERY_UNITS / 100; // 1% steps
export const BATTERY_MIN_UNITS = BATTERY_STEP_UNITS; // smallest amount: 1%
export const LUMINE_RUN_UNITS = 95_000;
export const ZERO_CHAT_UNITS = 16_000;

export function batteryPercent(units: number) {
  return Math.round((Number(units) / FULL_BATTERY_UNITS) * 100);
}

export function describeBatteryUse(units: number) {
  const runs = Math.floor(units / LUMINE_RUN_UNITS);
  if (runs >= 1) return `about ${runs} Lumine run${runs === 1 ? '' : 's'}`;
  const chats = Math.max(1, Math.floor(units / ZERO_CHAT_UNITS));
  return `about ${chats} chat${chats === 1 ? '' : 's'} with Zero or Ciel`;
}

// Site days end at 00:00 UTC; members see their own clock (9:00 AM in Korea).
export function formatBatteryExpiry(
  expiresAtSec: number,
  nowMs = Date.now(),
  timeZone?: string
) {
  const expiry = new Date(expiresAtSec * 1000);
  const time = expiry.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone
  });
  const dayKey = (date: Date) => date.toLocaleDateString('en-CA', { timeZone });
  const sameDay = dayKey(expiry) === dayKey(new Date(nowMs));
  return sameDay ? `today at ${time}` : `tomorrow at ${time}`;
}

// Nothing is stored: an offer's battery belongs to the site day the offer was
// made on, so its end comes from the offer's own timeStamp.
export function batteryExpiresAtForOffer(timeStampSec: number) {
  return siteDayEndSec(timeStampSec);
}

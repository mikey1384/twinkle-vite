// The tradable AI battery, as members see it. Server units stay internal;
// members see "% of a battery" and a plain equivalent. Costs come from the
// 11-17 production probe (last 7 closed days): a Lumine run (committed
// generation with its chat) is about 95,000 units, a Zero or Ciel chat reply
// about 16,000.
import { siteDayEndSec } from './siteDay';

// The size of a full daily battery is one API setting (Mikey 11-18). The
// website never keeps its own copy: it arrives with every AI Energy snapshot
// (baseEnergyUnitsPerDay) and with the battery picker data, and is remembered
// here. Until one of them has loaded it is unknown (0) and amounts are shown
// without a percentage.
let fullBatteryUnitsFromApi = 0;
export function setFullBatteryUnits(units: unknown) {
  const value = Math.floor(Number(units));
  if (Number.isFinite(value) && value > 0) fullBatteryUnitsFromApi = value;
}
export const fullBatteryUnits = () => fullBatteryUnitsFromApi;
// Amounts move in 1% steps; the smallest amount is 1%.
export const batteryStepUnits = () => fullBatteryUnitsFromApi / 100;
export const LUMINE_RUN_UNITS = 95_000;
export const ZERO_CHAT_UNITS = 16_000;

export function batteryPercent(units: number) {
  if (!fullBatteryUnitsFromApi) return 0;
  return Math.round((Number(units) / fullBatteryUnitsFromApi) * 100);
}

// "40% battery" on trade cards and summaries.
export function batteryAmountText(units: number) {
  return fullBatteryUnitsFromApi
    ? `${batteryPercent(units)}% battery`
    : 'battery';
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

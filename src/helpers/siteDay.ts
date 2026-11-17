// Twinkle's site day runs 00:00-24:00 UTC, counted from 2022-01-01 (the API's
// helpers/time.ts). Members see its end in their own clock: 9:00 AM in Korea.
const SITE_EPOCH_MS = Date.UTC(2022, 0, 1);
const DAY_MS = 86_400_000;

export function siteDayIndex(ms: number) {
  return Math.floor((Number(ms) - SITE_EPOCH_MS) / DAY_MS);
}

// The end (unix seconds) of the site day that a timestamp (seconds) falls on.
export function siteDayEndSec(timeStampSec: number) {
  return (
    ((siteDayIndex(Number(timeStampSec) * 1000) + 1) * DAY_MS + SITE_EPOCH_MS) /
    1000
  );
}

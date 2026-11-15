import { abbreviateNumber, addCommasToNumber } from '~/helpers/stringHelpers';

// Today's XP/Coins: exact below 100,000; from six digits the site's compact
// form (123.5K, 1.2M) with the exact value kept for a tooltip.
export const TODAY_AMOUNT_ABBREVIATE_FROM = 100_000;

export function formatTodayAmount(value: number) {
  const amount = Number(value) || 0;
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  const size = Math.abs(amount);
  const exact = `${sign}${addCommasToNumber(size)}`;
  if (size < TODAY_AMOUNT_ABBREVIATE_FROM) return { text: exact, exact: null };
  // abbreviateNumber would print 999,950–999,999 as "1000.0K".
  const short =
    size >= 999_950
      ? `${(size / 1_000_000).toFixed(1)}M`
      : abbreviateNumber(size);
  return { text: `${sign}${short}`, exact };
}

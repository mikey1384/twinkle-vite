// Dates on the auto-renew lines: the server sends calendar days (YYYY-MM-DD,
// UTC); members read them as "Dec 3, 2027" / "2027년 12월 3일".
export type RenewalLang = 'en' | 'ko';

export function renewalDateLabel(
  isoDay: string | null | undefined,
  lang: RenewalLang = 'en'
) {
  if (typeof isoDay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDay))
    return null;
  const date = new Date(`${isoDay}T00:00:00Z`);
  // impossible days (2027-02-29) roll over in JS: refuse them
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== isoDay
  )
    return null;
  return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: lang === 'ko' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// At checkout: a bought domain's first renewal is one year from today.
export function firstRenewalLabel(lang: RenewalLang = 'en', now = new Date()) {
  // Feb 29 → Feb 28 next year (what Stripe's yearly anchor charges), never Mar 1
  const year = now.getUTCFullYear() + 1;
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const next = new Date(
    Date.UTC(year, month, Math.min(now.getUTCDate(), lastDay))
  );
  return renewalDateLabel(next.toISOString().slice(0, 10), lang) || '';
}

export function renewalPrice(cents: number, currency?: string | null) {
  const amount = Math.max(0, Number(cents) || 0) / 100;
  const code = (
    typeof currency === 'string' && currency.trim() ? currency.trim() : 'USD'
  ).toUpperCase();
  return code === 'USD'
    ? `$${amount.toFixed(2)}`
    : `${amount.toFixed(2)} ${code}`;
}

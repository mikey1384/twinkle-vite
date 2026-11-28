// Dates on the auto-renew lines: the server sends calendar days (YYYY-MM-DD,
// UTC); members read them as "Dec 3, 2027" / "2027년 12월 3일".
export type RenewalLang = 'en' | 'ko';

export function renewalDateLabel(isoDay: string | null | undefined, lang: RenewalLang = 'en') {
  if (!isoDay || !/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return null;
  const date = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: lang === 'ko' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// At checkout: a bought domain's first renewal is one year from today.
export function firstRenewalLabel(lang: RenewalLang = 'en', now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate()));
  return renewalDateLabel(next.toISOString().slice(0, 10), lang) || '';
}

export function renewalPrice(cents: number, currency = 'USD') {
  const amount = Math.max(0, Number(cents) || 0) / 100;
  return currency.toUpperCase() === 'USD'
    ? `$${amount.toFixed(2)}`
    : `${amount.toFixed(2)} ${currency.toUpperCase()}`;
}

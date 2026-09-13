export interface MonthlyXP {
  id: number;
  label: string;
  value: number;
}

export interface XPSource {
  name: string;
  value: number;
}

const sourceLabels = new Map([
  ['writing', 'Writing'],
  ['watching', 'Watching'],
  ['vocabulary', 'Vocabulary'],
  ['missions', 'Missions'],
  ['grammar', 'Grammar'],
  ['cards', 'Cards'],
  ['ai story', 'AI stories'],
  ['daily bonus', 'Daily bonus'],
  ['chess puzzles', 'Chess puzzles'],
  ['lumine apps', 'Lumine apps'],
  ['other', 'Other']
]);

export function getSourceBreakdown(data: XPSource[]) {
  const totals = new Map<string, number>();
  for (const item of data) {
    // Also handles the old API's literal "undefined" category during rollout.
    const name = sourceLabels.has(item.name) ? item.name : 'other';
    const value = Number(item.value);
    if (Number.isFinite(value)) {
      totals.set(name, (totals.get(name) || 0) + value);
    }
  }
  const positiveTotal = Array.from(totals.values()).reduce(
    (total, value) => total + Math.max(0, value),
    0
  );
  return Array.from(totals, ([name, value]) => ({
    name,
    label: sourceLabels.get(name)!,
    value,
    share: positiveTotal > 0 ? (Math.max(0, value) / positiveTotal) * 100 : 0
  })).sort((a, b) => b.value - a.value);
}

export function getMonthlyScale(data: MonthlyXP[]) {
  const values = data.map(({ value }) => value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  return { min, max, range, zero: (max / range) * 100 };
}

const xpFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

export function formatXP(value: number) {
  return xpFormatter.format(value);
}

export function formatCompactXP(value: number) {
  return compactFormatter.format(value);
}

export function formatShare(share: number) {
  if (share > 0 && share < 0.1) return '<0.1%';
  return `${Number(share.toFixed(1))}%`;
}

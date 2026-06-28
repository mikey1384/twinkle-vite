export type Granularity = 'day' | 'month' | 'year';

export interface RangePreset {
  label: string;
  months: number;
  granularity: Granularity;
}

export const RANGE_PRESETS: RangePreset[] = [
  { label: '6M', months: 6, granularity: 'month' },
  { label: '1Y', months: 12, granularity: 'month' },
  { label: '2Y', months: 24, granularity: 'month' },
  { label: '5Y', months: 60, granularity: 'year' }
];

export const DEFAULT_PRESET_INDEX = 1;

export function computeRange(preset: RangePreset) {
  const end = Math.floor(Date.now() / 1000);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - preset.months);
  const start = Math.floor(startDate.getTime() / 1000);
  return { start, end, granularity: preset.granularity };
}

export interface AiEnergyDisplayPolicy {
  energyPercent?: number;
  energyRemaining?: number;
  baseEnergyUnitsPerDay?: number;
  dayKey?: string;
  dayIndex?: number | string;
}

const DAY_MS = 86_400_000;
const ENERGY_DAY_EPOCH = Date.UTC(2022, 0, 1);

export function getAiEnergyDisplay(
  policy?: AiEnergyDisplayPolicy | null,
  fallbackPercent?: number
): { percent: number | null; label: string } {
  const remaining = policy?.energyRemaining;
  const base = policy?.baseEnergyUnitsPerDay;
  const hasRemaining =
    typeof remaining === 'number' && Number.isFinite(remaining);
  const reportedPercent = policy?.energyPercent ?? fallbackPercent;
  const percent =
    hasRemaining && typeof base === 'number' && Number.isFinite(base) && base > 0
      ? Math.max(0, Math.min(100, (remaining / base) * 100))
      : hasRemaining && remaining <= 0
        ? 0
        : typeof reportedPercent === 'number' && Number.isFinite(reportedPercent)
          ? Math.max(0, Math.min(100, reportedPercent))
          : null;

  // energyLimit includes purchased recharges; baseEnergyUnitsPerDay represents
  // one battery. Never use the cumulative daily limit as the denominator.
  const lessThanOne =
    percent !== null &&
    ((percent > 0 && percent < 1) ||
      (percent === 0 && hasRemaining && remaining > 0));
  return {
    percent,
    label: lessThanOne
      ? 'Less than 1%'
      : percent === null
        ? '—'
        : `${Math.floor(percent)}%`
  };
}

export function getAiEnergyRefillTime(
  policy?: AiEnergyDisplayPolicy | null
): number | null {
  const dayKey = policy?.dayKey;
  if (typeof dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    const dayStart = Date.parse(`${dayKey}T00:00:00.000Z`);
    if (
      Number.isFinite(dayStart) &&
      new Date(dayStart).toISOString().slice(0, 10) === dayKey
    ) {
      return dayStart + DAY_MS;
    }
  }
  const rawDayIndex = policy?.dayIndex;
  const dayIndex =
    typeof rawDayIndex === 'string' && /^\d+$/.test(rawDayIndex)
      ? Number(rawDayIndex)
      : rawDayIndex;
  if (
    typeof dayIndex === 'number' &&
    Number.isSafeInteger(dayIndex) &&
    dayIndex >= 0
  ) {
    const refillTime = ENERGY_DAY_EPOCH + (dayIndex + 1) * DAY_MS;
    if (Number.isFinite(new Date(refillTime).getTime())) return refillTime;
  }
  return null;
}

export function formatAiEnergyRefillTime(
  refillTime: number,
  timeZone?: string
): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...(timeZone ? { timeZone } : {})
  }).format(refillTime);
}

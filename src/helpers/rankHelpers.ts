export function getRankDigitCount(rank?: number | string) {
  const n = typeof rank === 'number' ? rank : Number(rank);
  const resolved = Number.isFinite(n) ? Math.floor(Math.abs(n)) : 0;
  return resolved > 0 ? String(resolved).length : 0;
}

export function getRankFontScale(digitCount: number) {
  if (digitCount <= 0) return 1;
  if (digitCount === 1) return 1.12;
  if (digitCount === 2) return 1.05;
  if (digitCount === 3) return 1;
  if (digitCount === 4) return 0.93;
  if (digitCount === 5) return 0.88;
  if (digitCount === 6) return 0.84;
  return 0.8;
}


export const scoreTable: { [key: string]: number } = {
  S: 100,
  A: 90,
  B: 70,
  C: 50,
  D: 30,
  F: 10
};
export const perfectScoreBonus = 10;

export function getGradeFromMeasure({
  measureTime,
  baseTime
}: {
  measureTime: number;
  baseTime: number;
}): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (measureTime < baseTime * 0.25) return 'S';
  if (measureTime < baseTime * 0.5) return 'A';
  if (measureTime < baseTime * 0.75) return 'B';
  if (measureTime < baseTime * 1) return 'C';
  if (measureTime < baseTime * 1.25) return 'D';
  return 'F';
}

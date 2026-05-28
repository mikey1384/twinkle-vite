export type DailyTaskRewardMultiplierTier =
  | 'base'
  | 'active'
  | 'strong'
  | 'major'
  | 'epic'
  | 'legendary';

export function formatRewardMultiplier(multiplier: number) {
  if (Math.abs(multiplier - Math.round(multiplier)) < 0.001) {
    return `${Math.round(multiplier)}`;
  }
  return multiplier.toFixed(1).replace(/\.0$/, '');
}

export function getDailyTaskRewardMultiplier(dailyTaskReward: any) {
  const multiplier = Number(dailyTaskReward?.finalMultiplier);
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
}

export function getDailyTaskRewardMultiplierTier(
  multiplier: number
): DailyTaskRewardMultiplierTier {
  if (multiplier >= 50) return 'legendary';
  if (multiplier >= 25) return 'epic';
  if (multiplier >= 10) return 'major';
  if (multiplier >= 5) return 'strong';
  if (multiplier >= 2) return 'active';
  return 'base';
}

export function getRewardFontSize(digitCount: number) {
  if (digitCount >= 7) return '2.6rem';
  if (digitCount === 6) return '2.2rem';
  if (digitCount === 5) return '2rem';
  if (digitCount === 4) return '1.8rem';
  return '1.6rem';
}

export function formatRewardMultiplier(multiplier: number) {
  if (Math.abs(multiplier - Math.round(multiplier)) < 0.001) {
    return `${Math.round(multiplier)}`;
  }
  return multiplier.toFixed(1).replace(/\.0$/, '');
}

export function roundRewardAmount(rewardAmount: number) {
  if (rewardAmount < 100) {
    rewardAmount = 100;
  } else if (rewardAmount < 1000) {
    rewardAmount = Math.round(rewardAmount / 100) * 100;
  } else {
    rewardAmount = Math.round(rewardAmount / 1000) * 1000;
  }
  return Math.max(0, rewardAmount);
}

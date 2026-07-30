import { returnMaxRewards } from '~/constants/defaultValues';
import { RewardCaps } from '~/types';

interface Reward {
  rewardAmount?: number;
  rewarderId?: number;
}

export function getRewardCapacity({
  rewards,
  rewardCaps,
  rewardLevel,
  userId
}: {
  rewards: Reward[];
  rewardCaps?: RewardCaps;
  rewardLevel: number;
  userId: number;
}) {
  const derivedMaxRewardAmount = returnMaxRewards({ rewardLevel });
  const maxRewardAmount =
    rewardCaps?.maxRewardAmount ?? derivedMaxRewardAmount;
  const maxRewardAmountForOnePerson =
    rewardCaps?.maxRewardAmountForOnePerson ??
    Math.min(Math.ceil(derivedMaxRewardAmount / 2), 3);
  const totalRewarded = rewards.reduce(
    (total, reward) => total + (reward.rewardAmount || 0),
    0
  );
  const rewardedByUser = rewards.reduce((total, reward) => {
    return reward.rewarderId === userId
      ? total + (reward.rewardAmount || 0)
      : total;
  }, 0);
  const myRewardables = Math.max(
    maxRewardAmountForOnePerson - rewardedByUser,
    0
  );
  const remainingRewards = Math.max(maxRewardAmount - totalRewarded, 0);

  return {
    maxRewardAmountForOnePerson,
    myRewardables,
    rewardables: Math.min(remainingRewards, myRewardables)
  };
}

export function isRewardCaps(value: unknown): value is RewardCaps {
  if (!value || typeof value !== 'object') return false;
  const rewardCaps = value as RewardCaps;
  return (
    Number.isFinite(rewardCaps.maxRewardAmount) &&
    rewardCaps.maxRewardAmount >= 0 &&
    Number.isFinite(rewardCaps.maxRewardAmountForOnePerson) &&
    rewardCaps.maxRewardAmountForOnePerson >= 0
  );
}

export function getApplicableRewardCaps({
  rewardCaps,
  rewardLevel
}: {
  rewardCaps: unknown;
  rewardLevel: number;
}) {
  return isRewardCaps(rewardCaps) &&
    rewardCaps.clientRewardLevel === rewardLevel
    ? rewardCaps
    : undefined;
}

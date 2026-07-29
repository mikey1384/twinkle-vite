import { returnMaxRewards } from '~/constants/defaultValues';

interface Reward {
  rewardAmount?: number;
  rewarderId?: number;
}

export function getRewardCapacity({
  rewards,
  rewardLevel,
  userId
}: {
  rewards: Reward[];
  rewardLevel: number;
  userId: number;
}) {
  const maxRewardAmount = returnMaxRewards({ rewardLevel });
  const maxRewardAmountForOnePerson = Math.min(
    Math.ceil(maxRewardAmount / 2),
    3
  );
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

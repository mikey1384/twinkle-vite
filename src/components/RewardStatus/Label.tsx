import React, { memo } from 'react';
import { Color } from '~/constants/css';

interface RewardStatusLabelProps {
  rewardAmount: number;
}

function RewardStatusLabel({ rewardAmount }: RewardStatusLabelProps) {
  return (
    <span
      style={{
        fontWeight: 'bold',
        color:
          rewardAmount >= 3
            ? Color.gold()
            : rewardAmount === 2
            ? Color.pink()
            : Color.logoBlue()
      }}
    >
      rewarded {rewardAmount === 1 ? 'a' : rewardAmount} Twinkle
      {rewardAmount > 1 ? 's' : ''}
    </span>
  );
}

export default memo(RewardStatusLabel);

import React from 'react';
import RewardLevelBar from '~/components/RewardLevelBar';

export default function BottomRewardLevelDisplay({
  contentType,
  rewardLevel,
  rootObj,
  byUser,
  isEditing
}: {
  contentType: string;
  rewardLevel?: number;
  rootObj: any;
  byUser: boolean;
  isEditing: boolean;
}) {
  if (contentType !== 'subject' || !rewardLevel || (!rootObj.id && !byUser)) {
    return null;
  }

  return (
    <RewardLevelBar
      style={{
        width: 'calc(100% - 1.2rem)',
        marginTop: '0.6rem',
        marginLeft: '0.6rem',
        marginRight: '0.6rem',
        marginBottom: isEditing ? '1rem' : 0
      }}
      rewardLevel={rewardLevel}
    />
  );
}

import React from 'react';
import RewardLevelBar from '~/components/RewardLevelBar';
import { Content } from '~/types';

export default function RewardLevelDisplay({
  contentType,
  rootObj,
  byUser,
  rewardLevel
}: {
  contentType: string;
  rootObj: Content;
  byUser: boolean;
  rewardLevel?: number;
}) {
  if (contentType !== 'subject' || !!rootObj.id || byUser || !rewardLevel)
    return null;

  return (
    <RewardLevelBar
      style={{
        width: 'calc(100% - 1.2rem)',
        margin: '0.6rem 0.6rem 0.2rem 0.6rem'
      }}
      rewardLevel={rewardLevel}
    />
  );
}

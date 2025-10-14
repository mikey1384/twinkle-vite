import React from 'react';
import { css } from '@emotion/css';
import RewardLevelBar from '~/components/RewardLevelBar';
import { mobileMaxWidth } from '~/constants/css';
import { Content } from '~/types';

export default function RewardLevelDisplay({
  contentType,
  rootObj,
  byUser,
  rewardLevel,
  rootType
}: {
  contentType: string;
  rootObj: Content;
  byUser: boolean;
  rewardLevel?: number;
  rootType?: string;
}) {
  if (contentType !== 'subject' || !!rootObj.id || byUser || !rewardLevel)
    return null;

  return (
    <RewardLevelBar
      className={css``}
      style={{
        width: 'calc(100% - 1.2rem)',
        margin: '0.6rem 0.6rem 0.2rem 0.6rem'
      }}
      rewardLevel={rewardLevel}
    />
  );
}

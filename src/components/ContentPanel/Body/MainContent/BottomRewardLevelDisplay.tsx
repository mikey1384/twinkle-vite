import React from 'react';
import RewardLevelBar from '~/components/RewardLevelBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function BottomRewardLevelDisplay({
  contentType,
  rewardLevel,
  rootObj,
  byUser,
  isEditing,
  rootType,
  secretHidden
}: {
  contentType: string;
  rewardLevel: number;
  rootObj: any;
  byUser: any;
  isEditing: boolean;
  rootType: string;
  secretHidden: boolean;
}) {
  if (contentType !== 'subject' || !rewardLevel || (!rootObj.id && !byUser)) {
    return null;
  }

  return (
    <RewardLevelBar
      className={css`
        margin-left: -1px;
        margin-right: -1px;
        @media (max-width: ${mobileMaxWidth}) {
          margin-left: 0px;
          margin-right: 0px;
        }
      `}
      style={{
        marginBottom: isEditing
          ? '1rem'
          : rootType === 'url' && !secretHidden
          ? '-0.5rem'
          : 0
      }}
      rewardLevel={rewardLevel}
    />
  );
}

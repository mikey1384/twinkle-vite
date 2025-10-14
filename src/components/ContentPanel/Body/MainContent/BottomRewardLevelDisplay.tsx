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
  rewardLevel?: number;
  rootObj: any;
  byUser: boolean;
  isEditing: boolean;
  rootType?: string;
  secretHidden: boolean;
}) {
  if (contentType !== 'subject' || !rewardLevel || (!rootObj.id && !byUser)) {
    return null;
  }

  return (
    <RewardLevelBar
      className={css``}
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

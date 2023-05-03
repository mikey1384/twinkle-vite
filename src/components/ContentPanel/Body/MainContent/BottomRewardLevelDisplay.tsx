import React from 'react';
import PropTypes from 'prop-types';
import RewardLevelBar from '~/components/RewardLevelBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

BottomRewardLevelDisplay.propTypes = {
  contentType: PropTypes.string.isRequired,
  rewardLevel: PropTypes.number,
  rootObj: PropTypes.object.isRequired,
  byUser: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  rootType: PropTypes.string,
  secretHidden: PropTypes.bool.isRequired
};
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

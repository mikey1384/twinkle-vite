import PropTypes from 'prop-types';
import RewardLevelBar from '~/components/RewardLevelBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

BottomRewardLevelDisplay.propTypes = {
  contentType: PropTypes.string.isRequired,
  rewardLevel: PropTypes.number,
  rootObj: PropTypes.object,
  byUser: PropTypes.bool,
  isEditing: PropTypes.bool,
  rootType: PropTypes.string,
  secretHidden: PropTypes.bool
};

export default function BottomRewardLevelDisplay({
  contentType,
  rewardLevel,
  rootObj,
  byUser,
  isEditing,
  rootType,
  secretHidden
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

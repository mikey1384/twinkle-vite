import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import RewardLevelBar from '~/components/RewardLevelBar';
import { mobileMaxWidth } from '~/constants/css';

RewardLevelDisplay.propTypes = {
  contentType: PropTypes.string.isRequired,
  rootObj: PropTypes.object,
  byUser: PropTypes.bool,
  rewardLevel: PropTypes.number,
  rootType: PropTypes.string
};

export default function RewardLevelDisplay({
  contentType,
  rootObj,
  byUser,
  rewardLevel,
  rootType
}) {
  if (contentType !== 'subject' || !!rootObj.id || byUser || !rewardLevel)
    return null;

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
        marginBottom: rootType === 'url' ? '-0.5rem' : 0
      }}
      rewardLevel={rewardLevel}
    />
  );
}

import React from 'react';
import PropTypes from 'prop-types';
import Video from './Video';
import Subject from './Subject';

RewardLevelExplainer.propTypes = {
  rewardLevel: PropTypes.number,
  style: PropTypes.object,
  type: PropTypes.string
};

export default function RewardLevelExplainer({ rewardLevel, style, type }) {
  if (type === 'video') {
    return <Video rewardLevel={rewardLevel} style={style} />;
  }
  if (type === 'subject') {
    return <Subject rewardLevel={rewardLevel} style={style} />;
  }
  return null;
}

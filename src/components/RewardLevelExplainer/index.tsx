import React from 'react';
import Video from './Video';
import Subject from './Subject';

export default function RewardLevelExplainer({
  rewardLevel,
  style,
  type
}: {
  rewardLevel: number;
  style: React.CSSProperties;
  type: string;
}) {
  if (type === 'video') {
    return <Video rewardLevel={rewardLevel} style={style} />;
  }
  if (type === 'subject') {
    return <Subject rewardLevel={rewardLevel} style={style} />;
  }
  return null;
}

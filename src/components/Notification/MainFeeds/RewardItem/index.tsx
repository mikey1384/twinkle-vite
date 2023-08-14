import React, { useMemo } from 'react';
import { timeSince } from '~/helpers/timeStampHelpers';
import { notiFeedListItem } from '../../Styles';
import RewardText from './RewardText';

export default function RewardItem({
  actionColor,
  infoColor,
  linkColor,
  rewardColor,
  missionColor,
  reward: {
    id,
    isTask,
    contentId,
    contentType,
    rootId,
    rootType,
    rootMissionType,
    rewardAmount,
    rewardType,
    rewarderId,
    rewarderUsername,
    targetObj,
    timeStamp
  }
}: {
  actionColor: string;
  contentId?: number;
  contentType?: string;
  infoColor: string;
  isTask?: boolean;
  linkColor: string;
  reward: any;
  rewardColor: string;
  missionColor: string;
}) {
  const timeStampLabel = useMemo(() => timeSince(timeStamp), [timeStamp]);
  return (
    <nav style={{ background: '#fff' }} className={notiFeedListItem} key={id}>
      <RewardText
        actionColor={actionColor}
        contentId={contentId}
        contentType={contentType}
        infoColor={infoColor}
        isTask={isTask}
        linkColor={linkColor}
        missionColor={missionColor}
        rewardColor={rewardColor}
        rewardType={rewardType}
        rewardAmount={rewardAmount}
        rewarderId={rewarderId}
        rewarderUsername={rewarderUsername}
        rootId={rootId}
        rootType={rootType}
        rootMissionType={rootMissionType}
        targetObj={targetObj}
      />
      <small>{timeStampLabel}</small>
    </nav>
  );
}

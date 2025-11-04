import React, { memo, useMemo } from 'react';
import { timeSince } from '~/helpers/timeStampHelpers';
import { notiFeedListItem } from '../../Styles';
import RewardText from './RewardText';

function RewardItem({
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
    rootTargetType,
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
  return (
    <nav className={notiFeedListItem} key={id}>
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
        rootTargetType={rootTargetType}
        rootMissionType={rootMissionType}
        targetObj={targetObj}
      />
      {useMemo(() => {
        const d = new Date(Number(timeStamp) * 1000);
        const now = new Date();
        const isToday =
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
        return isToday;
      }, [timeStamp]) && <small>{timeSince(timeStamp)}</small>}
    </nav>
  );
}

export default memo(RewardItem);
